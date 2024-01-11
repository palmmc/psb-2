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
  PREFIX,
  randomIntFromInterval,
  sendAlert,
  sendError,
  toRomanNumeral,
} from "../main";
import { ChestFormData } from "../chest-ui/forms";

const overworld = world.getDimension("overworld");

const EnchantSlot = {
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
  pickaxehoe: [
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
};

// RARITIES:
const CE_RARITY = {
  common: "§7Common",
  rare: "§2Rare",
  epic: "§9Epic",
  unique: "§6Unique",
  forged: "§cForged",
};

//Test Enchant
new Enchant("nightvision", {
  display: "§7NightVision",
  rarity: "common",
  type: EnchantSlot.helmet,
  maxLevel: 5,
  hold: (data) => {
    data.player.addEffect("night_vision", 100);
  },
});

new Enchant("Dwarvinity", {
  display: "§7NightVision",
  rarity: "common",
  type: EnchantSlot.helmet,
  maxLevel: 5,
  hold: (data) => {
    data.player.addEffect("night_vision", 100);
  },
});

new Enchant("rumble", {
  display: "§cRumble",
  rarity: "forged",
  type: EnchantSlot.helmet,
  maxLevel: 1,
  hold: (data) => {
    data.player.runCommandAsync(`camerashake add @s 0.1 2.25`);
  },
});

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
      giveBookCE(player, rarity);
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
      giveCharm(player, type, rarity);
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

function giveBookCE(player: Player, rar: keyof typeof CE_RARITY) {
  const rarity = CE_RARITY[rar];
  let enchItem = new ItemStack("book", 1);
  enchItem.nameTag = `§@§r§e§lC§6E §d§lBook`;
  enchItem.setLore([`§%§r§5Rarity: ${rarity}`]);
  let equip = (<EntityInventoryComponent>player.getComponent("inventory"))
    .container;
  if (!equip) return;
  equip.addItem(enchItem);
}

const CHARMS = {
  // Charm of Binding - Increases the grade quality of a refined enchantment.
  binding: {
    // Increase in quality per rarity
    display: "§3Binding",
    basic: [5, 20],
    advanced: [15, 30],
    superior: [35, 50],
  },
  // Charm of Precision - Increases the level of an enchantment.
  precision: {
    // Increase in level per rarity
    display: "§bPrecision",
    basic: [1, 2],
    advanced: [1, 3],
    superior: [2, 5],
  },
  // Charm of Expulsion - Exiles a selected an enchantment from the item with a percent chance success rate.
  expulsion: {
    // Increase in success per rarity
    display: "§cExpulsion",
    basic: [30, 60],
    advanced: [40, 70],
    superior: [75, 90],
  },
  // Charm of Attunement - Increases an enchantment's level by 1 up to a max of 15 with a percent chance success rate.
  attunement: {
    display: "§9Attunement",
    basic: [20, 35],
    advanced: [40, 60],
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
    let charms = new Array<{ slot: number; type: string; tier: string }>();
    for (let i = 0; i < 36; i++) {
      if (!inventory) continue;
      let it = inventory.getItem(i);
      if (it?.typeId !== `minecraft:nautilus_shell`) continue;
      const lore = it.getLore();
      if (!lore) continue;
      const type = it.nameTag?.split("of ")[1].slice(2);
      const tier = lore[0].split("Type: ")[1].slice(2);
      if (!type || !tier) continue;
      charms.push({ slot: i, type: type ?? "", tier: tier });
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
  } else if (type == "precision") {
    const gui = new ChestFormData();
    gui.title(`Select an Enchantment`);
    let i = 10;
    for (const e of enchants) {
      if (i > 16) return;
      gui.button(
        i,
        `${e.info.display} §b§lBook`,
        [`§9Click to upgrade.`],
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
      overworld.spawnParticle(`minecraft:totem_manual`, {
        x: player.location.x,
        y: player.location.y + 0.5,
        z: player.location.z,
      });
      player.playSound(`random.anvil_land`, { pitch: 0.8 });
      let iname = item.typeId.split("_")[1];
      iname = iname.charAt(0).toUpperCase() + iname.slice(1);
      player.sendMessage(
        `§eUsed §dCharm §u(${CHARMS[type].display}§u) §eon ${enchant.info.display} §efor §b${iname}`
      );
      if (!inv) return;
      inv.setItem(charms[0].slot);
    });
  } else if (type == "expulsion") {
  } else if (type == "attunement") {
  }
}

function giveCharm(
  player: Player,
  type: keyof typeof CHARMS,
  rarity: keyof typeof CHARMS.binding
) {
  let info = CHARMS[type] as typeof CHARMS.binding;
  let enchItem = new ItemStack("nautilus_shell", 1);
  enchItem.nameTag = `§@§r§f§uCharm §5of ${info.display}`;
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
  )
    system.run(() => {
      if (player.getItemCooldown("refineCE") != 0) return;
      player.startItemCooldown("refineCE", 160);
      const enchants = Enchant.getEnchants(item);
      if (!enchants) return;
      (<EntityEquippableComponent>(
        player.getComponent("equippable")
      )).setEquipment(EquipmentSlot.Mainhand);
      refinementSequence(player, enchants[0]);
    });
});

