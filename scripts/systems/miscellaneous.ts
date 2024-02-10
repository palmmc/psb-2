import { Player, world } from "@minecraft/server";
import { randomIntFromInterval } from "../main";

// Player damage sound fix.
world.afterEvents.entityHurt.subscribe((data) => {
  if (data.hurtEntity.typeId == "minecraft:player" && data.damage > 0)
    (<Player>data.hurtEntity).playSound(`game.player.dmg`);
});

// Banned Items
export const itemsBanned = [
  "powder_snow_bucket",
  "anvil",
  "flint_and_steel",
  "enchanting_table",
  "ender_chest",
  "tnt",
  "hopper_minecart",
  "campfire",
  "tripwire_hook",
  "beehive",
  "bee_nest",
];
export const itemsSuperBanned = ["command_block"];

export const BlockOres = [
  // ["ore", "item", XPmin, XPmax]
  ["minecraft:cobblestone", "minecraft:cobblestone", 0, 0],
  ["minecraft:netherrack", "minecraft:netherrack", 0, 0],
  ["minecraft:coal_ore", "minecraft:coal", 0, 2],
  ["minecraft:iron_ore", "minecraft:iron_ore", 0, 2],
  ["minecraft:lapis_ore", "minecraft:lapis_lazuli", 0, 3],
  ["minecraft:gold_ore", "minecraft:gold_ore", 0, 2],
  ["minecraft:diamond_ore", "minecraft:diamond", 1, 3],
  ["minecraft:emerald_ore", "minecraft:emerald", 1, 3],
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
  "palm:beetroot_seeds",
  "palm:wheat_seeds",
  "palm:carrot",
  "palm:potato",
  "palm:berry_seeds",
  "palm:pumpkin_seeds",
  "palm:melon_seeds",
];

export const DEF_CROPS_BREAK = [
  "palm:beetroots",
  "palm:wheat",
  "palm:carrots",
  "palm:potatoes",
  "palm:sweet_berry_bush",
  "minecraft:pumpkin",
  "minecraft:melon_block",
];

export const CROP_DROPS = [
  [0, "palm:beetroots"],
  [1, "palm:wheat"],
  [2, "palm:carrots"],
  [3, "palm:potatoes"],
  [4, "palm:sweet_berry_bush"],
  [5, "palm:pumpkin_stem"],
  [6, "palm:melon_stem"],
  [7, "palm:farmland"],
];

export const CROP_TABLES = [
  "blocks/beetroot_",
  "blocks/wheat_",
  "blocks/carrot_",
  "blocks/potato_",
  "blocks/sweet_berry_bush_",
  "blocks/pumpkin_",
  "blocks/melon_",
  "blocks/farmland_",
];

export const DEF_SEEDS_BREAK = [
  "palm:beetroots",
  "palm:wheat",
  "palm:carrots",
  "palm:potatoes",
  "palm:sweet_berry_bush",
  "palm:pumpkin_stem",
  "palm:melon_stem",
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
