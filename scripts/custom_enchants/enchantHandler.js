import { EquipmentSlot, system, world } from "@minecraft/server";

export const EnchantSlot = {
  Head: [
    "minecraft:leather_helmet",
    "minecraft:chainmail_helmet",
    "minecraft:golden_helmet",
    "minecraft:iron_helmet",
    "minecraft:diamond_helmet",
  ],
  Chest: [
    "minecraft:leather_chestplate",
    "minecraft:chainmail_chestplate",
    "minecraft:golden_chestplate",
    "minecraft:iron_chestplate",
    "minecraft:diamond_chestplate",
  ],
  Legs: [
    "minecraft:leather_leggings",
    "minecraft:chainmail_leggings",
    "minecraft:golden_leggings",
    "minecraft:iron_leggings",
    "minecraft:diamond_leggings",
  ],
  Feet: [
    "minecraft:leather_boots",
    "minecraft:chainmail_boots",
    "minecraft:golden_boots",
    "minecraft:iron_boots",
    "minecraft:diamond_boots",
  ],
};

export class Enchant {
  constructor(id, info) {
    this.id = id.split(" ")[0];
    this.info = info;
    this.updating = false;
    this.update();
  }
  onUserHurt(callback) {
    this.info.userHurt = callback;
    this.update();
    return this;
  }
  onEntityHurt(callback) {
    this.info.entityHurt = callback;
    this.update();
    return this;
  }
  onEntityHit(callback) {
    this.info.entityHit = callback;
    this.update();
    return this;
  }
  onBlockHit(callback) {
    this.info.blockHit = callback;
    this.update();
    return this;
  }
  onBlockBreak(callback) {
    this.info.blockBreak = callback;
    this.update();
    return this;
  }
  onItemUse(callback) {
    this.info.itemUse = callback;
    this.update();
    return this;
  }
  onItemUseOn(callback) {
    this.info.itemUseOn = callback;
    this.update();
    return this;
  }
  onHold(callback) {
    this.info.hold = callback;
    this.update();
    return this;
  }
  async update() {
    if (this.updating) return;
    this.updating = true;
    system.run(() => {
      this.updating = false;
      Enchant.enchants[this.id] = this.info;
      Enchant.displayToId[this.info.display] = this.id;
    });
  }
  static alterEnch(item, enchantId, callback) {
    const lore = item.getLore();
    const enchantData = this.enchants[enchantId];
    if (!enchantData) return item;
    const enchantsId = lore.filter((v) => v.startsWith("§e§n§c§h"));
    if (!enchantsId && callback) {
      const newLore = callback({ info: enchantData, id: enchantId, level: 1 });
      if (!newLore) return item;
      lore.push(`§e§n§c§h§r${newLore}`);
      item.setLore(lore);
      return item;
    }
    const id = lore.findIndex((v) => v.startsWith(`§r${enchantData.display}`));
    const newLore = callback({
      info: enchantData,
      id: enchantId,
      level: id === -1 ? 1 : Number(lore[id].split(" ")[1]),
    });
    if (id === -1 && newLore) lore.push("§e§n§c§h§r" + newLore);
    else if (newLore) lore[id] = "§r" + newLore;
    else {
      lore.splice(id, 1);
    }
    if (lore.length === 0) lore.splice(enchantId, 1);
    else lore[enchantsId] = "§e§n§c§h" + lore.join("\n");
    item.setLore(lore);
    return item;
  }
  static addEnchant(item, enchantId, level) {
    return this.alterEnch(
      item,
      enchantId,
      (data) => `${data.info.display} ${level ?? 1}`
    );
  }
  static removeEnchant(item, enchantId) {
    return this.alterEnch(item, enchantId, (data) => undefined);
  }
  static getEnchant(item, enchantId) {
    const lore = item.getLore().find((v) => v.startsWith("§e§n§c§h"));
    if (!lore) return undefined;
    const split = lore.split(" ");
    const id = this.displayToId[split[0].slice(2)];
    if (!id) return undefined;
    const info = this.enchants[id];
    return { info, level: Number(split[1]), id };
  }

  static getEnchants(item) {
    const lore = item.getLore().filter((v) => v.startsWith("§e§n§c§h"));
    if (lore.length == 0) return [];
    let enchants = [];
    for (let l of lore) {
      l.slice(8)
        .split("\n")
        .map((v) => {
          const split = v.split(" ");
          const id = this.displayToId[split[0].slice(2)];
          if (!id) return;
          const info = this.enchants[id];
          enchants.push({ info, level: Number(split[1]), id });
        });
    }
    return enchants;
  }
  static enchants = {};
  static displayToId = {};
}

function runEnchants(player, type, args) {
  const equipment = player.getComponent("equippable");
  let slots = ["Head", "Chest", "Legs", "Feet", "Mainhand", "Offhand"];
  if (type == "hold") slots = ["Head", "Chest", "Legs", "Feet"];
  slots.forEach((v) => {
    const item = equipment.getEquipment(v);
    if (!item) return;
    if (type == "hold" && !EnchantSlot[v].includes(item.typeId)) return;
    Enchant.getEnchants(item).forEach((enchant) =>
      enchant.info[type]?.({ player, level: enchant.level, item, ...args })
    );
  });
}

world.afterEvents.entityHitEntity.subscribe(
  ({ damagingEntity: player, hitEntity: entity }) => {
    if (player.typeId !== "minecraft:player") return;
    runEnchants(player, "entityHit", { entity });
  }
);

world.afterEvents.entityHitBlock.subscribe(
  ({ damagingEntity: player, hitBlock: block, blockFace }) => {
    if (player.typeId !== "minecraft:player") return;
    runEnchants(player, "blockHit", { block, blockFace });
  }
);

world.afterEvents.entityHurt.subscribe(
  ({ hurtEntity, damageSource, damage }) => {
    if (hurtEntity.typeId === "minecraft:player")
      runEnchants(hurtEntity, "userHurt", { damageSource, damage });
    if (damageSource.damagingEntity?.typeId === "minecraft:player")
      runEnchants(damageSource.damagingEntity, "entityHurt", {
        entity: hurtEntity,
        damage,
      });
  }
);

world.afterEvents.playerBreakBlock.subscribe(
  ({ player, block, brokenBlockPermutation }) => {
    if (player.typeId !== "minecraft:player") return;
    runEnchants(player, "blockBreak", { block, brokenBlockPermutation });
  }
);

world.afterEvents.itemUse.subscribe(({ source: player }) => {
  if (player.typeId !== "minecraft:player") return;
  runEnchants(player, "itemUse", {});
});

world.afterEvents.itemUseOn.subscribe(
  ({ source: player, block, blockFace, faceLocation }) => {
    if (player.typeId !== "minecraft:player") return;
    runEnchants(player, "itemUse", { block, blockFace, faceLocation });
  }
);

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    runEnchants(player, "hold", {});
  }
}, 40);
