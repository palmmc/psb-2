import {
  BlockInventoryComponent,
  EntityInventoryComponent,
  Player,
  Vector,
  system,
  world,
} from "@minecraft/server";
import {
  ActionFormData,
  ActionFormResponse,
  MessageFormData,
  MessageFormResponse,
  ModalFormData,
} from "@minecraft/server-ui";
import {
  PREFIX,
  formatNumber,
  getItemAmount,
  playerDB,
  sendAlert,
  sendError,
  toRomanNumeral,
} from "../main";
import { formatItemName } from "./itemcloud";
import { EnchantEntries, VanillaEnchItem } from "../systems/enchantments";
import { ChestFormData } from "../chest-ui/forms";

const overworld = world.getDimension("overworld");

export function checkItemAmount(
  player: Player,
  itemId: string,
  clearItems: boolean
) {
  const inventory = (<EntityInventoryComponent>player.getComponent("inventory"))
    .container;
  let itemAmount = 0;
  for (let i = 0; i < 36; i++) {
    if (!inventory) return -1;
    let item = inventory.getItem(i);
    if (item?.typeId !== `minecraft:${itemId}`) continue;
    itemAmount += item.amount;
    if (clearItems) inventory.setItem(i);
  }
  return itemAmount;
}

const CATEGORY = {
  special: 0,
  blocks: 1,
  equipment: 2,
  decoration: 3,
  farming: 4,
  items: 5,
  cebooks: 6,
  spawners: 7,
  wood: 11,
  stone: 12,
  sand: 13,
  flowers: 21,
  terracotta: 22,
  wool: 23,
  glass: 24,
  ores: 25,
  food: 31,
  saplings: 32,
  leather: 41,
  chainmail: 42,
  gold: 43,
  iron: 44,
  diamond: 45,
  venchants: 101,
};

const ITEMRARITY = {
  common: "§7",
  rare: "§2",
  epic: "§d",
  legendary: "§6",
  vault: "§c",
};

