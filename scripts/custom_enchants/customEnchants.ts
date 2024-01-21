import {
  Block,
  EnchantmentSlot,
  Entity,
  EntityEquippableComponent,
  EntityInventoryComponent,
  EquipmentSlot,
  ItemStack,
  Player,
  Vector,
  system,
  world,
} from "@minecraft/server";
import { Enchant, EnchantData, EnchantInfo } from "./enchantHandler";
import {
  IslandMethods,
  PREFIX,
  randomIntFromInterval,
  sendAlert,
  sendError,
  toRomanNumeral,
} from "../main";
import { ChestFormData } from "../chest-ui/forms";
import { DEF_ORES } from "../systems/miscellaneous";
import { SpawnerEntities } from "../systems/spawner";
import { getIslandOn } from "../island/manage";

const overworld = world.getDimension("overworld");

export const EnchantSlot = {
  sword: [
    "minecraft:wooden_sword",
    "minecraft:stone_sword",
    "minecraft:iron_sword",
    "minecraft:golden_sword",
    "minecraft:diamond_sword",
  ],
  bow: ["minecraft:bow"],
  pickaxe: [
    "minecraft:wooden_pickaxe",
    "minecraft:stone_pickaxe",
    "minecraft:iron_pickaxe",
    "minecraft:golden_pickaxe",
    "minecraft:diamond_pickaxe",
  ],
  axe: [
    "minecraft:wooden_axe",
    "minecraft:stone_axe",
    "minecraft:iron_axe",
    "minecraft:golden_axe",
    "minecraft:diamond_axe",
  ],
  shovel: [
    "minecraft:wooden_shovel",
    "minecraft:stone_shovel",
    "minecraft:iron_shovel",
    "minecraft:golden_shovel",
    "minecraft:diamond_shovel",
  ],
  hoe: [
    "minecraft:wooden_hoe",
    "minecraft:stone_hoe",
    "minecraft:iron_hoe",
    "minecraft:golden_hoe",
    "minecraft:diamond_hoe",
  ],
  tool: [
    "#minecraft:diamond_tool",
    "minecraft:wooden_pickaxe",
    "minecraft:stone_pickaxe",
    "minecraft:iron_pickaxe",
    "minecraft:golden_pickaxe",
    "minecraft:diamond_pickaxe",
    "minecraft:wooden_axe",
    "minecraft:stone_axe",
    "minecraft:iron_axe",
    "minecraft:golden_axe",
    "minecraft:diamond_axe",
    "minecraft:wooden_hoe",
    "minecraft:stone_hoe",
    "minecraft:iron_hoe",
    "minecraft:golden_hoe",
    "minecraft:diamond_hoe",
  ],
  helmet: [
    "minecraft:leather_helmet",
    "minecraft:chainmail_helmet",
    "minecraft:golden_helmet",
    "minecraft:iron_helmet",
    "minecraft:diamond_helmet",
  ],
  chestplate: [
    "minecraft:leather_chestplate",
    "minecraft:chainmail_chestplate",
    "minecraft:golden_chestplate",
    "minecraft:iron_chestplate",
    "minecraft:diamond_chestplate",
  ],
  leggings: [
    "minecraft:leather_leggings",
    "minecraft:chainmail_leggings",
    "minecraft:golden_leggings",
    "minecraft:iron_leggings",
    "minecraft:diamond_leggings",
  ],
  boots: [
    "minecraft:leather_boots",
    "minecraft:chainmail_boots",
    "minecraft:golden_boots",
    "minecraft:iron_boots",
    "minecraft:diamond_boots",
  ],
  armor: [
    "#minecraft:diamond_armor",
    "minecraft:leather_helmet",
    "minecraft:chainmail_helmet",
    "minecraft:golden_helmet",
    "minecraft:iron_helmet",
    "minecraft:diamond_helmet",
    "minecraft:leather_chestplate",
    "minecraft:chainmail_chestplate",
    "minecraft:golden_chestplate",
    "minecraft:iron_chestplate",
    "minecraft:diamond_chestplate",
    "minecraft:leather_leggings",
    "minecraft:chainmail_leggings",
    "minecraft:golden_leggings",
    "minecraft:iron_leggings",
    "minecraft:diamond_leggings",
    "minecraft:leather_boots",
    "minecraft:chainmail_boots",
    "minecraft:golden_boots",
    "minecraft:iron_boots",
    "minecraft:diamond_boots",
  ],
};

// RARITIES:
export const CE_RARITY = {
  common: "§7Common",
  rare: "§2Rare",
  epic: "§9Epic",
  unique: "§6Unique",
  forged: "§cForged",
};

// COMMON ENCHANTS

new Enchant("shine", {
  rarity: "common",
  display: "§7Shine",
  type: EnchantSlot.helmet,
  maxLevel: 1,
  description: "Grants permanent night vision while worn.",
  hold: (data) => {
    data.player.addEffect("night_vision", 245, { showParticles: false });
    system.runTimeout(() => {
      let checkHead = data.player
        .getComponent("equippable")
        ?.getEquipment(EquipmentSlot.Head);
      if (checkHead) {
        let enchants = Enchant.getEnchants(checkHead);
        if (enchants.find((x) => x.id == "shine")) return;
      }
      data.player.runCommandAsync(`effect @s clear`);
    }, 49);
  },
});

