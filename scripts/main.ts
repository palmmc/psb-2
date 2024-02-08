import { JsonDatabase } from "./database";
import {
  BlockInventoryComponent,
  BlockSignComponent,
  Enchantment,
  EnchantmentTypes,
  EntityEquippableComponent,
  EntityInventoryComponent,
  EquipmentSlot,
  ItemStack,
  ItemTypes,
  Player,
  TicksPerSecond,
  Vector,
  Vector3,
  system,
  world,
} from "@minecraft/server";
import {
  ISLAND_GENERATOR,
  islandCreator,
  testValidName,
} from "./island/create";

// SCRIPT MODULES

import "./island/create";
import "./island/manage";
import "./island/permissions";
import "./systems/telepathy";
import "./systems/miscellaneous";
import "./systems/events";
import { formatItemName } from "./economy/itemcloud";
import "./economy/vending";
import "./economy/shop";
import "./systems/npc";
import "./economy/casino";
import "./systems/generators";
import "./systems/fishing";
import "./systems/spawner";
import "./systems/relic";
import "./custom_enchants/enchantHandler";
import "./custom_enchants/customEnchants";
import { CATEGORY, OpenShopBeta, ShopItems, ShopTabBeta } from "./economy/shop";
import {
  MAX_SIZE,
  UPGRADE_SIZE,
  getIslandOn,
  islandExpand,
  islandInfo,
  islandManage,
  islandUserUI,
  lockIsland,
  visitIsland,
  visitIslandUI,
  warpIsland,
} from "./island/manage";
import {
  ISLAND_ROLES,
  islandEditPerms,
  islandInvite,
} from "./island/permissions";
import {
  cropLevels,
  levelToXp,
  xpToLevel,
  xpUntilNextLevel,
} from "./island/levels";
import {
  ActionFormData,
  ActionFormResponse,
  MessageFormData,
  ModalFormData,
} from "@minecraft/server-ui";
import { ChestFormData } from "./chest-ui/forms";
import { Enchant } from "./custom_enchants/enchantHandler";
import {
  CE_RARITY,
  CHARMS,
  EnchantSlot,
  giveBookCE,
  giveCharm,
  giveOpenCE,
} from "./custom_enchants/customEnchants";
import { auctionMenu } from "./economy/auctionhouse";
import { Generator, genItems, genType } from "./systems/generators";
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
  else return x.toString();
}
export function shortFormatNumber(x: number) {
  if (x < 1000) return x;
  if (x < 999999) return `${Number(x / 1000).toFixed(1)}K`;
  else if (x < 999999999) return `${Number(x / 1000000).toFixed(1)}M`;
  else if (x < 999999999999) return `${Number(x / 1000000000).toFixed(1)}B`;
  else if (x < 999999999999999)
    return `${Number(x / 1000000000000).toFixed(1)}T`;
  else return x;
}
export function formatTime(s: number) {
  return (
    Math.floor(s / 3600).toString() +
    new Date(s * 1000).toISOString().slice(13, 19)
  );
}