export const ShopItems = [
  /*{
    category: CATEGORY.example,
    texture: "textures/example/test.png",
    name*: "Test Example"
    item: "minecraft:test",
    ditem*: [new Vector(0, 0, 0), 0 // slot]
    price: 500,
    sell: 50,
    data*: 0,
  },*/

  // LOGS
  {
    category: CATEGORY.wood,
    texture: "textures/blocks/log_oak.png",
    name: "Oak Log",
    item: "oak_log",
    price: 400,
    sell: 0,
  },
  {
    category: CATEGORY.wood,
    texture: "textures/blocks/log_birch.png",
    item: "birch_log",
    price: 400,
    sell: 0,
  },
  {
    category: CATEGORY.wood,
    texture: "textures/blocks/log_spruce.png",
    item: "spruce_log",
    price: 400,
    sell: 0,
  },
  {
    category: CATEGORY.wood,
    texture: "textures/blocks/log_acacia.png",
    item: "acacia_log",
    price: 400,
    sell: 0,
  },
  {
    category: CATEGORY.wood,
    texture: "textures/blocks/log_jungle.png",
    item: "jungle_log",
    price: 400,
    sell: 0,
  },
  {
    category: CATEGORY.wood,
    texture: "textures/blocks/log_big_oak.png",
    item: "dark_oak_log",
    price: 400,
    sell: 0,
  },
  {
    category: CATEGORY.wood,
    texture: "textures/blocks/huge_fungus/stripped_crimson_stem_side.png",
    item: "crimson_stem",
    price: 600,
    sell: 0,
  },
  {
    category: CATEGORY.wood,
    texture: "textures/blocks/huge_fungus/stripped_warped_stem_side.png",
    item: "warped_stem",
    price: 600,
    sell: 0,
  },
  {
    category: CATEGORY.wood,
    texture: "textures/blocks/mangrove_log_side.png",
    item: "mangrove_log",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.wood,
    texture: "textures/blocks/cherry_log_side.png",
    item: "cherry_log",
    price: 850,
    sell: 0,
  },
  {
    category: CATEGORY.wood,
    texture: "textures/blocks/bamboo_block.png",
    item: "bamboo_block",
    price: 900,
    sell: 0,
  },
  // STONES
  {
    category: CATEGORY.stone,
    texture: "textures/blocks/stone.png",
    item: "stone",
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.stone,
    texture: "textures/blocks/stone_granite.png",
    name: "Granite",
    item: "stone",
    data: 1,
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.stone,
    texture: "textures/blocks/stone_diorite.png",
    name: "Diorite",
    item: "stone",
    data: 3,
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.stone,
    texture: "textures/blocks/stone_andesite.png",
    name: "Andesite",
    item: "stone",
    data: 5,
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.stone,
    texture: "textures/blocks/dripstone_block.png",
    item: "dripstone_block",
    price: 300,
    sell: 0,
  },
  {
    category: CATEGORY.stone,
    texture: "textures/blocks/calcite.png",
    item: "calcite",
    price: 300,
    sell: 0,
  },
  {
    category: CATEGORY.stone,
    texture: "textures/blocks/tuff.png",
    item: "tuff",
    price: 300,
    sell: 0,
  },
  {
    category: CATEGORY.stone,
    texture: "textures/blocks/blackstone.png",
    item: "blackstone",
    price: 350,
    sell: 0,
  },
  {
    category: CATEGORY.stone,
    texture: "textures/blocks/polished_blackstone.png",
    item: "polished_blackstone",
    price: 350,
    sell: 0,
  },
  {
    category: CATEGORY.stone,
    texture: "textures/blocks/deepslate/cobbled_deepslate.png",
    item: "cobbled_deepslate",
    price: 350,
    sell: 0,
  },
  {
    category: CATEGORY.stone,
    texture: "textures/blocks/deepslate/deepslate.png",
    item: "deepslate",
    price: 350,
    sell: 0,
  },
  {
    category: CATEGORY.stone,
    texture: "textures/blocks/end_stone.png",
    item: "end_stone",
    price: 400,
    sell: 0,
  },
  // SAND
  {
    category: CATEGORY.sand,
    texture: "textures/blocks/sand.png",
    item: "sand",
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.sand,
    texture: "textures/blocks/red_sand.png",
    name: "Red Sand",
    item: "sand",
    data: 1,
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.sand,
    texture: "textures/blocks/sandstone_normal.png",
    item: "sandstone",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.sand,
    texture: "textures/blocks/red_sandstone_normal.png",
    item: "red_sandstone",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.sand,
    texture: "textures/blocks/clay.png",
    item: "clay",
    price: 1000,
    sell: 0,
  },
  {
    category: CATEGORY.sand,
    texture: "textures/blocks/mud.png",
    item: "mud",
    price: 1200,
    sell: 0,
  },
  // BLOCKS
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/grass_side_carried.png",
    item: "grass",
    price: 425,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/dirt.png",
    item: "dirt",
    price: 225,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/gravel.png",
    item: "gravel",
    price: 325,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/stonebrick.png",
    name: "Stone Bricks",
    item: "stonebrick",
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/brick.png",
    item: "brick_block",
    price: 1000,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/nether_brick.png",
    item: "nether_brick",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/soul_sand.png",
    item: "soul_sand",
    price: 200,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/glowstone.png",
    item: "glowstone",
    price: 200,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/bone_block_top.png",
    item: "bone_block",
    price: 15750,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/obsidian.png",
    item: "obsidian",
    rarity: ITEMRARITY.epic,
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/crying_obsidian.png",
    item: "crying_obsidian",
    price: 450,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/bedrock.png",
    item: "bedrock",
    price: 2000,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/prismarine_bricks.png",
    item: "prismarine",
    price: 1200,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/prismarine_dark.png",
    name: "Dark Prismarine",
    item: "prismarine",
    data: 1,
    price: 1200,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/ui/how_to_play_button_default.png",
    item: "sea_lantern",
    price: 3200,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/ochre_froglight_side.png",
    name: "Froglight",
    item: "ochre_froglight",
    price: 4800,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/pearlescent_froglight_side.png",
    name: "Froglight",
    item: "pearlescent_froglight",
    price: 4800,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/verdant_froglight_side.png",
    name: "Froglight",
    item: "verdant_froglight",
    price: 4800,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/snow.png",
    item: "snow",
    price: 400,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/powder_snow.png",
    name: "Powder Snow",
    ditem: [new Vector(0, -61, -1), 2],
    item: "powder_snow",
    price: 4000,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/ice.png",
    item: "ice",
    price: 350,
    sell: 0,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/ice_packed.png",
    item: "packed_ice",
    price: 3150,
    sell: 0,
  },
  // DECORATION
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/chest_front.png",
    item: "chest",
    price: 700,
    sell: 0,
  },
  /*
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/ender_chest_front.png",
    item: "ender_chest",
    price: 14000,
    sell: 0,
  },
  */
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/hopper_top.png",
    item: "hopper",
    price: 5600,
    sell: 0,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/furnace_front_off.png",
    item: "furnace",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/smoker_front_off.png",
    item: "smoker",
    price: 2200,
    sell: 0,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/blast_furnace_front_off.png",
    item: "blast_furnace",
    price: 3000,
    sell: 0,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/water_placeholder.png",
    name: "Water",
    ditem: [new Vector(0, -61, -1), 0],
    item: "water",
    price: 1000,
    sell: 0,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/lava_placeholder.png",
    name: "Lava",
    ditem: [new Vector(0, -61, -1), 1],
    item: "lava",
    price: 5000,
    sell: 0,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/ui/how_to_play_button_default.png",
    item: "sign",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/items/item_frame.png",
    name: "Item Frame",
    item: "frame",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/items/glow_item_frame.png",
    name: "Glow Item Frame",
    item: "glow_frame",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/hay_block_side.png",
    item: "hay_block",
    price: 1800,
    sell: 0,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/mushroom_block_skin_red.png",
    item: "red_mushroom_block",
    price: 1600,
    sell: 0,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/mushroom_block_skin_brown.png",
    item: "brown_mushroom_block",
    price: 1600,
    sell: 0,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/redstone_lamp_off.png",
    item: "redstone_lamp",
    price: 1200,
    sell: 0,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/dragon_egg.png",
    item: "dragon_egg",
    price: 20000000,
    sell: 0,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/ui/how_to_play_button_default.png",
    item: "lightning_rod",
    price: 1100,
    sell: 0,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/bookshelf.png",
    item: "bookshelf",
    price: 1800,
    sell: 0,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/chiseled_bookshelf_occupied.png",
    item: "chiseled_bookshelf",
    price: 2700,
    sell: 0,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/web.png",
    item: "web",
    price: 800,
    sell: 0,
  },
  // FLOWERS
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/flower_rose.png",
    name: "Poppy",
    item: "red_flower",
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/flower_dandelion.png",
    name: "Dandelion",
    item: "yellow_flower",
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/flower_blue_orchid.png",
    name: "Blue Orchid",
    item: "red_flower",
    data: 1,
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/flower_allium.png",
    name: "Allium",
    item: "red_flower",
    data: 2,
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/flower_houstonia.png",
    name: "Azure Bluet",
    item: "red_flower",
    data: 3,
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/flower_tulip_red.png",
    name: "Red Tulip",
    item: "red_flower",
    data: 4,
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/flower_tulip_orange.png",
    name: "Orange Tulip",
    item: "red_flower",
    data: 5,
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/flower_tulip_white.png",
    name: "White Tulip",
    item: "red_flower",
    data: 6,
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/flower_tulip_pink.png",
    name: "Pink Tulip",
    item: "red_flower",
    data: 7,
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/flower_oxeye_daisy.png",
    name: "Oxeye Daisy",
    item: "red_flower",
    data: 8,
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/flower_cornflower.png",
    name: "Cornflower",
    item: "red_flower",
    data: 9,
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/flower_lily_of_the_valley.png",
    name: "Lily of the Valley",
    item: "red_flower",
    data: 10,
    price: 250,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/double_plant_sunflower_front.png",
    name: "Sunflower",
    item: "double_plant",
    price: 500,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/double_plant_rose_top.png",
    name: "Rose Bush",
    item: "double_plant",
    data: 4,
    price: 500,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/double_plant_paeonia_top.png",
    name: "Peony",
    item: "double_plant",
    data: 5,
    price: 500,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/pitcher_crop_top_stage_4.png",
    item: "pitcher_plant",
    price: 700,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/torchflower.png",
    item: "torchflower",
    price: 700,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/blocks/pink_petals.png",
    item: "pink_petals",
    price: 350,
    sell: 0,
  },
  {
    category: CATEGORY.flowers,
    texture: "textures/items/dye_powder_brown.png",
    item: "cocoa_beans",
    price: 400,
    sell: 0,
  },
  // WOOL
  {
    category: CATEGORY.wool,
    texture: "textures/blocks/wool_colored_white.png",
    item: "white_wool",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.wool,
    texture: "textures/blocks/wool_colored_pink.png",
    item: "pink_wool",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.wool,
    texture: "textures/blocks/wool_colored_magenta.png",
    item: "magenta_wool",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.wool,
    texture: "textures/blocks/wool_colored_purple.png",
    item: "purple_wool",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.wool,
    texture: "textures/blocks/wool_colored_red.png",
    item: "red_wool",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.wool,
    texture: "textures/blocks/wool_colored_orange.png",
    item: "orange_wool",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.wool,
    texture: "textures/blocks/wool_colored_yellow.png",
    item: "yellow_wool",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.wool,
    texture: "textures/blocks/wool_colored_lime.png",
    item: "lime_wool",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.wool,
    texture: "textures/blocks/wool_colored_green.png",
    item: "green_wool",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.wool,
    texture: "textures/blocks/wool_colored_cyan.png",
    item: "cyan_wool",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.wool,
    texture: "textures/blocks/wool_colored_light_blue.png",
    item: "light_blue_wool",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.wool,
    texture: "textures/blocks/wool_colored_blue.png",
    item: "blue_wool",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.wool,
    texture: "textures/blocks/wool_colored_silver.png",
    item: "light_gray_wool",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.wool,
    texture: "textures/blocks/wool_colored_gray.png",
    item: "gray_wool",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.wool,
    texture: "textures/blocks/wool_colored_brown.png",
    item: "brown_wool",
    price: 800,
    sell: 0,
  },
  {
    category: CATEGORY.wool,
    texture: "textures/blocks/wool_colored_black.png",
    item: "black_wool",
    price: 800,
    sell: 0,
  },
  // TERRACOTTA
  {
    category: CATEGORY.terracotta,
    texture: "textures/blocks/hardened_clay_stained_white.png",
    item: "white_terracotta",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.terracotta,
    texture: "textures/blocks/hardened_clay_stained_pink.png",
    item: "pink_terracotta",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.terracotta,
    texture: "textures/blocks/hardened_clay_stained_magenta.png",
    item: "magenta_terracotta",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.terracotta,
    texture: "textures/blocks/hardened_clay_stained_purple.png",
    item: "purple_terracotta",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.terracotta,
    texture: "textures/blocks/hardened_clay_stained_red.png",
    item: "red_terracotta",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.terracotta,
    texture: "textures/blocks/hardened_clay_stained_orange.png",
    item: "orange_terracotta",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.terracotta,
    texture: "textures/blocks/hardened_clay_stained_yellow.png",
    item: "yellow_terracotta",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.terracotta,
    texture: "textures/blocks/hardened_clay_stained_lime.png",
    item: "lime_terracotta",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.terracotta,
    texture: "textures/blocks/hardened_clay_stained_green.png",
    item: "green_terracotta",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.terracotta,
    texture: "textures/blocks/hardened_clay_stained_cyan.png",
    item: "cyan_terracotta",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.terracotta,
    texture: "textures/blocks/hardened_clay_stained_light_blue.png",
    item: "light_blue_terracotta",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.terracotta,
    texture: "textures/blocks/hardened_clay_stained_blue.png",
    item: "blue_terracotta",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.terracotta,
    texture: "textures/blocks/hardened_clay_stained_silver.png",
    item: "light_gray_terracotta",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.terracotta,
    texture: "textures/blocks/hardened_clay_stained_gray.png",
    item: "gray_terracotta",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.terracotta,
    texture: "textures/blocks/hardened_clay_stained_brown.png",
    item: "brown_terracotta",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.terracotta,
    texture: "textures/blocks/hardened_clay_stained_black.png",
    item: "black_terracotta",
    price: 1250,
    sell: 0,
  },
  // STAINED GLASS
  {
    category: CATEGORY.glass,
    texture: "textures/blocks/glass.png",
    item: "glass",
    price: 500,
    sell: 0,
  },
  {
    category: CATEGORY.glass,
    texture: "textures/blocks/glass_white.png",
    item: "white_stained_glass",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.glass,
    texture: "textures/blocks/glass_pink.png",
    item: "pink_stained_glass",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.glass,
    texture: "textures/blocks/glass_magenta.png",
    item: "magenta_stained_glass",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.glass,
    texture: "textures/blocks/glass_purple.png",
    item: "purple_stained_glass",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.glass,
    texture: "textures/blocks/glass_red.png",
    item: "red_stained_glass",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.glass,
    texture: "textures/blocks/glass_orange.png",
    item: "orange_stained_glass",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.glass,
    texture: "textures/blocks/glass_yellow.png",
    item: "yellow_stained_glass",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.glass,
    texture: "textures/blocks/glass_lime.png",
    item: "lime_stained_glass",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.glass,
    texture: "textures/blocks/glass_green.png",
    item: "green_stained_glass",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.glass,
    texture: "textures/blocks/glass_cyan.png",
    item: "cyan_stained_glass",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.glass,
    texture: "textures/blocks/glass_light_blue.png",
    item: "light_blue_stained_glass",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.glass,
    texture: "textures/blocks/glass_blue.png",
    item: "blue_stained_glass",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.glass,
    texture: "textures/blocks/glass_silver.png",
    item: "light_gray_stained_glass",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.glass,
    texture: "textures/blocks/glass_gray.png",
    item: "gray_stained_glass",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.glass,
    texture: "textures/blocks/glass_brown.png",
    item: "brown_stained_glass",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.glass,
    texture: "textures/blocks/glass_black.png",
    item: "black_stained_glass",
    price: 750,
    sell: 0,
  },
  // EQUIPMENT
  // LEATHER
  {
    category: CATEGORY.leather,
    texture: "textures/items/leather_helmet.tga",
    item: "leather_helmet",
    price: 750,
    sell: 0,
  },
  {
    category: CATEGORY.leather,
    texture: "textures/items/leather_chestplate.png",
    item: "leather_chestplate",
    price: 1200,
    sell: 0,
  },
  {
    category: CATEGORY.leather,
    texture: "textures/items/leather_leggings.tga",
    item: "leather_leggings",
    price: 1050,
    sell: 0,
  },
  {
    category: CATEGORY.leather,
    texture: "textures/items/leather_boots.tga",
    item: "leather_boots",
    price: 600,
    sell: 0,
  },
  {
    category: CATEGORY.leather,
    texture: "textures/items/wood_sword.png",
    item: "wooden_sword",
    price: 200,
    sell: 0,
  },
  {
    category: CATEGORY.leather,
    texture: "textures/items/wood_pickaxe.png",
    item: "wooden_pickaxe",
    price: 300,
    sell: 0,
  },
  {
    category: CATEGORY.leather,
    texture: "textures/items/wood_axe.png",
    item: "wooden_axe",
    price: 300,
    sell: 0,
  },
  {
    category: CATEGORY.leather,
    texture: "textures/items/wood_shovel.png",
    item: "wooden_shovel",
    price: 100,
    sell: 0,
  },
  {
    category: CATEGORY.leather,
    texture: "textures/items/wood_hoe.png",
    item: "wooden_hoe",
    price: 200,
    sell: 0,
  },
  // CHAINMAIL
  {
    category: CATEGORY.chainmail,
    texture: "textures/items/chainmail_helmet.png",
    item: "chainmail_helmet",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.chainmail,
    texture: "textures/items/chainmail_chestplate.png",
    item: "chainmail_chestplate",
    price: 1800,
    sell: 0,
  },
  {
    category: CATEGORY.chainmail,
    texture: "textures/items/chainmail_leggings.png",
    item: "chainmail_leggings",
    price: 1575,
    sell: 0,
  },
  {
    category: CATEGORY.chainmail,
    texture: "textures/items/chainmail_boots.png",
    item: "chainmail_boots",
    price: 900,
    sell: 0,
  },
  {
    category: CATEGORY.chainmail,
    texture: "textures/items/stone_sword.png",
    item: "stone_sword",
    price: 350,
    sell: 0,
  },
  {
    category: CATEGORY.chainmail,
    texture: "textures/items/stone_pickaxe.png",
    item: "stone_pickaxe",
    price: 475,
    sell: 0,
  },
  {
    category: CATEGORY.chainmail,
    texture: "textures/items/stone_axe.png",
    item: "stone_axe",
    price: 475,
    sell: 0,
  },
  {
    category: CATEGORY.chainmail,
    texture: "textures/items/stone_shovel.png",
    item: "stone_shovel",
    price: 225,
    sell: 0,
  },
  {
    category: CATEGORY.chainmail,
    texture: "textures/items/stone_hoe.png",
    item: "stone_hoe",
    price: 350,
    sell: 0,
  },
  // GOLD
  {
    category: CATEGORY.gold,
    texture: "textures/items/gold_helmet.png",
    item: "golden_helmet",
    price: 5500,
    sell: 0,
  },
  {
    category: CATEGORY.gold,
    texture: "textures/items/gold_chestplate.png",
    item: "golden_chestplate",
    price: 8800,
    sell: 0,
  },
  {
    category: CATEGORY.gold,
    texture: "textures/items/gold_leggings.png",
    item: "golden_leggings",
    price: 7700,
    sell: 0,
  },
  {
    category: CATEGORY.gold,
    texture: "textures/items/gold_boots.png",
    item: "golden_boots",
    price: 4400,
    sell: 0,
  },
  {
    category: CATEGORY.gold,
    texture: "textures/items/gold_sword.png",
    item: "golden_sword",
    price: 2200,
    sell: 0,
  },
  {
    category: CATEGORY.gold,
    texture: "textures/items/gold_pickaxe.png",
    item: "golden_pickaxe",
    price: 3300,
    sell: 0,
  },
  {
    category: CATEGORY.gold,
    texture: "textures/items/gold_axe.png",
    item: "golden_axe",
    price: 3300,
    sell: 0,
  },
  {
    category: CATEGORY.gold,
    texture: "textures/items/gold_shovel.png",
    item: "golden_shovel",
    price: 1100,
    sell: 0,
  },
  {
    category: CATEGORY.gold,
    texture: "textures/items/gold_hoe.png",
    item: "golden_hoe",
    price: 2200,
    sell: 0,
  },
  // IRON
  {
    category: CATEGORY.iron,
    texture: "textures/items/iron_helmet.png",
    item: "iron_helmet",
    price: 7000,
    sell: 0,
  },
  {
    category: CATEGORY.iron,
    texture: "textures/items/iron_chestplate.png",
    item: "iron_chestplate",
    price: 11200,
    sell: 0,
  },
  {
    category: CATEGORY.iron,
    texture: "textures/items/iron_leggings.png",
    item: "iron_leggings",
    price: 9800,
    sell: 0,
  },
  {
    category: CATEGORY.iron,
    texture: "textures/items/iron_boots.png",
    item: "iron_boots",
    price: 5600,
    sell: 0,
  },
  {
    category: CATEGORY.iron,
    texture: "textures/items/iron_sword.png",
    item: "iron_sword",
    price: 2800,
    sell: 0,
  },
  {
    category: CATEGORY.iron,
    texture: "textures/items/iron_pickaxe.png",
    item: "iron_pickaxe",
    price: 4200,
    sell: 0,
  },
  {
    category: CATEGORY.iron,
    texture: "textures/items/iron_axe.png",
    item: "iron_axe",
    price: 4200,
    sell: 0,
  },
  {
    category: CATEGORY.iron,
    texture: "textures/items/iron_shovel.png",
    item: "iron_shovel",
    price: 1400,
    sell: 0,
  },
  {
    category: CATEGORY.iron,
    texture: "textures/items/iron_hoe.png",
    item: "iron_hoe",
    price: 2800,
    sell: 0,
  },
  // DIAMOND
  {
    category: CATEGORY.diamond,
    texture: "textures/items/diamond_helmet.png",
    item: "diamond_helmet",
    price: 10000,
    sell: 0,
  },
  {
    category: CATEGORY.diamond,
    texture: "textures/items/diamond_chestplate.png",
    item: "diamond_chestplate",
    price: 16000,
    sell: 0,
  },
  {
    category: CATEGORY.diamond,
    texture: "textures/items/diamond_leggings.png",
    item: "diamond_leggings",
    price: 14000,
    sell: 0,
  },
  {
    category: CATEGORY.diamond,
    texture: "textures/items/diamond_boots.png",
    item: "diamond_boots",
    price: 8000,
    sell: 0,
  },
  {
    category: CATEGORY.diamond,
    texture: "textures/items/diamond_sword.png",
    item: "diamond_sword",
    price: 4000,
    sell: 0,
  },
  {
    category: CATEGORY.diamond,
    texture: "textures/items/diamond_pickaxe.png",
    item: "diamond_pickaxe",
    price: 6000,
    sell: 0,
  },
  {
    category: CATEGORY.diamond,
    texture: "textures/items/diamond_axe.png",
    item: "diamond_axe",
    price: 6000,
    sell: 0,
  },
  {
    category: CATEGORY.diamond,
    texture: "textures/items/diamond_shovel.png",
    item: "diamond_shovel",
    price: 2000,
    sell: 0,
  },
  {
    category: CATEGORY.diamond,
    texture: "textures/items/diamond_hoe.png",
    item: "diamond_hoe",
    price: 4000,
    sell: 0,
  },
  // OTHER
  {
    category: CATEGORY.equipment,
    texture: "textures/items/elytra.png",
    item: "elytra",
    price: 10000000,
    sell: 0,
  },
  {
    category: CATEGORY.equipment,
    texture: "textures/items/bow_standby.png",
    item: "bow",
    price: 2500,
    sell: 0,
  },
  {
    category: CATEGORY.equipment,
    texture: "textures/items/spyglass.png",
    item: "spyglass",
    price: 22000,
    sell: 0,
  },
  {
    category: CATEGORY.equipment,
    texture: "textures/items/saddle.png",
    item: "saddle",
    price: 7000,
    sell: 0,
  },
  // RESOURCES
  {
    category: CATEGORY.items,
    texture: "textures/blocks/cobblestone.png",
    item: "cobblestone",
    price: 0,
    sell: 125,
  },
  {
    category: CATEGORY.items,
    texture: "textures/blocks/netherrack.png",
    item: "netherrack",
    price: 0,
    sell: 125,
  },
  {
    category: CATEGORY.items,
    texture: "textures/items/coal.png",
    item: "coal",
    price: 750,
    sell: 40,
  },
  {
    category: CATEGORY.items,
    texture: "textures/items/gold_ingot.png",
    item: "gold_ingot",
    price: 1100,
    sell: 60,
  },
  {
    category: CATEGORY.items,
    texture: "textures/items/iron_ingot.png",
    item: "iron_ingot",
    price: 1400,
    sell: 70,
  },
  {
    category: CATEGORY.items,
    texture: "textures/items/dye_powder_blue.png",
    item: "lapis_lazuli",
    price: 1500,
    sell: 80,
  },
  {
    category: CATEGORY.items,
    texture: "textures/items/diamond.png",
    item: "diamond",
    price: 2000,
    sell: 100,
  },
  {
    category: CATEGORY.items,
    texture: "textures/items/emerald.png",
    item: "emerald",
    price: 0,
    sell: 110,
  },
  {
    category: CATEGORY.items,
    texture: "textures/items/arrow.png",
    item: "arrow",
    price: 233,
    sell: 0,
  },
  // FARMING
  // FOOD
  {
    category: CATEGORY.food,
    texture: "textures/items/cookie.png",
    item: "cookie",
    price: 160,
    sell: 0,
  },
  {
    category: CATEGORY.food,
    texture: "textures/items/beetroot_soup.png",
    item: "beetroot_soup",
    price: 2000,
    sell: 0,
  },
  {
    category: CATEGORY.food,
    texture: "textures/items/mushroom_stew.png",
    item: "mushroom_stew",
    price: 3000,
    sell: 0,
  },
  {
    category: CATEGORY.food,
    texture: "textures/items/rabbit_stew.png",
    item: "rabbit_stew",
    price: 4500,
    sell: 0,
  },
  {
    category: CATEGORY.food,
    texture: "textures/items/cake.png",
    item: "cake",
    price: 5000,
    sell: 0,
  },
  {
    category: CATEGORY.food,
    texture: "textures/items/apple_golden.png",
    item: "golden_apple",
    price: 7500,
    sell: 0,
  },
  {
    category: CATEGORY.food,
    texture: "textures/items/apple_golden.png",
    item: "enchanted_golden_apple",
    price: 250000,
    sell: 0,
  },
  // FARMING
  {
    category: CATEGORY.farming,
    texture: "textures/items/seeds_beetroot.png",
    item: "beetroot_seeds",
    price: 75,
    sell: 0,
  },
  {
    category: CATEGORY.farming,
    texture: "textures/items/beetroot.png",
    item: "beetroot",
    price: 225,
    sell: 15,
  },
  {
    category: CATEGORY.farming,
    texture: "textures/items/seeds_wheat.png",
    item: "wheat_seeds",
    price: 105,
    sell: 0,
  },
  {
    category: CATEGORY.farming,
    texture: "textures/items/wheat.png",
    item: "wheat",
    price: 315,
    sell: 20,
  },
  {
    category: CATEGORY.farming,
    texture: "textures/items/carrot.png",
    item: "carrot",
    price: 0,
    sell: 30,
  },
  {
    category: CATEGORY.farming,
    texture: "textures/items/potato.png",
    item: "potato",
    price: 0,
    sell: 35,
  },
  {
    category: CATEGORY.farming,
    texture: "textures/items/reeds.png",
    item: "sugar_cane",
    price: 375,
    sell: 25,
  },
  {
    category: CATEGORY.farming,
    texture: "textures/blocks/cactus_side.tga",
    item: "cactus",
    price: 425,
    sell: 25,
  },
  {
    category: CATEGORY.farming,
    texture: "textures/items/seeds_pumpkin.png",
    item: "pumpkin_seeds",
    price: 300,
    sell: 0,
  },
  {
    category: CATEGORY.farming,
    texture: "textures/blocks/pumpkin_side.png",
    item: "pumpkin",
    price: 900,
    sell: 90,
  },
  {
    category: CATEGORY.farming,
    texture: "textures/blocks/pumpkin_face_on.png",
    item: "lit_pumpkin",
    price: 3600,
    sell: 105,
  },
  {
    category: CATEGORY.farming,
    texture: "textures/items/seeds_melon.png",
    item: "melon_seeds",
    price: 325,
    sell: 0,
  },
  {
    category: CATEGORY.farming,
    texture: "textures/blocks/melon_side.png",
    item: "melon_block",
    price: 975,
    sell: 100,
  },
  {
    category: CATEGORY.farming,
    texture: "textures/items/dye_powder_white.png",
    item: "bone_meal",
    price: 1750,
    sell: 0,
  },
  // SAPLINGS
  {
    category: CATEGORY.saplings,
    texture: "textures/blocks/sapling_oak.png",
    name: "Oak Sapling",
    item: "sapling",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.saplings,
    texture: "textures/blocks/sapling_birch.png",
    name: "Birch Sapling",
    item: "sapling",
    data: 2,
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.saplings,
    texture: "textures/blocks/sapling_spruce.png",
    name: "Spruce Sapling",
    item: "sapling",
    data: 1,
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.saplings,
    texture: "textures/blocks/sapling_acacia.png",
    name: "Acacia Sapling",
    item: "sapling",
    data: 4,
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.saplings,
    texture: "textures/blocks/sapling_jungle.png",
    name: "Jungle Sapling",
    item: "sapling",
    data: 3,
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.saplings,
    texture: "textures/blocks/sapling_roofed_oak.png",
    name: "Dark Oak Sapling",
    item: "sapling",
    data: 5,
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.saplings,
    texture: "textures/blocks/mangrove_propagule.png",
    item: "mangrove_propagule",
    price: 1250,
    sell: 0,
  },
  {
    category: CATEGORY.saplings,
    texture: "textures/blocks/cherry_sapling.png",
    item: "cherry_sapling",
    price: 3250,
    sell: 0,
  },
  // SPAWNERS
  {
    category: CATEGORY.spawners,
    texture: "textures/blocks/mob_spawner.png",
    name: "Pig Spawner",
    ditem: [new Vector(0, -61, -1), 9],
    item: "spawner_pig",
    price: 4000000,
    sell: 0,
  },
  {
    category: CATEGORY.spawners,
    texture: "textures/blocks/mob_spawner.png",
    name: "Cow Spawner",
    ditem: [new Vector(0, -61, -1), 10],
    item: "spawner_cow",
    price: 4500000,
    sell: 0,
  },
  {
    category: CATEGORY.spawners,
    texture: "textures/blocks/mob_spawner.png",
    name: "Sheep Spawner",
    ditem: [new Vector(0, -61, -1), 11],
    item: "spawner_sheep",
    price: 5000000,
    sell: 0,
  },
  {
    category: CATEGORY.spawners,
    texture: "textures/blocks/mob_spawner.png",
    name: "Mooshroom Spawner",
    ditem: [new Vector(0, -61, -1), 12],
    item: "spawner_mooshroom",
    price: 6000000,
    sell: 0,
  },
  {
    category: CATEGORY.spawners,
    texture: "textures/blocks/mob_spawner.png",
    name: "Spider Spawner",
    ditem: [new Vector(0, -61, -1), 13],
    item: "spawner_spider",
    price: 7000000,
    sell: 0,
  },
  {
    category: CATEGORY.spawners,
    texture: "textures/blocks/mob_spawner.png",
    name: "Skeleton Spawner",
    ditem: [new Vector(0, -61, -1), 14],
    item: "spawner_skeleton",
    price: 7500000,
    sell: 0,
  },
  {
    category: CATEGORY.spawners,
    texture: "textures/blocks/mob_spawner.png",
    name: "Zombie Spawner",
    ditem: [new Vector(0, -61, -1), 15],
    item: "spawner_zombie",
    price: 8500000,
    sell: 0,
  },
  {
    category: CATEGORY.spawners,
    texture: "textures/blocks/mob_spawner.png",
    name: "Iron Golem Spawner",
    ditem: [new Vector(0, -61, -1), 16],
    item: "spawner_iron_golem",
    price: 10000000,
    sell: 0,
  },
  {
    category: CATEGORY.spawners,
    texture: "textures/blocks/mob_spawner.png",
    name: "Zombie Pigman Spawner",
    ditem: [new Vector(0, -61, -1), 17],
    item: "spawner_zombie_pigman",
    price: 11000000,
    sell: 0,
  },
];

