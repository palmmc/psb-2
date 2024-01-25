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
import {
  Island,
  IslandMethods,
  PREFIX,
  randomIntFromInterval,
  sendError,
} from "../main";
import {
  BlockOres,
  DEF_CROPS_BREAK,
  DEF_CROPS_PLACE,
  DEF_ORES,
  DEF_SEEDS_BREAK,
} from "../systems/miscellaneous";
import { getIslandOn } from "./manage";
import { giveRelic, openRelic, rollRelic } from "../systems/relic";
import { JsonDatabase } from "../database";

const overworld = world.getDimension("overworld");

// Initialize Databases
var playerDB: any = undefined;
var islandDB: any = undefined;
world.afterEvents.worldInitialize.subscribe((data) => {
  const islandRewards = [
    {
      id: 0,
      level: 2,
      reward: function rewardOne(player: Player) {
        player.sendMessage(
          `${PREFIX.island} §aCongratulations on §f§l[ §r§eLevel 2§f§l ]§r§f!`
        );
        player.sendMessage(
          `${PREFIX.island} §bHere's a little reward to help you along. §3Enjoy!`
        );
        let pdata = playerDB.get(player.id);
        pdata.coins = pdata.coins + 2500;
        playerDB.set(player.id, pdata);
      },
    },
    {
      id: 1,
      level: 5,
      reward: function rewardTwo(player: Player) {
        player.sendMessage(
          `${PREFIX.island} §aCongratulations on §f§l[ §r§eLevel 5§f§l ]§r§f!`
        );
        player.sendMessage(
          `${PREFIX.island} §bHere's to your continued success! §3Cheers!`
        );
        let pdata = playerDB.get(player.id);
        pdata.coins = pdata.coins + 7500;
        playerDB.set(player.id, pdata);
      },
    },
    {
      id: 2,
      level: 10,
      reward: function rewardThree(player: Player) {
        player.sendMessage(
          `${PREFIX.island} §aCongratulations on §f§l[ §r§eLevel 10§f§l ]§r§f!`
        );
        player.sendMessage(
          `${PREFIX.island} §bWow! You're really getting up there! Good luck with the big leagues, kid!`
        );
        let pdata = playerDB.get(player.id);
        pdata.coins = pdata.coins + 20000;
        playerDB.set(player.id, pdata);
      },
    },
    {
      id: 3,
      level: 50,
      reward: emptyReward,
    },
  ];
  system.runTimeout(() => {
    playerDB = new JsonDatabase("playerDB", world);
    islandDB = new JsonDatabase("islandDB", world);
    system.runInterval(() => {
      for (let player of world.getPlayers()) {
        let pdata = playerDB.get(player.id);
        if (!pdata.island) continue;
        let idata: Island = islandDB.get(pdata.island);
        let level = xpToLevel(idata.points);
        let lastLevel =
          world.scoreboard.getObjective("lastLevel")?.getScore(player) ?? -1;
        if (lastLevel == -1) {
          player.runCommandAsync(`scoreboard players add @s lastLevel 0`);
          continue;
        } else if (level > lastLevel) {
          player.runCommandAsync(`scoreboard players add @s lastLevel 1`);
          player.onScreenDisplay.setActionBar(
            `§f[§eIsland§f] >> §e${lastLevel} §a-> §e${lastLevel + 1}`
          );
          player.sendMessage(
            `${
              PREFIX.island
            } §kaa§r §l§6Level Up!§r §kaa§r §l[§r§e${lastLevel} §a-> §e${
              lastLevel + 1
            }§f§l]§r`
          );
          let reward = islandRewards.find((x) => level == lastLevel);
          if (
            reward &&
            (world.scoreboard.getObjective("isReward")?.getScore(player) ?? 0) <
              reward.id + 1
          ) {
            reward.reward(player);
            player.runCommandAsync(`scoreboard players add @s isReward 1`);
          }
          player.playSound(`firework.launch`, { volume: 0.5 });
          system.runTimeout(
            () => player.playSound(`firework.large_blast`, { volume: 0.5 }),
            5
          );
          system.runTimeout(
            () => player.playSound(`firework.blast`, { volume: 0.5 }),
            2
          );
          system.runTimeout(
            () => player.playSound(`firework.twinkle`, { volume: 0.5 }),
            3
          );
          system.runTimeout(
            () => player.playSound(`random.levelup`, { volume: 0.5 }),
            3
          );
        }
      }
    }, 100);
  }, 180);
});

export const cropLevels = [
  {
    crop: "palm:beetroot_seeds",
    levelReq: 1,
  },
  {
    crop: "palm:wheat_seeds",
    levelReq: 5,
  },
  {
    crop: "palm:carrot",
    levelReq: 15,
  },
  {
    crop: "palm:potato",
    levelReq: 35,
  },
  {
    crop: "minecraft:cactus",
    levelReq: 50,
  },
  {
    crop: "palm:pumpkin_seeds",
    levelReq: 70,
  },
  {
    crop: "palm:melon_seeds",
    levelReq: 90,
  },
];

// LEVEL FUNCTIONS
export function levelToXp(level: number) {
  let sum = 125;
  for (let i = 1; i <= level; i++) {
    sum += 125 * (i + 1);
  }
  return sum;
}

