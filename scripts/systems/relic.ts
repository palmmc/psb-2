import {
  Entity,
  EntityDamageCause,
  EquipmentSlot,
  ItemStack,
  Player,
  ScoreboardObjective,
  Vector,
  system,
  world,
} from "@minecraft/server";
import {
  PREFIX,
  formatNumber,
  randomIntFromInterval,
  sendAlert,
} from "../main";
import { formatItemName } from "../economy/itemcloud";
import { Enchant } from "../custom_enchants/enchantHandler";
import {
  CE_RARITY,
  CHARMS,
  giveBookCE,
  giveCharm,
} from "../custom_enchants/customEnchants";
import { JsonDatabase } from "../database";

// Initialize Databases
var playerDB: any = undefined;
world.afterEvents.worldInitialize.subscribe((data) => {
  system.runTimeout(() => {
    playerDB = new JsonDatabase("playerDB", world);
  }, 180);
});

const overworld = world.getDimension("overworld");

type relicChance = {
  relic: number;
  coal: number;
  iron: number;
  gold: number;
  diamond: number;
  emerald: number;
};

export const RELIC_CHANCE = {
  ORE: {
    relic: 750,
    coal: 63,
    iron: 21,
    gold: 10,
    diamond: 4,
    emerald: 2,
  },
  FARM: {
    relic: 700,
    coal: 60,
    iron: 20,
    gold: 13,
    diamond: 4,
    emerald: 3,
  },
  MELON_PUMPKIN: {
    relic: 850,
    coal: 58,
    iron: 19,
    gold: 15,
    diamond: 5,
    emerald: 3,
  },
};

interface Relic {
  name: string;
  id: string;
  item: string;
  loot: RelicLoot[];
}

type RelicLoot = {
  item?: string;
  function?: Function;
  amount: [min: number, max: number];
};

function giveXP(player: Player, RELIC_INFO: Relic, min: number, max: number) {
  let amount = randomIntFromInterval(min, max);
  player.addExperience(amount);
  sendAlert(
    player,
    `§eYou found §d${formatNumber(amount)} §l§aXP§r §ein ${
      RELIC_INFO.name
    } ${RELIC_DISPLAY}§e!`,
    PREFIX.relic
  );
}

function giveMoney(
  player: Player,
  RELIC_INFO: Relic,
  min: number,
  max: number
) {
  let amount = randomIntFromInterval(min, max);
  let pdata = playerDB.get(player.id);
  pdata.coins = pdata.coins + amount;
  playerDB.set(player.id, pdata);
  sendAlert(
    player,
    `§eYou found §6$${formatNumber(amount)} §ein ${
      RELIC_INFO.name
    } ${RELIC_DISPLAY}§e!`,
    PREFIX.relic
  );
}