export const subCategories = [
  /*{
    category: CATEGORY.example,
    texture: "textures/example/test.png",
    name*: "Test Example"
    group: CATEGORY.example2,
    sort*: boolean,
  },*/
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/log_oak.png",
    item: "oak_log",
    name: "Wood Logs",
    group: CATEGORY.wood,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/stone.png",
    item: "stone",
    name: "Stones",
    group: CATEGORY.stone,
  },
  {
    category: CATEGORY.blocks,
    texture: "textures/blocks/sand.png",
    item: "sand",
    name: "Sand",
    group: CATEGORY.sand,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/glass_white.png",
    item: "glass",
    name: "Glass",
    group: CATEGORY.glass,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/hardened_clay.png",
    item: "terracotta",
    name: "Terracotta",
    group: CATEGORY.terracotta,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/wool_colored_white.png",
    item: "wool",
    name: "Wool",
    group: CATEGORY.wool,
  },
  {
    category: CATEGORY.decoration,
    texture: "textures/blocks/flower_rose.png",
    item: "red_flower",
    name: "Flowers",
    group: CATEGORY.flowers,
  },
  {
    category: CATEGORY.equipment,
    texture: "textures/items/leather_chestplate.png",
    item: "leather_chestplate",
    name: "Leather",
    group: CATEGORY.leather,
    sort: false,
  },
  {
    category: CATEGORY.equipment,
    texture: "textures/items/chainmail_chestplate.png",
    item: "chainmail_chestplate",
    name: "Chainmail",
    group: CATEGORY.chainmail,
    sort: false,
  },
  {
    category: CATEGORY.equipment,
    texture: "textures/items/gold_chestplate.png",
    item: "gold_chestplate",
    name: "Gold",
    group: CATEGORY.gold,
    sort: false,
  },
  {
    category: CATEGORY.equipment,
    texture: "textures/items/iron_chestplate.png",
    item: "iron_chestplate",
    name: "Iron",
    group: CATEGORY.iron,
    sort: false,
  },
  {
    category: CATEGORY.equipment,
    texture: "textures/items/diamond_chestplate.png",
    item: "diamond_chestplate",
    name: "Diamond",
    group: CATEGORY.diamond,
    sort: false,
  },
  {
    category: CATEGORY.farming,
    texture: "textures/items/pumpkin_pie.png",
    item: "pumpkin_pie",
    name: "Food",
    group: CATEGORY.food,
  },
  {
    category: CATEGORY.farming,
    texture: "textures/blocks/sapling_oak.png",
    item: "sapling",
    name: "Saplings",
    group: CATEGORY.saplings,
  },
];