new Enchant("bobble", {
  rarity: "common",
  display: "§7Bobble",
  type: EnchantSlot.helmet,
  maxLevel: 1,
  description: "Increases the size of your head while worn.",
  hold: (data) => {
    data.player.playAnimation(`animation.humanoid.big_head`, {
      nextState: `animation.humanoid.big_head`,
    });
    system.runTimeout(() => {
      let checkHead = data.player
        .getComponent("equippable")
        ?.getEquipment(EquipmentSlot.Head);
      if (checkHead) {
        let enchants = Enchant.getEnchants(checkHead);
        if (enchants.find((x) => x.id == "bobble")) return;
        return;
      }
      data.player.playAnimation(`animation.player.move.arms.single`, {
        nextState: `a`,
        blendOutTime: 0,
        stopExpression: `query.is_moving`,
      });
      return;
    }, 39);
  },
});

new Enchant("brisk", {
  rarity: "common",
  display: "§7Brisk",
  type: EnchantSlot.pickaxe,
  maxLevel: 10,
  description: "Grants haste while mining.",
  blockBreak: (data) => {
    if (randomIntFromInterval(1, 13 - data.level) != 1) return;
    if (!DEF_ORES.includes(data.brokenBlockPermutation.type.id)) return;
    data.player.addEffect("haste", 80 + data.level * 6, {
      amplifier: Math.floor(data.level * 0.8),
      showParticles: false,
    });
  },
});

new Enchant("trove", {
  rarity: "common",
  display: "§7Trove",
  type: EnchantSlot.tool,
  maxLevel: 10,
  description: "Grants a chance to recieve extra drops when mining.",
});

new Enchant("durable", {
  rarity: "common",
  display: "§7Durable",
  type: EnchantSlot.tool,
  maxLevel: 10,
  description: "Decreases chance to lose durability while mining.",
  blockBreak: (data) => {
    if (randomIntFromInterval(1, Math.floor(data.level + 2)) == 1) return;
    let dura = data.item.getComponent("minecraft:durability");
    if (!dura) return;
    if (dura.damage == 0) return;
    dura.damage = dura.damage - 1;
    let equip = data.player.getComponent("equippable");
    system.run(() => {
      let testI = equip?.getEquipment(EquipmentSlot.Mainhand);
      if (!testI || !Enchant.getEnchant(testI, "durable")) return;
      equip?.setEquipment(EquipmentSlot.Mainhand, data.item);
    });
  },
});

new Enchant("spring", {
  rarity: "common",
  display: "§7Spring",
  type: EnchantSlot.boots,
  maxLevel: 3,
  description: "Chance for a large double jump after each jump.",
  hold: (data) => {
    if (!(randomIntFromInterval(1, Math.max(3 - data.level, 1)) == 1)) return;
    if (
      data.player.getVelocity().y > 0.1 ||
      (data.player.getVelocity().y < -0.1 && data.player.getVelocity().y > -0.5)
    )
      data.player.applyKnockback(
        data.player.location.x,
        data.player.location.z,
        0,
        Math.max(data.level / 3, 0.7)
      );
  },
});

new Enchant("quake", {
  rarity: "common",
  display: "§7Quake",
  type: EnchantSlot.leggings,
  maxLevel: 10,
  description: "Increases speed and agility while worn.",
  hold: (data) => {
    data.player.addEffect("speed", 60, {
      amplifier: Math.ceil(data.level / 3) - 1,
      showParticles: false,
    });
    data.player.addEffect("jump_boost", 60, {
      amplifier: Math.ceil(data.level / 3) - 1,
      showParticles: false,
    });
  },
});

new Enchant("toxin", {
  rarity: "common",
  display: "§7Toxin",
  type: EnchantSlot.sword,
  maxLevel: 5,
  description: "Chance to poison entity on hit.",
  entityHit: (data) => {
    if (!(randomIntFromInterval(1, 22 - data.level * 2) == 1)) return;
    if (!SpawnerEntities.find((x) => x.id == data.entity.id.slice(10))) return;
    data.entity.addEffect("fatal_poison", 40 + data.level * 5, {
      amplifier: data.level > 3 ? 1 : 0,
      showParticles: true,
    });
  },
});

// RARE EMCHANTS

new Enchant("forge", {
  rarity: "rare",
  display: "§2Forge",
  type: EnchantSlot.pickaxe,
  maxLevel: 5,
  description: "Grants a chance to smelt drops when mining.",
});

new Enchant("ignite", {
  rarity: "rare",
  display: "§2Ignite",
  type: EnchantSlot.sword,
  maxLevel: 5,
  description: "Chance to ignite entity on hit.",
  entityHit: (data) => {
    if (!(randomIntFromInterval(1, 30 - data.level * 4) == 1)) return;
    if (!SpawnerEntities.find((x) => x.id == data.entity.id.slice(10))) return;
    data.entity.setOnFire(data.level, true);
  },
});

