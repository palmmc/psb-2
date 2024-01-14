import { JsonDatabase } from "./database";
import {
  BlockInventoryComponent,
  BlockSignComponent,
  Enchantment,
  EnchantmentTypes,
  EntityEquippableComponent,
  EntityInventoryComponent,
  EquipmentSlot,
  ItemEnchantsComponent,
  ItemTypes,
  Player,
  TicksPerSecond,
  Vector,
  system,
  world,
} from "@minecraft/server";
import { ISLAND_GENERATOR, islandCreator } from "./island/create";

// SCRIPT MODULES

import "./island/cobblegens";
import "./island/create";
import "./island/manage";
import "./island/permissions";
import "./systems/telepathy";
import "./systems/miscellaneous";
import "./systems/events";
import {
  exportToCloud,
  formatItemName,
  importFromCloud,
  infoInHand,
  listFromCloud,
} from "./economy/itemcloud";
import "./economy/itemcloud";
import "./economy/shop";
import "./systems/enchantments";
import "./systems/generators";
import "./custom_enchants/enchantHandler";
import "./custom_enchants/customEnchants";
import {
  OpenShop,
  OpenShopBeta,
  ShopItems,
  ShopTabEnchantments,
} from "./economy/shop";
import {
  EnchantEntries,
  EnchantInfo,
  VanillaEnchItem,
} from "./systems/enchantments";
import { getIslandOn, islandExpand, visitIsland } from "./island/manage";
import {
  islandEditPerms,
  islandInvite,
  listIslandPerms,
} from "./island/permissions";
import { levelToXp, xpToLevel, xpUntilNextLevel } from "./island/levels";
import {
  ActionFormData,
  ActionFormResponse,
  MessageFormData,
} from "@minecraft/server-ui";
import { ChestFormData } from "./chest-ui/forms";
// TEST CONNECTION

world.sendMessage("hello world");

// ESSENTIAL FUNCTIONS

export function sendAlert(
  player: Player,
  msg: string,
  prefix?: typeof PREFIX.server,
  sound?: string,
  volume?: number
) {
  player.sendMessage(`${prefix ?? PREFIX.server} ${msg}`);
  if (sound) player.playSound(sound, { volume: volume ?? 0.25 });
  else {
    if (randomIntFromInterval(1, 3) == 1)
      player.playSound(`note.hat`, { volume: 0.25 });
    else player.playSound(`note.snare`, { volume: 0.25 });
  }
}
export function sendError(
  player: Player,
  msg: string,
  prefix?: typeof PREFIX.server
) {
  player.sendMessage(`${prefix ?? PREFIX.server} §4Error: §c${msg}`);
  if (randomIntFromInterval(1, 3) == 1)
    player.playSound(`note.bass`, { volume: 0.25, pitch: 0.75 });
  else player.playSound(`note.bassattack`, { volume: 0.25, pitch: 0.75 });
}

export function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
export function formatNumber(x: number) {
  if (x < 999999)
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
  else if (x < 999999999) return `${Number(x / 1000000).toFixed(2)}M`;
  else if (x < 999999999999) return `${Number(x / 1000000000).toFixed(2)}B`;
  else if (x < 999999999999999)
    return `${Number(x / 1000000000000).toFixed(2)}T`;
  else return x;
}
function formatTime(s: number) {
  return (
    Math.floor(s / 3600).toString() +
    new Date(s * 1000).toISOString().slice(13, 19)
  );
}
function addScore(score: string, player: Player, x: number) {
  if (player.scoreboardIdentity)
    return world.scoreboard
      .getObjective(score)
      ?.setScore(
        player.scoreboardIdentity,
        (world.scoreboard
          .getObjective(score)
          ?.getScore(player.scoreboardIdentity) ?? 0) + x
      );
  else {
    player.runCommandAsync(`scoreboard players add @s ${score} 0`);
    return 0;
  }
}
function removeScore(score: string, player: Player, x: number) {
  if (player.scoreboardIdentity)
    return world.scoreboard
      .getObjective(score)
      ?.setScore(
        player.scoreboardIdentity,
        (world.scoreboard
          .getObjective(score)
          ?.getScore(player.scoreboardIdentity) ?? 0) - x
      );
  else {
    player.runCommandAsync(`scoreboard players add @s ${score} 0`);
    return 0;
  }
}
function getScore(score: string, player: Player) {
  if (player.scoreboardIdentity)
    return (
      world.scoreboard
        .getObjective(score)
        ?.getScore(player.scoreboardIdentity) ?? 0
    );
  else return 0;
}