export function OpenShop(player: Player) {
  let coins = playerDB.get(player.id).coins;
  const gui = new ActionFormData();
  player.playSound(`item.spyglass.use`, { pitch: 1 });
  player.playSound(`note.snare`, { pitch: 1.2 });
  player.playSound(`note.chime`, { pitch: 0.8 });
  gui.title(`§e§lShop§r`);
  gui.body(`§eYour Balance: §f$${formatNumber(coins)}`);
  gui.button("§8Search Items", `textures/ui/refresh_hover.png`);
  gui.button("§4Specials", `textures/ui/sprint_pressed.png`);
  gui.button("§2Blocks", `textures/ui/flyingdescend_pressed.png`);
  gui.button("§3Equipment", `textures/ui/attack_pressed.png`);
  gui.button("§5Decoration", `textures/ui/sneak_pressed.png`);
  gui.button("§6Farming", `textures/ui/waterdescend_pressed.png`);
  gui.button("§cItems", `textures/ui/mount_pressed.png`);
  gui.button("§9Enchantments", `textures/ui/how_to_play_button_default.png`);
  gui.button("§tCE Books", `textures/ui/how_to_play_button_default.png`);
  gui.button("§uSpawners", `textures/ui/how_to_play_button_default.png`);
  gui.show(player).then((result) => {
    if (result.selection == 0) {
      //ShopSearch(player);
    } else if (result.selection == 1) {
      ShopTabStandard(
        `Specials`,
        `random.enderchestopen`,
        CATEGORY.special,
        player,
        true
      );
    } else if (result.selection == 2) {
      ShopTabStandard(`Blocks`, `dig.stone`, CATEGORY.blocks, player, true);
    } else if (result.selection == 3) {
      ShopTabStandard(
        `Equipment`,
        `armor.equip_diamond`,
        CATEGORY.equipment,
        player,
        true
      );
    } else if (result.selection == 4) {
      ShopTabStandard(
        `Decoration`,
        `dig.wood`,
        CATEGORY.decoration,
        player,
        true
      );
    } else if (result.selection == 5) {
      ShopTabStandard(`Farming`, `dig.grass`, CATEGORY.farming, player, false);
    } else if (result.selection == 6) {
      ShopTabStandard(
        `Items`,
        `block.itemframe.add_item`,
        CATEGORY.items,
        player,
        false
      );
    } else if (result.selection == 7) {
      ShopTabEnchantments(
        `Enchantments`,
        `item.book.page_turn`,
        101,
        EnchantEntries,
        player,
        false
      );
    } else if (result.selection == 8) {
      ShopTabStandard(
        `CE Books`,
        `item.book.page_turn`,
        CATEGORY.cebooks,
        player,
        true
      );
    } else if (result.selection == 9) {
      ShopTabStandard(
        `Spawners`,
        `mob.chicken.say`,
        CATEGORY.spawners,
        player,
        true
      );
    }
  });
}

