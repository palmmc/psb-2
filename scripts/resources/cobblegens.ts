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

type CHANCE = {
  cobblestone: number;
  netherrack: number;
  coal: number;
  iron: number;
  lapis: number;
  gold: number;
  diamond: number;
  emerald: number;
};

// TILE DEFINTIONS
const water = ["minecraft:water", "minecraft:flowing_water"];
const lava = ["minecraft:lava", "minecraft:flowing_lava"];

// EVENT HANDLER
world.afterEvents.playerBreakBlock.subscribe((data) => {
  const locations = [
    new Vector(
      data.block.location.x + 1,
      data.block.location.y,
      data.block.location.z
    ),
    new Vector(
      data.block.location.x - 1,
      data.block.location.y,
      data.block.location.z
    ),
    new Vector(
      data.block.location.x,
      data.block.location.y,
      data.block.location.z + 1
    ),
    new Vector(
      data.block.location.x,
      data.block.location.y,
      data.block.location.z - 1
    ),
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
            selectOre(data.block, CHANCE);
          }, ORE_DELAY);
      }
    } else if (
      lava.includes(block.typeId) &&
      ((block.permutation.getState("liquid_depth") as number) ?? 8) <= 2
    ) {
      for (var i = 0, n = locations.length; i < n; ++i) {
        block = overworld.getBlock(locations[i]);
        if (block && block.isLiquid && water.includes(block.typeId))
          system.runTimeout(() => {
            selectOre(data.block, CHANCE);
          }, ORE_DELAY);
      }
    }
  }
});

// ORE RANDOMIZER
export function selectOre(block: Block, CHANCE: CHANCE) {
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
  else ore = "cobblestone";
  block.setType(ore);
  return ore;
}