new Enchant("glimmer", {
  rarity: "rare",
  display: "§2Glimmer",
  type: EnchantSlot.pickaxe,
  maxLevel: 10,
  description: "Grants a chance replace nearby cobblestone into emeralds.",
  blockBreak: (data) => {
    if (!DEF_ORES.includes(data.brokenBlockPermutation.type.id)) return;
    if (randomIntFromInterval(1, 78 - data.level * 6) != 1) return;
    data.player.runCommandAsync(
      `fill ${data.block.x - 1} ${data.block.y} ${data.block.z - 1} ${
        data.block.x + 1
      } ${data.block.y} ${data.block.z + 1} emerald_ore replace cobblestone`
    );
  },
});

// EPIC ENCHANTS

new Enchant("splash", {
  rarity: "epic",
  display: "§9Splash",
  type: EnchantSlot.tool,
  maxLevel: 10,
  description: "Grants a chance to recieve extra XP when mining.",
  blockBreak: (data) => {
    if (!(randomIntFromInterval(1, 26 - data.level * 2) == 1)) return;
    data.player.addExperience(
      randomIntFromInterval(1, Math.floor(data.level / 3))
    );
  },
});

new Enchant("nourish", {
  rarity: "epic",
  display: "§9Nourish",
  type: EnchantSlot.pickaxe,
  maxLevel: 10,
  description: "Grants a chance to be fed while mining.",
  blockBreak: (data) => {
    if (!DEF_ORES.includes(data.brokenBlockPermutation.type.id)) return;
    if (randomIntFromInterval(1, 55 - data.level * 5) != 1) return;
    data.player.addEffect("saturation", data.level * 3, {
      amplifier: 1,
      showParticles: false,
    });
  },
});

new Enchant("polish", {
  rarity: "epic",
  display: "§9Polish",
  type: EnchantSlot.pickaxe,
  maxLevel: 10,
  description: "Grants a recieve copper when mining.",
  blockBreak: (data) => {
    if (!DEF_ORES.includes(data.brokenBlockPermutation.type.id)) return;
    if (randomIntFromInterval(1, 92 - data.level * 6) != 1) return;
    data.player.runCommandAsync(`give @s copper_ingot`);
  },
});

new Enchant("procure", {
  rarity: "epic",
  display: "§9Procure",
  type: EnchantSlot.sword,
  maxLevel: 10,
  description: "Grants a chance to recieve extra drops when mining.",
});

// UNIQUE ENCHANTS

new Enchant("talaria", {
  rarity: "unique",
  display: "§6Talaria",
  type: EnchantSlot.boots,
  maxLevel: 5,
  description: "Grants temporary flight.",
  hold: (data) => {
    if (!getIslandOn(data.player)) {
      data.player.runCommandAsync(`ability @s mayfly false`);
      data.player.runCommandAsync(`gamemode adventure @s`);
      data.player.runCommandAsync(`gamemode survival @s`);
    }
    let cd = data.player.getItemCooldown("flight");
    if (data.player.isJumping == true && cd == 0) {
      data.player.applyKnockback(
        data.player.location.x,
        data.player.location.z,
        0,
        0.75
      );
      data.player.runCommandAsync(`ability @s mayfly true`);
      data.player.playSound(`mob.enderdragon.flap`, { volume: 1, pitch: 1 });
      data.player.sendMessage(`[§o§6Talaria§r§f] >> §aON`);
      data.player.startItemCooldown(
        "flight",
        data.level * 2400 + data.level * 1200
      );
      system.runTimeout(() => {
        data.player.sendMessage(
          `[§o§6Talaria§r§f] >> §cFlight will wear off in §710§8s§c.`
        );
        system.runTimeout(() => {
          data.player.runCommandAsync(`ability @s mayfly false`);
          data.player.playSound(`fall.cloth`, { volume: 1.1, pitch: 1.25 });
          data.player.sendMessage(`[§o§6Talaria§r§f] >> §cOFF`);
          data.player.runCommandAsync(`gamemode adventure @s`);
          data.player.runCommandAsync(`gamemode survival @s`);
        }, 200);
      }, data.level * 1200);
    } else if (
      data.player.isJumping == true &&
      data.player.getItemCooldown("flight") > 0
    ) {
      data.player.sendMessage(
        `[§o§6Talaria§r§f] >> §cThis action is on cooldown. §4(§7${Math.ceil(
          cd / 20
        )}§8s§4)`
      );
    }
  },
});

new Enchant("regenerate", {
  rarity: "unique",
  display: "§6Regenerate",
  type: EnchantSlot.pickaxe,
  maxLevel: 10,
  description: "Grants a chance to instantly duplicate last mined ore.",
  blockBreak: (data) => {
    if (!DEF_ORES.includes(data.brokenBlockPermutation.type.id)) return;
    if (randomIntFromInterval(1, 98 - data.level * 6) != 1) return;
    system.runTimeout(() => {
      data.block.setType(data.brokenBlockPermutation.type);
    }, 3);
  },
});