function ShopTabStandard(
  title: string,
  sound: string,
  category: typeof CATEGORY.special,
  player: Player,
  sort: boolean,
  lastCat?: Array<any>
) {
  system.runTimeout(() => {
    player.playSound(sound, { volume: 1.25 });
  }, 2);
  const tabUI = new ActionFormData();
  tabUI.title(`§e§lShop§r / ${title}`);
  let coins = playerDB.get(player.id).coins;
  tabUI.body(`§eYour Balance: §f$${formatNumber(coins)}`);
  let subCats = subCategories.filter((x) => x.category == category);
  subCats.map((x) => {
    tabUI.button(`§8${x.name}`, x.texture);
  });
  let items = ShopItems.filter((x) => x.category == category);
  if (sort == true) items = items.sort((x, y) => x.price - y.price);
  if (items.length == 0) {
    sendError(player, `This category is empty.`, PREFIX.shop);
    OpenShop(player);
    return;
  }
  items.map((x) => {
    let p = `§c$${formatNumber(x.price)}§8`;
    if (x.price <= coins) p = `§2$${formatNumber(x.price)}§8`;
    if (x.sell > 0 && x.price == 0) p = `§3$${formatNumber(x.sell)}§8`;
    else if (x.sell > 0) p = `§3$${formatNumber(x.sell)} §8| ${p}§8`;
    tabUI.button(`§8${x.name ?? formatItemName(x.item)} [${p}]`, x.texture);
  });
  tabUI.show(player).then((result) => {
    if (result.canceled) {
      if (lastCat)
        ShopTabStandard(
          `§8${lastCat[1]}`,
          `note.hat`,
          lastCat[0],
          player,
          lastCat[2]
        );
      else OpenShop(player);
      return;
    }
    let subCategory = subCategories.find((x) => {
      return x == subCats[result.selection ?? -1];
    });
    let optionData = ShopItems.find((x) => {
      return x == items[(result.selection ?? -1) - (subCats.length ?? 0)];
    });
    if (!optionData && !subCategory) {
      sendError(player, `This item is unavailable.`, PREFIX.shop);
      return;
    } else if (subCategory)
      ShopTabStandard(
        `§8${subCategory.name}`,
        `note.hat`,
        subCategory.group,
        player,
        sort,
        [category, title]
      );
    else if (optionData) purchaseItem(player, title, optionData);
  });
}