export function getItemAmount(
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

export function toRomanNumeral(num: number) {
  if (isNaN(num)) return "NaN";
  var digits = String(+num).split(""),
    key = [
      "",
      "C",
      "CC",
      "CCC",
      "CD",
      "D",
      "DC",
      "DCC",
      "DCCC",
      "CM",
      "",
      "X",
      "XX",
      "XXX",
      "XL",
      "L",
      "LX",
      "LXX",
      "LXXX",
      "XC",
      "",
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
    ],
    roman = "",
    i = 3;
  //@ts-ignore
  while (i--) roman = (key[+digits.pop() + i * 10] || "") + roman;
  return Array(+digits.join("") + 1).join("M") + roman;
}

export function fromRomanNumeral(roman: string): number {
  let res: number = 0;
  const romanMap = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 };
  const others = ["CD", "CM", "XL", "XC", "IV", "IX"];
  for (let i = 0; i < roman.length; i++) {
    others.indexOf(roman[i] + roman[i + 1]) === -1
      ? (res += romanMap[roman[i] as keyof typeof romanMap])
      : (res -= romanMap[roman[i] as keyof typeof romanMap]);
  }
  return res;
}

// INITALIZE DATABASES
export const playerDB = new JsonDatabase("playerDB", world);
export const islandDB = new JsonDatabase("islandDB", world);

// READ/WRITE ISLAND DATA
export function readIsland(
  name: string,
  key: "owner" | "ownerId" | "members" | "points" | "size" | "funds" | "limits"
) {
  return islandDB.get(name)[key];
}
export function writeIsland(
  name: string,
  key: "owner" | "ownerId" | "members" | "points" | "size" | "funds" | "limits",
  push: any
) {
  let data = islandDB.get(name);
  data[key] = push;
  islandDB.set(name, data);
}
const limitEx = {
  lava: 0,
  maxLava: 0,
  crops: 0,
  maxCrops: 0,
  spawners: 0,
  maxSpawners: 0,
};
export function storeIsland(
  name: string,
  owner: string,
  ownerId: string,
  members: Array<string>,
  points: number,
  size: number,
  funds: number,
  limits: typeof limitEx
) {
  islandDB.set(name, {
    owner: owner,
    ownerId: ownerId,
    members: members,
    points: points,
    size: size,
    funds: funds,
    limits: limits,
  });
}

// DEFINTIIONS

export const PREFIX = {
  server: "§l§f[§r§l§dPalm§uSB§r§f§l]§r >>§r",
  island: "§l§f[§r§e§lIsland§r§f§l]§r >>§r",
  shop: "§l§f[§r§l§bShop§r§f§l]§r >>§r",
  ce: "§l§8[§r§l§cBlacksmith§r§8§l]§r >>§r",
};
const ItemIds = ItemTypes.getAll().map((x) => {
  return x.id;
});
const overworld = world.getDimension("overworld");

// SIDEBAR RUNTIME

system.runInterval(() => {
  for (var i = 0, n = world.getPlayers().length; i < n; ++i) {
    let player = world.getPlayers()[i];
    addScore("time", player, 2);

    // Fetch island info.
    let pdata = playerDB.get(player.id);
    let coins = pdata.coins;
    let island = islandDB.get(getIslandOn(player)?.island);
    if (pdata.island == "") {
      island = { owner: "??", points: 0, size: 16, funds: 0 };
      pdata.island = "-is create";
    }
    let sidebarText = `\n\n §7|§f ${
      world.getPlayers().length
    }/10 §7| §f ${TicksPerSecond}t §7| §e 0 §7|\n\n§g §aUser §7» §f${
      player.name.length > 15 ? player.name.slice(0, 15) + "..." : player.name
    }\n §eWallet §7»  §f$${formatNumber(
      coins
    )}\n§g §6Time Played §7» §f${formatTime(getScore("time", player))}`;
    if (island && island.owner != "??") {
      let points = island.points;
      let level = xpToLevel(points);
      let pointsNeeded = levelToXp(level - 1);
      let pointsBefore = levelToXp(level - 2);
      pointsBefore = level > 1 ? pointsBefore : 0;
      sidebarText += `\n\n §e§l[ §r§bIsland §fInfo §l§e]§r\n §l§6│§r §eIsland §7» §f${
        (pdata.island.length > 11
          ? pdata.island.slice(0, 11) + "..."
          : pdata.island) ?? "-is create"
      }\n §l§6│§r §6Owner §7» §f${
        island.owner.length > 11
          ? island.owner.slice(0, 11) + "..."
          : island.owner
      }\n §l§6│§r §2Level §7» §f${level} §2(§f${points - pointsBefore}§2/§f${
        pointsNeeded - pointsBefore
      }§2)\n §l§6│§r §eSize §7» §d(§f${island.size} §dx §f${
        island.size
      }§d)\n §l§6│§r §6Funds §7» §f$${formatNumber(island.funds)}`;
    }
    sidebarText += `\n §f> §7Use -help for info §f<\n`;

    /*
    const sidebarText = `\n §f⟩ §ediscord.palmskyblock.fun §f⟨\n§g⦿ §aUser: §f${
      player.name
    }\n§g⦿ §bPlayers: §f${
      world.getPlayers().length
    }/10\n§g⦿ §eBalance: §f$${formatNumber(coins)}\n§g⦿ §aXP: §f${formatNumber(
      player.getTotalXp()
    )}\n§g⦿ §6Time Played: §f${formatTime(
      getScore("time", player)
    )}\n§d⟦ Island Info ⟧\n  §l§6↳§r §eIsland: §f${
      pdata.island ?? "-is create"
    }\n  §l§6↳§r §6Owner: §f${
      player.name
    }\n  §l§6↳§r §2Level: §f${level}\n  §l§6↳§r §aPoints: §2(§f${
      points - pointsBefore
    }§2/§f${pointsNeeded - pointsBefore}§2)\n  §l§6↳§r §eSize: §d(§f${
      island.size
    } §dx §f${island.size}§d)\n  §l§6↳§r §6Funds: §f$${formatNumber(
      island.funds
    )}\n  §l§6↳§r §bTPS: §f${TicksPerSecond}\n §f⟩ §7Use -help for commands §f⟨`;
    */
    player.onScreenDisplay.setTitle(sidebarText);
  }
}, 40);