new Enchant("flex", {
  rarity: "unique",
  display: "§6Flex",
  type: EnchantSlot.armor,
  maxLevel: 5,
  description: "Changes the size of the player while worn.",
  hold: (data) => {
    if (data.player.isSneaking == true) {
      if (
        ((data.player.getProperty(`property:size`) as number) ?? -1) >=
        2.5 - 0.25 * data.level
      ) {
        data.player.triggerEvent(`palm:min_size`);
      } else {
        data.player.triggerEvent(`palm:increase_size_small`);
      }
      system.run(() =>
        sendAlert(
          data.player,
          `§b§lSize: §r§f${
            (data.player.getProperty(`property:size`) as number) ?? 1
          }`
        )
      );
    }
    system.runTimeout(() => {
      let checkHead = data.player
        .getComponent("equippable")
        ?.getEquipment(EquipmentSlot.Head);
      if (checkHead) {
        let enchants = Enchant.getEnchants(checkHead);
        if (enchants.find((x) => x.id == "flex")) return;
        return;
      }
      data.player.triggerEvent(`palm:reset_size`);
      return;
    }, 39);
  },
});

// FORGED (UNOBTAINABLE) ENCHANTS

// END OF ENCHANTS

// GIVE CEBOOK
world.beforeEvents.chatSend.subscribe((data) => {
  let player = data.sender;
  let msg = data.message;
  if (msg.startsWith("-giveceopen") && player.nameTag == "The Palm Healer") {
    data.cancel = true;
    system.run(() => {
      let ench = msg.split(" ")[1];
      let level = Number(msg.split(" ")[2]);
      if (!ench || !level) return;
      giveOpenCE(player, ench, level);
    });
  } else if (
    msg.startsWith("-givecebook") &&
    player.nameTag == "The Palm Healer"
  ) {
    data.cancel = true;
    system.run(() => {
      let rarity = msg.split(" ")[1] as keyof typeof CE_RARITY;
      if (!rarity) return;
      giveBookCE(player, rarity, 1);
    });
  } else if (
    msg.startsWith("-givecharm") &&
    player.nameTag == "The Palm Healer"
  ) {
    data.cancel = true;
    system.run(() => {
      let type = msg.split(" ")[1] as keyof typeof CHARMS;
      let rarity = msg.split(" ")[2] as keyof typeof CHARMS.binding;
      if (!rarity) return;
      giveCharm(player, type, rarity, 1);
    });
  } else if (msg.startsWith("-charm") && player.nameTag == "The Palm Healer") {
    data.cancel = true;
    system.run(() => {
      let type = msg.split(" ")[1] as keyof typeof CHARMS;
      if (!type) return;
      system.runTimeout(() => useCharm(player, type), 2);
    });
  }
});

// GIVE OPEN CEBOOK
function giveOpenCE(player: Player, name: string, level: number) {
  //console.warn(Object.keys(Enchant.enchants));
  //@ts-ignore
  let enchant = Enchant.enchants[name];
  if (!enchant) {
    sendAlert(player, `Invalid CE.`, PREFIX.ce);
    return;
  }
  let enchItem = new ItemStack("enchanted_book", 1);
  Enchant.addEnchant(enchItem, name, level);
  enchItem.nameTag = `§r${enchant.display} §b§lBook`;
  let equip = (<EntityInventoryComponent>player.getComponent("inventory"))
    .container;
  if (!equip) return;
  equip.addItem(enchItem);
  sendAlert(
    player,
    `§eYou have been given ${enchant.display} §7${toRomanNumeral(level)}§e.`,
    PREFIX.ce
  );
}

// GIVE CLOSED CEBOOK
export function giveBookCE(
  player: Player,
  rar: keyof typeof CE_RARITY,
  amount: number
) {
  const rarity = CE_RARITY[rar];
  let enchItem = new ItemStack("book", amount);
  enchItem.nameTag = `§@§r§e§lC§6E §d§lBook`;
  enchItem.setLore([`§%§r§5Rarity: ${rarity}`]);
  let equip = (<EntityInventoryComponent>player.getComponent("inventory"))
    .container;
  if (!equip) return;
  equip.addItem(enchItem);
}

export const CHARMS = {
  // Charm of Binding - Increases the grade quality of a refined enchantment.
  binding: {
    // Increase in quality per rarity
    display: "§3Binding",
    basic: [10, 25],
    advanced: [20, 40],
    superior: [35, 50],
  },
  // Charm of Precision - Increases the level of an enchantment up to a max of 10.
  precision: {
    // Increase in level per rarity
    display: "§bPrecision",
    basic: [1, 2],
    advanced: [1, 3],
    superior: [2, 4],
  },
  // Charm of Expulsion - Exiles a selected an enchantment from the item with a percent chance success rate.
  expulsion: {
    // Increase in success per rarity
    display: "§cExpulsion",
    basic: [50, 65],
    advanced: [60, 80],
    superior: [85, 100],
  },
  // Charm of Attunement - Increases an enchantment's level by 1 up to a max of 15 with a percent chance success rate.
  attunement: {
    display: "§9Attunement",
    basic: [50, 65],
    advanced: [60, 80],
    superior: [85, 100],
  },
  basic: "§bBasic",
  advanced: "§6Advanced",
  superior: "§cSuperior",
};

