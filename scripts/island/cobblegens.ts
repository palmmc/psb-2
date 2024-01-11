import { Block, Vector, system, world } from "@minecraft/server";
import { randomIntFromInterval } from "../main";

// DEFINITIONS
const overworld = world.getDimension("overworld");

// CONFIGURATION
const ORE_DELAY = 6;

// ORE WEIGHTS
const CHANCE = {
  cobblestone: 21, // 5% correction due to cobblestone not being replaced correctly.
  netherrack: 12,
  coal: 22,
  iron: 11,
  lapis: 14,
  gold: 11,
  diamond: 5,
  emerald: 4,
};

// TILE DEFINTIONS
const water = ["minecraft:water", "minecraft:flowing_water"];
const lava = ["minecraft:lava", "minecraft:flowing_lava"];

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

// EVENT HANDLER
world.afterEvents.playerBreakBlock.subscribe((data) => {
  const locations = [
    new Vector(data.block.location.x + 1, data.block.location.y, data.block.location.z),
    new Vector(data.block.location.x - 1, data.block.location.y, data.block.location.z),
    new Vector(data.block.location.x, data.block.location.y, data.block.location.z + 1),
    new Vector(data.block.location.x, data.block.location.y, data.block.location.z - 1),
  ];
  for (var i = 0, n = locations.length; i < n; ++i) {
    let block = overworld.getBlock(locations[i]);
    if (!block) continue;
    if (water.includes(block.typeId)) {
      for (var i = 0, n = locations.length; i < n; ++i) {
        block = overworld.getBlock(locations[i]);
        if (
          block &&
          block.isLiquid &&
          lava.includes(block.typeId) &&
          ((block.permutation.getState("liquid_depth") as number) ?? 8) <= 2
        )
          system.runTimeout(() => {
            selectOre(data.block);
          }, ORE_DELAY);
      }
    } else if (lava.includes(block.typeId) && ((block.permutation.getState("liquid_depth") as number) ?? 8) <= 2) {
      for (var i = 0, n = locations.length; i < n; ++i) {
        block = overworld.getBlock(locations[i]);
        if (block && block.isLiquid && water.includes(block.typeId))
          system.runTimeout(() => {
            selectOre(data.block);
          }, ORE_DELAY);
      }
    }
  }
});

// ORE RANDOMIZER
function selectOre(block: Block) {
  let ore = "air";
  let roll = randomIntFromInterval(1, 100);
  let choice = 100;
  if (roll >= (choice -= CHANCE.emerald)) ore = "emerald_ore";
  else if (roll >= (choice -= CHANCE.diamond)) ore = "diamond_ore";
  else if (roll >= (choice -= CHANCE.gold)) ore = "gold_ore";
  else if (roll >= (choice -= CHANCE.lapis)) ore = "lapis_ore";
  else if (roll >= (choice -= CHANCE.iron)) ore = "iron_ore";
  else if (roll >= (choice -= CHANCE.coal)) ore = "coal_ore";
  else if (roll >= (choice -= CHANCE.netherrack)) ore = "netherrack";
  else if (roll >= (choice -= CHANCE.cobblestone)) ore = "cobblestone";
  block.setType(ore);
  return ore;
}