function purchaseItem(
  player: Player,
  title: string,
  optionData: {
    category: number;
    texture: string;
    name?: string;
    item: string;
    price: number;
    sell: number;
    data?: number;
    ditem?: Array<any>;
  }
) {
  let coins = playerDB.get(player.id).coins;
  let name = optionData.name ?? formatItemName(optionData.item);
  const itemInfoUI = new ModalFormData();
  itemInfoUI.title(`${title} §r/ ${name}`);
  itemInfoUI.slider(
    `\n§eYour Balance: §f$${formatNumber(coins)}\nAmount`,
    0,
    256,
    1
  );
  itemInfoUI.textField(`Override:`, `64`);
  if (optionData.sell > 0 && optionData.price > 0)
    itemInfoUI.toggle(`Sell Mode`, false);
  itemInfoUI.show(player).then((result) => {
    if (result.canceled || !result.formValues) return;
    system.runTimeout(() => {
      player.playSound(`note.xylophone`, { volume: 1, pitch: 0.75 });
    }, 2);
    let amount = 0;
    let price = optionData.price;
    let mod = ["§r§4-§c$", "§abuy"];
    if (
      (result.formValues[2] && result.formValues[2] == true) ||
      optionData.price == 0
    ) {
      price = optionData.sell;
      mod = ["§r§2+§a$", "§bsell"];
    }
    if (result.formValues[1]) amount = Number(result.formValues[1]);
    else amount = Number(result.formValues[0]);
    const confirmUI = new ActionFormData();
    confirmUI.title(`${name} §r/ Transaction`);
    confirmUI.body(
      `\n§7Are you sure you want to continue?§f\n----- --------- -----\n§eType: §r${
        mod[1]
      }\n§bItem:§r §f${name}[§9${
        optionData.data ?? 0
      }§f] §7x${amount}\n§dValue:§r ${mod[0]}${formatNumber(
        price * amount
      )}\n§f----- --------- -----\n\n`
    );
    confirmUI.button(`Confirm`);
    confirmUI.button(`Cancel`);
    confirmUI.show(player).then((result) => {
      if (!result.canceled && result.selection == 0) {
        let inv = (<EntityInventoryComponent>player.getComponent("inventory"))
          .container;
        if (!inv) return;
        if (inv.emptySlotsCount == 0) {
          sendError(player, `Your inventory is full.`, PREFIX.shop);
          return;
        } else {
          if (price == optionData.price) {
            if (coins < price * amount) {
              sendError(
                player,
                `You cannot afford this transaction.`,
                PREFIX.shop
              );
              return;
            } else {
              let pdata = playerDB.get(player.id);
              pdata.coins = pdata.coins - price * amount;
              playerDB.set(player.id, pdata);
              if (optionData.ditem) {
                const binv = (<BlockInventoryComponent>(
                  overworld
                    .getBlock(optionData.ditem[0])
                    ?.getComponent("inventory")
                )).container;
                const pinv = (<EntityInventoryComponent>(
                  player.getComponent("inventory")
                )).container;
                let it = binv?.getItem(optionData.ditem[1])?.clone();
                if (it && pinv) {
                  it.amount = amount;
                  pinv.addItem(it);
                }
              } else
                player.runCommandAsync(
                  `give @s ${optionData.item} ${amount} ${optionData.data ?? 0}`
                );
              sendAlert(
                player,
                `§eBought §7${name} §8x${amount} §f§l-> ${mod[0]}${formatNumber(
                  price * amount
                )}`,
                PREFIX.shop
              );
              system.runTimeout(() => {
                player.playSound(`note.iron_xylophone`, {
                  volume: 1,
                  pitch: 1,
                });
                player.playSound(`note.iron_xylophone`, {
                  volume: 1,
                  pitch: 2,
                });
              }, 2);
              return;
            }
          } else if (price == optionData.sell) {
            let getItem = getItemAmount(player, optionData.item, false);
            if (getItem <= amount) amount = getItem;
            if (amount == 0) {
              sendAlert(player, `§cInsufficient item to sell.`, PREFIX.shop);
              return;
            }
            player.runCommandAsync(
              `clear @s ${optionData.item} ${optionData.data ?? 0} ${amount}`
            );
            let total = Math.floor(price * amount);
            let pdata = playerDB.get(player.id);
            pdata.coins = pdata.coins + total;
            playerDB.set(player.id, pdata);
            sendAlert(
              player,
              `§aSold §7${name} §8x${amount} §f§l-> ${mod[0]}${formatNumber(
                total
              )}`,
              PREFIX.shop
            );
            system.runTimeout(() => {
              player.playSound(`note.iron_xylophone`, { volume: 1, pitch: 1 });
              player.playSound(`note.iron_xylophone`, { volume: 1, pitch: 2 });
            }, 2);
            return;
          }
        }
      }
    });
  });
}

export function ShopTabEnchantments(
  title: string,
  sound: string,
  category: typeof CATEGORY.special,
  store: typeof ShopItems,
  player: Player,
  sort: boolean,
  lastCat?: Array<any>
) {
  system.runTimeout(() => {
    player.playSound(sound, { volume: 1.25 });
  }, 2);
  const tabUI = new ActionFormData();
  tabUI.title(`§e§lShop§r / ${title}`);
  let coins = playerDB.get(player.id).coins;
  tabUI.body(`§eYour Balance: §f$${formatNumber(coins)}`);
  let subCats = subCategories.filter((x) => x.category == category);
  subCats.map((x) => {
    tabUI.button(`§8${x.name}`, x.texture);
  });
  let items = store.filter((x) => x.category == category);
  if (sort == true) items = items.sort((x, y) => x.price - y.price);
  if (items.length == 0) {
    sendError(player, `This category is empty.`, PREFIX.shop);
    OpenShop(player);
    return;
  }
  items.map((x) => {
    tabUI.button(`§8${x.name ?? formatItemName(x.item)}`, x.texture);
  });
  tabUI.show(player).then((result) => {
    if (result.canceled) {
      if (lastCat)
        ShopTabStandard(
          `§8${lastCat[1]}`,
          `note.hat`,
          lastCat[0],
          player,
          lastCat[2]
        );
      else OpenShop(player);
      return;
    }
    let subCategory = subCategories.find((x) => {
      return x == subCats[result.selection ?? -1];
    });
    let optionData = store.find((x) => {
      return x == items[(result.selection ?? -1) - (subCats.length ?? 0)];
    });
    if (!optionData && !subCategory) {
      sendError(player, `This item is unavailable.`, PREFIX.shop);
      return;
    } else if (subCategory)
      ShopTabStandard(
        `§8${subCategory.name}`,
        `note.hat`,
        subCategory.group,
        player,
        sort,
        [category, title]
      );
    else if (optionData) purchaseEnchantment(player, title, optionData);
  });
}

function purchaseEnchantment(
  player: Player,
  title: string,
  optionData: {
    category: number;
    texture: string;
    name?: string;
    item: string;
    price: number;
    sell: number;
    data?: number;
    ditem?: Array<any>;
    max?: number;
  }
) {
  let coins = playerDB.get(player.id).coins;
  let name = optionData.name ?? formatItemName(optionData.item);
  const itemInfoUI = new ModalFormData();
  itemInfoUI.title(`${title} §r/ ${name}`);
  itemInfoUI.slider(
    `\n§eYour Balance: §f$${formatNumber(coins)}\nLevel`,
    1,
    optionData.max ?? 1,
    1
  );
  itemInfoUI.show(player).then((result) => {
    if (result.canceled || !result.formValues) return;
    system.runTimeout(() => {
      player.playSound(`note.xylophone`, { volume: 1, pitch: 0.75 });
    }, 2);
    let amount = 0;
    let price = optionData.price;
    if (result.formValues[1]) amount = Number(result.formValues[1]);
    else amount = Number(result.formValues[0]);
    const confirmUI = new ActionFormData();
    confirmUI.title(`${name} §r/ Transaction`);
    confirmUI.body(
      `\n§7Are you sure you want to continue?§f\n----- --------- -----\n§eType: §r§6enchant\n§bEnchantment:§r §f${name} §7${toRomanNumeral(
        amount
      )}\n§dValue:§r §r§4-§c$${formatNumber(
        price * amount
      )}\n§f----- --------- -----\n\n`
    );
    confirmUI.button(`Confirm`);
    confirmUI.button(`Cancel`);
    confirmUI.show(player).then((result) => {
      if (!result.canceled && result.selection == 0) {
        if (coins < price * amount) {
          sendError(player, `You cannot afford this transaction.`, PREFIX.shop);
          return;
        } else {
          if (optionData.ditem) {
            const binv = (<BlockInventoryComponent>(
              overworld.getBlock(optionData.ditem[0])?.getComponent("inventory")
            )).container;
            const pinv = (<EntityInventoryComponent>(
              player.getComponent("inventory")
            )).container;
            let it = binv?.getItem(optionData.ditem[1])?.clone();
            if (it && pinv) {
              it.amount = amount;
              pinv.addItem(it);
            }
          } else {
            let tryEnch = VanillaEnchItem(player, optionData.item, amount);
            if (tryEnch != true) return;
          }
          let pdata = playerDB.get(player.id);
          pdata.coins = pdata.coins - price * amount;
          playerDB.set(player.id, pdata);
          sendAlert(
            player,
            `§dEnchant §b${name} §7${toRomanNumeral(
              amount
            )} §f§l-> §r§4-§c$${formatNumber(price * amount)}`,
            PREFIX.shop
          );
        }
      }
    });
  });
}