function useCharm(player: Player, type: keyof typeof CHARMS) {
  const equip = <EntityEquippableComponent>player.getComponent("equippable");
  let item = equip.getEquipment(EquipmentSlot.Mainhand);
  if (!item) {
    sendError(player, `You must hold the item to use the charm on.`, PREFIX.ce);
    return;
  }
  function findCharmInInv(player: Player) {
    const inventory = (<EntityInventoryComponent>(
      player.getComponent("inventory")
    )).container;
    let charms = new Array<{
      slot: number;
      type: string;
      tier: string;
      item: ItemStack;
    }>();
    for (let i = 0; i < 36; i++) {
      if (!inventory) continue;
      let it = inventory.getItem(i);
      if (it?.typeId !== `minecraft:nautilus_shell`) continue;
      const lore = it.getLore();
      if (!lore) continue;
      const type = it.nameTag?.split(" ")[1].slice(2);
      const tier = lore[0].split("Type: ")[1].slice(2);
      if (!type || !tier) continue;
      charms.push({ slot: i, type: type ?? "", tier: tier, item: it });
    }
    return charms;
  }
  const inv = (<EntityInventoryComponent>player.getComponent("inventory"))
    .container;
  let charms = findCharmInInv(player);
  charms = charms.filter((x) => type == x.type.toLowerCase());
  if (charms.length == 0) {
    sendError(player, `You do not have any charms of this type.`, PREFIX.ce);
    return;
  }
  const tier = charms[0].tier.toLowerCase();
  const enchants = Enchant.getEnchants(item);
  if (type == "binding") {
    if (item.typeId != "minecraft:ender_eye") {
      sendError(
        player,
        `You must hold the enchantment orb that you want to enhance.`,
        PREFIX.ce
      );
      return;
    }
    let ti = item.getLore()[1].slice(14);
    if (!item) return;
    let t = gradeToTier(ti);
    if (t >= 12) {
      sendError(player, `This enchantment already has max grade.`, PREFIX.ce);
      return;
    }
    let inc = randomIntFromInterval(
      CHARMS.binding[tier as keyof typeof CHARMS.binding][0] as number,
      CHARMS.binding[tier as keyof typeof CHARMS.binding][1] as number
    );
    t += t * (inc / 100);
    let newT = tierToGrade(t);
    let lore = item.getLore();
    lore.pop();
    lore.push(`§r§l§bTier: §r${newT}`);
    item.setLore(lore);
    equip.setEquipment(EquipmentSlot.Mainhand, item);
    overworld.spawnParticle(`minecraft:totem_particle`, {
      x: player.location.x,
      y: player.location.y + 0.5,
      z: player.location.z,
    });
    player.playSound(`random.anvil_land`, { pitch: 0.8 });
    player.sendMessage(
      `§eUsed §dCharm §5(${CHARMS[type].display}§5) §eon ${enchants[0].info.display} §efor §b§lOrb`
    );
    if (!inv) return;
    if (charms[0].item.amount > 1) {
      charms[0].item.amount--;
      inv.setItem(charms[0].slot, charms[0].item);
    } else inv.setItem(charms[0].slot);
  } else if (type == "precision") {
    const gui = new ChestFormData("magenta");
    gui.title(`Select an Enchantment:`);
    let i = 10;
    for (const e of enchants) {
      if (i > 16) return;
      gui.button(
        i,
        `${e.info.display} §b§lBook`,
        [`§l§9CLICK TO UPGRADE`],
        "minecraft:enchanted_book",
        1,
        true
      );
      i++;
    }
    gui.show(player).then((data) => {
      if (data.canceled || !data.selection) return;
      const select = data.selection - 10;
      let enchant = enchants[select];
      const max = enchant.info.maxLevel;
      if (enchant.level == max) {
        sendError(player, `This enchantment is already max level.`, PREFIX.ce);
        return;
      }
      const levels = CHARMS[type][tier as keyof typeof CHARMS.binding];
      let level = 0;
      level = Math.min(
        max,
        enchant.level +
          randomIntFromInterval(levels[0] as number, levels[1] as number)
      );
      if (!item) return;
      Enchant.removeEnchant(item, enchant.id);
      Enchant.addEnchant(item, enchant.id, level);
      equip.setEquipment(EquipmentSlot.Mainhand, item);
      overworld.spawnParticle(`minecraft:totem_particle`, {
        x: player.location.x,
        y: player.location.y + 0.5,
        z: player.location.z,
      });
      player.playSound(`random.anvil_land`, { pitch: 0.8 });
      let iname = item.typeId.split("_")[1];
      iname = iname.charAt(0).toUpperCase() + iname.slice(1);
      player.sendMessage(
        `§eUsed §dCharm §5(${CHARMS[type].display}§5) §eon ${enchant.info.display} §efor §b${iname}`
      );
      if (!inv) return;
      if (charms[0].item.amount > 1) {
        charms[0].item.amount--;
        inv.setItem(charms[0].slot, charms[0].item);
      } else inv.setItem(charms[0].slot);
    });
  } else if (type == "expulsion") {
    const gui = new ChestFormData("magenta");
    gui.title(`Select an Enchantment:`);
    let i = 10;
    for (const e of enchants) {
      if (i > 16) return;
      gui.button(
        i,
        `${e.info.display} §b§lBook`,
        [`§l§cCLICK TO REMOVE`],
        "minecraft:enchanted_book",
        1,
        true
      );
      i++;
    }
    gui.show(player).then((data) => {
      if (data.canceled || !data.selection) return;
      const select = data.selection - 10;
      let enchant = enchants[select];
      if (!item) return;
      Enchant.removeEnchant(item, enchant.id);
      equip.setEquipment(EquipmentSlot.Mainhand, item);
      overworld.spawnParticle(`minecraft:totem_particle`, {
        x: player.location.x,
        y: player.location.y + 0.5,
        z: player.location.z,
      });
      const chances = CHARMS[type][tier as keyof typeof CHARMS.binding];
      const chance = randomIntFromInterval(
        chances[0] as number,
        chances[1] as number
      );
      if (randomIntFromInterval(1, 100) > chance) {
        sendAlert(
          player,
          `§cExplusion has failed.\n§4The enchantment overpowered the charm, resulting in the charm breaking.`,
          PREFIX.ce,
          "random.break"
        );
        return;
        if (charms[0].item.amount > 1) {
          charms[0].item.amount--;
          inv?.setItem(charms[0].slot, charms[0].item);
        } else inv?.setItem(charms[0].slot);
      }
      player.playSound(`random.anvil_land`, { pitch: 0.8 });
      let iname = item.typeId.split("_")[1];
      iname = iname.charAt(0).toUpperCase() + iname.slice(1);
      player.sendMessage(
        `§eUsed §dCharm §5(${CHARMS[type].display}§5) §eon ${enchant.info.display} §efor §b${iname}`
      );
      if (!inv) return;
      if (charms[0].item.amount > 1) {
        charms[0].item.amount--;
        inv.setItem(charms[0].slot, charms[0].item);
      } else inv.setItem(charms[0].slot);
    });
  } else if (type == "attunement") {
    const gui = new ChestFormData("magenta");
    gui.title(`Select an Enchantment:`);
    let i = 10;
    for (const e of enchants) {
      if (i > 16) return;
      gui.button(
        i,
        `${e.info.display} §b§lBook`,
        [`§l§eCLIC§gK TO AS§6CEND`],
        "minecraft:enchanted_book",
        1,
        true
      );
      i++;
    }
    gui.show(player).then((data) => {
      if (data.canceled || !data.selection) return;
      const select = data.selection - 10;
      let enchant = enchants[select];
      const max = enchant.info.maxLevel + Math.floor(enchant.info.maxLevel / 2);
      if (enchant.level >= max) {
        sendError(player, `This enchantment is already max level.`, PREFIX.ce);
        return;
      }
      const chances = CHARMS[type][tier as keyof typeof CHARMS.binding];
      const chance = randomIntFromInterval(
        chances[0] as number,
        chances[1] as number
      );
      if (randomIntFromInterval(1, 100) > chance) {
        sendAlert(
          player,
          `§cAttunement has failed.\n§4The process went wrong, resulting in the charm breaking.`,
          PREFIX.ce,
          "random.break"
        );
        if (charms[0].item.amount > 1) {
          charms[0].item.amount--;
          inv?.setItem(charms[0].slot, charms[0].item);
        } else inv?.setItem(charms[0].slot);
        return;
      }
      if (!item) return;
      Enchant.removeEnchant(item, enchant.id);
      Enchant.addEnchant(item, enchant.id, enchant.level + 1);
      equip.setEquipment(EquipmentSlot.Mainhand, item);
      overworld.spawnParticle(`minecraft:totem_particle`, {
        x: player.location.x,
        y: player.location.y + 0.5,
        z: player.location.z,
      });
      player.playSound(`random.anvil_land`, { pitch: 0.8 });
      let iname = item.typeId.split("_")[1];
      iname = iname.charAt(0).toUpperCase() + iname.slice(1);
      player.sendMessage(
        `§eUsed §dCharm §5(${CHARMS[type].display}§5) §eon ${enchant.info.display} §efor §b${iname}`
      );
      if (!inv) return;
      if (charms[0].item.amount > 1) {
        charms[0].item.amount--;
        inv.setItem(charms[0].slot, charms[0].item);
      } else inv.setItem(charms[0].slot);
    });
  }
}