export const RELICS: Relic[] = [
  {
    name: "§l§8Coal§r",
    id: "coal",
    item: "deepslate_coal_ore",
    loot: [
      {
        item: "coal",
        amount: [8, 32],
      },
      {
        item: "iron_ore",
        amount: [12, 40],
      },
      {
        item: "gold_ore",
        amount: [8, 24],
      },
      {
        item: "iron_ingot",
        amount: [8, 20],
      },
      {
        item: "gold_ingot",
        amount: [6, 14],
      },
      {
        item: "lapis_lazuli",
        amount: [8, 40],
      },
      {
        item: "diamond",
        amount: [3, 16],
      },
      {
        item: "emerald",
        amount: [2, 14],
      },
      {
        item: "iron_block",
        amount: [1, 5],
      },
      {
        item: "coal_block",
        amount: [2, 8],
      },
      {
        item: "gold_block",
        amount: [3, 5],
      },
      {
        item: "hay_block",
        amount: [3, 6],
      },
      {
        item: "palm:potato",
        amount: [7, 26],
      },
      {
        item: "palm:carrot",
        amount: [6, 33],
      },
      {
        item: "palm:wheat_seeds",
        amount: [9, 44],
      },
      {
        item: "apple",
        amount: [1, 5],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveXP(player, RELIC_INFO, 10, 250);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveXP(player, RELIC_INFO, 10, 250);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 100, 2500);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 100, 2500);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 100, 2500);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 100, 2500);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 100, 2500);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 100, 2500);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 100, 2500);
        },
        amount: [1, 1],
      },
    ],
  },
  {
    name: "§l§fIron§r",
    id: "iron",
    item: "deepslate_iron_ore",
    loot: [
      {
        item: "coal",
        amount: [8, 64],
      },
      {
        item: "iron_ore",
        amount: [8, 64],
      },
      {
        item: "gold_ore",
        amount: [8, 64],
      },
      {
        item: "iron_ingot",
        amount: [8, 64],
      },
      {
        item: "gold_ingot",
        amount: [8, 64],
      },
      {
        item: "lapis_lazuli",
        amount: [8, 64],
      },
      {
        item: "diamond",
        amount: [8, 32],
      },
      {
        item: "emerald",
        amount: [8, 32],
      },
      {
        item: "iron_block",
        amount: [1, 10],
      },
      {
        item: "coal_block",
        amount: [1, 10],
      },
      {
        item: "gold_block",
        amount: [1, 8],
      },
      {
        item: "diamond_block",
        amount: [1, 8],
      },
      {
        item: "emerald_block",
        amount: [1, 8],
      },
      {
        item: "hay_block",
        amount: [5, 12],
      },
      {
        item: "apple",
        amount: [1, 16],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveBookCE(player, "common", 1);
          sendAlert(
            player,
            `§eYou found a ${CE_RARITY.common} §l§6C§eE §dBook§r §ein ${RELIC_INFO.name} ${RELIC_DISPLAY}§e!`,
            PREFIX.relic
          );
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveXP(player, RELIC_INFO, 25, 500);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveXP(player, RELIC_INFO, 25, 500);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveXP(player, RELIC_INFO, 25, 500);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 250, 5000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 250, 5000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 250, 5000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 250, 5000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 250, 5000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 250, 5000);
        },
        amount: [1, 1],
      },
    ],
  },
  {
    name: "§l§6Gold§r",
    id: "gold",
    item: "deepslate_gold_ore",
    loot: [
      {
        item: "iron_ingot",
        amount: [24, 64],
      },
      {
        item: "gold_ingot",
        amount: [24, 64],
      },
      {
        item: "lapis_lazuli",
        amount: [24, 64],
      },
      {
        item: "diamond",
        amount: [16, 64],
      },
      {
        item: "emerald",
        amount: [16, 64],
      },
      {
        item: "iron_block",
        amount: [4, 24],
      },
      {
        item: "gold_block",
        amount: [4, 16],
      },
      {
        item: "diamond_block",
        amount: [4, 16],
      },
      {
        item: "emerald_block",
        amount: [4, 16],
      },
      {
        item: "pumpkin",
        amount: [12, 24],
      },
      {
        item: "melon_block",
        amount: [4, 20],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveBookCE(player, "common", 1);
          sendAlert(
            player,
            `§eYou found a ${CE_RARITY.common} §l§6C§eE §dBook§r §ein ${RELIC_INFO.name} ${RELIC_DISPLAY}§e!`,
            PREFIX.relic
          );
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveBookCE(player, "rare", 1);
          sendAlert(
            player,
            `§eYou found a ${CE_RARITY.rare} §l§6C§eE §dBook§r §ein ${RELIC_INFO.name} ${RELIC_DISPLAY}§e!`,
            PREFIX.relic
          );
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          let charms = ["binding", "precision", "expulsion"];
          giveCharm(
            player,
            charms[
              randomIntFromInterval(1, charms.length) - 1
            ] as keyof typeof CHARMS,
            "basic",
            1
          );
          sendAlert(
            player,
            `§eYou found a §dCharm §ein ${RELIC_INFO.name} ${RELIC_DISPLAY}§e!`,
            PREFIX.relic
          );
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveXP(player, RELIC_INFO, 75, 1500);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveXP(player, RELIC_INFO, 75, 1500);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 750, 15000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 750, 15000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 750, 15000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 750, 15000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 750, 15000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 750, 15000);
        },
        amount: [1, 1],
      },
    ],
  },
  {
    name: "§l§bDiamond§r",
    id: "diamond",
    item: "deepslate_diamond_ore",
    loot: [
      {
        item: "iron_block",
        amount: [16, 64],
      },
      {
        item: "gold_block",
        amount: [16, 64],
      },
      {
        item: "diamond_block",
        amount: [12, 48],
      },
      {
        item: "emerald_block",
        amount: [12, 48],
      },
      {
        item: "pumpkin",
        amount: [12, 64],
      },
      {
        item: "melon_block",
        amount: [8, 64],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveBookCE(player, "common", 1);
          sendAlert(
            player,
            `§eYou found a ${CE_RARITY.common} §l§6C§eE §dBook§r §ein ${RELIC_INFO.name} ${RELIC_DISPLAY}§e!`,
            PREFIX.relic
          );
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveBookCE(player, "common", 2);
          sendAlert(
            player,
            `§eYou found a ${CE_RARITY.common} §l§6C§eE §dBook§r §ein ${RELIC_INFO.name} ${RELIC_DISPLAY}§e!`,
            PREFIX.relic
          );
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveBookCE(player, "rare", 1);
          sendAlert(
            player,
            `§eYou found a ${CE_RARITY.rare} §l§6C§eE §dBook§r §ein ${RELIC_INFO.name} ${RELIC_DISPLAY}§e!`,
            PREFIX.relic
          );
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          let charms = ["binding", "precision", "expulsion"];
          let rarities = ["basic", "basic", "rare"];
          giveCharm(
            player,
            charms[
              randomIntFromInterval(1, charms.length) - 1
            ] as keyof typeof CHARMS,
            rarities[
              randomIntFromInterval(1, rarities.length) - 1
            ] as keyof typeof CHARMS.precision,
            randomIntFromInterval(1, 2)
          );
          sendAlert(
            player,
            `§eYou found a §dCharm §ein ${RELIC_INFO.name} ${RELIC_DISPLAY}§e!`,
            PREFIX.relic
          );
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveXP(player, RELIC_INFO, 300, 3000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveXP(player, RELIC_INFO, 300, 3000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveXP(player, RELIC_INFO, 300, 3000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 3000, 30000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 3000, 30000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 3000, 30000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 3000, 30000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 3000, 30000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 3000, 30000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 3000, 30000);
        },
        amount: [1, 1],
      },
    ],
  },
  {
    name: "§l§aEmerald§r",
    id: "emerald",
    item: "deepslate_emerald_ore",
    loot: [
      {
        item: "diamond_block",
        amount: [24, 64],
      },
      {
        item: "emerald_block",
        amount: [24, 64],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveBookCE(player, "common", 2);
          sendAlert(
            player,
            `§eYou found ${CE_RARITY.common} §l§6C§eE §dBook§r §8x§72 §ein ${RELIC_INFO.name} ${RELIC_DISPLAY}§e!`,
            PREFIX.relic
          );
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveBookCE(player, "common", 3);
          sendAlert(
            player,
            `§eYou found ${CE_RARITY.common} §l§6C§eE §dBook§r §8x§73 §ein ${RELIC_INFO.name} ${RELIC_DISPLAY}§e!`,
            PREFIX.relic
          );
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveBookCE(player, "rare", 1);
          sendAlert(
            player,
            `§eYou found a ${CE_RARITY.rare} §l§6C§eE §dBook§r §ein ${RELIC_INFO.name} ${RELIC_DISPLAY}§e!`,
            PREFIX.relic
          );
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveBookCE(player, "rare", 1);
          sendAlert(
            player,
            `§eYou found a ${CE_RARITY.rare} §l§6C§eE §dBook§r §ein ${RELIC_INFO.name} ${RELIC_DISPLAY}§e!`,
            PREFIX.relic
          );
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveBookCE(player, "epic", 1);
          sendAlert(
            player,
            `§eYou found a ${CE_RARITY.epic} §l§6C§eE §dBook§r §ein ${RELIC_INFO.name} ${RELIC_DISPLAY}§e!`,
            PREFIX.relic
          );
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          let charms = ["binding", "precision", "expulsion"];
          let rarities = ["basic", "rare", "rare"];
          giveCharm(
            player,
            charms[
              randomIntFromInterval(1, charms.length) - 1
            ] as keyof typeof CHARMS,
            rarities[
              randomIntFromInterval(1, rarities.length) - 1
            ] as keyof typeof CHARMS.precision,
            randomIntFromInterval(1, 2)
          );
          sendAlert(
            player,
            `§eYou found a §dCharm §ein ${RELIC_INFO.name} ${RELIC_DISPLAY}§e!`,
            PREFIX.relic
          );
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveXP(player, RELIC_INFO, 1000, 5000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveXP(player, RELIC_INFO, 1000, 5000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveXP(player, RELIC_INFO, 1000, 5000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveXP(player, RELIC_INFO, 1000, 5000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 20000, 60000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 20000, 60000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 20000, 60000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 20000, 60000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 20000, 60000);
        },
        amount: [1, 1],
      },
      {
        function: function (player: Player, RELIC_INFO: Relic) {
          giveMoney(player, RELIC_INFO, 20000, 60000);
        },
        amount: [1, 1],
      },
    ],
  },
];

const RELIC_DISPLAY = "§c§lRelic§r";

export function rollRelic(type: keyof typeof RELIC_CHANCE) {
  let RELIC = RELIC_CHANCE[type];
  if (randomIntFromInterval(1, RELIC.relic) != 1) return undefined;
  let roll = randomIntFromInterval(1, 100);
  let choice = 100;
  if (roll >= (choice -= RELIC.emerald)) return "emerald";
  if (roll >= (choice -= RELIC.diamond)) return "diamond";
  if (roll >= (choice -= RELIC.gold)) return "gold";
  if (roll >= (choice -= RELIC.iron)) return "iron";
  if (roll >= (choice -= RELIC.coal)) return "coal";
  else return undefined;
}

export function giveRelic(
  player: Player,
  type?: keyof typeof RELIC_CHANCE.ORE,
  amount?: number
) {
  if (!type) return;
  let RELIC_INFO = RELICS.find((x) => x.id == type);
  if (!RELIC_INFO) return;
  let item = new ItemStack(RELIC_INFO.item, amount ?? 1);
  item.nameTag = `§r${RELIC_INFO.name} ${RELIC_DISPLAY}`;
  item.setLore([`§r§d§lCLICK TO OPEN§r`]);
  player.getComponent("inventory")?.container?.addItem(item);
}

export function openRelic(player: Player, type: keyof typeof RELIC_CHANCE.ORE) {
  let RELIC_INFO = RELICS.find((x) => x.id == type);
  if (!RELIC_INFO) return;
  let chosenLoot =
    RELIC_INFO.loot[randomIntFromInterval(1, RELIC_INFO.loot.length) - 1];
  if (chosenLoot.function) chosenLoot.function(player, RELIC_INFO);
  else if (chosenLoot.item) {
    let amount = randomIntFromInterval(
      chosenLoot.amount[0],
      chosenLoot.amount[1]
    );
    player
      .getComponent("inventory")
      ?.container?.addItem(new ItemStack(chosenLoot.item, amount));
    sendAlert(
      player,
      `§eYou found §b${formatItemName(chosenLoot.item)} §8x§7${amount} §ein ${
        RELIC_INFO.name
      } ${RELIC_DISPLAY}§e!`,
      PREFIX.relic
    );
  }
}

world.beforeEvents.playerPlaceBlock.subscribe((data) => {
  if (!data.itemStack.getLore()) return;
  let RELIC_INFO = RELICS.find(
    (x) => x.name == (data.itemStack.nameTag?.split(" ")[0].slice(2) ?? "")
  );
  if (!RELIC_INFO) return;
  data.cancel = true;
  system.run(() => {
    if (data.player.getItemCooldown("relic") > 0) return;
    data.player.startItemCooldown("relic", 15);
    let item = data.player
      .getComponent("equippable")
      ?.getEquipment(EquipmentSlot.Mainhand);
    if (item?.nameTag != data.itemStack.nameTag) return;
    if (data.itemStack.amount > 1) {
      let item = data.itemStack;
      item.amount--;
      data.player
        .getComponent("equippable")
        ?.setEquipment(EquipmentSlot.Mainhand, item);
    } else
      data.player
        .getComponent("equippable")
        ?.setEquipment(EquipmentSlot.Mainhand);
    openRelic(data.player, RELIC_INFO?.id as keyof typeof RELIC_CHANCE.ORE);
  });
});

//giveRelic(world.getPlayers()[0], "coal", 64);
//giveRelic(world.getPlayers()[0], "iron", 64);
//giveRelic(world.getPlayers()[0], "gold", 64);
//giveRelic(world.getPlayers()[0], "diamond", 64);
//giveRelic(world.getPlayers()[0], "emerald", 64);