export function OpenShopBeta(player: Player) {
  let coins = playerDB.get(player.id).coins;
  const gui = new ChestFormData("shop");
  gui.pattern([0, 0], ["xxxxxxxxx", "x_______x", "xxxxxxxxx"], {
    x: {
      data: { itemName: "", itemDesc: [], enchanted: false, stackSize: 1 },
      iconPath: "textures/blocks/glass_white.png",
    },
  });
  gui.button(
    22,
    "§8Search Items",
    ["§d§lCLICK TO OPEN"],
    `minecraft:compass`,
    0,
    true
  );
  gui.button(
    21,
    "§cBack Page",
    ["§9§lCLICK TO USE"],
    `minecraft:gray_dye`,
    0,
    true
  );
  gui.button(
    23,
    "§aNext Page",
    ["§9§lCLICK TO USE"],
    `minecraft:lime_dye`,
    0,
    true
  );
  player.playSound(`note.snare`, { pitch: 1.2 });
  player.playSound(`note.chime`, { pitch: 0.8 });
  gui.title(` §f$${formatNumber(coins)}`);
  gui.button(2, "§2Blocks", ["§d§lCLICK TO OPEN"], `minecraft:grass`, 0, true);
  gui.button(3, "§3Equipment", ["§d§lCLICK TO OPEN"], `minecraft:iron_block`),
    0,
    true;
  gui.button(
    4,
    "§5Decoration",
    ["§d§lCLICK TO OPEN"],
    `minecraft:crafting_table`,
    0,
    true
  );
  gui.button(
    5,
    "§6Farming",
    ["§d§lCLICK TO OPEN"],
    `minecraft:hay_block`,
    0,
    true
  );
  gui.button(6, "§cItems", ["§d§lCLICK TO OPEN"], `minecraft:chest`, 0, true);
  gui.button(
    12,
    "§4Special §cItems",
    ["§d§lCLICK TO OPEN"],
    `minecraft:slime`,
    0,
    true
  );
  gui.button(
    13,
    "§9Enchantments",
    ["§d§lCLICK TO OPEN"],
    `minecraft:enchanted_book`,
    0,
    true
  );
  gui.button(
    14,
    "§uSpawners",
    ["§d§lCLICK TO OPEN"],
    `minecraft:mob_spawner`,
    0,
    true
  );
  gui.show(player).then((result) => {
    if (result.selection == 0) {
      //ShopSearch(player);
    } else if (result.selection == 1) {
      ShopTabBeta(
        `Specials`,
        `random.enderchestopen`,
        CATEGORY.special,
        player,
        true
      );
    } else if (result.selection == 2) {
      ShopTabBeta(`Blocks`, `dig.stone`, CATEGORY.blocks, player, true);
    } else if (result.selection == 3) {
      ShopTabBeta(
        `Equipment`,
        `armor.equip_diamond`,
        CATEGORY.equipment,
        player,
        true
      );
    } else if (result.selection == 4) {
      ShopTabBeta(`Decoration`, `dig.wood`, CATEGORY.decoration, player, true);
    } else if (result.selection == 5) {
      ShopTabBeta(`Farming`, `dig.grass`, CATEGORY.farming, player, false);
    } else if (result.selection == 6) {
      ShopTabBeta(
        `Items`,
        `block.itemframe.add_item`,
        CATEGORY.items,
        player,
        false
      );
    } else if (result.selection == 7) {
      ShopTabEnchantments(
        `Enchantments`,
        `item.book.page_turn`,
        101,
        EnchantEntries,
        player,
        false
      );
    } else if (result.selection == 8) {
      ShopTabBeta(
        `CE Books`,
        `item.book.page_turn`,
        CATEGORY.cebooks,
        player,
        true
      );
    } else if (result.selection == 9) {
      ShopTabBeta(
        `Spawners`,
        `mob.chicken.say`,
        CATEGORY.spawners,
        player,
        true
      );
    } else if (result.selection == 22) {
      sendError(player, `§cThis feature is currently disabled.`, PREFIX.shop);
      OpenShopBeta(player);
      return;
    } else if (result.selection == 21 || result.selection == 23) {
      sendError(player, `§cPage does not exist.`, PREFIX.shop);
      OpenShopBeta(player);
      return;
    }
  });
}

function ShopTabBeta(
  title: string,
  sound: string,
  category: typeof CATEGORY.special,
  player: Player,
  sort: boolean,
  lastCat?: Array<any>
) {
  system.runTimeout(() => {
    player.playSound(sound, { volume: 1.25 });
  }, 2);
  const tabUI = new ChestFormData("shop");
  let coins = playerDB.get(player.id).coins;
  tabUI.title(` §f$${formatNumber(coins)}`);
  let subCats = subCategories.filter((x) => x.category == category);
  for (let i = 0; i < subCats.length; i++) {
    let x = subCats[i];
    tabUI.button(
      i,
      `§8${x.name}`,
      ["§d§lCLICK TO OPEN"],
      x.item,
      0,
      true,
      x.texture
    );
  }
  let items = ShopItems.filter((x) => x.category == category);
  if (sort == true) items = items.sort((x, y) => x.price - y.price);
  if (items.length == 0) {
    sendError(player, `This category is empty.`, PREFIX.shop);
    OpenShop(player);
    return;
  }
  for (let i = 0; i < items.length; i++) {
    let x = items[i];
    let p = new Array();
    if (x.price != 0)
      if (x.price <= coins) p.push([`§9Price: §2$${formatNumber(x.price)}§8`]);
      else p.push([`§9Price: §c$${formatNumber(x.price)}§8`]);
    if (x.sell > 0) p.push([`§dValue: §3$${formatNumber(x.sell)}§8`]);
    let item = x.item;
    if (item.startsWith("white_")) item = item.slice(6);
    else if (x.category == CATEGORY.flowers) item = x.texture;
    tabUI.button(
      i + subCats.length,
      `${x.rarity ?? ITEMRARITY.common}${x.name ?? formatItemName(x.item)}`,
      p,
      item,
      0,
      false,
      x.texture
    );
  }
  tabUI.show(player).then((result) => {
    if (result.canceled) {
      if (lastCat)
        ShopTabBeta(
          `§8${lastCat[1]}`,
          `note.hat`,
          lastCat[0],
          player,
          lastCat[2]
        );
      else OpenShopBeta(player);
      return;
    }
    let subCategory = subCategories.find((x) => {
      return x == subCats[result.selection ?? -1];
    });
    let optionData = ShopItems.find((x) => {
      return x == items[(result.selection ?? -1) - (subCats.length ?? 0)];
    });
    if (!optionData && !subCategory) {
      sendError(player, `This item is unavailable.`, PREFIX.shop);
      return;
    } else if (subCategory)
      ShopTabBeta(
        `§8${subCategory.name}`,
        `note.hat`,
        subCategory.group,
        player,
        subCategory.sort ?? sort,
        [category, title]
      );
    else if (optionData) purchaseItemBeta(player, title, optionData, 0);
  });
}