export function giveCharm(
  player: Player,
  type: keyof typeof CHARMS,
  rarity: keyof typeof CHARMS.binding,
  amount: number
) {
  let info = CHARMS[type] as typeof CHARMS.binding;
  let enchItem = new ItemStack("nautilus_shell", amount);
  enchItem.nameTag = `§@§r§f§5Charm ${info.display}`;
  enchItem.setLore([
    `§%§r§dType: ${CHARMS[rarity as "basic" | "advanced" | "superior"]}`,
  ]);
  let equip = (<EntityInventoryComponent>player.getComponent("inventory"))
    .container;
  if (!equip) return;
  equip.addItem(enchItem);
}

function openCEBook(player: Player, item: ItemStack) {
  if (
    item.typeId != "minecraft:book" &&
    !item.getLore()[0].startsWith("§%§r§5Rarity: ")
  )
    return;
  const rarity = item.getLore()[0].split("§%§r§5Rarity: ")[1];
  const rareKey = rarity.slice(2).toLowerCase();
  sendAlert(player, `§dOpening ${rarity} §l§eC§6E §r§dbook..`, PREFIX.ce);
  player.playSound(`lodestone_compass.link_compass_to_lodestone`, {
    volume: 1,
    pitch: 0.8,
  });
  const rareEnchs = Object.values(Enchant.enchants).filter(
    (x) => x.rarity == rareKey
  );
  const ench = rareEnchs[randomIntFromInterval(0, rareEnchs.length - 1)];
  function getEnchKey() {
    for (const key of Object.keys(Enchant.enchants)) {
      //@ts-ignore
      if (Enchant.enchants[key] === ench) {
        return key;
      }
    }
  }
  let id = getEnchKey() ?? "";
  if (!id) return;
  let enchItem = new ItemStack("enchanted_book", 1);
  Enchant.addEnchant(enchItem, id, 1);
  enchItem.nameTag = `§r${ench.display} §b§lBook`;
  let equip = <EntityEquippableComponent>player.getComponent("equippable");
  let mainBook = equip.getEquipment(EquipmentSlot.Mainhand);
  if (mainBook && mainBook.amount > 1) {
    mainBook.amount--;
    equip.setEquipment(EquipmentSlot.Mainhand, mainBook);
  } else equip.setEquipment(EquipmentSlot.Mainhand);
  system.runTimeout(() => {
    let inv = (<EntityInventoryComponent>player.getComponent("inventory"))
      .container;
    if (!inv) return;
    inv.addItem(enchItem);
    sendAlert(
      player,
      `§aYou found a ${ench.display} §eCustom§6Enchant §dBook.`,
      PREFIX.ce
    );
  }, 20);
}

