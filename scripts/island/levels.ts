import {
  Direction,
  Entity,
  EntityEquippableComponent,
  EquipmentSlot,
  ItemUseOnBeforeEvent,
  MolangVariableMap,
  Player,
  PlayerInteractWithBlockBeforeEvent,
  PlayerPlaceBlockAfterEvent,
  PlayerPlaceBlockBeforeEvent,
  RGB,
  Vector,
  system,
  world,
} from "@minecraft/server";
import { PREFIX, islandDB, playerDB, randomIntFromInterval, sendError } from "../main";
import { BlockOres, DEF_CROPS_BREAK, DEF_CROPS_PLACE, DEF_ORES, DEF_SEEDS_BREAK } from "./cobblegens";
import { getIslandOn } from "./manage";

const overworld = world.getDimension("overworld");

// LEVEL FUNCTIONS
export function levelToXp(level: number) {
  let sum = 160;
  for (let i = 1; i <= level; i++) {
    sum += 160 * (i + 1);
  }
  return sum;
}

export function xpToLevel(xp: number) {
  let n = Math.log(xp / 160) / Math.log(2);
  n = Math.ceil(n);
  while (levelToXp(n) < xp) {
    n++;
  }
  if (levelToXp(n - 1) >= xp + 1) n--;
  if (n < 0) n = 0;
  return ++n;
}

export function xpUntilNextLevel(xp: number) {
  return levelToXp(xpToLevel(xp) - 1);
}

// ISLAND LEVEL REWARDS

const islandRewards = [
  {
    id: 0,
    level: 2,
    reward: function rewardOne(player: Player) {
      player.sendMessage(`${PREFIX.island} §aCongratulations on §f§l[ §r§eLevel 2§f§l ]§r§f!`);
      player.sendMessage(`${PREFIX.island} §bHere's a little reward to help you along. §3Enjoy!`);
      let pdata = playerDB.get(player.id);
      pdata.coins += 2500;
      playerDB.set(player.id, pdata);
    },
  },
  {
    id: 1,
    level: 5,
    reward: function rewardTwo(player: Player) {
      player.sendMessage(`${PREFIX.island} §aCongratulations on §f§l[ §r§eLevel 5§f§l ]§r§f!`);
      player.sendMessage(`${PREFIX.island} §bHere's to your continued success! §3Cheers!`);
      let pdata = playerDB.get(player.id);
      pdata.coins += 7500;
      playerDB.set(player.id, pdata);
    },
  },
  {
    id: 2,
    level: 20,
    reward: emptyReward,
  },
  {
    id: 3,
    level: 50,
    reward: emptyReward,
  },
];
function emptyReward(player: Player) {}

system.runInterval(() => {
  for (let player of world.getPlayers()) {
    let pdata = playerDB.get(player.id);
    let idata = islandDB.get(pdata.island);
    if (!idata) return;
    let level = xpToLevel(idata.points);
    let lastLevel = world.scoreboard.getObjective("lastLevel")?.getScore(player) ?? -1;
    if (lastLevel == -1) {
      player.runCommandAsync(`scoreboard players add @s lastLevel 0`);
      return;
    } else if (level > lastLevel) {
      player.runCommandAsync(`scoreboard players add @s lastLevel 1`);
      player.onScreenDisplay.setActionBar(`§f[§eIsland§f] >> §e${lastLevel} §a-> §e${lastLevel + 1}`);
      player.sendMessage(
        `${PREFIX.island} §kaa§r §l§6Level Up!§r §kaa§r §l[§r§e${lastLevel} §a-> §e${lastLevel + 1}§f§l]§r`
      );
      let reward = islandRewards.find((x) => level == lastLevel);
      if (reward && (world.scoreboard.getObjective("isReward")?.getScore(player) ?? 0) < reward.id + 1) {
        reward.reward(player);
        player.runCommandAsync(`scoreboard players add @s isReward 1`);
      }
      player.playSound(`firework.launch`, { volume: 0.5 });
      system.runTimeout(() => player.playSound(`firework.large_blast`, { volume: 0.5 }), 5);
      system.runTimeout(() => player.playSound(`firework.blast`, { volume: 0.5 }), 2);
      system.runTimeout(() => player.playSound(`firework.twinkle`, { volume: 0.5 }), 3);
      system.runTimeout(() => player.playSound(`random.levelup`, { volume: 0.5 }), 3);
    }
  }
}, 100);