export function returnTime(time: number) {
  let years = Math.max(Math.floor(time / 31536e6), 0);
  let days = Math.max(Math.floor(time / 864e5) % 365, 0);
  let hours = Math.max(Math.floor(time / 36e5) % 24, 0);
  let minutes = Math.max(Math.floor(time / 6e4) % 60, 0);
  let seconds = Math.max(Math.floor(time / 1e3) % 60, 0);
  return `${years ? years + "y " : ""}${days ? days + "d " : ""}${
    hours ? hours + "h " : ""
  }${minutes ? minutes + "m " : ""}${
    seconds ? seconds + "s" : Math.max(years, days, hours, minutes) ? "" : "0s"
  }`.trim();
}
export function nameToID(playerName?: string, id?: string) {
  if (id) return (playerDB.get(id) ?? {}).name;
  if (playerName) {
    for (const [key, value] of playerDB.entries()) {
      if (value.name.toLowerCase() === playerName.toLowerCase()) return key;
    }
    return undefined;
  }
  return undefined;
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
var playerDB: any = undefined;
var islandDB: any = undefined;
var generatorDB: any = undefined;
world.afterEvents.worldInitialize.subscribe((data) => {
  system.runTimeout(() => {
    world.sendMessage("Loading Data...");
    playerDB = new JsonDatabase("playerDB", world);
    islandDB = new JsonDatabase("islandDB", world);
    generatorDB = new JsonDatabase("generatorDB", world);
  }, 180);
});

/*
let player = world.getPlayers()[0];
let pdata = playerDB.get(player.id);
pdata.island = "ToddlersUnite";
playerDB.set(player.id, pdata);

let idata: Island = islandDB.get(pdata.island);
idata.operator = {
  name: player.name,
  id: player.id,
  permissions: ISLAND_ROLES.guest.permissions,
};
idata.owners = new Array();
idata.owners.push({
  name: player.name,
  id: player.id,
  permissions: ISLAND_ROLES.guest.permissions,
});
islandDB.set(pdata.island, idata)
*/

// ISLAND CLASS DEFINITIONS

export interface IslandMember {
  name: string;
  id: string;
  permissions: MemberPermissions;
}

export interface IslandOwner extends IslandMember {
  name: string;
  id: string;
  permissions: MemberPermissions;
}

export interface MemberPermissions {
  break: boolean;
  place: boolean;
  interact: boolean;
  attack: boolean;
  container: boolean;
  mine: boolean;
  farm: boolean;
  build: boolean;
}

export interface IslandLimits {
  oregen: { amount: number; max: number };
  autominer: { amount: number; max: number };
  spawner: { amount: number; max: number };
  crop: { amount: number; max: number };
  homes: { amount: number; max: number };
  members: { amount: number; max: number };
  owners: { amount: number; max: number };
  hoppers: { amount: number; max: number };
}

interface IslandHome {
  name: string;
  location: WorldLocation;
}

interface WorldLocation {
  x: number;
  y: number;
  z: number;
}

export class Island {
  public name: string;
  public spawn: WorldLocation;
  public owners: Array<IslandOwner>;
  public operator: IslandOwner;
  public members: Array<IslandMember>;
  public banned: Array<string>;
  public size: number;
  public points: number;
  public notifyLevel: number;
  public funds: number;
  public limits: IslandLimits;
  public homes: Array<IslandHome>;
  public status: boolean;

  constructor(
    name: string,
    spawn: Vector | Vector3,
    owner: IslandOwner,
    status: boolean
  ) {
    this.name = name;
    this.spawn = { x: spawn.x, y: spawn.y, z: spawn.z };
    this.owners = [owner];
    this.operator = owner;
    this.members = new Array();
    this.banned = new Array();
    this.size = 16;
    this.points = 0;
    this.notifyLevel = 0;
    this.funds = 0;
    this.limits = {
      oregen: { amount: 0, max: 5 },
      autominer: { amount: 0, max: 2 },
      spawner: { amount: 0, max: 0 },
      crop: { amount: 0, max: 100 },
      hoppers: { amount: 0, max: 2 },
      homes: { amount: 0, max: 3 },
      members: { amount: 0, max: 3 },
      owners: { amount: 1, max: 2 },
    };
    this.homes = new Array();
    this.status = status;
  }
}

export const IslandMethods = {
  setName: function setName(island: Island, name: string) {
    island.name = name;
    IslandMethods.updateData(island);
  },

  setSpawn: function setSpawn(
    island: Island,
    location: Vector | Vector3
  ): Vector | Vector3 {
    island.spawn = location;
    IslandMethods.updateData(island);
    return island.spawn;
  },

  addMember: function addMember(
    island: Island,
    player: Player,
    permissions: MemberPermissions
  ) {
    island.members.push({
      name: player.name,
      id: player.id,
      permissions: permissions,
    });
    IslandMethods.updateData(island);
  },

  removeMember: function removeMember(
    island: Island,
    id: string
  ): boolean | Error {
    let member = island.members.find((x) => x.id == id);
    if (!member) return new Error("Player is not an existing member.");
    island.members.splice(island.members.indexOf(member), 1);
    IslandMethods.updateData(island);
    return true;
  },

  banPlayer: function banPlayer(island: Island, player: Player) {
    island.banned.push(player.id);
    IslandMethods.updateData(island);
  },

  unbanPlayer: function unbanPlayer(
    island: Island,
    player: Player
  ): boolean | Error {
    let ban = island.banned.splice(island.banned.indexOf(player.id), 1);
    IslandMethods.updateData(island);
    return true;
  },

  addOwner: function addOwner(
    island: Island,
    player: Player,
    permissions?: MemberPermissions
  ) {
    island.owners.push({
      name: player.name,
      id: player.id,
      permissions: permissions ?? ISLAND_ROLES.guest.permissions,
    });
    let pdata = playerDB.get(player.id);
    pdata.oldisland = pdata.island;
    pdata.island = island.name;
    playerDB.set(player.id, pdata);
    IslandMethods.updateData(island);
  },

  removeOwner: function removeOwner(
    island: Island,
    id: string
  ): boolean | Error {
    let owner = island.owners.find((x) => x.id == id);
    if (!owner) return new Error("Player is not an existing owner.");
    island.owners.splice(island.owners.indexOf(owner), 1);
    let pdata = playerDB.get(id);
    pdata.island = pdata.oldisland ?? "";
    playerDB.set(id, pdata);
    IslandMethods.updateData(island);
    return true;
  },

  setOperator: function setOperator(
    island: Island,
    operator: Player,
    permissions?: MemberPermissions
  ) {
    island.operator = {
      name: operator.name,
      id: operator.id,
      permissions: permissions ?? ISLAND_ROLES.guest.permissions,
    };
    IslandMethods.updateData(island);
  },

  getPermission: function getPermission(
    island: Island,
    player: Player,
    permission: keyof MemberPermissions
  ): boolean | undefined {
    if (island.members.length == 0) return undefined;
    let member = island.members.find((x) => x.id == player.id);
    return member ? member.permissions[permission] : undefined;
  },

  increaseSize: function increaseSize(island: Island): number | Error {
    island.size + UPGRADE_SIZE <= MAX_SIZE
      ? (island.size += UPGRADE_SIZE)
      : new Error("Island has reached maximum size.");
    IslandMethods.updateData(island);
    return island.size;
  },

  decreaseSize: function decreaseSize(island: Island): number | Error {
    island.size - UPGRADE_SIZE <= 0
      ? new Error("Island size must be more than zero.")
      : (island.size -= UPGRADE_SIZE);
    IslandMethods.updateData(island);
    return island.size;
  },

  addPoints: function addPoints(island: Island, amount: number): number {
    island.points += amount;
    IslandMethods.updateData(island);
    return island.points;
  },

  removePoints: function removePoints(island: Island, amount: number): number {
    island.points -= amount;
    IslandMethods.updateData(island);
    return island.points;
  },

  addFunds: function addFunds(island: Island, amount: number): number {
    island.funds += amount;
    IslandMethods.updateData(island);
    return island.funds;
  },

  removeFunds: function removeFunds(island: Island, amount: number) {
    island.funds -= amount;
    IslandMethods.updateData(island);
    return island.funds;
  },

  addLimit: function addLimit(
    island: Island,
    property: keyof IslandLimits,
    amount: number
  ): number {
    let ret =
      island.limits[property].amount + amount > island.limits[property].max
        ? -2
        : (island.limits[property].amount =
            island.limits[property].amount + amount);
    IslandMethods.updateData(island);
    return ret;
  },

  removeLimit: function removeLimit(
    island: Island,
    property: keyof IslandLimits,
    amount: number
  ): number {
    let ret =
      island.limits[property].amount - amount >= 0
        ? (island.limits[property].amount =
            island.limits[property].amount - amount)
        : -2;
    IslandMethods.updateData(island);
    return ret;
  },

  increaseLimit: function increaseLimit(
    island: Island,
    property: keyof IslandLimits,
    amount: number
  ): number {
    island.limits[property].max = island.limits[property].max + amount;
    IslandMethods.updateData(island);
    return island.limits[property].max;
  },

  decreaseLimit: function decreaseLimit(
    island: Island,
    property: keyof IslandLimits,
    amount: number
  ): number | Error {
    island.limits[property].max - amount >= 0
      ? (island.limits[property].max = island.limits[property].max - amount)
      : new Error("Value cannot be less than 0.");
    IslandMethods.updateData(island);
    return island.limits[property].max;
  },

  addHome: function addHome(
    island: Island,
    name: string,
    location: Vector | Vector3
  ) {
    island.homes.push({ name: name, location: location });
    IslandMethods.updateData(island);
  },

  removeHome: function removeHome(
    island: Island,
    name: string
  ): boolean | Error {
    let home = island.homes.find((x) => x.name == name);
    if (!home) return new Error("Home does not exist.");
    island.homes.splice(island.homes.indexOf(home), 1);
    IslandMethods.updateData(island);
    return true;
  },

  toggleStatus: function toggleStatus(island: Island): boolean {
    island.status == true ? (island.status = false) : (island.status = true);
    IslandMethods.updateData(island);
    return island.status;
  },

  isInBounds: function isInBounds(
    island: Island,
    location: Vector | Vector3
  ): boolean {
    let spawn = island.spawn;
    return Math.floor(
      Math.sqrt(
        Math.pow(spawn.x - location.x, 2) + Math.pow(spawn.z - location.z, 2)
      )
    ) <= island.size &&
      Math.abs(location.y - spawn.y) < 32 + Math.min(island.size, 64) &&
      location.y >= -16
      ? true
      : false;
  },

  updateData: function updateData(island: Island): boolean {
    return islandDB.set(island.name, island) ? true : false;
  },
};

/*
BIG FRIENDLY BUTTON (RESET)
*/

/*
let player = world.getPlayers()[0].id;
let pdata = playerDB.get(player);
let idata = islandDB.delete(pdata.island);
pdata.island = "";
playerDB.set(player, pdata);
*/

/*
let island: Island = islandDB.get("Tester");
island.members = [];
IslandMethods.updateData(island);

system.runTimeout(() => {
  let player = world.getPlayers()[0].id;
  let pdata = playerDB.get(player);
  pdata.island = "ToddlersUnite";
  playerDB.set(player, pdata);
}, 10);
*/

/*
GOOD LUCK!
*/

// DEFINTIIONS

export const PREFIX = {
  server: "§l§f[§r§l§dPalm§uSB§r§f§l]§r >>§r",
  island: "§l§f[§r§e§lIsland§r§f§l]§r >>§r",
  shop: "§l§f[§r§l§bShop§r§f§l]§r >>§r",
  ce: "§l§8[§r§l§cBlacksmith§r§8§l]§r >>§r",
  transfer: "§l§2[§aTransfer§2]§r >>§r",
  relic: "§l§f[§r§c§lRelic§r§f§l]§r >>§r",
  casino: "§l§f[§r§c§lCasino§r§f§l]§r >>§r",
  fish: "§l§f[§r§b§lFishing§r§f§l]§r >>§r",
};
const ItemIds = ItemTypes.getAll().map((x) => {
  return x.id;
});
const overworld = world.getDimension("overworld");

// SIDEBAR RUNTIME

system.runInterval(() => {
  for (let player of world.getPlayers()) {
    if (player.name == "PalmSkyblock") continue;
    addScore("time", player, 2);

    // Fetch island info.
    let pdata = playerDB.get(player.id);
    let coins = pdata.coins;
    let island = getIslandOn(player);
    let sidebarText = ``;
    if (player.hasTag("pref:no_sidebar")) continue;
    if (player.hasTag("pref:minimal_sidebar")) {
      sidebarText = `\n\n §7|§f ${
        world.getPlayers().length
      }/10 §7| §f ${TicksPerSecond} §7| §e ${shortFormatNumber(
        pdata.gems ?? 0
      )} §7|\n\n§g §aUser §7» §f${
        player.name.length > 15 ? player.name.slice(0, 15) + "..." : player.name
      }\n §eBal. §7»  §f$${formatNumber(coins)}  §a${shortFormatNumber(
        player.getTotalXp()
      )}\n§g §6Time Played §7» §f${formatTime(getScore("time", player))}`;
      let owner = island?.operator.name;
      if (island && owner) {
        let points = island.points;
        let level = xpToLevel(points);
        let pointsNeeded = levelToXp(level - 1);
        let pointsBefore = levelToXp(level - 2);
        pointsBefore = level > 1 ? pointsBefore : 0;
        sidebarText += `\n §l§6│§r §eIsland §7» §f${
          (island.name.length > 11
            ? island.name.slice(0, 11) + "..."
            : island.name) ?? "-is create"
        }\n §l§6│§r §2Level §7» §f${level} §2(§f${shortFormatNumber(
          points - pointsBefore
        )}§2/§f${shortFormatNumber(pointsNeeded - pointsBefore)}§2)\n`;
      }
    } else if (player.hasTag("pref:mining_mode")) {
      sidebarText = `\n\n §7|§f ${
        world.getPlayers().length
      }/10 §7| §f ${TicksPerSecond} §7| §e ${shortFormatNumber(
        pdata.gems ?? 0
      )} §7|\n\n§g §aUser §7» §f${
        player.name.length > 15 ? player.name.slice(0, 15) + "..." : player.name
      }\n §eBal. §7»  §f$${formatNumber(coins)}  §a${shortFormatNumber(
        player.getTotalXp()
      )}\n§g §6Time Played §7» §f${formatTime(getScore("time", player))}\n`;
      let item = player
        .getComponent("equippable")
        ?.getEquipment(EquipmentSlot.Mainhand);
      if (item) {
        let speed = 100;
        let fortune = 100;
        let dura = item.getComponent("durability");
        let damage = 0;
        let color = "§2";
        if (dura) {
          damage = Math.floor(
            (1 - (dura?.damage ?? 0) / (dura?.maxDurability ?? 0)) * 100
          );
          if (damage < 5) {
            color = "§c";
            if (player.getItemCooldown("alert") == 0) {
              sendAlert(player, `§cYour tool is reaching low durability.`);
              player.startItemCooldown("alert", 20);
            }
          } else if (damage < 20) color = "§6";
          else if (damage < 40) color = "§e";
          else if (damage < 70) color = "§a";
        }
        let brisk = Enchant.getEnchant(item, "brisk");
        if (brisk && brisk.level > 0)
          speed += Math.floor(brisk.level * 0.8) * 20;
        let trove = Enchant.getEnchant(item, "trove");
        if (trove && trove.level > 0)
          fortune += ((Math.floor(trove.level / 2) + 1) / 2) * 100;
        sidebarText += `\n §b${
          item.nameTag ?? formatItemName(item.typeId)
        }§r\n §l§c│§r §9Durability §7» ${color}${damage}%%\n §l§c│§r §2Speed §7» §a${speed}%%\n §l§c│§r §3Fortune §7» §b${fortune}%%\n`;
      }
    } else {
      sidebarText = `\n\n §7|§f ${
        world.getPlayers().length
      }/10 §7| §f ${TicksPerSecond} §7| §e ${shortFormatNumber(
        pdata.gems ?? 0
      )} §7|\n\n§g §aUser §7» §f${
        player.name.length > 15 ? player.name.slice(0, 15) + "..." : player.name
      }\n §eBal. §7»  §f$${formatNumber(coins)}  §a${shortFormatNumber(
        player.getTotalXp()
      )}\n§g §6Time Played §7» §f${formatTime(getScore("time", player))}`;
      let owner = island?.operator.name;
      if (island && owner) {
        let points = island.points;
        let level = xpToLevel(points);
        let pointsNeeded = levelToXp(level - 1);
        let pointsBefore = levelToXp(level - 2);
        pointsBefore = level > 1 ? pointsBefore : 0;
        sidebarText += `\n\n §e§l[ §r§bIsland §9Info §l§e]§r\n §l§6│§r §eIsland §7» §f${
          (island.name.length > 11
            ? island.name.slice(0, 11) + "..."
            : island.name) ?? "-is create"
        }\n §l§6│§r §6Owner §7» §f${
          owner.length > 11 ? owner.slice(0, 11) + "..." : owner
        }\n §l§6│§r §2Level §7» §f${level} §2(§f${shortFormatNumber(
          points - pointsBefore
        )}§2/§f${shortFormatNumber(
          pointsNeeded - pointsBefore
        )}§2)\n §l§6│§r §eSize §7» §d(§f${island.size} §dx §f${
          island.size
        }§d)\n §l§6│§r §6Funds §7» §f$${formatNumber(island.funds)}`;
      }
      sidebarText += `\n §f> §7Use -help for info §f<\n`;
    }

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
  MOD: 1,
  ADMIN: 2,
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
        function: warpIsland,
      },
      {
        alias: ["tp", "teleport", "visit"],
        info: "Teleports you to another player's island.",
        function: function (player: Player, message: string) {
          let islandName = message.split(" ")[2];
          let island: Island = islandDB.get(islandName);
          if (!island) {
            system.runTimeout(() => visitIslandUI(player), 2);
            return;
          }
          if (island.operator.name == player.name) {
            sendError(
              player,
              `You cannot visit your own island.\n§4Use: §e-is go`,
              PREFIX.server
            );
            return;
          }
          let owners = world.getPlayers({
            excludeNames: island.owners.map((x) => x.name),
          });
          if (owners.length == world.getPlayers().length) {
            sendError(
              player,
              `The island owner must be online to visit it.`,
              PREFIX.server
            );
            return;
          }
          visitIsland(
            player,
            island,
            world.getPlayers({ name: island.operator.name })[0]
          );
        },
      },
      {
        alias: ["randomvisit", "rvisit", "randomtp", "rtp"],
        info: "Teleports you to a random player's island.",
        function: function (player: Player, message: string, fails?: number) {
          let visitPlayer =
            world.getPlayers()[
              randomIntFromInterval(0, world.getPlayers().length - 1)
            ];
          let island: Island = islandDB.get(
            playerDB.get(visitPlayer.id).island
          );
          if (!island) {
            if ((fails ?? 0) > 2) warpIsland(player);
            this.function(player, message, (fails ?? 0) + 1);
            return;
          }
          if (island.owners.find((x) => x.id == player.id)) {
            warpIsland(player);
            return;
          }
          visitIsland(
            player,
            island,
            world.getPlayers({ name: island.operator.name })[0]
          );
        },
      },
      {
        alias: ["edituser", "edit", "setperms", "editperms"],
        info: "Opens the permissions editor.",
        function: function (player: Player, message: string) {
          system.runTimeout(() => islandEditPerms(player), 2);
        },
      },
      {
        alias: ["invite", "inv"],
        info: "Opens the island inviter.",
        function: function (player: Player, message: string) {
          system.runTimeout(() => islandInvite(player), 2);
        },
      },
      {
        alias: ["member"],
        info: "Shows all islands a user is member of.",
        function: function (player: Player, message: string) {
          let user = player;
          let username = message.split(" ")[2];
          if (message.includes('"')) username = message.split('"')[1];
          if (username)
            user = world.getPlayers({ name: username })[0] ?? player;
          system.runTimeout(() => islandUserUI(user, player), 2);
        },
      },
      {
        alias: ["leave"],
        info: "Leaves an island you are member of.",
        function: function (player: Player, message: string) {
          let island = message.split(" ")[2];
          if (!island) {
            sendError(
              player,
              `Invalid format.\n§4Use: §e-is leave §g<name>`,
              PREFIX.server
            );
            return;
          }
          let idata: Island | undefined = islandDB.get(island);
          if (!idata) {
            sendError(player, `Island does not exist.`, PREFIX.island);
            return;
          }
          if (idata.operator.id == player.id) {
            sendError(
              player,
              `You cannot leave your own island.`,
              PREFIX.island
            );
            return;
          }
          if (idata.owners.find((x) => x.id == player.id)) {
            if (IslandMethods.removeOwner(idata, player.id) == true) {
              sendAlert(
                player,
                `§cYou have left the §e${idata.name} §cisland.`,
                PREFIX.island
              );
              return;
            }
          }
          if (IslandMethods.removeMember(idata, player.id) == true) {
            sendAlert(
              player,
              `§cYou have left the §e${idata.name} §cisland.`,
              PREFIX.island
            );
            return;
          } else {
            sendError(
              player,
              `You are not a member of this island.`,
              PREFIX.island
            );
          }
        },
      },
      {
        alias: ["lock"],
        info: "Toggles the status of your island.",
        function: lockIsland,
      },
      {
        alias: ["expand"],
        info: "Increases your island's size.",
        function: function (player: Player, message: string) {
          system.runTimeout(() => islandExpand(player), 2);
        },
      },
      {
        alias: ["manage"],
        info: "Opens the island manager.",
        function: function (player: Player, message: string) {
          system.runTimeout(() => islandManage(player), 2);
        },
      },
      {
        alias: ["info", "i", "limits"],
        info: "Shows info for your island.",
        function: function (player: Player, message: string) {
          let island = message.split("info ")[1];
          system.runTimeout(
            () =>
              islandInfo(
                player,
                islandDB.get(island) ??
                  islandDB.get(playerDB.get(player.id).island)
              ),
            2
          );
        },
      },
      {
        alias: ["setspawn"],
        info: "Sets your island spawn.",
        function: function (player: Player, message: string) {
          let island: Island | undefined = islandDB.get(
            playerDB.get(player.id).island
          );
          if (!island) return;
          if (!IslandMethods.isInBounds(island, player.location)) {
            sendError(
              player,
              `You cannot set your island spawn here.`,
              PREFIX.island
            );
            return;
          }
          let oldSpawn = island.spawn;
          let oldBedrock = overworld.getBlock({
            x: island.spawn.x,
            y: island.spawn.y - 1,
            z: island.spawn.z,
          });
          if (!oldBedrock) return;
          oldBedrock.setType("air");
          player.runCommandAsync(`setblock ~ ~-1 ~ bedrock`);
          IslandMethods.setSpawn(island, {
            x: Math.floor(player.location.x),
            y: Math.floor(player.location.y),
            z: Math.floor(player.location.z),
          });
          sendAlert(
            player,
            `§aIsland §bspawn§a has been set at your location.`,
            PREFIX.island
          );
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
            let idata: Island = islandDB.get(island);
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
            IslandMethods.addFunds(idata, amount);
            playerDB.set(player.id, pdata);
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
            let idata: Island = islandDB.get(island);
            let pdata = playerDB.get(player.id);
            if (amount > idata.funds) {
              sendError(
                player,
                `Insufficient balance to withdraw.`,
                PREFIX.island
              );
              return;
            }
            IslandMethods.removeFunds(idata, amount);
            pdata.coins += amount;
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
      {
        alias: ["crops"],
        info: "Shows all crop levels.",
        function: function (player: Player) {
          let message = `§f---=======- §e[ §6Crops §e] §f-=======---`;
          let crops = [
            "Beetroot",
            "Wheat",
            "Carrot",
            "Potato",
            "Berries",
            "Pumpkin",
            "Melon",
          ];
          let idata: Island = islandDB.get(playerDB.get(player.id).island);
          for (let i = 0; i < cropLevels.length; i++) {
            let cropName = crops[i];
            let cropInfo = cropLevels[i];
            message =
              message +
              `\n§e - §a${cropName}§e: §6§l< §r${
                xpToLevel(idata.points) >= cropInfo.levelReq ? "§b" : "§c"
              }Level ${cropInfo.levelReq} §l§6>§r`;
          }
          message = message + `\n§f---======- §e----   ---- §f-======---`;
          player.sendMessage(message);
        },
        arguments: [],
        allowSigns: true,
        closeChat: true,
      },
      {
        alias: ["addhome"],
        info: "Adds an island home.",
        function: function (player: Player, message: string) {
          let island: Island | undefined = islandDB.get(
            playerDB.get(player.id).island
          );
          if (!island) return;
          let name = message.split(" ")[2];
          if (!name) {
            sendError(player, `Format: §e-is addhome §g<name>`, PREFIX.island);
            return;
          }
          if (testValidName(player, name, true) == false) return;
          if (!IslandMethods.isInBounds(island, player.location)) {
            sendError(
              player,
              `You cannot create an island home here.`,
              PREFIX.island
            );
            return;
          }
          if (island.homes.length >= island.limits.homes.max) {
            sendError(
              player,
              `Island has reached the homes limit.\n§dUse §e-is expand §dto increase it.`,
              PREFIX.island
            );
            return;
          }
          if (island.homes.length > 0)
            if (island.homes.find((x) => x.name == name)) {
              sendError(
                player,
                `Home by that name already exists.`,
                PREFIX.island
              );
              return;
            }
          IslandMethods.addLimit(island, "homes", 1);
          IslandMethods.addHome(island, name, {
            x: Math.floor(player.location.x),
            y: Math.floor(player.location.y),
            z: Math.floor(player.location.z),
          });
          sendAlert(
            player,
            `§aIsland home §d${name}§a has been created at your location.`,
            PREFIX.island
          );
        },
      },
      {
        alias: ["delhome"],
        info: "Deletes an island home.",
        function: function (player: Player, message: string) {
          let island: Island | undefined = islandDB.get(
            playerDB.get(player.id).island
          );
          if (!island) return;
          let name = message.split(" ")[2];
          if (!name) {
            sendError(player, `Format: §e-is delhome §g<name>`, PREFIX.island);
            return;
          }
          if (!island.homes.find((x) => x.name == name)) {
            sendError(player, `Home does not exist.`, PREFIX.island);
            return;
          }
          IslandMethods.removeLimit(island, "homes", 1);
          IslandMethods.removeHome(island, name);
          sendAlert(
            player,
            `§cIsland home §d${name}§c has been removed at your location.`,
            PREFIX.island
          );
        },
      },
      {
        alias: ["clearhomes"],
        info: "Clears all island homes.",
        function: function (player: Player, message: string) {
          let island: Island | undefined = islandDB.get(
            playerDB.get(player.id).island
          );
          if (!island) return;
          island.homes = [];
          IslandMethods.updateData(island);
          sendAlert(player, `§cIsland homes have been cleared.`, PREFIX.island);
        },
      },
      {
        alias: ["home"],
        info: "Warps to an island home.",
        function: function (player: Player, message: string) {
          let island: Island | undefined = islandDB.get(
            playerDB.get(player.id).island
          );
          if (!island) return;
          let name = message.split(" ")[2];
          if (!name) {
            sendError(player, `Format: §e-is home §g<name>`, PREFIX.island);
            return;
          }
          let home = island.homes.find((x) => x.name == name);
          if (!home) {
            sendError(player, `Home does not exist.`, PREFIX.island);
            return;
          }
          player.teleport({
            x: home.location.x + 0.5,
            y: home.location.y + 1,
            z: home.location.z + 0.5,
          });
          sendAlert(
            player,
            `§aYou have been teleported to your §d${home.name} §aisland home.`,
            PREFIX.server
          );
        },
      },
      {
        alias: ["homes"],
        info: "Lists all island homes.",
        function: function (player: Player, message: string) {
          let island: Island | undefined = islandDB.get(
            playerDB.get(player.id).island
          );
          if (!island) return;
          if (island.homes.length == 0) {
            sendError(
              player,
              `You do not have any island homes.`,
              PREFIX.island
            );
            return;
          }
          let list = island.homes
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((x) => {
              return `§e${x.name}`;
            })
            .toString()
            .replace(/,/g, "§6, ");
          sendAlert(player, `§e§l§dHomes: §r${list}`, PREFIX.island);
        },
      },
    ],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["marketplace", "ah", "auction", "auctionhouse", "market"],
    info: "Auction Market",
    function: function (player: Player, message: string) {
      system.runTimeout(() => auctionMenu(player), 2);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["shop"],
    info: "Opens the Shop UI.",
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
      let optionData = ShopItems.find(
        (x) =>
          x.item ==
          (item?.typeId.includes("palm")
            ? item?.typeId
            : item?.typeId.slice(10))
      );
      if (!optionData || optionData.sell == 0) {
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
    alias: ["compress", "compressinv", "condenseall", "ca"],
    info: "Compresses inventory ores into blocks.",
    function: function (player: Player, message: string) {
      if (player.getItemCooldown("compress") > 0) {
        sendError(player, "§cThis action is on cooldown.");
        return;
      }
      player.startItemCooldown("compress", 600);
      let blocks = [
        ["coal", "coal_block"],
        ["iron_ingot", "iron_block"],
        ["lapis_lazuli", "lapis_block"],
        ["gold_ingot", "gold_block"],
        ["diamond", "diamond_block"],
        ["emerald", "emerald_block"],
        ["copper_ingot", "copper_block"],
        ["gold_nugget", "gold_ingot"],
      ];
      let c = 0;
      for (let block of blocks) {
        let count = getItemAmount(player, block[0], true);
        c += count;
        if (count < 9) {
          player.runCommandAsync(`give @s ${block[0]} ${count}`);
        } else {
          player.runCommandAsync(
            `give @s ${block[1]} ${Math.floor(count / 9)}`
          );
          player.runCommandAsync(`give @s ${block[0]} ${count % 9}`);
        }
      }
      sendAlert(player, `§eCompressed §8x§7${c} §bores §einto §6blocks§e!`);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["repair", "fix", "mend"],
    info: "Shortcut to sell to shop.",
    function: function (player: Player, message: string) {
      system.runTimeout(() => {
        let holdInv = <EntityEquippableComponent>(
          player.getComponent("equippable")
        );
        let item = holdInv.getEquipment(EquipmentSlot.Mainhand);
        if (!item || item.isStackable == true) {
          sendError(player, `This item cannot be repaired.`, PREFIX.shop);
          return;
        }
        let dura = item.getComponent("durability");
        if (!dura || !dura.damage) {
          sendError(player, `This item cannot be repaired.`, PREFIX.shop);
          return;
        }
        let price = dura.damage * 7;
        let gui = new ChestFormData("light_blue");
        gui.title("Repair Item");
        gui.pattern([0, 0], ["xxxxxxxxx", "xooo_ooox", "xxxxxxxxx"], {
          x: {
            data: {
              itemName: "",
              itemDesc: [],
              enchanted: false,
              stackSize: 1,
            },
            iconPath: "textures/blocks/glass_white.png",
          },
          o: {
            data: {
              itemName: "",
              itemDesc: [],
              enchanted: false,
              stackSize: 1,
            },
            iconPath: "textures/blocks/glass_gray.png",
          },
        });
        gui.button(
          13,
          "§bRepair Item",
          [`§9Price: §6$§e${price}`],
          item.typeId,
          1,
          true
        );
        gui.show(player).then((result) => {
          if (result.canceled || result.selection != 13) return;
          let pdata = playerDB.get(player.id);
          if (price > pdata.coins) {
            sendError(
              player,
              `Insufficient funds. §4(§e$${formatNumber(price)}§4)`,
              PREFIX.shop
            );
            return;
          }
          if (!dura || !item) return;
          pdata.coins = pdata.coins - price;
          playerDB.set(player.id, pdata);
          dura.damage = 0;
          holdInv.setEquipment(EquipmentSlot.Mainhand, item);
          sendAlert(
            player,
            `§3Repaired §b${
              item.nameTag ?? formatItemName(item.typeId.slice(10))
            } §8(§c${price / 7}§8) §3for §e$${formatNumber(price)}§3.`,
            PREFIX.server,
            `block.grindstone.use`
          );
        });
      }, 2);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["sign", "signature"],
    info: "Signs an item with your name.",
    function: function (player: Player, message: string) {
      let holdInv = <EntityEquippableComponent>(
        player.getComponent("equippable")
      );
      let item = holdInv.getEquipment(EquipmentSlot.Mainhand);
      if (
        !item ||
        item.isStackable == true ||
        !item.getComponent("durability")
      ) {
        sendError(player, `You can only sign equipment items.`);
        return;
      }
      if (item.nameTag) {
        sendError(player, `This item has already been signed.`);
        return;
      }
      if (item.typeId.includes("_"))
        item.nameTag = `§r§c${player.name}§f's ${
          formatItemName(item.typeId).split(" ")[1]
        }`;
      else
        item.nameTag = `§r§c${player.name}§f's ${formatItemName(item.typeId)}`;
      holdInv.setEquipment(EquipmentSlot.Mainhand, item);
      sendAlert(
        player,
        `§cSigned §b${formatItemName(item.typeId.slice(10))}§c.`,
        PREFIX.server,
        `item.book.page_turn`
      );
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["piggybank", "pb", "enderchest", "ec"],
    info: "Opens your piggy bank.",
    function: function (player: Player, message: string) {
      type PiggySlot = {
        typeId: string;
        amount: number;
        nameTag?: string;
        lore?: string[];
      };
      function getSlotCost(slot: number) {
        return (slot - 3) * 5;
      }
      system.runTimeout(() => {
        let gui = new ChestFormData("pink");
        gui.title("§uPiggy§5§lBank");
        let pdata = playerDB.get(player.id);
        //pdata.piggyslots = 5;
        //playerDB.set(player.id, pdata);
        //return;
        if (pdata.piggybank) {
          for (let i = 0; i < 27; i++) {
            let slot: PiggySlot = pdata.piggybank[i];
            let cost = getSlotCost(pdata.piggyslots);
            if (!slot) {
              if (i >= pdata.piggyslots) {
                gui.button(
                  i,
                  "§4Locked Slot",
                  [`§6§lUnlock:§r  §e${cost}`],
                  "textures/blocks/glass_red.png"
                );
              } else
                gui.button(
                  i,
                  "§cEmpty Slot",
                  [`§d§lCLICK TO ADD`],
                  "textures/blocks/glass_pink.png"
                );
              continue;
            }
            gui.button(
              i,
              slot.nameTag ?? formatItemName(slot.typeId),
              slot.lore?.concat([`§c§lCLICK TO REMOVE`]),
              slot.typeId,
              slot.amount
            );
          }
        } else {
          pdata.piggybank = [];
          pdata.piggyslots = 5;
          for (let i = 0; i < 27; i++) {
            let cost = getSlotCost(pdata.piggyslots);
            if (i >= pdata.piggyslots) {
              gui.button(
                i,
                "§4Locked Slot",
                [`§6§lUnlock:§r  §e${cost}`],
                "textures/blocks/glass_red.png"
              );
            } else
              gui.button(
                i,
                "§cEmpty Slot",
                [`§d§lCLICK TO ADD`],
                "textures/blocks/glass_pink.png"
              );
          }
        }
        gui.show(player).then((result) => {
          if (result.canceled) return;
          if ((result.selection ?? 0) >= pdata.piggyslots) {
            let cost = getSlotCost(result.selection ?? 0);
            if (pdata.gems < cost) {
              sendError(player, `Insufficient gems.`);
              return;
            }
            pdata.gems = pdata.gems - cost;
            pdata.piggyslots = pdata.piggyslots + 1;
            playerDB.set(player.id, pdata);
            sendAlert(
              player,
              `§l§6Upgraded§r §uPiggy§l§5Bank§e§r §8(§c${
                pdata.piggyslots - 1
              } §f-> §a${pdata.piggyslots}§8)`
            );
            return;
          }
          let item: PiggySlot = pdata.piggybank[result.selection ?? 0];
          let inv = player.getComponent("inventory")?.container;
          if (item) {
            let itemStack = new ItemStack(item.typeId, item.amount);
            itemStack.nameTag = item.nameTag;
            itemStack.setLore(item.lore);
            pdata.piggybank.splice(result.selection ?? 0, 1);
            playerDB.set(player.id, pdata);
            inv?.addItem(itemStack);
            sendAlert(
              player,
              `§cRemoved §b${
                item.nameTag ?? formatItemName(item.typeId)
              } §8x§7${item.amount} §efrom §uPiggy§l§5Bank§e§r.`
            );
          } else {
            let gui = new ChestFormData("large");
            gui.title("Select an Item");
            for (let i = 0; i < 36; i++) {
              let item = inv?.getItem(i);
              if (!item) continue;
              gui.button(
                i,
                item.nameTag ?? formatItemName(item.typeId),
                item.getLore().concat([`§d§lCLICK TO ADD`]),
                item.typeId,
                item.amount
              );
            }
            gui.show(player).then((result) => {
              if (result.canceled) return;
              let item = inv?.getItem(result.selection ?? 0);
              if (!item) return;
              pdata.piggybank.push({
                typeId: item.typeId,
                amount: item.amount,
                nameTag: item.nameTag,
                lore: item.getLore(),
              } as PiggySlot);
              playerDB.set(player.id, pdata);
              inv?.setItem(result.selection ?? 0);
              sendAlert(
                player,
                `§aAdded §b${
                  item.nameTag ?? formatItemName(item.typeId)
                } §8x§7${item.amount} §eto §uPiggy§l§5Bank§e§r.`
              );
            });
          }
        });
      }, 2);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["celist"],
    info: "Displays a list of Custom Enchants.",
    function: function (player: Player) {
      system.runTimeout(() => {
        let gui = new ChestFormData("magenta");
        gui.title("§l§eCustom §6Enchants");
        let i = 0;
        for (const key of Object.keys(Enchant.enchants)) {
          //@ts-ignore
          let enchant = Enchant.enchants[key];
          if (!enchant || !enchant.description) continue;
          gui.button(
            i,
            `${enchant.display}`,
            [
              `§8${enchant.description}`,
              `§dRarity: ${
                CE_RARITY[enchant.rarity as keyof typeof CE_RARITY]
              }`,
              `§9Level: §bI§3-§b${toRomanNumeral(enchant.maxLevel)}`,
              `§eSlot: §6${formatItemName(enchant.type[0].split("_")[1])}`,
            ],
            "enchanted_book",
            1,
            true
          );
          i++;
        }
        gui.show(player).then((result) => {
          if (result.canceled) return;
          ShopTabBeta(
            `Custom Enchantments`,
            `item.book.page_turn`,
            CATEGORY.cebooks,
            player,
            true
          );
        });
      }, 2);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["pref", "preferences", "settings"],
    info: "Opens the preference settings.",
    function: function preferenceUI(player: Player) {
      const PREFERENCES = [
        {
          name: "Minimal Sidebar",
          description: "Shrinks the sidescreen HUD\nto only essential info.",
          tag: "pref:minimal_sidebar",
        },
        {
          name: "Quieter Mining",
          description: "Silences the xp sound when\nmining ores.",
          tag: "pref:quieter_mining",
        },
        {
          name: "Mining Mode",
          description: "Activates the mining sidebar.",
          tag: "pref:mining_mode",
        },
      ];
      system.runTimeout(() => {
        let gui = new ChestFormData("small");
        gui.title("User Preferences");
        gui.pattern([0, 0], ["xxxxxxxxx", "x_______x", "xxxxxxxxx"], {
          x: {
            data: {
              itemName: "",
              itemDesc: [],
              enchanted: false,
              stackSize: 1,
            },
            iconPath: "textures/blocks/glass_white.png",
          },
        });
        let i = 10;
        for (let p of PREFERENCES) {
          gui.button(
            i,
            `${p.name}`,
            [
              `§8${p.description}`,
              `§9Status: ${player.hasTag(p.tag) ? "§a§lON" : "§c§lOFF"}`,
            ],
            "shulker_box",
            1,
            player.hasTag(p.tag) ? true : false
          );
          i++;
        }
        gui.show(player).then((result) => {
          if (result.canceled || !result.selection) return;
          let pref = PREFERENCES[result.selection - 10];
          player.hasTag(pref.tag)
            ? player.removeTag(pref.tag)
            : player.addTag(pref.tag);
          preferenceUI(player);
        });
      }, 2);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["pay", "givemoney"],
    info: "Allows transfer of funds to another player.",
    function: function (player: Player) {
      function payPlayer(player: Player) {
        let payUI = new ModalFormData();
        let players = world
          .getPlayers()
          .filter((x) => x.name != "PalmSkyblock" && x.name != player.name)
          .map((x) => x.name);
        if (players.length == 0) {
          sendError(player, `§cThere are no other players online.`);
          return;
        }
        payUI.title(`Transfer Currency`);
        payUI.dropdown(`\nSelect a player:`, players);
        payUI.textField(`Amount:`, "200");
        payUI.toggle(`Confirm Transfer`, false);
        payUI.show(player).then((result) => {
          if (!result.formValues || result.canceled) return;
          if ((result.formValues[2] as boolean) === false) {
            sendError(player, `Did not confirm transaction.`, PREFIX.transfer);
            return;
          }
          if (result.formValues[1] && Number.isNaN(result.formValues[2])) {
            sendError(player, `Amount must be numerical.`, PREFIX.transfer);
            return;
          }
          let payPlayer = world.getPlayers({
            name: players[result.formValues[0] as number],
          })[0];
          if (!payPlayer) {
            sendError(
              player,
              `Player is offline or does not exist.`,
              PREFIX.transfer
            );
            return;
          }
          let amount = Number(result.formValues[1]);
          if (amount < 200) {
            sendError(player, `Amount must be at least $200.`, PREFIX.transfer);
            return;
          }
          if (amount > 10000000) {
            sendError(
              player,
              `Amount must be less than $10M.`,
              PREFIX.transfer
            );
            return;
          }
          let pdata = playerDB.get(player.id);
          if (pdata.coins < amount) {
            sendError(
              player,
              `You cannot afford this transaction.`,
              PREFIX.transfer
            );
            return;
          }
          pdata.coins = pdata.coins - amount;
          let paydata = playerDB.get(payPlayer.id);
          paydata.coins = paydata.coins + amount;
          playerDB.set(player.id, pdata);
          playerDB.set(payPlayer.id, paydata);
          sendAlert(
            player,
            `§aSuccessfully transferred §6$${formatNumber(amount)} §ato §b${
              payPlayer.nameTag
            }§a!`,
            PREFIX.transfer,
            `item.book.page_turn`
          );
          sendAlert(
            payPlayer,
            `§b${player.nameTag} §ahas transferred you §6$${formatNumber(
              amount
            )}§a!`,
            PREFIX.transfer,
            `item.book.page_turn`
          );
        });
      }
      system.runTimeout(() => payPlayer(player), 2);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["spawn", "lobby", "hub"],
    info: "Warps you to the server lobby.",
    function: warpLobby,
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["break", "bedrock", "bb"],
    info: "Breaks bedrock you're looking at.",
    function: function (player: Player, message: string) {
      let block = player.getBlockFromViewDirection({ maxDistance: 5 });
      let island = getIslandOn(player);
      if (!island || island?.operator.id != player.id) {
        sendError(player, `§cYou must be §eIsland Owner §cto break that here.`);
        return;
      }
      if (block?.block && block.block.typeId == "minecraft:bedrock") {
        if (
          block.block.location.x == island.spawn.x &&
          block.block.location.z == island.spawn.z
        ) {
          sendError(
            player,
            `§cYou cannot break your island spawn.\n§cUse §e-is setspawn §cinstead.`
          );
          return;
        }
        block.block.setType("air");
        sendAlert(player, `§cBedrock block has been broken.`);
        player
          .getComponent("inventory")
          ?.container?.addItem(new ItemStack("bedrock", 1));
      }
    },
    arguments: [],
    allowSigns: true,
    closeChat: false,
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
        function: warpList,
      },
      {
        alias: ["spawn", "lobby", "hub"],
        info: "Warps you to the server lobby.",
        function: function (player: Player, message: string) {
          warpLobby(player);
        },
      },
      {
        alias: ["blacksmith"],
        info: "Warps you to the blacksmith.",
        function: function (player: Player, message: string) {
          player.camera.fade({
            fadeTime: { fadeInTime: 0.7, holdTime: 1, fadeOutTime: 1 },
          });
          system.runTimeout(() => {
            player.teleport(new Vector(-45.5, 91, -19.5));
            sendAlert(player, `§aWarped to §dBlacksmith§a.`, PREFIX.server);
            player.playSound("note.bell");
          }, 15);
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
    alias: ["resetdata"],
    permission: COMMAND_PERMS.ADMIN,
    info: "Resets player stats.",
    function: function (player: Player, message: string) {
      // Allowed modifiers: 'add' | 'set' | 'remove'
      let setPlayer = world.getPlayers({ name: message.split('"')[1] })[0];
      if (!message.includes('"')) {
        sendError(player, "§cInvalid player.");
        return;
      }
      playerDB.set(setPlayer.id, { coins: 100, island: "" });
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["isadmin", "islandadmin"],
    permission: COMMAND_PERMS.ADMIN,
    info: "Executes an island function as admin.",
    function: function (player: Player, message: string) {
      let island = message.split('"')[1];
      console.warn(island);
      let idata: Island = islandDB.get(island);
      if (!idata) {
        sendError(
          player,
          `Island does not exist.\n§cFormat: §e-isadmin <§gisland§e> [§9function§e]`,
          PREFIX.server
        );
        return;
      }
      console.warn(idata.name);
      let func = message.split(" ")[2];
      let arg1: any = message.split(" ")[3] ?? "";
      let arg2: any = message.split(" ")[4] ?? "";
      if (!arg2) arg1 = Number(arg1);
      else arg2 = Number(arg2);
      if (func == "addPoints") IslandMethods.addPoints(idata, arg1);
      else if (func == "removePoints") IslandMethods.removePoints(idata, arg1);
      else if (func == "addLimit") IslandMethods.addLimit(idata, arg1, arg2);
      else if (func == "removeLimit")
        IslandMethods.removeLimit(idata, arg1, arg2);
      else if (func == "expand") IslandMethods.increaseSize(idata);
      else if (func == "contract") IslandMethods.decreaseSize(idata);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["enchant"],
    permission: COMMAND_PERMS.ADMIN,
    info: "Gives an open CE.",
    function: function (player: Player, msg: string) {
      let mod = msg.split(" ")[1];
      let ench = msg.split(" ")[2];
      let level = Number(msg.split(" ")[3]);
      if (!mod || !ench || !level) return;
      let equip = player.getComponent("equippable");
      let item = equip?.getEquipment(EquipmentSlot.Mainhand);
      if (!item) return;
      if (mod == "add") {
        Enchant.addEnchant(item, ench, level);
        equip?.setEquipment(EquipmentSlot.Mainhand, item);
      } else if (mod == "remove") {
        Enchant.removeEnchant(item, ench);
        equip?.setEquipment(EquipmentSlot.Mainhand, item);
      } else {
        sendError(player, `§cInvalid modifier: '§eadd§c' §4| §c'§eremove§c'.`);
      }
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["giveceopen", "giveopence"],
    permission: COMMAND_PERMS.ADMIN,
    info: "Gives an open CE.",
    function: function (player: Player, msg: string) {
      let ench = msg.split(" ")[1];
      let level = Number(msg.split(" ")[2]);
      if (!ench || !level) return;
      giveOpenCE(player, ench, level);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["givecebook", "givebookce"],
    permission: COMMAND_PERMS.ADMIN,
    info: "Gives an open CE.",
    function: function (player: Player, msg: string) {
      let rarity = msg.split(" ")[1] as keyof typeof CE_RARITY;
      if (!rarity) return;
      giveBookCE(player, rarity, 1);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["givecharm"],
    permission: COMMAND_PERMS.ADMIN,
    info: "Gives a charm.",
    function: function (player: Player, msg: string) {
      let type = msg.split(" ")[1] as keyof typeof CHARMS;
      let rarity = msg.split(" ")[2] as keyof typeof CHARMS.binding;
      if (!rarity) return;
      giveCharm(player, type, rarity, 1);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["creategen"],
    permission: COMMAND_PERMS.ADMIN,
    info: "Artifically constructs generator.",
    function: function (player: Player, msg: string) {
      // -creategen "PalmOnTop" oregen 1:1
      let island: Island | undefined = islandDB.get(msg.split('"')[1]);
      if (!island) return;
      let type = msg.split(" ")[2];
      let speed = msg.split(":")[0];
      speed = speed.slice(speed.length - 1);
      let fortune = msg.split(":")[1];
      let gen = new Generator(
        type as genType,
        {
          speed: Number(speed) - 1,
          fortune: Number(fortune) - 1,
        },
        {
          x: Math.floor(player.location.x),
          y: Math.floor(player.location.y),
          z: Math.floor(player.location.z),
        },
        island.operator.id,
        ""
      );
      // Store generator data.
      let key = JSON.stringify({
        x: gen.location.x,
        y: gen.location.y,
        z: gen.location.z,
      });
      let block = overworld.getBlock(player.location);
      block?.setType(genItems[type as keyof typeof genItems]);
      generatorDB.set(key, gen);
      // Send alert.
      sendAlert(
        player,
        `§ePlaced §b§lGenerator§r\n§9Owner: §a${island.operator.name}`,
        undefined,
        "block.lantern.break",
        0.75
      );
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["macro"],
    permission: COMMAND_PERMS.MOD,
    info: "Checks player for macro.",
    function: function (p: Player, msg: string) {
      let i = 0;
      let total = 0;
      let player = world.getPlayers({ name: msg.split('"')[1] })[0];
      if (!player) {
        sendError(p, `Player does not exist.`);
        return;
      }
      function checkMacro() {
        let elapse = 0;
        let check1 = system.runInterval(() => {
          total++;
          if (
            (player.getVelocity().x == 0 && player.getVelocity().z != 0) ||
            (player.getVelocity().z == 0 && player.getVelocity().x != 0)
          ) {
            console.warn("START");
            system.clearRun(check1);
            let check2 = system.runInterval(() => {
              // Velocity: == 0.2158203125
              elapse++;
              total++;
              if (
                Math.abs(player.getVelocity().x) > 0.21 ||
                Math.abs(player.getVelocity().x) > 0.21
              ) {
                console.warn("RECORD IN PROGRESS");
                system.clearRun(check2);
                let check3 = system.runInterval(() => {
                  elapse++;
                  total++;
                  if (
                    (player.getVelocity().x == 0 &&
                      player.getVelocity().z != 0) ||
                    (player.getVelocity().z == 0 && player.getVelocity().x != 0)
                  ) {
                    console.warn("END");
                    system.clearRun(check3);
                    let time = elapse / 6.66;
                    p.sendMessage(
                      `§eResult: §6${time.toString().substring(0, 5)}s`
                    );
                    i++;
                  }
                }, 3);
              }
            }, 3);
          }
        }, 3);
      }
      checkMacro();
      let m = system.runInterval(() => {
        if (i < 3) checkMacro();
        if (i == 3) {
          system.clearRun(m);
          total /= 6.66;
          p.sendMessage(`§bTotal: §6${total.toString().substring(0, 5)}s`);
        }
      }, 200);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["forcerename"],
    permission: COMMAND_PERMS.ADMIN,
    info: "Sets a player's island name.",
    function: function (player: Player, msg: string) {
      let is = msg.split(" ")[1];
      if (!is) return;
      let island: Island | undefined = islandDB.get(is);
      if (!island) return;
      let name = msg.split(" ")[2];
      if (!name) return;
      for (let owner of island.owners) {
        let odata = playerDB.get(owner.id);
        odata.island = name;
        playerDB.set(owner.id, odata);
      }
      islandDB.delete(island.name);
      IslandMethods.setName(island, name);
      sendAlert(player, `§dIsland has been force renamed.`);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  /*
  {
    alias: ["hoppergoblin"],
    permission: COMMAND_PERMS.ADMIN,
    info: "Sets hopper stats.",
    function: function (p: Player, msg: string) {
      for (let isle of islandDB.entries()) {
        let island: Island = isle[1];
        if (!island.limits.hoppers) {
          island.limits.hoppers = {
            amount: 0,
            max: 2 + Math.floor((island.size - 16) / 8),
          };
          islandDB.set(island.name, island);
        }
      }
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  */
  /*
  {
    alias: ["gemsetter"],
    permission: COMMAND_PERMS.ADMIN,
    info: "Adds gem statistic.",
    function: function (p: Player, msg: string) {
      for (let pdata of playerDB.entries()) {
        pdata[1].gems = 0;
        playerDB.set(pdata[0], pdata[1]);
      }
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  */
];

export function warpLobby(player: Player) {
  player.camera.fade({
    fadeTime: { fadeInTime: 0.7, holdTime: 1, fadeOutTime: 1 },
  });
  system.runTimeout(() => {
    player.teleport(new Vector(0.5, 91, 0.5));
    sendAlert(player, `§aWarped to §eSpawn§a.`, PREFIX.server);
    player.playSound("note.bell");
  }, 15);
}

export function warpList(player: Player, message: string) {
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
}

// CHAT COMMAND HANDLER

world.beforeEvents.chatSend.subscribe((data) => {
  const player = data.sender;
  let msg = data.message;
  data.cancel = true;
  if (msg.startsWith("-")) {
    parseCommand(player, msg, "chat");
  } else {
    system.run(() => {
      let rank = `§7Guest`;
      let color = `§f`;
      if (player.hasTag("role:owner")) {
        rank = "§6Owner";
        color = "§e";
      } else if (player.hasTag("role:manager")) {
        rank = "§9Manager";
      } else if (player.hasTag("role:helper")) {
        rank = "§aHelper";
      } else if (player.hasTag("role:creator")) {
        rank = "§cCC";
      } else if (player.hasTag("role:supporter")) {
        rank = "§dSupporter";
      }
      let idata = islandDB.get(playerDB.get(player.id).island);
      if (!idata) idata = { points: 0, name: "--" };
      world.sendMessage(
        `§7 - §f[§e${xpToLevel(Number(idata.points))}§f] §g${
          idata.name
        } §7[${rank}§7] §f${player.nameTag} §p>> ${color}${msg}`
      );
    });
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
  let mods = ["The Palm Healer", "EpicRedstone"];
  let admins = ["The Palm Healer"];
  if (
    !cmd ||
    (cmd.permission == COMMAND_PERMS.MOD && !mods.includes(player.name)) ||
    (cmd.permission == COMMAND_PERMS.ADMIN && !admins.includes(player.name))
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