world.beforeEvents.itemUseOn.subscribe((data) => {
  const player = <Player>data.source;
  const item = data.itemStack;
  if (item.typeId == "minecraft:book" && item.getLore()[0])
    system.run(() => {
      if (player.getItemCooldown("openCE") != 0) return;
      player.startItemCooldown("openCE", 35);
      openCEBook(player, item);
    });
  if (
    item.typeId == "minecraft:enchanted_book" &&
    item.getLore()[0] &&
    data.block.typeId == "minecraft:end_portal_frame"
  ) {
    if (
      overworld.getEntities({
        type: "palm:orb",
        location: player.location,
        maxDistance: 10,
      }).length > 0
    ) {
      return;
    }
    system.run(() => {
      if (player.getItemCooldown("refineCE") != 0) return;
      player.startItemCooldown("refineCE", 40);
      const enchants = Enchant.getEnchants(item);
      if (!enchants) return;
      (<EntityEquippableComponent>(
        player.getComponent("equippable")
      )).setEquipment(EquipmentSlot.Mainhand);
      refinementSequence(player, enchants[0]);
    });
  }
});

// COMBINER TEST ANIMATION

export function animateBlacksmith(
  player: Player,
  blacksmith: Entity,
  type:
    | "pickaxe"
    | "axe"
    | "hoe"
    | "sword"
    | "shovel"
    | "helmet"
    | "chestplate"
    | "leggings"
    | "boots",
  enchant: EnchantData,
  accuracy: number
) {
  player.runCommandAsync(`camera @s fade time 0.5 1 0.5`);
  system.runTimeout(() => {
    player.runCommandAsync(
      `camera @s set palm:cutscene ease 1 spring pos -46 91.4 -16.9 facing -46 91.65 -16`
    );
    player.runCommandAsync(`inputpermission set @s movement disabled`);
    player.runCommandAsync(`inputpermission set @s camera disabled`);
    let loc = new Vector(
      blacksmith.location.x,
      blacksmith.location.y,
      blacksmith.location.z - 2
    );
    player.teleport(loc, { facingLocation: blacksmith.location });
  }, 10);
  system.runTimeout(() => {
    blacksmith.playAnimation(`animation.blacksmith.fuse_${type}`);
    system.runTimeout(() => {
      player.playSound(`random.pop`);
      system.runTimeout(() => {
        player.playSound(`random.pop`);
        system.runTimeout(() => {
          player.playSound(`fire.fire`);
          system.runTimeout(() => {
            let fail = false;
            if (!(randomIntFromInterval(1, 100) <= accuracy)) fail = true;
            if (!fail) player.playSound(`block.false_permissions`);
            player.playSound(`beacon.deactivate`);
            const equip = <EntityEquippableComponent>(
              player.getComponent("equippable")
            );
            let item = equip.getEquipment(EquipmentSlot.Mainhand);
            if (item && !fail) {
              Enchant.addEnchant(item, enchant.id, enchant.level);
              sendAlert(
                player,
                `§aEnchantment was a success!\n§eThe tier quality was enough to support the item.`,
                PREFIX.ce,
                "random.break"
              );
            }
            equip.setEquipment(EquipmentSlot.Mainhand, item);
            let particle = "minecraft:basic_flame_particle";
            if (fail) {
              particle = "minecraft:rising_border_dust_particle";
              sendAlert(
                player,
                `§cEnchantment has failed.\n§4The tier quality was too poor, resulting in the enchantment being lost.`,
                PREFIX.ce,
                "random.break"
              );
            }
            overworld.spawnParticle(
              particle,
              new Vector(-46 + randomIntFromInterval(-3, 3) / 10, 91.5, -17)
            );
            overworld.spawnParticle(
              particle,
              new Vector(-46.5 + randomIntFromInterval(-3, 3) / 10, 91.55, -17)
            );
            //overworld.spawnParticle(`minecraft:eyeofender_death_explode_particle`, new Vector(2986.05, 65.5, 3000.5));
            overworld.spawnParticle(
              particle,
              new Vector(-47 + randomIntFromInterval(-3, 3) / 10, 91.5, -17)
            );
            system.runTimeout(() => {
              player.runCommandAsync(`camera @s clear`);
              player.runCommandAsync(`inputpermission set @s movement enabled`);
              player.runCommandAsync(`inputpermission set @s camera enabled`);
            }, 40);
          }, 40);
        }, 25);
      }, 23);
    }, 16);
  }, 40);
}

