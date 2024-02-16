import {
  Direction,
  Entity,
  EntityEquippableComponent,
  EquipmentSlot,
  ItemStack,
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
  sendAlert,
  sendError,
} from "../main";
import {
  BlockOres,
  CROP_DROPS,
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
        if (!pdata) continue;
        if (!pdata.island) continue;
        let idata: Island = islandDB.get(pdata.island);
        let level = xpToLevel(idata.points);
        if (!idata.notifyLevel) {
          idata.notifyLevel =
            world.scoreboard.getObjective("lastLevel")?.getScore(player) ?? 0;
          IslandMethods.updateData(idata);
        }
        if (level > idata.notifyLevel) {
          let lastLevel = idata.notifyLevel;
          let l = Math.min(5, level - lastLevel);
          idata.notifyLevel = idata.notifyLevel + l;
          IslandMethods.updateData(idata);
          if (lastLevel == 0) continue;
          player.onScreenDisplay.setActionBar(
            `§f[§eIsland§f] >> §e${lastLevel} §a-> §e${lastLevel + l}`
          );
          sendAlert(
            player,
            `§kaa§r §l§6Level Up!§r §kaa§r §l[§r§e${lastLevel} §a-> §e${
              lastLevel + l
            }§f§l]§r`,
            PREFIX.island
          );
          let reward = islandRewards.find(
            (x) => x.level <= lastLevel && x.level > lastLevel - 5
          );
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
    crop: "palm:berry_seeds",
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
export const BREAK_XP = {
  minecraft: {
    coal_ore: [1, 3],
    iron_ore: [1, 3],
    lapis_ore: [2, 5],
    gold_ore: [1, 4],
    diamond_ore: [1, 6],
    emerald_ore: [1, 7],
    coal_block: -16,
    iron_block: -18,
    lapis_block: -20,
    gold_block: -22,
    diamond_block: -24,
    emerald_block: -28,
  },
  palm: {
    beetroots: [0, 4],
    wheat: [2, 4],
    carrots: [2, 6],
    potatoes: [2, 6],
    sweet_berry_bush: [1, 4],
    pumpkin: [3, 6],
    melon_block: [3, 6],
  },
};

export const PLACE_XP = {
  minecraft: {
    coal_block: 16,
    iron_block: 18,
    lapis_block: 20,
    gold_block: 22,
    diamond_block: 24,
    emerald_block: 28,
  },
  palm: {},
};

world.beforeEvents.playerBreakBlock.subscribe((data) => {
  let id = data.block.type.id;
  let player = data.player;
  // Check for island
  let island = getIslandOn(player);
  if (!island) return;
  if (
    IslandMethods.getPermission(island, player, "farm") != true &&
    !island.members.find((x) => x.id == player.id) &&
    !island.owners.find((x) => x.id == player.id)
  ) {
    data.cancel = true;
    return;
  }
  //@ts-ignore
  let xp = BREAK_XP[id.split(":")[0]][id.split(":")[1]];
  // Extras
  if (id.endsWith("copper")) xp = -28;
  else if (id == "minecraft:hopper")
    IslandMethods.removeLimit(island, "hoppers", 1);
  //
  if (!xp) return;
  if (xp[1]) xp = randomIntFromInterval(xp[0], xp[1]);
  if (id == "minecraft:pumpkin" || id == "minecraft:melon_block") {
    giveRelic(data.player, rollRelic("MELON_PUMPKIN"));
  } else if (id.includes("ore") && randomIntFromInterval(1, 5) != 1) return;
  IslandMethods.addPoints(island, xp as number);
});

world.beforeEvents.playerBreakBlock.subscribe((data) => {
  let id = data.block.type.id;
  let player = data.player;
  // Check for island
  let island = getIslandOn(player);
  if (!island) return;
  if (
    IslandMethods.getPermission(island, player, "farm") != true &&
    !island.members.find((x) => x.id == player.id) &&
    !island.owners.find((x) => x.id == player.id)
  ) {
    data.cancel = true;
    return;
  }
  //@ts-ignore
  // Extras
  if (id == "minecraft:hopper") {
    IslandMethods.removeLimit(island, "hoppers", 1);
    return;
  }
  //
  if (DEF_SEEDS_BREAK.includes(id)) {
    IslandMethods.removeLimit(island, "crop", 1);
    if (data.block.permutation.getState("palm:growth_stage") != 7) return;
    giveRelic(data.player, rollRelic("FARM"));
  } else if (id == "palm:farmland") {
    if (DEF_SEEDS_BREAK.includes(data.block.above(1)?.typeId ?? ""))
      IslandMethods.removeLimit(island, "crop", 1);
  }
});

world.afterEvents.playerPlaceBlock.subscribe((data) => {
  let id = data.block.type.id;
  let player = data.player;
  // Check for island
  let island = getIslandOn(player);
  if (!island) return;
  //@ts-ignore
  let xp = PLACE_XP[id.split(":")[0]][id.split(":")[1]];
  // Copper additions
  if (id.endsWith("copper")) xp = 28;
  if (!xp) return;
  IslandMethods.addPoints(island, xp as number);
});

// LIMIT EVENTS

world.beforeEvents.itemUseOn.subscribe((data) => {
  let C_LEVEL = cropLevels.find((x) => x.crop == data.itemStack.typeId);
  if (!C_LEVEL) return;
  let player = <Player>data.source;
  let idata: Island | undefined = getIslandOn(player);
  if (!idata) return;
  if (C_LEVEL.levelReq > xpToLevel(idata.points)) {
    data.cancel = true;
    system.run(() =>
      sendError(
        player,
        `This island has not unlocked this crop yet.\n§6Use §e-is crops §6to see when it unlocks.`,
        PREFIX.island
      )
    );
    return;
  }
});

world.afterEvents.playerPlaceBlock.subscribe((data) => {
  if (
    !DEF_SEEDS_BREAK.includes(data.block.typeId) &&
    data.block.typeId != "minecraft:hopper"
  )
    return;
  let player = data.player;
  let idata: Island | undefined = getIslandOn(player);
  if (!idata) return;
  if (data.block.typeId == "minecraft:hopper") {
    if (idata.limits.hoppers.amount >= idata.limits.hoppers.max) {
      data.block.setType("air");
      player.runCommandAsync(`give @s hopper`);
      sendError(
        data.player,
        `Island has reached the hopper limit.\n§dUse §e-is expand §dto increase it.`,
        PREFIX.island
      );
      return;
    } else {
      IslandMethods.addLimit(idata, "hoppers", 1);
      return;
    }
  } else if (idata.limits.crop.amount >= idata.limits.crop.max) {
    let id = DEF_CROPS_PLACE[DEF_SEEDS_BREAK.indexOf(data.block.typeId)];
    data.block.setType("air");
    player.startItemCooldown("crop", 15);
    player.runCommandAsync(`give @s ${id}`);
    sendError(
      player,
      `Island has reached the crop limit.\n§dUse §e-is expand §dto increase it.`,
      PREFIX.island
    );
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

world.afterEvents.playerInteractWithBlock.subscribe((data) => {
  if (data.block.typeId != "palm:sweet_berry_bush") return;
  let growth = data.block.permutation.getState("palm:growth_stage") as number;
  if (growth < 6) return;
  if (data.player.getItemCooldown("berry") > 0) return;
  data.player.startItemCooldown("berry", 20);
  data.player.runCommandAsync(
    `setblock ${data.block.x} ${data.block.y} ${data.block.z} palm:sweet_berry_bush`
  );
  data.player
    .getComponent("inventory")
    ?.container?.addItem(
      new ItemStack(
        "palm:sweet_berries",
        growth >= 7 ? randomIntFromInterval(1, 4) : 1
      )
    );
});