// COMBINER TEST ANIMATION
world.afterEvents.entityHitEntity.subscribe((data) => {
  const player = <Player>data.damagingEntity;
  if (data.hitEntity.typeId != "palm:blacksmith" || !player) return;
  const equip = <EntityEquippableComponent>player.getComponent("equippable");
  let item = equip.getEquipment(EquipmentSlot.Mainhand);
  if (!item) {
    sendError(
      player,
      `You must hold the item that you want to be enchanted.`,
      PREFIX.ce
    );
    return;
  }
  const enchants = Enchant.getEnchants(item);
  if (enchants.length >= 5) return;
  function getSlotKey() {
    for (const key of Object.keys(EnchantSlot)) {
      //@ts-ignore
      if (EnchantSlot[key].includes(item?.typeId)) {
        return key as keyof EnchantmentSlot;
      }
    }
  }
  let type = getSlotKey();
  if (!type) return;
  function findEnchInInv(player: Player) {
    const inventory = (<EntityInventoryComponent>(
      player.getComponent("inventory")
    )).container;
    for (let i = 0; i < 36; i++) {
      if (!inventory) return 0;
      let it = inventory.getItem(i);
      if (it?.typeId !== `minecraft:ender_eye`) continue;
      const lore = it.getLore();
      if (!lore) continue;
      const enchants = Enchant.getEnchants(it);
      if (!enchants) continue;
      const tier = lore[lore.length - 1].slice(16);
      function matchEnch() {
        for (let e of enchants) {
          if (!e.info.type?.includes(item?.typeId ?? "")) continue;
          return e;
        }
      }
      return { slot: i, ench: matchEnch(), tier };
    }
  }
  const inv = (<EntityInventoryComponent>player.getComponent("inventory"))
    .container;
  const ench = findEnchInInv(player);
  if (!ench || !ench.ench) {
    sendError(
      player,
      `Found no enchantments to combine in inventory.`,
      PREFIX.ce
    );
    return;
  }
  if (Enchant.getEnchants(item).find((x) => x.id == ench.ench?.id)) {
    sendError(
      player,
      `This enchantment is already applied to this item.`,
      PREFIX.ce
    );
    return;
  }
  if (!inv) return;
  inv.setItem(ench?.slot ?? -1);
  let accuracy = randomIntFromInterval(20, 40);
  if (ench.tier == "Iron") accuracy = randomIntFromInterval(40, 60);
  if (ench.tier == "Gold") accuracy = randomIntFromInterval(60, 80);
  if (ench.tier == "Diamond") accuracy = randomIntFromInterval(80, 100);
  if (ench.tier == "Emerald") accuracy = 100;
  animateBlacksmith(player, data.hitEntity, type, ench?.ench, accuracy);
});

function animateBlacksmith(
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
      `camera @s set palm:cutscene ease 1 spring pos 2986.9 65.25 3000 facing 2984 65.75 3000`
    );
    player.runCommandAsync(`inputpermission set @s movement disabled`);
    player.runCommandAsync(`inputpermission set @s camera disabled`);
    let loc = new Vector(
      blacksmith.location.x + 2,
      blacksmith.location.y,
      blacksmith.location.z
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
              new Vector(2986, 65.5, 3000 + randomIntFromInterval(-3, 3) / 10)
            );
            overworld.spawnParticle(
              particle,
              new Vector(
                2986,
                65.55,
                3000.5 + randomIntFromInterval(-3, 3) / 10
              )
            );
            //overworld.spawnParticle(`minecraft:eyeofender_death_explode_particle`, new Vector(2986.05, 65.5, 3000.5));
            overworld.spawnParticle(
              particle,
              new Vector(2986, 65.5, 3001 + randomIntFromInterval(-3, 3) / 10)
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

function refinementSequence(player: Player, enchant: EnchantData) {
  player.runCommandAsync(`camera @s fade time 0.5 1 0.5`);
  const orb = overworld.spawnEntity(
    `palm:orb`,
    new Vector(2987, 64.75, 2994.5)
  );
  orb.addEffect("invisibility", 255, { showParticles: false });
  orb.runCommandAsync(`tp @s ~ ~ ~ facing ~2 ~ ~`);
  system.runTimeout(() => {
    player.runCommandAsync(
      `camera @s set palm:cutscene ease 1 spring pos 2988 65 2994 facing 2987 65.5 2994`
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
      `camera @s set palm:cutscene ease 6.5 linear pos 2987.75 65.5 2994 facing 2987 65.6 2994`
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
            if (item) Enchant.addEnchant(item, enchant.id, enchant.level);
            const runTier = randomIntFromInterval(1, 12);
            // Tiers: [Coal: 1-2 (20-40%)] [Iron: 3-6 (40-60%)] [Gold: 7-8 (60-80%)] [Diamond: 9-10 (80-100%)] [Emerald: 11-12 (100%)]
            let tier = "§8Coal";
            if (runTier <= 2) tier = "§8Coal";
            else if (runTier <= 6) tier = "§fIron";
            else if (runTier <= 8) tier = "§6Gold";
            else if (runTier <= 10) tier = "§3Diamond";
            else if (runTier <= 12) tier = "§aEmerald";
            const lore = item.getLore();
            lore.push(`§r§l§bTier: §r${tier}`);
            item.setLore(lore);
            equip.setEquipment(EquipmentSlot.Mainhand, item);
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