function tierToGrade(runTier: number) {
  if (runTier <= 2) return "§8Coal";
  else if (runTier <= 6) return "§fIron";
  else if (runTier <= 8) return "§6Gold";
  else if (runTier <= 10) return "§3Diamond";
  else if (runTier <= 12) return "§aEmerald";
  else return "§8Coal";
}

function gradeToTier(grade: string) {
  if (grade == "§8Coal") return 2;
  else if (grade == "§fIron") return 5;
  else if (grade == "§6Gold") return 7;
  else if (grade == "§3Diamond") return 9;
  else if (grade == "§aEmerald") return 12;
  else return 2;
}

function refinementSequence(player: Player, enchant: EnchantData) {
  player.runCommandAsync(`camera @s fade time 0.5 1 0.5`);
  const orb = overworld.spawnEntity(`palm:orb`, new Vector(-47, 91.75, -30.5));
  orb.addEffect("invisibility", 255, { showParticles: false });
  let lb = overworld.getEntities({
    type: "palm:leaderboard",
    maxDistance: 3,
    location: orb.location,
  })[0];
  lb.addEffect("invisibility", 170, { showParticles: false });
  orb.runCommandAsync(`tp @s ~ ~ ~ facing ~2 ~ ~`);
  system.runTimeout(() => {
    player.runCommandAsync(
      `camera @s set palm:cutscene ease 1 spring pos -46 92 -31 facing -48 92.5 -31`
    );
    player.runCommandAsync(`inputpermission set @s movement disabled`);
    player.runCommandAsync(`inputpermission set @s camera disabled`);
    let loc = new Vector(orb.location.x + 2, orb.location.y, orb.location.z);
    player.teleport(loc, { facingLocation: orb.location });
  }, 10);
  system.runTimeout(() => {
    orb.removeEffect("invisibility");
    orb.playAnimation(`animation.orb.spin`);
    player.runCommandAsync(
      `camera @s set palm:cutscene ease 6.5 linear pos -46 92 -31 facing -48 92.5 -31`
    );
    system.runTimeout(() => {
      player.playSound(`mob.ghast.fireball`);
      system.runTimeout(() => {
        player.playSound(`block.end_portal_frame.fill`);
        system.runTimeout(
          () => player.playSound(`block.end_portal_frame.fill`),
          10
        );
        system.runTimeout(
          () => player.playSound(`block.end_portal_frame.fill`),
          20
        );
        system.runTimeout(() => {
          player.playSound(`block.end_portal.spawn`);
          system.runTimeout(() => {
            const equip = <EntityEquippableComponent>(
              player.getComponent("equippable")
            );
            let item = new ItemStack("ender_eye", 1);
            item.nameTag = `§r${enchant.info.display} §b§lOrb§r`;
            if (item) Enchant.addEnchant(item, enchant.id, enchant.level);
            const runTier = randomIntFromInterval(1, 12);
            // Tiers: [Coal: 1-2 (20-40%)] [Iron: 3-6 (40-60%)] [Gold: 7-8 (60-80%)] [Diamond: 9-10 (80-100%)] [Emerald: 11-12 (100%)]
            let tier = tierToGrade(runTier);
            const lore = item.getLore();
            lore.push(`§r§l§bTier: §r${tier}`);
            item.setLore(lore);
            player.getComponent("inventory")?.container?.addItem(item);
            player.runCommandAsync(`camera @s clear`);
            player.runCommandAsync(`inputpermission set @s movement enabled`);
            player.runCommandAsync(`inputpermission set @s camera enabled`);
            player.runCommandAsync(`event entity @e[type=palm:orb] npcdespawn`);
          }, 40);
        }, 40);
      }, 38);
    }, 10);
  }, 20);
}