// COMMAND BUILDER

const COMMAND_PERMS = {
  GUEST: 0,
  ADMIN: 1,
};

const commands = [
  {
    alias: ["test"],
    permission: COMMAND_PERMS.ADMIN,
    info: "Test", // Test command.
    function: function (player: Player, message: string) {
      world.sendMessage("test command");
    },
    arguments: [
      {
        alias: ["testarg"],
        info: "",
        function: function (player: Player, message: string) {
          world.sendMessage("test argument");
        },
      },
    ],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["slots"],
    info: "", // Shows available island slots.
    function: function (player: Player, message: string) {
      let players = world.getPlayers();
      let slots = new Array();
      for (const [key, value] of playerDB) {
        if (value) slots.push(value.slot);
      }
      let avSlots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(function (data) {
        return !slots.includes(data);
      });
      avSlots.forEach((d) => {
        player.sendMessage(`${d}`);
      });
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["help", "?"],
    info: "Shows a list of available commands.",
    function: function (player: Player, message: string) {
      let PAGE_LENGTH = 7;
      let args = commands;
      let page = Number(message.split(" ")[1]);
      if (!message.split(" ")[1]) page = 1;
      else if (
        !(page > 0) ||
        Math.floor(page - 1) > args?.length / PAGE_LENGTH ||
        Math.floor(page) < 1
      ) {
        sendError(
          player,
          `§cInvalid format: Try using §a-help [§2page: 1-${Math.ceil(
            args.length / PAGE_LENGTH
          )}§a] §cinstead.`,
          PREFIX.server
        );
        return;
      }
      let list = args
        .filter((x) => {
          return x.info != "" && !x.permission;
        })
        .sort((a, b) => a.alias[0].localeCompare(b.alias[0]))
        .slice(
          page * PAGE_LENGTH - PAGE_LENGTH,
          Math.min(page * PAGE_LENGTH, args.length)
        )
        .map((x) => {
          return `§f- §a${x.alias[0]} §8// §7${x.info}`;
        })
        .toString()
        .replace(/,/g, "\n");
      player.sendMessage(`§f============= §l§2Help:§r §f=============`);
      player.sendMessage(list);
      player.sendMessage(`§f============ §a-- ${page} --§r §f============`);
      player.playSound(`random.pop2`, { pitch: 1.5 });
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["island", "is", "skyblock", "sb"],
    info: "", // All island related functions.
    function: function (player: Player, message: string) {
      sendError(
        player,
        `§cUse §e-is help §cfor a list of available commands.`,
        PREFIX.server
      );
    },
    arguments: [
      {
        alias: ["help", "?"],
        info: "Shows a list of all available island commands.",
        function: function (player: Player, message: string) {
          let PAGE_LENGTH = 7;
          let args = commands.find((x) => {
            return x.alias.includes("island");
          })?.arguments;
          if (!args) return;
          let page = Number(message.split(" ")[2]);
          if (!message.split(" ")[2]) page = 1;
          if (
            !(page > 0) ||
            Math.floor(page - 1) > args?.length / PAGE_LENGTH ||
            Math.floor(page) < 1
          ) {
            sendError(
              player,
              `§cInvalid format: Try using §e-is help [§gpage: 1-${Math.ceil(
                args.length / PAGE_LENGTH
              )}§e] §cinstead.`,
              PREFIX.island
            );
            return;
          }
          let list = args
            .filter((x) => {
              return x.info != "";
            })
            .sort((a, b) => a.alias[0].localeCompare(b.alias[0]))
            .slice(
              page * PAGE_LENGTH - PAGE_LENGTH,
              Math.min(page * PAGE_LENGTH, args.length)
            )
            .map((x) => {
              return `§f- §eis ${x.alias[0]} §8// §7${x.info}`;
            })
            .toString()
            .replace(/,/g, "\n");
          player.sendMessage(`§g========= §l§6Island Help:§r §g==========`);
          player.sendMessage(list);
          player.sendMessage(`§g=========== §e-- ${page} --§r §g=============`);
          player.playSound(`random.pop2`, { pitch: 1.5 });
        },
      },
      {
        alias: ["create"],
        info: "Opens the island creator.",
        function: function (player: Player, message: string) {
          let island = playerDB.get(player.id).island;
          if (island && island != "-is create") {
            sendError(
              player,
              `§cYou already own the §d${island}§c island.\nUse §e-is go§c to warp to it.`,
              PREFIX.server
            );
            return;
          } else islandCreator(player);
        },
      },
      {
        alias: ["go", "warp"],
        info: "Warps you to your island.",
        function: function (player: Player, message: string) {
          let slot = playerDB.get(player.id).slot;
          let island = playerDB.get(player.id).island;
          if (!island) {
            sendError(
              player,
              `§cYou do not currently own a skyblock island.\nUse §e-is create§c to create one.`,
              PREFIX.server
            );
            return;
          }
          player.teleport(
            new Vector(
              ISLAND_GENERATOR.start + slot * ISLAND_GENERATOR.dist + 0.5,
              65,
              ISLAND_GENERATOR.start + slot * ISLAND_GENERATOR.dist + 0.5
            )
          );
          sendAlert(
            player,
            `§aYou have been teleported to your §e${island} §aisland.`,
            PREFIX.server
          );
        },
      },
      {
        alias: ["tp", "teleport", "visit"],
        info: "Teleports you to another player's island.",
        function: function (player: Player, message: string) {
          let islandName = message.split(" ")[2];
          let island = islandDB.get(islandName);
          if (!island) {
            sendError(
              player,
              `Invalid format: Island does not exist.\n§cFormat: §e-is visit [§gisland§e]`,
              PREFIX.server
            );
            return;
          }
          let ownerName = island.owner;
          let owner = world.getPlayers({ name: ownerName })[0];
          if (!owner) {
            sendError(
              player,
              `The island owner must be online to visit it.`,
              PREFIX.server
            );
            return;
          }
          visitIsland(player, owner);
        },
      },
      {
        alias: ["setperms", "setperm", "edit"],
        info: "placeholder",
        function: function (player: Player, message: string) {
          system.runTimeout(() => islandEditPerms(player), 2);
        },
      },
      {
        alias: ["invite", "inv"],
        info: "placeholder",
        function: function (player: Player, message: string) {
          system.runTimeout(() => islandInvite(player), 2);
        },
      },
      {
        alias: ["perms"],
        info: "placeholder",
        function: function (player: Player, message: string) {
          system.runTimeout(() => listIslandPerms(player), 2);
        },
      },
      {
        alias: ["expand"],
        info: "Increases your island's size.",
        function: function (player: Player, message: string) {
          system.runTimeout(() => islandExpand(player), 2);
        },
      },
      {
        alias: ["info", "i"],
        info: "Shows info for your island.",
        function: function (player: Player, message: string) {
          let island = message.split("info ")[1];
          if (!islandDB.get(island)) island = playerDB.get(player.id).island;
          if (!island) {
            sendError(player, `Island is invalid.`, PREFIX.island);
            return;
          }
          function islandInfo(player: Player, island: string) {
            const idata = islandDB.get(island);
            // Level Data
            let points = idata.points;
            let level = xpToLevel(points);
            let pointsNeeded = levelToXp(level - 1);
            let pointsBefore = levelToXp(level - 2);
            pointsBefore = level > 1 ? pointsBefore : 0;
            // Status
            let status = "§aOPEN";
            if ((idata.status = false)) status = "§6CLOSED";
            if (!world.getPlayers({ name: idata.owner })[0])
              status = "§cOFFLINE";
            const gui = new ActionFormData();
            gui.title(`Island Info`);
            const info = [
              `§aIsland: §f${island}`,
              `§bOwner: §f${idata.owner}`,
              `§6Level: §e${level} §7/ §gPoints: §2(§a${
                points - pointsBefore
              }§2/§a${pointsNeeded - pointsBefore}§2)`,
              `§dSize: §u(§f${idata.size} §dx §f${idata.size}§u)`,
              `§gFunds: §f$${formatNumber(idata.funds as number)}`,
              `§cMembers: §f${
                idata.members.length > 0 ? idata.members : "§7..."
              }`,
              `§9Status: §l§f[§r ${status} §f§l]§r`,
              `§dLimits:\n §8- §6Lava: §8[§f${idata.limits.lava}§7/§f${idata.limits.maxLava}§8]\n §8- §aCrops: §8[§f${idata.limits.crops}§7/§f${idata.limits.maxCrops}§8]\n §8- §cSpawners: §8[§f${idata.limits.spawners}§7/§f${idata.limits.maxSpawners}§8]\n`,
            ];
            let infoStr = "\n";
            for (let i of info) {
              infoStr = infoStr + " " + i + `\n`;
            }
            gui.body(infoStr);
            gui.button("Submit");
            gui.show(player);
          }
          system.runTimeout(() => islandInfo(player, island), 2);
        },
      },
      {
        alias: ["deposit", "donate", "d"],
        info: "Adds to an island's funds.",
        function: function (player: Player, message: string) {
          function islandDonate(
            player: Player,
            island: string,
            amount: number
          ) {
            let idata = islandDB.get(island);
            let pdata = playerDB.get(player.id);
            if (amount > pdata.coins) {
              sendError(
                player,
                `Insufficient balance to deposit.`,
                PREFIX.island
              );
              return;
            }
            pdata.coins -= amount;
            idata.funds += amount;
            playerDB.set(player.id, pdata);
            islandDB.set(island, idata);
            sendAlert(
              player,
              `§eDeposited §c$${formatNumber(
                amount
              )} §eto island funds. (§6Balance: §g$${formatNumber(
                idata.funds
              )}§e)`,
              PREFIX.island
            );
          }
          let arg = message.split(" ")[2];
          let arg2 = message.split(" ")[3];
          if (arg && Number(arg) > 0)
            islandDonate(player, playerDB.get(player.id).island, Number(arg));
          else if (islandDB.get(arg) && arg2 && Number(arg2) > 0)
            islandDonate(player, arg, Number(arg2));
          else {
            sendError(
              player,
              `Invalid format.\n§cFormat: §e-is deposit [§gisland§7*§e] [§gamount§e]\n§8*§7Island is optional, will default to your island.`,
              PREFIX.island
            );
          }
        },
      },
      {
        alias: ["withdraw", "with", "w"],
        info: "Removes from your island's funds.",
        function: function (player: Player, message: string) {
          function islandDonate(
            player: Player,
            island: string,
            amount: number
          ) {
            let idata = islandDB.get(island);
            let pdata = playerDB.get(player.id);
            if (amount > idata.funds) {
              sendError(
                player,
                `Insufficient balance to withdraw.`,
                PREFIX.island
              );
              return;
            }
            idata.funds -= amount;
            pdata.coins += amount;
            islandDB.set(island, idata);
            playerDB.set(player.id, pdata);
            sendAlert(
              player,
              `§eWithdrawn §a$${formatNumber(
                amount
              )} §efrom island funds. (§6Balance: §g$${formatNumber(
                idata.funds
              )}§e)`,
              PREFIX.island
            );
          }
          let arg = message.split(" ")[2];
          if (arg && Number(arg) > 0)
            islandDonate(player, playerDB.get(player.id).island, Number(arg));
          else {
            sendError(
              player,
              `Invalid format.\n§cFormat: §e-is deposit [§gisland§7*§e] [§gamount§e]\n§8*§7Island is optional, will default to your island.`,
              PREFIX.island
            );
          }
        },
      },
    ],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["shop"],
    info: "Opens the Shop UI.",
    function: function (player: Player, message: string) {
      system.runTimeout(() => {
        OpenShop(player);
      }, 2);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["testshop"],
    info: "Opens the Beta Shop UI.",
    function: function (player: Player, message: string) {
      system.runTimeout(() => {
        OpenShopBeta(player);
      }, 2);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["buy"],
    info: "Shortcut to buy from shop.",
    function: function (player: Player, message: string) {
      // Format: -buy {item}:{data} {amount}
      const inv = (<EntityInventoryComponent>player.getComponent("inventory"))
        .container;
      let item = message.split(":")[0].split(" ")[1];
      let data = 0;
      if (message.includes(":")) {
        data = Number(message.split(":")[1].split(" ")[0]);
        if (!(data > 0)) {
          sendError(
            player,
            `Invalid format: Data must be greater than zero.\n§cFormat: §e-buy [§gitem§e]:[§gdata§e] [§gamount§e]`,
            PREFIX.shop
          );
          return;
        }
      }
      let optionData = ShopItems.find(
        (x) => x.item == item && (x.data ?? 0) == data
      );
      if (!optionData || item == "air") {
        sendError(
          player,
          `This item cannot be purchased from the shop.`,
          PREFIX.shop
        );
        return;
      }
      let amount = Number(message.split(" ")[2]);
      if (!(amount > 0)) {
        sendError(
          player,
          `Invalid format: Amount must be greater than zero.\n§cFormat: §e-buy [§gitem§e] [§gamount§e]`,
          PREFIX.shop
        );
        return;
      }
      let pdata = playerDB.get(player.id);
      let coins = pdata.coins;
      let name = optionData.name ?? formatItemName(optionData.item);
      if (inv && inv.emptySlotsCount == 0) {
        sendError(player, `Your inventory is full.`, PREFIX.shop);
        return;
      } else {
        let price = optionData.price;
        if (coins < price * amount) {
          sendError(player, `You cannot afford this transaction.`, PREFIX.shop);
          return;
        } else {
          pdata.coins = pdata.coins - price * amount;
          playerDB.set(player.id, pdata);
          if (optionData.ditem) {
            const binv = (<BlockInventoryComponent>(
              overworld
                .getBlock(optionData.ditem[0] as Vector)
                ?.getComponent("inventory")
            )).container;
            let it = binv?.getItem(optionData.ditem[1] as number)?.clone();
            if (!it) return;
            it.amount = amount;
            if (inv) inv.addItem(it);
          } else
            player.runCommandAsync(
              `give @s ${optionData.item} ${amount} ${optionData.data ?? 0}`
            );
          sendAlert(
            player,
            `§eBought §7${name} §8x${amount} §f§l-> §r§4-§c$${formatNumber(
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
        }
      }
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["sell", "sellhand", "sh"],
    info: "Shortcut to sell to shop.",
    function: function (player: Player, message: string) {
      // Format: -buy {item}:{data} {amount}
      let holdInv = <EntityEquippableComponent>(
        player.getComponent("equippable")
      );
      let item = holdInv.getEquipment(EquipmentSlot.Mainhand);
      if (!item) {
        sendError(
          player,
          `You must hold the item you want to sell.`,
          PREFIX.shop
        );
        return;
      }
      let amount = item.amount;
      let optionData = ShopItems.find((x) => x.item == item?.typeId.slice(10));
      if (!optionData) {
        sendError(player, `This item cannot be sold.`, PREFIX.shop);
        return;
      }
      let pdata = playerDB.get(player.id);
      let name = optionData.name ?? formatItemName(optionData.item);
      let total = Math.floor(optionData.sell * amount);
      let getItem = getItemAmount(player, optionData.item, false);
      if (getItem <= amount) amount = getItem;
      if (amount == 0) {
        sendAlert(player, `§cInsufficient item to sell.`, PREFIX.shop);
        return;
      } else {
        pdata.coins = pdata.coins + total;
        playerDB.set(player.id, pdata);
        holdInv.setEquipment(EquipmentSlot.Mainhand);
        sendAlert(
          player,
          `§aSold §7${name} §8x${amount} §f§l-> §r§2+§a$${formatNumber(total)}`,
          PREFIX.shop
        );
        system.runTimeout(() => {
          player.playSound(`note.iron_xylophone`, { volume: 1, pitch: 1 });
          player.playSound(`note.iron_xylophone`, { volume: 1, pitch: 2 });
        }, 2);
      }
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["enchant", "ench"],
    info: "Vanilla enchants an item.",
    function: function (player: Player, message: string) {
      VanillaEnchItem(
        player,
        message.split(" ")[1],
        Number(message.split(" ")[2])
      );
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["enchants", "enchantments"],
    info: "Opens the enchantment shop.",
    function: function (player: Player, message: string) {
      system.runTimeout(() => {
        ShopTabEnchantments(
          `Enchantments`,
          `item.book.page_turn`,
          101,
          EnchantEntries,
          player,
          false
        );
      }, 2);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["spawn", "lobby", "hub"],
    info: "Warps you to the server lobby.",
    function: function (player: Player, message: string) {
      player.teleport(new Vector(0.5, 91, 0.5));
      sendAlert(player, `§aWarped to §eSpawn§a.`, PREFIX.server);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["warp", "warps"],
    info: "Teleports you to the specified warp location.",
    function: function (player: Player, message: string) {
      let PAGE_LENGTH = 7;
      let args = commands.find((x) => {
        return x.alias.includes("warp");
      })?.arguments;
      if (!args) return;
      sendError(
        player,
        `§cUse §e-warp list [§gpage: 1-${Math.ceil(
          args.length / PAGE_LENGTH
        )}§e] §cfor a list of available warps.`,
        PREFIX.server
      );
    },
    arguments: [
      {
        alias: ["list"],
        info: "Shows a list of available warps.",
        function: function (player: Player, message: string) {
          let PAGE_LENGTH = 7;
          let args = commands.find((x) => {
            return x.alias.includes("warp");
          })?.arguments;
          if (!args) return;
          let page = Number(message.split(" ")[2]);
          if (!message.split(" ")[2]) page = 1;
          if (
            !(page > 0) ||
            Math.floor(page - 1) > args?.length / PAGE_LENGTH ||
            Math.floor(page) < 1
          ) {
            sendError(
              player,
              `§cInvalid format: Try using §e-warp list [§gpage: 1-${Math.ceil(
                args.length / PAGE_LENGTH
              )}§e] §cinstead.`,
              PREFIX.server
            );
            return;
          }
          let list = args
            .filter((x) => {
              return x.info != "";
            })
            .sort((a, b) => a.alias[0].localeCompare(b.alias[0]))
            .slice(
              page * PAGE_LENGTH - PAGE_LENGTH,
              Math.min(page * PAGE_LENGTH, args.length)
            )
            .map((x) => {
              return `§f- §d${x.alias[0]} §8// §7${x.info}`;
            })
            .toString()
            .replace(/,/g, "\n");
          player.sendMessage(`§u============ §l§5Warps:§r §u============`);
          player.sendMessage(list);
          player.sendMessage(`§u============ §d-- ${page} --§r §u============`);
          player.playSound(`random.pop2`, { pitch: 1.5 });
        },
      },
      {
        alias: ["spawn", "lobby", "hub"],
        info: "Warps you to the server lobby.",
        function: function (player: Player, message: string) {
          player.teleport(new Vector(0.5, 91, 0.5));
          sendAlert(player, `§aWarped to §eSpawn§a.`, PREFIX.server);
        },
      },
    ],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["itemstore", "it", "ic"],
    info: "External item storage.",
    function: function (player: Player, message: string) {},
    arguments: [
      {
        alias: ["upload", "up"],
        info: "",
        function: function (player: Player, message: string) {
          if (!ItemIds.includes(`minecraft:${message.split(" ")[2]}`))
            sendError(
              player,
              `§cInvalid format: Item must be registered (e.g. emerald).\n§cFormat: §e-it upload [§gitem§e] [§gamount§e]`,
              PREFIX.server
            );
          let amount = Number(message.split(" ")[3]);
          if (!message.split(" ")[3]) amount = 32767;
          if (!(amount > 0))
            sendError(
              player,
              `Invalid format: Amount must be greater than zero.\n§cFormat: §e-it upload [§gitem§e] [§gamount§e]`,
              PREFIX.server
            );
          else exportToCloud(player, message.split(" ")[2], amount);
        },
      },
      {
        alias: ["download", "down"],
        info: "",
        function: function (player: Player, message: string) {
          if (!ItemIds.includes(`minecraft:${message.split(" ")[2]}`))
            sendError(
              player,
              `Invalid format: Item must be registered (e.g. emerald).\n§cFormat: §e-it download [§gitem§e] [§gamount§e]`,
              PREFIX.server
            );
          else if (!(Number(message.split(" ")[3]) > 0))
            sendError(
              player,
              `Invalid format: Amount must be greater than zero.\n§cFormat: §e-it download [§gitem§e] [§gamount§e]`,
              PREFIX.server
            );
          else
            importFromCloud(
              player,
              message.split(" ")[2],
              Number(message.split(" ")[3])
            );
        },
      },
      {
        alias: ["info"],
        info: "",
        function: function (player: Player, message: string) {
          infoInHand(player);
        },
      },
      {
        alias: ["list"],
        info: "",
        function: function (player: Player, message: string) {
          listFromCloud(player, message);
        },
      },
    ],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["statistic", "stat"],
    permission: COMMAND_PERMS.ADMIN,
    info: "Sets player stats.",
    function: function (player: Player, message: string) {
      // Allowed modifiers: 'add' | 'set' | 'remove'
      let mod = message.split(" ")[1];
      if (!["add", "set", "remove"].includes(mod)) {
        sendError(
          player,
          `Invalid modifier.\n§cFormat: §e-stat [§gset §6| §gadd §6| §gremove§e] [§astat§e] <§gplayer§e> [§gvalue§e]`,
          PREFIX.server
        );
        return;
      }
      let setPlayer = world.getPlayers({ name: message.split('"')[1] })[0];
      if (!message.includes('"'))
        setPlayer = world.getPlayers({ name: message.split(" ")[3] })[0];
      if (!setPlayer) {
        sendError(
          player,
          `Player does not exist.\n§cFormat: §e-stat [§gset §6| §gadd §6| §gremove§e] [§astat§e] <§gplayer§e> [§gvalue§e]`,
          PREFIX.server
        );
        return;
      }
      let pdata = playerDB.get(setPlayer.id);
      let stat = message.split(" ")[2];
      if (!pdata[stat]) {
        sendError(
          player,
          `Invalid statistic '§4${stat}§c'.\n§cFormat: §e-stat [§gset §6| §gadd §6| §gremove§e] [§astat§e] <§gplayer§e> [§gvalue§e]`,
          PREFIX.server
        );
        return;
      }
      let amount = Number(message.split('"')[2].split(" ")[1]);
      if (!message.includes('"')) amount = Number(message.split(" ")[4]);
      if (!(amount > 0)) {
        sendError(
          player,
          `Invalid amount.\n§cFormat: §e-stat [§gset §6| §gadd §6| §gremove§e] [§astat§e] <§gplayer§e> [§gvalue§e]`,
          PREFIX.server
        );
        return;
      }
      if (mod == "add") pdata[stat] = pdata[stat] + amount;
      else if (mod == "set") pdata[stat] = amount;
      else if (mod == "remove") pdata[stat] = pdata[stat] - amount;
      sendAlert(
        player,
        `§a${mod.charAt(0).toUpperCase() + mod.slice(1)} §c${formatNumber(
          amount
        )} §ato §d${stat} §afor §e${setPlayer.name}§a.`,
        PREFIX.server
      );
      playerDB.set(setPlayer.id, pdata);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["islandadmin", "isadmin"],
    permission: COMMAND_PERMS.ADMIN,
    info: "Sets island stats.",
    function: function (player: Player, message: string) {
      // Allowed modifiers: 'add' | 'set' | 'remove'
      let mod = message.split(" ")[1];
      if (!["add", "set", "remove"].includes(mod)) {
        sendError(
          player,
          `Invalid modifier.\n§cFormat: §e-isadmin [§gset §6| §gadd §6| §gremove§e] [§astat§e] <§gisland§e> [§gvalue§e]`,
          PREFIX.server
        );
        return;
      }
      let island = message.split(" ")[3];
      let idata = islandDB.get(island);
      if (!idata) {
        sendError(
          player,
          `Island does not exist.\n§cFormat: §e-isadmin [§gset §6| §gadd §6| §gremove§e] [§astat§e] <§gisland§e> [§gvalue§e]`,
          PREFIX.server
        );
        return;
      }
      let stat = message.split(" ")[2];
      if (!idata[stat] && idata[stat] != 0) {
        sendError(
          player,
          `Invalid statistic '§4${stat}§c'.\n§cFormat: §e-isadmin [§gset §6| §gadd §6| §gremove§e] [§astat§e] <§gisland§e> [§gvalue§e]`,
          PREFIX.server
        );
        return;
      }
      let value = message.split(" ")[4];
      if (!value) {
        sendError(
          player,
          `Invalid value.\n§cFormat: §e-isadmin [§gset §6| §gadd §6| §gremove§e] [§astat§e] <§gisland§e> [§gvalue§e]`,
          PREFIX.server
        );
        return;
      }
      if (mod == "add" && !Number.isNaN(value))
        idata[stat] = Number(idata[stat]) + Number(value);
      else if (mod == "set") idata[stat] = value;
      else if (mod == "remove" && !Number.isNaN(value))
        idata[stat] = Number(idata[stat]) - Number(value);
      sendAlert(
        player,
        `§a${
          mod.charAt(0).toUpperCase() + mod.slice(1)
        } §c${value} §ato §d${stat} §afor §e${island}§a.`,
        PREFIX.server
      );
      islandDB.set(island, idata);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
];

// CHAT COMMAND HANDLER

world.beforeEvents.chatSend.subscribe((data) => {
  const player = data.sender;
  let msg = data.message;
  if (msg.startsWith("-")) {
    data.cancel = true;
    parseCommand(player, msg, "chat");
  }
});

// SIGN COMMAND HANDLER
world.afterEvents.entityHitBlock.subscribe((data) => {
  let sign = <BlockSignComponent>data.hitBlock.getComponent("sign");
  if (sign && sign.getText()?.includes("-")) {
    let signText = sign.getText() ?? "";
    const player = <Player>data.damagingEntity;
    if (signText.startsWith("§")) signText = signText.slice(2);
    else sign.setText(`§d${signText}`);
    parseCommand(player, signText, "sign");
  }
});

// COMMAND PARSING
function parseCommand(player: Player, msg: string, source: "chat" | "sign") {
  const cmd = commands.find((x) =>
    x.alias.includes(msg.slice(1).split(" ")[0].toLowerCase())
  );
  if (cmd?.allowSigns == false && source == "sign") return;
  if (
    !cmd ||
    (cmd.permission == COMMAND_PERMS.ADMIN && player.isOp() == false)
  ) {
    system.run(() => {
      sendError(
        player,
        `§e${
          msg.split(" ")[0]
        }§c is not a registered command.\nUse §a-help§c to see a list of all available commands.`,
        PREFIX.server
      );
    });
    return;
  } else {
    if (msg.includes(" ") && cmd.arguments.length > 0) {
      const getArg = cmd.arguments.find((x) =>
        x.alias.includes(msg.split(" ")[1].toLowerCase())
      );
      if (!getArg) {
        system.run(() => {
          sendError(
            player,
            `'${msg.split(" ")[1]}' is not a valid argument at '${msg}'.`,
            PREFIX.server
          );
        });
        return;
      } else {
        system.run(() => {
          getArg.function(player, msg);
        });
      }
    } else
      system.run(() => {
        cmd.function(player, msg);
      });
    if (cmd.closeChat == true && source == "chat") {
      player.runCommandAsync(`damage @s 0 entity_attack`);
    }
  }
}
