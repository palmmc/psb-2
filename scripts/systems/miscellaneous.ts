import { Player, world } from "@minecraft/server";
import { randomIntFromInterval } from "../main";

// Player damage sound fix.
world.afterEvents.entityHurt.subscribe((data) => {
  if (data.hurtEntity.typeId == "minecraft:player" && data.damage > 0)
    (<Player>data.hurtEntity).playSound(`game.player.dmg`);
});

// Banned Items
export const itemsBanned = ["powder_snow_bucket"];
export const itemsSuperBanned = ["command_block"];

export const BlockOres = [
  // ["ore", "item", XPmin, XPmax]
  ["minecraft:cobblestone", "minecraft:cobblestone", 0, 0],
  ["minecraft:netherrack", "minecraft:netherrack", 0, 0],
  ["minecraft:coal_ore", "minecraft:coal", 0, 2],
  ["minecraft:iron_ore", "minecraft:iron_ore", 0, 0],
  ["minecraft:lapis_ore", "minecraft:lapis_lazuli", 0, 4],
  ["minecraft:gold_ore", "minecraft:gold_ore", 0, 0],
  ["minecraft:diamond_ore", "minecraft:diamond", 1, 5],
  ["minecraft:emerald_ore", "minecraft:emerald", 1, 7],
];

export const DEF_ORES = [
  "minecraft:cobblestone",
  "minecraft:netherrack",
  "minecraft:coal_ore",
  "minecraft:iron_ore",
  "minecraft:lapis_ore",
  "minecraft:gold_ore",
  "minecraft:diamond_ore",
  "minecraft:emerald_ore",
];

export const DEF_CROPS_PLACE = [
  "minecraft:beetroot_seeds",
  "minecraft:wheat_seeds",
  "minecraft:carrot",
  "minecraft:potato",
  "minecraft:sugar_cane",
  "minecraft:cactus",
  "minecraft:pumpkin_seeds",
  "minecraft:melon_seeds",
];

export const DEF_CROPS_BREAK = [
  "minecraft:beetroot",
  "minecraft:wheat",
  "minecraft:carrots",
  "minecraft:potatoes",
  "minecraft:reeds",
  "minecraft:cactus",
  "minecraft:pumpkin",
  "minecraft:melon_block",
];

export const DEF_SEEDS_BREAK = [
  "minecraft:beetroot",
  "minecraft:wheat",
  "minecraft:carrots",
  "minecraft:potatoes",
  "minecraft:pumpkin_stem",
  "minecraft:melon_stem",
];

export const DEF_XP_BLOCKS = [
  "minecraft:coal_block",
  "minecraft:iron_block",
  "minecraft:lapis_block",
  "minecraft:gold_block",
  "minecraft:diamond_block",
  "minecraft:emerald_block",
  "minecraft:quartz_block",
  "minecraft:copper_block",
];