// XP WEIGHTS
export const BREAK_XP = [
  // Format: ["minecraft:tile": String, xpMin: number, xpMax: number, isCrop: boolean]
  ["minecraft:coal_ore", 0, 1],
  ["minecraft:iron_ore", 0, 1],
  ["minecraft:lapis_ore", 0, 2],
  ["minecraft:gold_ore", 1, 1],
  ["minecraft:diamond_ore", 1, 1],
  ["minecraft:emerald_ore", 1, 2],
  ["minecraft:beetroot", 0, 1, true],
  ["minecraft:wheat", 1, 1, true],
  ["minecraft:carrots", 1, 2, true],
  ["minecraft:potatoes", 1, 2, true],
  //["minecraft:reeds", 0, 0],
  //["minecraft:cactus", 0, 0],
  ["minecraft:pumpkin", 1, 3],
  ["minecraft:melon_block", 1, 3],
  ["minecraft:coal_block", -16],
  ["minecraft:iron_block", -18],
  ["minecraft:lapis_block", -20],
  ["minecraft:gold_block", -22],
  ["minecraft:diamond_block", -24],
  ["minecraft:emerald_block", -25],
];
const PLACE_XP = [
  // Format: ["minecraft:tile": String, xpMin: number, xpMax: number, isCrop: boolean]
  ["minecraft:coal_block", 16],
  ["minecraft:iron_block", 18],
  ["minecraft:lapis_block", 20],
  ["minecraft:gold_block", 22],
  ["minecraft:diamond_block", 24],
  ["minecraft:emerald_block", 25],
];

// LEVEL EVENTS
world.afterEvents.playerBreakBlock.subscribe((data) => {
  let block = data.brokenBlockPermutation;
  let id = block.type.id;
  let ldata = BREAK_XP.find((x) => x[0] == id);
  // Copper additions
  if (id.includes("copper") && !id.includes("slab") && !id.includes("stairs")) {
    if (id.includes("cut")) ldata = ["minecraft:cut", -8];
    else ldata = ["minecraft:copper", -32];
  }
  if (!ldata) return;
  if (id.includes("ore") && randomIntFromInterval(1, 5) != 1) return;
  const player = data.player;
  let isle = getIslandOn(player);
  let owner = isle?.owner;
  if (!owner) return;
  if (ldata[3] && (ldata[3] as boolean) == true) {
    if (block.getState("growth") != 7) return;
  }
  let xp = ldata[1] as number;
  if (ldata[2]) xp = randomIntFromInterval(ldata[1] as number, ldata[2] as number);
  if (!xp) return;
  let island = isle?.island;
  let idata = islandDB.get(island);
  idata.points = Number(idata.points) + xp;
  islandDB.set(island, idata);
});

world.afterEvents.playerPlaceBlock.subscribe((data) => {
  let block = data.block;
  let id = block.type.id;
  let ldata = PLACE_XP.find((x) => x[0] == id);
  // Copper additions
  if (id.includes("copper") && !id.includes("slab") && !id.includes("stairs")) {
    if (id.includes("cut")) ldata = ["minecraft:cut", 8];
    else ldata = ["minecraft:copper", 32];
  }
  if (!ldata) return;
  const player = data.player;
  let isle = getIslandOn(player);
  let owner = isle?.owner;
  if (!owner) return;
  let island = isle?.island;
  let idata = islandDB.get(island);
  idata.points = Number(idata.points) + (ldata[1] as number);
  islandDB.set(island, idata);
});

// LIMIT EVENTS

world.beforeEvents.chatSend.subscribe((data) => {
  if (data.message == "!setlava") {
    let isle = getIslandOn(data.sender);
    let owner = isle?.owner;
    if (!owner) return;
    let island = isle?.island;
    let idata = islandDB.get(island);
    idata.limits.lava = 0 as number;
    islandDB.set(island, idata);
  }
});