function purchaseItemBeta(
  player: Player,
  title: string,
  optionData: {
    category: number;
    texture: string;
    name?: string;
    item: string;
    price: number;
    sell: number;
    data?: number;
    ditem?: Array<any>;
  },
  amount: number
) {
  let coins = playerDB.get(player.id).coins;
  let name = optionData.name ?? formatItemName(optionData.item);
  let price = optionData.price;
  let priceT = "§6Cost";
  let color = "lime";
  if (optionData.sell > 0) {
    price = optionData.sell;
    priceT = "§3Value";
    color = "light_blue";
  }
  const itemInfoUI = new ChestFormData("shop");
  itemInfoUI.pattern([0, 0], ["xxxxxxxxx", "x_______x", "xxxxxxxxx"], {
    x: {
      data: { itemName: "", itemDesc: [], enchanted: false, stackSize: 1 },
      iconPath: "textures/blocks/glass_white.png",
    },
  });
  itemInfoUI.title(` §f$${formatNumber(coins)}`);
  itemInfoUI.button(10, "§9Amount", ["§a+1"], `${color}_wool`, 1);
  itemInfoUI.button(11, "§9Amount", ["§a+16"], `${color}_wool`, 16);
  itemInfoUI.button(12, "§9Amount", ["§a+64"], `${color}_wool`, 64);
  let famount = Math.max(amount, 1);
  itemInfoUI.button(
    13,
    "§a§lConfirm Transaction",
    [`§3Amount: §9${famount}\n${priceT}: §f$${famount * price}`],
    optionData.item,
    amount,
    true
  );
  itemInfoUI.button(14, "§9Amount", ["§c-64"], "red_wool", 64);
  itemInfoUI.button(15, "§9Amount", ["§c-16"], "red_wool", 16);
  itemInfoUI.button(16, "§9Amount", ["§c-1"], "red_wool", 1);
  let maxItem = 0;
  if (price == optionData.sell)
    maxItem = getItemAmount(player, optionData.item, false);
  else maxItem = Math.floor(coins / price);
  itemInfoUI.button(22, "§9Amount", [`§6=${maxItem}`], "gold_block", maxItem);
  itemInfoUI.show(player).then((result) => {
    if (result.canceled || !result.selection) return;
    const amounts = [1, 16, 64, 0, -64, -16, -1];
    if (
      result.selection >= 10 &&
      result.selection <= 16 &&
      result.selection != 13
    ) {
      let am = Math.max(amount + amounts[result.selection % 10], 0);
      if (result.selection == 10 && amount == 0) am++;
      purchaseItemBeta(player, title, optionData, am);
      return;
    } else if (result.selection == 22) {
      purchaseItemBeta(player, title, optionData, Math.max(maxItem, 0));
      return;
    } else if (result.selection == 13) {
      if (amount == 0) amount = 1;
    } else {
      return;
    }
    let inv = (<EntityInventoryComponent>player.getComponent("inventory"))
      .container;
    if (!inv) return;
    if (price == optionData.price) {
      if (
        inv.emptySlotsCount == 0 ||
        inv.emptySlotsCount - Math.ceil(amount / 64) <= 0
      ) {
        sendError(player, `Not enough inventory space.`, PREFIX.shop);
        return;
      }
      if (coins < price * amount) {
        sendError(player, `You cannot afford this transaction.`, PREFIX.shop);
        return;
      } else {
        let pdata = playerDB.get(player.id);
        pdata.coins = pdata.coins - price * amount;
        playerDB.set(player.id, pdata);
        if (optionData.ditem) {
          const binv = (<BlockInventoryComponent>(
            overworld.getBlock(optionData.ditem[0])?.getComponent("inventory")
          )).container;
          const pinv = (<EntityInventoryComponent>(
            player.getComponent("inventory")
          )).container;
          let it = binv?.getItem(optionData.ditem[1])?.clone();
          if (it && pinv) {
            it.amount = amount;
            pinv.addItem(it);
          }
        } else
          player.runCommandAsync(
            `give @s ${optionData.item} ${amount} ${optionData.data ?? 0}`
          );
        sendAlert(
          player,
          `§eBought §7${name} §8x${amount} §f§l-> §c§l-$${formatNumber(
            price * amount
          )}`,
          PREFIX.shop
        );
        system.run(() => {
          player.playSound(`note.iron_xylophone`, {
            volume: 1,
            pitch: 2,
          });
          player.playSound(`note.iron_xylophone`, {
            volume: 1,
            pitch: 3,
          });
        });
        return;
      }
    } else if (price == optionData.sell) {
      let getItem = getItemAmount(player, optionData.item, false);
      if (getItem <= amount) amount = getItem;
      if (amount == 0) {
        sendAlert(player, `§cInsufficient item to sell.`, PREFIX.shop);
        return;
      }
      player.runCommandAsync(
        `clear @s ${optionData.item} ${optionData.data ?? 0} ${amount}`
      );
      let total = Math.floor(price * amount);
      let pdata = playerDB.get(player.id);
      pdata.coins = pdata.coins + total;
      playerDB.set(player.id, pdata);
      sendAlert(
        player,
        `§aSold §7${name} §8x${amount} §f§l-> §a§l+$${formatNumber(total)}`,
        PREFIX.shop
      );
      system.runTimeout(() => {
        player.playSound(`note.iron_xylophone`, { volume: 1, pitch: 1 });
        player.playSound(`note.iron_xylophone`, { volume: 1, pitch: 2 });
      }, 2);
      return;
    }
  });
}

export function ShopTabEnchantmentsBeta(
  title: string,
  sound: string,
  category: typeof CATEGORY.special,
  store: typeof ShopItems,
  player: Player,
  sort: boolean,
  lastCat?: Array<any>
) {
  system.runTimeout(() => {
    player.playSound(sound, { volume: 1.25 });
  }, 2);
  const tabUI = new ActionFormData();
  tabUI.title(`§e§lShop§r / ${title}`);
  let coins = playerDB.get(player.id).coins;
  tabUI.body(`§eYour Balance: §f$${formatNumber(coins)}`);
  let subCats = subCategories.filter((x) => x.category == category);
  subCats.map((x) => {
    tabUI.button(`§8${x.name}`, x.texture);
  });
  let items = store.filter((x) => x.category == category);
  if (sort == true) items = items.sort((x, y) => x.price - y.price);
  if (items.length == 0) {
    sendError(player, `This category is empty.`, PREFIX.shop);
    OpenShop(player);
    return;
  }
  items.map((x) => {
    tabUI.button(`§8${x.name ?? formatItemName(x.item)}`, x.texture);
  });
  tabUI.show(player).then((result) => {
    if (result.canceled) {
      if (lastCat)
        ShopTabBeta(
          `§8${lastCat[1]}`,
          `note.hat`,
          lastCat[0],
          player,
          lastCat[2]
        );
      else OpenShop(player);
      return;
    }
    let subCategory = subCategories.find((x) => {
      return x == subCats[result.selection ?? -1];
    });
    let optionData = store.find((x) => {
      return x == items[(result.selection ?? -1) - (subCats.length ?? 0)];
    });
    if (!optionData && !subCategory) {
      sendError(player, `This item is unavailable.`, PREFIX.shop);
      return;
    } else if (subCategory)
      ShopTabBeta(
        `§8${subCategory.name}`,
        `note.hat`,
        subCategory.group,
        player,
        sort,
        [category, title]
      );
    else if (optionData) purchaseEnchantment(player, title, optionData);
  });
}

function purchaseEnchantmentBeta(
  player: Player,
  title: string,
  optionData: {
    category: number;
    texture: string;
    name?: string;
    item: string;
    price: number;
    sell: number;
    data?: number;
    ditem?: Array<any>;
    max?: number;
  }
) {
  let coins = playerDB.get(player.id).coins;
  let name = optionData.name ?? formatItemName(optionData.item);
  const itemInfoUI = new ModalFormData();
  itemInfoUI.title(`${title} §r/ ${name}`);
  itemInfoUI.slider(
    `\n§eYour Balance: §f$${formatNumber(coins)}\nLevel`,
    1,
    optionData.max ?? 1,
    1
  );
  itemInfoUI.show(player).then((result) => {
    if (result.canceled || !result.formValues) return;
    system.runTimeout(() => {
      player.playSound(`note.xylophone`, { volume: 1, pitch: 0.75 });
    }, 2);
    let amount = 0;
    let price = optionData.price;
    if (result.formValues[1]) amount = Number(result.formValues[1]);
    else amount = Number(result.formValues[0]);
    const confirmUI = new ActionFormData();
    confirmUI.title(`${name} §r/ Transaction`);
    confirmUI.body(
      `\n§7Are you sure you want to continue?§f\n----- --------- -----\n§eType: §r§6enchant\n§bEnchantment:§r §f${name} §7${toRomanNumeral(
        amount
      )}\n§dValue:§r §r§4-§c$${formatNumber(
        price * amount
      )}\n§f----- --------- -----\n\n`
    );
    confirmUI.button(`Confirm`);
    confirmUI.button(`Cancel`);
    confirmUI.show(player).then((result) => {
      if (!result.canceled && result.selection == 0) {
        if (coins < price * amount) {
          sendError(player, `You cannot afford this transaction.`, PREFIX.shop);
          return;
        } else {
          if (optionData.ditem) {
            const binv = (<BlockInventoryComponent>(
              overworld.getBlock(optionData.ditem[0])?.getComponent("inventory")
            )).container;
            const pinv = (<EntityInventoryComponent>(
              player.getComponent("inventory")
            )).container;
            let it = binv?.getItem(optionData.ditem[1])?.clone();
            if (it && pinv) {
              it.amount = amount;
              pinv.addItem(it);
            }
          } else {
            let tryEnch = VanillaEnchItem(player, optionData.item, amount);
            if (tryEnch != true) return;
          }
          let pdata = playerDB.get(player.id);
          pdata.coins = pdata.coins - price * amount;
          playerDB.set(player.id, pdata);
          sendAlert(
            player,
            `§dEnchant §b${name} §7${toRomanNumeral(
              amount
            )} §f§l-> §r§4-§c$${formatNumber(price * amount)}`,
            PREFIX.shop
          );
        }
      }
    });
  });
}
