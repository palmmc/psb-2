//@ts-nocheck
import {
  BlockInventoryComponent,
  Enchantment,
  EnchantmentTypes,
  EntityEquippableComponent,
  EquipmentSlot,
  Player,
  Vector,
  system,
  world,
} from "@minecraft/server";
import { PREFIX, sendError } from "../main";

const overworld = world.getDimension("overworld");

export const EnchantInfo = [
  {
    id: "efficiency",
    cost: 12000,
    max: 10,
    location: new Vector(0, -61, -2),
    startSlot: 0,
  },
  {
    id: "fortune",
    cost: 12000,
    max: 10,
    location: new Vector(0, -61, -2),
    startSlot: 9,
  },
  {
    id: "unbreaking",
    cost: 12000,
    max: 10,
    location: new Vector(0, -61, -2),
    startSlot: 18,
  },
];

export const EnchantEntries = [
  {
    category: 101,
    texture: "textures/items/book_enchanted.png",
    item: "efficiency",
    price: 12000,
    sell: 0,
    max: 10,
  },
  {
    category: 101,
    texture: "textures/items/book_enchanted.png",
    item: "fortune",
    price: 12000,
    sell: 0,
    max: 10,
  },
  {
    category: 101,
    texture: "textures/items/book_enchanted.png",
    item: "unbreaking",
    price: 12000,
    sell: 0,
    max: 10,
  },
];

export function VanillaEnchItem(player: Player, e: string, level: number) {
  // Format: -enchant {enchantment} {level}
  let holdInv = <EntityEquippableComponent>player.getComponent("equippable");
  let item = holdInv.getEquipment(EquipmentSlot.Mainhand);
  if (!item) {
    sendError(
      player,
      `You must hold the item you want to enchant.`,
      PREFIX.server
    );
    return;
  }
  if (!(level > 0)) {
    sendError(
      player,
      `Invalid format: Level must be greater than zero.\n§cFormat: §e-enchant [§genchantment§e] [§glevel§e]`,
      PREFIX.server
    );
    return;
  }
  let edata = EnchantInfo.find((x) => {
    return x.id == e;
  });
  if (!EnchantmentTypes.get(e) || !edata) {
    sendError(
      player,
      `Invalid format: Enchantment is not available.`,
      PREFIX.server
    );
    return;
  }
  let ench = new Enchantment(e, 1);
  let enchants = (<ItemEnchantsComponent>item.getComponent("enchantments"))
    .enchantments;
  if (enchants.hasEnchantment(ench.type)) {
    sendError(
      player,
      `This item already has enchant '§e${ench.type.id}§c'.`,
      PREFIX.server
    );
    return;
  }
  if (!enchants.canAddEnchantment(ench)) {
    sendError(
      player,
      `This item cannot be enchanted with '§e${ench.type.id}§c'.`,
      PREFIX.server
    );
    return;
  }
  if (level <= 3 && level > 0) {
    player.runCommandAsync(`enchant @s ${ench.type.id} ${level}`);
  } else if (level > 3 && level <= edata.max) {
    const binv = (<BlockInventoryComponent>(
      overworld.getBlock(edata.location)?.getComponent("inventory")
    )).container;
    let it = binv?.getItem(edata.startSlot + (level - 4))?.clone();
    if (it) {
      let getEnch = (<ItemEnchantsComponent>(
        it.getComponent("enchantments")
      )).enchantments.getEnchantment(ench.type.id);
      if (getEnch) enchants.addEnchantment(getEnch);
      (<ItemEnchantsComponent>item.getComponent("enchantments")).enchantments =
        enchants;
      holdInv.setEquipment(EquipmentSlot.Mainhand, item);
    }
  } else {
    sendError(player, `Level must be between 1-${edata.max}§c.`, PREFIX.server);
    return;
  }
  //let pdata = playerDB.get(player.id);
  //pdata.coins = pdata.coins - 1;
  //playerDB.set(player.id, pdata);
  holdInv.setEquipment(EquipmentSlot.Mainhand, item);
  system.runTimeout(() => {
    player.playSound(`mob.ghast.fireball`, { volume: 1, pitch: 1 });
    system.runTimeout(() => {
      player.playSound(`random.anvil_land`, { volume: 0.6, pitch: 0.9 });
    }, 2);
  }, 2);
  return true;
}