function getBlockAtFace(data: PlayerInteractWithBlockBeforeEvent, face: Direction) {
  let loc = Vector.add(data.block.location, new Vector(data.faceLocation.x, data.faceLocation.y, data.faceLocation.z));
  if (face == Direction.North) loc.z--;
  else if (face == Direction.West) loc.x--;
  else if (face == Direction.Down) loc.y--;
  //console.warn(loc.x + " " + loc.y + " " + loc.z);
  //console.warn(overworld.getBlock(loc)?.typeId);
  return overworld.getBlock(loc);
}

function setIslandLimit(player: Player, type: string, amount: number) {
  let isle = getIslandOn(player);
  let island = isle?.island;
  if (!island) return false;
  let idata = islandDB.get(island);
  if (Number(idata.limits[type.toLowerCase()]) >= Number(idata.limits[`max${type}`])) {
    system.run(() =>
      sendError(
        player,
        `You have reached your island limit for this block.\n§dUse §e-is expand§d to increase it.`,
        PREFIX.island
      )
    );
    return false;
  } else idata.limits[type.toLowerCase()] += amount as number;
  islandDB.set(island, idata);
  console.warn(idata.limits[type.toLowerCase()]);
  return true;
}

world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
  const player = data.player;
  let item = data.itemStack;
  if (!item) return;
  if (item.typeId == "minecraft:lava") data.cancel = true;
  else if (DEF_CROPS_PLACE[DEF_CROPS_PLACE.indexOf(item.typeId) ?? -1]) {
    system.run(() => {
      const getItem = (<EntityEquippableComponent>player.getComponent("equippable")).getEquipment(
        EquipmentSlot.Mainhand
      );
      if (!getItem || (getItem?.typeId == item?.typeId && getItem.amount == item.amount - 1))
        setIslandLimit(player, "Crops", 1);
      else return;
    });
  } else {
    const block = getBlockAtFace(data, data.blockFace);
    if (block?.typeId.includes("lava") && ((block.permutation.getState("liquid_depth") ?? 0) as number) == 0) {
      data.cancel = true;
      system.run(() => block.setType("minecraft:air"));
      setIslandLimit(player, "Lava", -1);
      return;
    } else return;
  }
  system.run(() => {
    const block = getBlockAtFace(data, data.blockFace);
    const bid = block?.typeId;
    if (bid != "minecraft:air") return;
    if (!setIslandLimit(player, "Lava", 1)) return;
    block?.setType("lava");
    const equip = <EntityEquippableComponent>player.getComponent("equippable");
    const getItem = equip.getEquipment(EquipmentSlot.Mainhand);
    if (item && getItem?.typeId == item.typeId && getItem?.amount)
      if (item.amount == 1) {
        equip.setEquipment(EquipmentSlot.Mainhand);
      } else {
        item.amount--;
        equip.setEquipment(EquipmentSlot.Mainhand, item);
      }
    else return;
  });
});

world.afterEvents.playerBreakBlock.subscribe((data) => {
  let block = data.block;
  let id = block.type.id;
  let type: string;
  if (DEF_SEEDS_BREAK[DEF_SEEDS_BREAK.indexOf(id) ?? -1]) type = "Crops";
  else if (id == "minecraft:mob_spawner") type = "Spawners";
  else return;
  const player = data.player;
  setIslandLimit(player, type, -1);
});

/*
world.beforeEvents.playerPlaceBlock.subscribe((data) => {
  let id = data.itemStack.typeId;
  let type = "";
  const player = data.player;
  if (id == "minecraft:mob_spawner") type = "Spawners";
  else if (id == "minecraft:lava" && !getBlockAtFace(data, data.face)?.typeId.includes("lava")) type = "Lava";
  else return;
  let isle = getIslandOn(player);
  let owner = isle?.owner;
  if (!owner) return;
  let island = isle?.island;
  let idata = islandDB.get(island);
  if (Number(idata.limits[type.toLowerCase()]) >= Number(idata.limits[`max${type}`])) {
    data.cancel = true;
    system.run(() =>
      sendError(
        player,
        `You have reached your island limit for this block.\n§dUse §e-is expand§d to increase it.`,
        PREFIX.island
      )
    );
    return;
  } else idata.limits[type.toLowerCase()]++ as number;
  console.warn(idata.limits[type.toLowerCase()]);
  islandDB.set(island, idata);
});
*/