export function xpToLevel(xp: number) {
  let n = Math.log(xp / 125) / Math.log(2);
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
function emptyReward(player: Player) {}

// XP WEIGHTS
export const BREAK_XP = [
  // Format: ["minecraft:tile": String, xpMin: number, xpMax: number, isCrop: boolean]
  ["minecraft:coal_ore", 0, 2],
  ["minecraft:iron_ore", 0, 2],
  ["minecraft:lapis_ore", 1, 4],
  ["minecraft:gold_ore", 1, 3],
  ["minecraft:diamond_ore", 1, 3],
  ["minecraft:emerald_ore", 1, 4],
  ["palm:beetroots", 0, 2, true],
  ["palm:wheat", 1, 2, true],
  ["palm:carrots", 1, 3, true],
  ["palm:potatoes", 1, 3, true],
  //["minecraft:reeds", 0, 0],
  //["minecraft:cactus", 0, 0],
  ["minecraft:pumpkin", 1, 3],
  ["minecraft:melon_block", 1, 3],
  ["minecraft:coal_block", -14],
  ["minecraft:iron_block", -16],
  ["minecraft:lapis_block", -18],
  ["minecraft:gold_block", -20],
  ["minecraft:diamond_block", -22],
  ["minecraft:emerald_block", -24],
];
const PLACE_XP = [
  // Format: ["minecraft:tile": String, xpMin: number, xpMax: number, isCrop: boolean]
  ["minecraft:coal_block", 14],
  ["minecraft:iron_block", 16],
  ["minecraft:lapis_block", 18],
  ["minecraft:gold_block", 20],
  ["minecraft:diamond_block", 22],
  ["minecraft:emerald_block", 24],
];

// LEVEL EVENTS
world.afterEvents.playerBreakBlock.subscribe((data) => {
  let block = data.brokenBlockPermutation;
  let id = block.type.id;
  let ldata = BREAK_XP.find((x) => x[0] == id);
  // Copper additions
  if (id.includes("copper") && !id.includes("slab") && !id.includes("stairs")) {
    if (id.includes("cut")) ldata = ["minecraft:cut", -7];
    else ldata = ["minecraft:copper", -28];
  }
  if (!ldata) return;
  if (id.includes("ore") && randomIntFromInterval(1, 5) != 1) return;
  const player = data.player;
  if (ldata[3] && (ldata[3] as boolean) == true) {
    let island = islandDB.get(playerDB.get(player.id).island);
    IslandMethods.removeLimit(island, "crop", 1);
    if (block.getState("palm:growth_stage") != 7) return;
    giveRelic(data.player, rollRelic("FARM"));
  }
  if (id == "minecraft:pumpkin" || id == "minecraft:melon_block") {
    giveRelic(data.player, rollRelic("MELON_PUMPKIN"));
  }
  let xp = ldata[1] as number;
  if (ldata[2])
    xp = randomIntFromInterval(ldata[1] as number, ldata[2] as number);
  if (!xp) return;
  let idata = getIslandOn(player);
  if (!idata) return;
  IslandMethods.addPoints(idata, xp);
});

world.afterEvents.playerPlaceBlock.subscribe((data) => {
  let block = data.block;
  let id = block.type.id;
  let ldata = PLACE_XP.find((x) => x[0] == id);
  // Copper additions
  if (id.includes("copper") && !id.includes("slab") && !id.includes("stairs")) {
    if (id.includes("cut")) ldata = ["minecraft:cut", 7];
    else ldata = ["minecraft:copper", 28];
  }
  if (!ldata) return;
  const player = data.player;
  let idata = getIslandOn(player);
  if (!idata) return;
  IslandMethods.addPoints(idata, ldata[1] as number);
});

// LIMIT EVENTS

world.beforeEvents.itemUseOn.subscribe((data) => {
  let C_LEVEL = cropLevels.find((x) => x.crop == data.itemStack.typeId);
  if (!C_LEVEL) return;
  let player = <Player>data.source;
  let idata: Island = islandDB.get(playerDB.get(player.id).island);
  if (C_LEVEL.levelReq > xpToLevel(idata.points)) {
    data.cancel = true;
    system.run(() =>
      sendError(
        player,
        `This island has not unlocked this crop yet.\n§6Use §e-crops §6to see when it unlocks.`,
        PREFIX.island
      )
    );
    return;
  }
});

world.afterEvents.playerPlaceBlock.subscribe((data) => {
  if (
    !data.block.typeId.startsWith("palm:") ||
    data.block.typeId.includes("farmland")
  )
    return;
  let player = data.player;
  let idata: Island = islandDB.get(playerDB.get(player.id).island);
  if (idata.limits.crop.amount >= idata.limits.crop.max) {
    data.block.setType("air");
    player.startItemCooldown("crop", 15);
    sendError(
      player,
      `Island has reached the crop limit.\n§dUse §e-is expand §dto increase it.`,
      PREFIX.island
    );
    return;
  } else {
    IslandMethods.addLimit(idata, "crop", 1);
  }
});

function getBlockAtFace(
  data: PlayerInteractWithBlockBeforeEvent,
  face: Direction
) {
  let loc = Vector.add(
    data.block.location,
    new Vector(data.faceLocation.x, data.faceLocation.y, data.faceLocation.z)
  );
  if (face == Direction.North) loc.z--;
  else if (face == Direction.West) loc.x--;
  else if (face == Direction.Down) loc.y--;
  //console.warn(loc.x + " " + loc.y + " " + loc.z);
  //console.warn(overworld.getBlock(loc)?.typeId);
  return overworld.getBlock(loc);
}
