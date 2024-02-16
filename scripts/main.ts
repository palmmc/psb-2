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
import "./systems/moderation";
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
  kickPlayerIsland,
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
import {
  banPlayer,
  clearWarnsPlayer,
  freezePlayer,
  getModerationData,
  getWarnsPlayer,
  mutePlayer,
  removeWarnPlayer,
  unbanPlayer,
  warnPlayer,
} from "./systems/moderation";
import { getGlobalMultiplier } from "./systems/events";
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

export type Tutorial = {
  id: string;
  lines: string[];
};
export function playTutorial(
  player: Player,
  tutorial: Tutorial,
  timer?: number,
  color?: string,
  color2?: string,
  sound?: string
) {
  if (
    player.hasTag("pref:notutorial") ||
    player.hasTag("tutorial:" + tutorial.id)
  )
    return;
  let i = 0;
  let time = 10;
  if (!player.hasTag("inTutorial")) player.addTag("inTutorial");
  else return;
  for (let line of tutorial.lines) {
    system.runTimeout(() => {
      i++;
      player.sendMessage(
        `§l${color ?? "§6"}[§e!${color ?? "§6"}]§r ${color2 ?? "§f"}${line}`
      );
      if (sound) player.playSound(sound);
      else {
        if (randomIntFromInterval(1, 3) == 1)
          player.playSound(`note.hat`, { volume: 0.25 });
        else player.playSound(`note.snare`, { volume: 0.25 });
      }
      if (i == tutorial.lines.length) player.removeTag("inTutorial");
    }, time);
    time += line.length * 1.5 * (timer ?? 1);
  }
  player.addTag("tutorial:" + tutorial.id);
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
  if (!itemId.startsWith("palm:")) itemId = `minecraft:${itemId}`;
  for (let i = 0; i < 36; i++) {
    if (!inventory) return -1;
    let item = inventory.getItem(i);
    if (item?.typeId !== itemId) continue;
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

// USER PERMS
export const USER_PERMS = {
  trainee: ["Nothbeen7008", "EpicRedstone", "The Palm Healer"],
  helpers: ["The Palm Healer", "EpicRedstone"],
  mods: ["The Palm Healer", "EpicRedstone"],
  admins: ["The Palm Healer"],
};
//

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
    island.spawn = { x: location.x, y: location.y, z: location.z };
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
  moderation: "§l§f[§r§c§lBig§7Eyes§r§f§l]§r >>§r",
};
const ItemIds = ItemTypes.getAll().map((x) => {
  return x.id;
});
const overworld = world.getDimension("overworld");

// SIDEBAR RUNTIME

system.runInterval(() => {
  for (let player of world.getPlayers()) {
    if (player.name == "RB Relay") continue;
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
      }\n §eP$ §7»  §f$${formatNumber(coins)}  §a${shortFormatNumber(
        player.getTotalXp()
      )}\n§g §6Time Played §7» §f${formatTime(getScore("time", player))}`;
      let owner = island?.operator.name;
      if (island && owner) {
        let points = island.points;
        let level = xpToLevel(points);
        let pointsNeeded = levelToXp(level - 1);
        let pointsBefore = levelToXp(level - 2);
        pointsBefore = level > 1 ? pointsBefore : 0;
        let pointsDisplay = `§2(§f${shortFormatNumber(
          points - pointsBefore
        )}§2/§f${shortFormatNumber(pointsNeeded - pointsBefore)}§2)`;
        sidebarText += `\n §l§6│§r §eIsland §7» §f${
          (island.name.length > 11
            ? island.name.slice(0, 11) + "..."
            : island.name) ?? "-is create"
        }\n §l§6│§r §2Lvl. §7» §f${level} ${
          pointsDisplay.length > 19
            ? pointsDisplay.slice(0, 19) + ".."
            : pointsDisplay
        }\n`;
      }
    } else if (player.hasTag("pref:mining_mode")) {
      sidebarText = `\n\n §7|§f ${
        world.getPlayers().length
      }/10 §7| §f ${TicksPerSecond} §7| §e ${shortFormatNumber(
        pdata.gems ?? 0
      )} §7|\n\n§g §aUser §7» §f${
        player.name.length > 15 ? player.name.slice(0, 15) + "..." : player.name
      }\n §eP$ §7»  §f$${formatNumber(coins)}  §a${shortFormatNumber(
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
      }\n §eP$ §7»  §f$${formatNumber(coins)}  §a${shortFormatNumber(
        player.getTotalXp()
      )}\n§g §6Time Played §7» §f${formatTime(getScore("time", player))}`;
      let owner = island?.operator.name;
      if (island && owner) {
        let points = island.points;
        let level = xpToLevel(points);
        let pointsNeeded = levelToXp(level - 1);
        let pointsBefore = levelToXp(level - 2);
        pointsBefore = level > 1 ? pointsBefore : 0;
        let pointsDisplay = `§2(§f${shortFormatNumber(
          points - pointsBefore
        )}§2/§f${shortFormatNumber(pointsNeeded - pointsBefore)}§2)`;
        sidebarText += `\n\n §e§l[ §r§bIsland §9Info §l§e]§r\n §l§6│§r §eIsland §7» §f${
          (island.name.length > 11
            ? island.name.slice(0, 11) + "..."
            : island.name) ?? "-is create"
        }\n §l§6│§r §6Owner §7» §f${
          owner.length > 11 ? owner.slice(0, 11) + "..." : owner
        }\n §l§6│§r §2Lvl. §7» §f${level} ${
          pointsDisplay.length > 19
            ? pointsDisplay.slice(0, 19) + ".."
            : pointsDisplay
        }\n §l§6│§r §eSize §7» §d(§f${island.size} §dx §f${
          island.size
        }§d)\n §l§6│§r §6Funds §7» §f$${formatNumber(island.funds)}`;
      }
      sidebarText += `\n §f> §7Use -help for info §f<\n`;
    }

    /*
    const sidebarText = `\n §f⟩ §ediscord.RB Relay.fun §f⟨\n§g⦿ §aUser: §f${
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
  HELPER: 1,
  MOD: 2,
  ADMIN: 3,
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
    alias: ["modhelp", "mhelp"],
    permission: COMMAND_PERMS.MOD,
    info: "Shows a list of available commands.",
    function: function (player: Player, message: string) {
      let PAGE_LENGTH = 7;
      let args = commands.filter((x) => x.permission == COMMAND_PERMS.MOD);
      let page = Number(message.split(" ")[1]);
      if (!message.split(" ")[1]) page = 1;
      else if (
        !(page > 0) ||
        Math.floor(page - 1) > args?.length / PAGE_LENGTH ||
        Math.floor(page) < 1
      ) {
        sendError(
          player,
          `§cInvalid format: Try using §a-modhelp [§2page: 1-${Math.ceil(
            args.length / PAGE_LENGTH
          )}§a] §cinstead.`,
          PREFIX.server
        );
        return;
      }
      let list = args
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
      player.sendMessage(`§f============= §l§2Mod Help:§r §f=============`);
      player.sendMessage(list);
      player.sendMessage(`§f============== §a-- ${page} --§r §f==============`);
      player.playSound(`random.pop2`, { pitch: 1.5 });
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["staffhelp", "shelp"],
    permission: COMMAND_PERMS.HELPER,
    info: "Shows a list of available commands.",
    function: function (player: Player, message: string) {
      let PAGE_LENGTH = 7;
      let args = commands.filter((x) => x.permission == COMMAND_PERMS.HELPER);
      let page = Number(message.split(" ")[1]);
      if (!message.split(" ")[1]) page = 1;
      else if (
        !(page > 0) ||
        Math.floor(page - 1) > args?.length / PAGE_LENGTH ||
        Math.floor(page) < 1
      ) {
        sendError(
          player,
          `§cInvalid format: Try using §a-modhelp [§2page: 1-${Math.ceil(
            args.length / PAGE_LENGTH
          )}§a] §cinstead.`,
          PREFIX.server
        );
        return;
      }
      let list = args
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
      player.sendMessage(`§f============= §l§3Staff Help:§r §f=============`);
      player.sendMessage(list);
      player.sendMessage(`§f============== §a-- ${page} --§r §f==============`);
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
      /*
      {
        alias: ["edituser", "edit", "setperms", "editperms"],
        info: "Opens the permissions editor.",
        function: function (player: Player, message: string) {
          system.runTimeout(() => islandEditPerms(player), 2);
        },
      },
      */
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
        alias: ["chat"],
        info: "Toggles island chat.",
        function: function (player: Player, message: string) {
          let island = message.split(" ")[2];
          if (!island) island = playerDB.get(player.id).island;
          let idata: Island | undefined = islandDB.get(island);
          if (!idata) {
            sendError(
              player,
              `Island is offline or doesn't exist.`,
              PREFIX.island
            );
            return;
          }
          if (
            !idata.owners.find((x) => x.id == player.id) &&
            !idata.members.find((x) => x.id == player.id)
          ) {
            sendError(
              player,
              `You must be a member of an island to use their chat.`,
              PREFIX.island
            );
            return;
          }
          if (player.hasTag(`island:chat:${idata.name}`)) {
            player.removeTag(`island:chat:${idata.name}`);
            sendAlert(player, `§eIsland §dChat §f>> §c§lOFF`, PREFIX.island);
          } else {
            player.addTag(`island:chat:${idata.name}`);
            sendAlert(player, `§eIsland §dChat §f>> §a§lON`, PREFIX.island);
          }
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
          let oldNomads = overworld.getEntities({
            type: "palm:nomad",
            location: island.spawn,
            maxDistance: 128,
          });
          let newLoc = {
            x: Math.floor(player.location.x),
            y: Math.floor(player.location.y),
            z: Math.floor(player.location.z),
          };
          if (oldNomads.length > 0) {
            for (let nomad of oldNomads)
              nomad.teleport(Vector.add(newLoc, new Vector(0.5, 0, 0.5)));
          }
          IslandMethods.setSpawn(island, newLoc);
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
    alias: ["marketplace", "mp", "ah", "auction", "auctionhouse", "market"],
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
    alias: ["tpa", "tpask", "tpaccept"],
    info: "Sends a teleport request.",
    function: function (player: Player, message: string) {
      let tpUser = message.split(" ")[1];
      if (message.includes('"')) tpUser = message.split('"')[1];
      if (!tpUser) {
        let tag = player.getTags().find((x) => x.includes("tpa:"));
        if (!tag) {
          sendError(player, `Found no requests to accept.`);
          return;
        }
        let user = tag.split(":")[1];
        let userPlayer = world.getPlayers({ name: user })[0];
        if (userPlayer) {
          userPlayer.teleport(player.location);
          sendAlert(userPlayer, `§aYour request has been accepted!`);
          sendAlert(player, `§aTeleport request was accepted.`);
        }
        player.removeTag(tag);
        return;
      }
      if (player.getItemCooldown("tpa") > 0) {
        sendError(player, `This action is on cooldown.`);
        return;
      }
      let tpPlayer = world.getPlayers({ name: tpUser })[0];
      if (!tpPlayer) {
        sendError(player, `Player is offline or does not exist.`);
        return;
      }
      if (tpPlayer.hasTag("pref:noTPA")) {
        sendError(player, `Player is not accepting requests at this time.`);
        return;
      }
      player.startItemCooldown("tpa", 1300);
      tpPlayer.addTag(`tpa:${player.name}`);
      sendAlert(player, `§aSent §dteleport §arequest to §e${tpPlayer.name}§a.`);
      sendAlert(
        tpPlayer,
        `§e${player.name} §awould like to §dteleport §ato you.\n§cUse §a-tpaccept §cto accept.`
      );
      system.runTimeout(() => {
        if (!tpPlayer) return;
        if (tpPlayer.hasTag(`tpa:${player.name}`)) {
          tpPlayer.removeTag(`tpa:${player.name}`);
          sendAlert(player, `§cTeleport request has expired.`);
        }
      }, 1200);
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
      let multiplier = getGlobalMultiplier();
      let amount = item.amount;
      let optionData = ShopItems.find(
        (x) =>
          x.item ==
            (item?.typeId.includes("palm")
              ? item?.typeId
              : item?.typeId.slice(10)) && !x.data
      );
      if (!optionData || optionData.sell == 0) {
        sendError(player, `This item cannot be sold.`, PREFIX.shop);
        return;
      }
      let pdata = playerDB.get(player.id);
      let name = optionData.name ?? formatItemName(optionData.item);
      let total = Math.floor(optionData.sell * amount * multiplier);
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
      player.startItemCooldown("compress", 400);
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
          item = holdInv.getEquipment(EquipmentSlot.Mainhand);
          dura = item?.getComponent("durability");
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
      let viewUser = message.split(" ")[1];
      if (message.includes('"')) viewUser = message.split('"')[1];
      let pdata: any;
      let id = player.id;
      if (viewUser && USER_PERMS.mods.includes(player.name)) {
        function getPBUser() {
          for (let vd of playerDB.entries()) {
            if (vd[1].name == viewUser) {
              pdata = vd[1];
              id = vd[0];
              return;
            }
          }
        }
        getPBUser();
        if (!pdata) {
          sendError(player, `No record found for §4${viewUser}§c.`);
          return;
        }
      } else pdata = playerDB.get(player.id);
      type PiggySlot = {
        typeId: string;
        amount: number;
        durability: number;
        nameTag?: string;
        lore?: string[];
      };
      function getSlotCost(slot: number) {
        return (slot - 4) * 5;
      }
      system.runTimeout(() => {
        let gui = new ChestFormData("pink");
        gui.title(
          "§uPiggy§5§lBank" + (id != player.id ? ` §r§5${viewUser}` : "")
        );
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
            playerDB.set(id, pdata);
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
            let dura = itemStack.getComponent("durability");
            if (dura) dura.damage = item.durability;
            pdata.piggybank.splice(result.selection ?? 0, 1);
            playerDB.set(id, pdata);
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
              let damage = 0;
              let durability = item.getComponent("durability");
              if (durability) damage = durability.damage;
              pdata.piggybank.push({
                typeId: item.typeId,
                amount: item.amount,
                durability: damage,
                nameTag: item.nameTag,
                lore: item.getLore(),
              } as PiggySlot);
              playerDB.set(id, pdata);
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
    alias: ["invview", "viewinv"],
    info: "Views a player's inventory.",
    permission: COMMAND_PERMS.MOD,
    function: function (player: Player, message: string) {
      let viewUser = message.split(" ")[1];
      if (message.includes('"')) viewUser = message.split('"')[1];
      let vP = world.getPlayers({ name: viewUser })[0];
      if (!vP) {
        sendError(player, `Player is not online or does not exist.`);
      }
      function viewInv(player: Player, viewP: Player) {
        system.runTimeout(() => {
          let gui = new ChestFormData("large");
          gui.title(`Viewing: §9${viewP.name}`);
          let inv = viewP.getComponent("inventory")?.container;
          if (!inv) return;
          for (let i = 0; i < inv.size; i++) {
            let item = inv.getItem(i);
            if (!item)
              gui.button(
                i,
                "§cEmpty Slot",
                ["§d§lCLICK TO ADD"],
                "textures/blocks/glass_white.png",
                1
              );
            else
              gui.button(
                i,
                item.nameTag ?? formatItemName(item.typeId),
                item.getLore()?.concat([`§c§lCLICK TO REMOVE`]),
                item.typeId,
                item.amount
              );
          }
          gui.show(player).then((result) => {
            if (result.canceled) return;
            let item = inv?.getItem(result.selection ?? 0);
            let pinv = player.getComponent("inventory")?.container;
            if (item && pinv) {
              inv?.setItem(result.selection ?? 0);
              pinv.addItem(item);
              viewInv(player, viewP);
            } else if (pinv) {
              let gui = new ChestFormData("large");
              gui.title("Select an Item");
              for (let i = 0; i < pinv.size; i++) {
                let item = pinv?.getItem(i);
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
                let item = pinv?.getItem(result.selection ?? 0);
                if (!item) return;
                pinv?.setItem(result.selection ?? 0);
                inv?.addItem(item);
                viewInv(player, viewP);
              });
            }
          });
        }, 2);
      }
      viewInv(player, vP);
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
        function CEList(player: Player) {
          let gui = new ChestFormData("magenta");
          gui.title("§l§eCustom §6Enchants");
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
          let slots = [
            EnchantSlot.sword,
            EnchantSlot.pickaxe,
            EnchantSlot.tool,
            EnchantSlot.helmet,
            EnchantSlot.armor,
            EnchantSlot.leggings,
            EnchantSlot.boots,
            EnchantSlot.rod,
          ];
          for (let slot of slots) {
            if (i == 17) i += 5;
            let sitem = slot[slot.length - 1];
            gui.button(
              i++,
              `§9${formatItemName(slot[0].split("_")[1])}`,
              [],
              sitem,
              1,
              true
            );
          }
          gui.show(player).then((result) => {
            if (result.canceled || !result.selection) return;
            let selection = result.selection;
            let slot =
              slots[
                (result.selection > 16 ? (selection -= 5) : selection) - 10
              ];
            if (!slot) return;
            let gui = new ChestFormData("magenta");
            gui.title("§l§eCustom §6Enchants");
            let i = 0;
            for (const key of Object.keys(Enchant.enchants)) {
              //@ts-ignore
              let enchant = Enchant.enchants[key];
              if (!enchant || !enchant.description || enchant.type != slot)
                continue;
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
              if (result.canceled) {
                CEList(player);
                return;
              }
              ShopTabBeta(
                `Custom Enchantments`,
                `item.book.page_turn`,
                CATEGORY.cebooks,
                player,
                true
              );
            });
          });
        }
        CEList(player);
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
          color: "red",
        },
        {
          name: "Quieter Mining",
          description: "Silences the xp sound when\nmining ores.",
          tag: "pref:quieter_mining",
          color: "orange",
        },
        {
          name: "Mining Mode",
          description: "Activates the mining sidebar.",
          tag: "pref:mining_mode",
          color: "yellow",
        },
        {
          name: "Request Denier",
          description: "Disables teleport requests.",
          tag: "pref:noTPA",
          color: "lime",
        },
        {
          name: "Master Gamer",
          description: "Disables tutorials.",
          tag: "pref:notutorial",
          color: "blue",
        },
        {
          name: "No Tips",
          description: "Hides tip messages.",
          tag: "pref:notips",
          color: "magenta",
        },
      ];
      system.runTimeout(() => {
        let gui = new ChestFormData("small");
        gui.title("User Preferences");
        gui.pattern([0, 0], ["x_______x", "x_______x", "x_______x"], {
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
        let slots = [
          1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23,
          24, 25,
        ];
        let i = 0;
        for (let p of PREFERENCES) {
          gui.button(
            slots[i],
            `${p.name}`,
            [
              `§8${p.description}`,
              `§9Status: ${player.hasTag(p.tag) ? "§a§lON" : "§c§lOFF"}`,
            ],
            (p.color ? `${p.color}_` : "") + "shulker_box",
            1,
            player.hasTag(p.tag) ? true : false
          );
          i++;
        }
        gui.show(player).then((result) => {
          if (result.canceled || !result.selection) return;
          let pref = PREFERENCES[slots.indexOf(result.selection ?? 0)];
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
          .filter((x) => x.name != "RB Relay" && x.name != player.name)
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
    alias: ["block"],
    info: "Blocks a player's chat messages.",
    function: function (player: Player, message: string) {
      let blockPlayer = message.split(" ")[1];
      if (message.includes('"')) blockPlayer = message.split('"')[1];
      let bp = world.getPlayers({ name: blockPlayer })[0];
      if (!bp) {
        sendError(player, `Player is not online or does not exist.`);
        return;
      } else if (bp.name == player.name) {
        sendError(player, `You cannot block yourself.`);
        return;
      } else if (USER_PERMS.helpers.includes(bp.name)) {
        sendError(player, `You cannot block this player.`);
        return;
      }
      if (player.hasTag(`block:${bp.name}`)) {
        player.removeTag(`block:${bp.name}`);
        sendAlert(player, `§6Unblocked §c${bp.name}§6 successfully.`);
      } else {
        player.addTag(`block:${bp.name}`);
        sendAlert(player, `§eBlocked §c${bp.name}§e successfully.`);
      }
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
    alias: ["balance", "bal"],
    info: "Shows a player's balance.",
    function: function (player: Player, message: string) {
      let balp = message.split(" ")[1];
      if (message.includes('"')) balp = message.split('"')[1];
      if (!balp) balp = player.name;
      let bdata: any;
      for (let bd of playerDB.values()) {
        if (bd.name == balp) bdata = bd;
      }
      if (!bdata) {
        sendError(player, `No record found for §4${balp}§c.`);
        return;
      }
      let xp =
        world.scoreboard
          .getObjective("offline:xp")
          ?.getScore("o" + bdata.name) ?? 0;
      player.sendMessage(`§b============ §l§3Balance§r §b============`);
      player.sendMessage(`§f - §aPlayer: §2${bdata.name}`);
      player.sendMessage(
        `§f   - §eCoins§f:  §6$§f${formatNumber(bdata.coins)}`
      );
      player.sendMessage(`§f   - §a§lXP§r§f:  §a${formatNumber(xp)}`);
      player.sendMessage(`§f   - §cGems§f:  §e${formatNumber(bdata.gems)}`);
      player.sendMessage(`§b============ §3-- -- --§r §b============`);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["discord", "disc"],
    info: "Invites your to our discord.",
    function: function (player: Player, message: string) {
      sendAlert(
        player,
        `§dJoin our discord!\n§e§lInvite:§r §9discord.gg/y39XTT9zwE`
      );
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["warnupdate", "update"],
    permission: COMMAND_PERMS.ADMIN,
    info: "Warns players of update.",
    function: function (player: Player, message: string) {
      world.sendMessage(
        `${PREFIX.server} §c§lUpdate Warning\n§r§dPalm's §uSkyblock §6is about to §crestart§6 for an §eupdate§c.\n§cPlease wait §41-2§c minutes before rejoining, or you could §4potentially lose progress§c.`
      );
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
      playerDB.set(setPlayer.id, {
        name: player.name,
        coins: 100,
        gems: 5,
        island: "",
      });
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["modmenu", "moderation"],
    permission: COMMAND_PERMS.HELPER,
    info: "Opens the moderation menu.",
    function: function (player: Player, message: string) {
      function modMenu(player: Player) {
        let gui = new ChestFormData("lime");
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
        gui.title("Moderation Menu");
        gui.button(
          11,
          "§bFreeze Player",
          ["§c§lCLICK TO ENACT"],
          "packed_ice",
          1,
          true
        );
        gui.button(
          12,
          "§dMute Player",
          ["§c§lCLICK TO ENACT"],
          "noteblock",
          1,
          true
        );
        gui.button(
          13,
          "§6Warn Player",
          ["§c§lCLICK TO ENACT"],
          "bookshelf",
          1,
          true
        );
        gui.button(
          14,
          "§cBan Player",
          ["§c§lCLICK TO ENACT"],
          "red_wool",
          1,
          true
        );
        gui.button(
          15,
          "§aUnban Player",
          ["§c§lCLICK TO ENACT"],
          "lime_wool",
          1,
          true
        );
        gui.show(player).then((result) => {
          if (result.canceled) return;
          system.runTimeout(() => {
            let players = world
              .getPlayers()
              .filter(
                (x) => x.name != "RB Relay" && !USER_PERMS.mods.includes(x.name)
              );
            if (
              players.length == 0 &&
              [11, 12].includes(result.selection ?? 0)
            ) {
              sendError(
                player,
                "There are no other players online.",
                PREFIX.moderation
              );
              return;
            }
            if (result.selection == 11) {
              let gui = new ModalFormData();
              gui.title("Freeze Player");
              gui.dropdown(
                "Select a Player",
                players.length > 0
                  ? players.map((x) => {
                      return x.name;
                    })
                  : ["No players online."]
              );
              gui.show(player).then((result) => {
                if (result.canceled || !result.formValues) {
                  modMenu(player);
                  return;
                }
                let freezeP = players[result.formValues[0] as number];
                freezePlayer(freezeP) == 2
                  ? sendAlert(
                      player,
                      `§e${freezeP.name} §bhas been frozen.`,
                      PREFIX.moderation
                    )
                  : sendAlert(player, `§e${freezeP.name} §9has been unfrozen.`),
                  PREFIX.moderation;
                return;
              });
            } else if (result.selection == 12) {
              let gui = new ModalFormData();
              gui.title("Mute Player");
              gui.dropdown(
                "Select a Player",
                players.length > 0
                  ? players.map((x) => {
                      return x.name;
                    })
                  : ["No players online."]
              );
              gui.show(player).then((result) => {
                if (result.canceled || !result.formValues) {
                  modMenu(player);
                  return;
                }
                let muteP = players[result.formValues[0] as number];
                mutePlayer(muteP) == 2
                  ? sendAlert(
                      player,
                      `§e${muteP.name} §dhas been muted.`,
                      PREFIX.moderation
                    )
                  : sendAlert(
                      player,
                      `§e${muteP.name} §5has been unmuted.`,
                      PREFIX.moderation
                    );
                return;
              });
            } else if (result.selection == 13) {
              let gui = new ModalFormData();
              gui.title("Warns Menu");
              gui.dropdown(
                "Select a Player",
                players.length > 0
                  ? players.map((x) => {
                      return x.name;
                    })
                  : ["No players online."]
              );
              gui.textField("Enter a Username", "EpicRedstone");
              gui.show(player).then((result) => {
                if (result.canceled || !result.formValues) {
                  modMenu(player);
                  return;
                }
                let warnP = result.formValues[1]
                  ? (result.formValues[1] as string)
                  : players[result.formValues[0] as number];
                let gui = new ChestFormData("lime");
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
                gui.title("Warns Menu");
                gui.button(
                  12,
                  "§aAdd Warn",
                  ["§c§lCLICK TO ENACT"],
                  "lime_dye",
                  1,
                  true
                );
                gui.button(
                  13,
                  "§6View Warns",
                  ["§c§lCLICK TO ENACT"],
                  "orange_dye",
                  1,
                  true
                );
                gui.button(
                  14,
                  "§cRemove Warn",
                  ["§c§lCLICK TO ENACT"],
                  "red_dye",
                  1,
                  true
                );
                gui.show(player).then((result) => {
                  if (result.canceled) {
                    modMenu(player);
                    return;
                  }
                  let warns = getWarnsPlayer(warnP);
                  if (result.selection == 12) {
                    let gui = new ModalFormData();
                    gui.title("Warn Player");
                    gui.textField("Reason", "Rule breaking.");
                    gui.show(player).then((result) => {
                      if (result.canceled || !result.formValues) {
                        modMenu(player);
                        return;
                      }
                      let name = warnP instanceof Player ? warnP.name : warnP;
                      warnPlayer(warnP, result.formValues[0] as string) == 1
                        ? sendAlert(
                            player,
                            `§e${name} §chas been §6warned§c.`,
                            PREFIX.moderation
                          )
                        : sendAlert(
                            player,
                            `§cCould not warn §e${name}§c.`,
                            PREFIX.moderation
                          );
                    });
                  } else if (result.selection == 13) {
                    let list = warns
                      .map((x) => {
                        return `§f- §7[§e${warns.indexOf(x)}§7] §8// §7${
                          x.reason
                        }§8 => ${x.date}`;
                      })
                      .toString()
                      .replace(/,/g, "\n");
                    player.sendMessage(
                      `§7============= §l§cWarns:§r §7=============`
                    );
                    player.sendMessage(list);
                    player.sendMessage(
                      `§7============ §c-- --- --§r §7============`
                    );
                    player.playSound(`random.pop2`, { pitch: 1.5 });
                  } else if (result.selection == 14) {
                    if (!USER_PERMS.mods.includes(player.name)) {
                      sendError(
                        player,
                        `Insufficient permissions.\n§4Required: §2Moderator`,
                        PREFIX.moderation
                      );
                      return;
                    }
                    let gui = new ModalFormData();
                    gui.title("Remove Warning");
                    gui.dropdown(
                      "Select Warning",
                      warns.map((x) => x.reason)
                    );
                    gui.toggle("Clear All", false);
                    gui.show(player).then((result) => {
                      if (result.canceled || !result.formValues) {
                        modMenu(player);
                        return;
                      }
                      let name = warnP instanceof Player ? warnP.name : warnP;
                      if ((result.formValues[1] as boolean) == true) {
                        clearWarnsPlayer(warnP) == 1
                          ? sendAlert(
                              player,
                              `§6Cleared warnings from §e${name}§6.`,
                              PREFIX.moderation
                            )
                          : sendAlert(
                              player,
                              `§cCould not clear warnings for §e${name}§c.`,
                              PREFIX.moderation
                            );
                        return;
                      }
                      removeWarnPlayer(warnP, result.formValues[0] as number) ==
                      1
                        ? sendAlert(
                            player,
                            `§6Removed warning from §e${name}§6.`,
                            PREFIX.moderation
                          )
                        : sendAlert(
                            player,
                            `§cCould not remove warning §e${name}§c.`,
                            PREFIX.moderation
                          );
                    });
                  }
                });
              });
            } else if (result.selection == 14) {
              if (!USER_PERMS.mods.includes(player.name)) {
                sendError(
                  player,
                  `Insufficient permissions.\n§4Required: §2Moderator`,
                  PREFIX.moderation
                );
                return;
              }
              let gui = new ModalFormData();
              gui.title("Ban Player");
              gui.dropdown(
                "Select a Player",
                players.length > 0
                  ? players.map((x) => {
                      return x.name;
                    })
                  : ["No players online."]
              );
              gui.textField("Enter a Username", "EpicRedstone");
              gui.textField("Duration (d:h:m)", "0");
              gui.textField("Reason", "Rule breaking.");
              gui.toggle("Can Appeal", true);
              gui.show(player).then((result) => {
                if (result.canceled || !result.formValues) {
                  modMenu(player);
                  return;
                }
                let timeStr = result.formValues[2] as string;
                let time =
                  Number(timeStr.split(":")[0]) * 1440 +
                  Number(timeStr.split(":")[1]) * 60 +
                  Number(timeStr.split(":")[2]);
                if (Number.isNaN(time)) {
                  sendError(player, "Invalid timestamp.", PREFIX.moderation);
                  return;
                }
                if (result.formValues[1]) {
                  banPlayer(
                    result.formValues[1] as string,
                    time,
                    result.formValues[3] as string,
                    result.formValues[4] as boolean
                  );
                  return;
                } else {
                  banPlayer(
                    players[result.formValues[0] as number],
                    time,
                    result.formValues[3] as string,
                    result.formValues[4] as boolean
                  );
                  return;
                }
              });
            } else if (result.selection == 15) {
              if (!USER_PERMS.mods.includes(player.name)) {
                sendError(
                  player,
                  `Insufficient permissions.\n§4Required: §2Moderator`,
                  PREFIX.moderation
                );
                return;
              }
              let gui = new ModalFormData();
              gui.title("Unban Player");
              gui.textField("Enter a Username", "EpicRedstone");
              gui.show(player).then((result) => {
                if (result.canceled || !result.formValues) {
                  modMenu(player);
                  return;
                }
                let unbanP = result.formValues[0] as string;
                unbanPlayer(unbanP) == 1
                  ? sendAlert(
                      player,
                      `§e${unbanP} §chas been §6unbanned§c.`,
                      PREFIX.moderation
                    )
                  : sendAlert(
                      player,
                      `§cCould not unban §e${unbanP}§c.`,
                      PREFIX.moderation
                    );
                return;
              });
            } else return;
          }, 1);
        });
      }
      system.runTimeout(() => modMenu(player), 2);
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
      let island = message.split(" ")[1];
      console.warn(island);
      let idata: Island = islandDB.get(island);
      if (!idata) {
        sendError(
          player,
          `Island does not exist.\n§cFormat: §e-isadmin <§gisland§e>`,
          PREFIX.server
        );
        return;
      }
      system.runTimeout(() => {
        let gui = new ModalFormData();
        gui.title("Island Admin Editor");
        gui.textField("Name", idata.name);
        gui.textField("Operator", idata.operator.name);
        gui.textField(
          "Spawn",
          idata.spawn.x + ", " + idata.spawn.y + ", " + idata.spawn.z
        );
        gui.textField("Owners", "", idata.owners.map((x) => x.name).toString());
        gui.textField(
          "Members",
          "",
          idata.members.map((x) => x.name).toString()
        );
        gui.textField("Banned", "", idata.banned.toString());
        gui.slider("Size", 16, MAX_SIZE, 8, idata.size);
        gui.textField("Points", "", idata.points.toString());
        gui.textField("Level", xpToLevel(idata.points).toString());
        gui.textField("Funds", idata.funds.toString());
        gui.dropdown(
          "Remove Home",
          ["Click to Select"].concat(idata.homes.map((x) => x.name))
        );
        gui.toggle("Unlocked", idata.status);
        for (let l of Object.keys(idata.limits)) {
          let limit = idata.limits[l as keyof IslandLimits];
          gui.slider(`§eAmount §7(§f${l}§7)§f`, 0, limit.max, 1, limit.amount);
          gui.textField(
            `§cMax §7(§f${l}§7)§f`,
            limit.max.toString(),
            limit.max.toString()
          );
        }
        gui.show(player).then((result) => {
          if (result.canceled || !result.formValues) return;
          // Island Name
          if (result.formValues[0]) {
            let name = result.formValues[0] as string;
            for (let owner of idata.owners) {
              let odata = playerDB.get(owner.id);
              odata.island = name;
              playerDB.set(owner.id, odata);
            }
            islandDB.delete(idata.name);
            IslandMethods.setName(idata, name);
          }
          // Island Operator
          if (result.formValues[1]) {
            function findIdByName() {
              if (result.formValues)
                for (let pdata of playerDB.entries()) {
                  if (pdata[1].name == (result.formValues[1] as string))
                    return pdata[0];
                }
              return undefined;
            }
            let id = findIdByName();
            if (!id) return;
            IslandMethods.removeOwner(idata, idata.operator.id);
            let newOp = {
              id: id,
              name: result.formValues[1] as string,
              permissions: ISLAND_ROLES.guest.permissions,
            };
            idata.operator = newOp;
            idata.owners.push(newOp);
            let pdata = playerDB.get(id);
            pdata.oldisland = pdata.island;
            pdata.island = idata.name;
            playerDB.set(id, pdata);
            IslandMethods.updateData(idata);
            sendAlert(
              player,
              `§cSet §6data §cfor §e${idata.name}§c.`,
              PREFIX.moderation
            );
            return;
          }
          // Set Island Spawn
          if (result.formValues[2]) {
            let newL = (result.formValues[2] as string).split(", ");
            let newLoc = {
              x: Number(newL[0]),
              y: Number(newL[1]),
              z: Number(newL[2]),
            };
            let oldBedrock = overworld.getBlock({
              x: idata.spawn.x,
              y: idata.spawn.y - 1,
              z: idata.spawn.z,
            });
            if (!oldBedrock) return;
            oldBedrock.setType("air");
            overworld
              .getBlock({ x: newLoc.x, y: newLoc.y - 1, z: newLoc.z })
              ?.setType("bedrock");
            let oldNomads = overworld.getEntities({
              type: "palm:nomad",
              location: idata.spawn,
              maxDistance: 128,
            });
            if (oldNomads.length > 0) {
              for (let nomad of oldNomads)
                nomad.teleport(Vector.add(newLoc, new Vector(0.5, 0, 0.5)));
            }
            IslandMethods.setSpawn(idata, newLoc);

            //world.sendMessage(
            //  idata.spawn.x + ", " + idata.spawn.y + ", " + idata.spawn.z
            //);
          }
          // Island Owners
          if (
            result.formValues[3] &&
            result.formValues[3] != idata.owners.map((x) => x.name).toString()
          ) {
            let ownerStr = result.formValues[3] as string;
            let ownerNames = ownerStr.includes(", ")
              ? ownerStr.split(", ")
              : ownerStr.split(",");
            let currentOwnerNames = idata.owners.map((x) => x.name);
            for (let ownerName of ownerNames) {
              if (!idata.owners.find((x) => x.name == ownerName)) {
                function findIdByName() {
                  if (result.formValues)
                    for (let pdata of playerDB.entries()) {
                      if (pdata[1].name == ownerName) return pdata[0];
                    }
                  return undefined;
                }
                let id = findIdByName();
                if (!id) continue;
                let newOwner = {
                  id: id,
                  name: ownerName,
                  permissions: ISLAND_ROLES.guest.permissions,
                };
                idata.owners.push(newOwner);
                let pdata = playerDB.get(id);
                pdata.oldisland = pdata.island;
                pdata.island = idata.name;
                playerDB.set(id, pdata);
              }
            }
            for (let ownerName of currentOwnerNames) {
              if (!ownerNames.includes(ownerName)) {
                let owner = idata.owners.find((x) => x.name == ownerName);
                if (!owner) return;
                idata.owners.splice(idata.owners.indexOf(owner), 1);
                let pdata = playerDB.get(owner.id);
                pdata.island = pdata.oldisland ?? "";
                playerDB.set(owner.id, pdata);
              }
            }

            //world.sendMessage(idata.owners.map((x) => x.name));
          }
          // Island Members
          if (
            result.formValues[4] &&
            result.formValues[4] != idata.members.map((x) => x.name).toString()
          ) {
            let memberStr = result.formValues[4] as string;
            let memberNames = memberStr.includes(", ")
              ? memberStr.split(", ")
              : memberStr.split(",");
            let currentmemberNames = idata.members.map((x) => x.name);
            for (let memberName of memberNames) {
              if (!idata.members.find((x) => x.name == memberName)) {
                let permission = "Initiate";
                if (memberName.includes(":")) {
                  permission = memberName.split(":")[1];
                  memberName = memberName.split(":")[0];
                }
                function findIdByName() {
                  if (result.formValues)
                    for (let pdata of playerDB.entries()) {
                      if (pdata[1].name == memberName) return pdata[0];
                    }
                  return undefined;
                }
                let id = findIdByName();
                if (!id) continue;
                let newmember = {
                  id: id,
                  name: memberName,
                  permissions:
                    ISLAND_ROLES[
                      permission.toLowerCase() as keyof typeof ISLAND_ROLES
                    ].permissions,
                };
                idata.members.push(newmember);
              }
            }
            for (let memberName of currentmemberNames) {
              if (!memberNames.includes(memberName)) {
                let member = idata.members.find((x) => x.name == memberName);
                if (!member) return;
                idata.members.splice(idata.members.indexOf(member), 1);
              }
            }

            //world.sendMessage(idata.members.map((x) => x.name));
          }
          // Banned
          if (
            result.formValues[5] &&
            result.formValues[5] != idata.banned.toString()
          ) {
            let bannedStr = result.formValues[5] as string;
            let bannedNames = bannedStr.includes(", ")
              ? bannedStr.split(", ")
              : bannedStr.split(",");
            let newBanned = [];
            for (let name of bannedNames) {
              function findIdByName() {
                if (result.formValues)
                  for (let pdata of playerDB.entries()) {
                    if (pdata[1].name == name) return pdata[0];
                  }
                return undefined;
              }
              let id = findIdByName();
              newBanned.push(id);
            }
            idata.banned = newBanned;

            //world.sendMessage(idata.banned);
          }
          // Size
          if (result.formValues[6] && result.formValues[6] != idata.size) {
            let newSize = result.formValues[6] as number;
            idata.size = newSize;

            //world.sendMessage(idata.size.toString());
          }
          // Points
          if (
            result.formValues[7] &&
            Number(result.formValues[7]) != idata.points
          ) {
            let newPoints = Number(result.formValues[7] as string);
            idata.points = newPoints;

            //world.sendMessage(idata.points.toString());
          }
          // Level
          if (result.formValues[8]) {
            let newLevel = Number(result.formValues[8] as string);
            idata.points = levelToXp(newLevel - 2) + 1;

            //world.sendMessage(xpToLevel(idata.points).toString());
          }
          // Funds
          if (result.formValues[9]) {
            let newFunds = Number(result.formValues[9] as string);
            idata.funds = newFunds;

            //world.sendMessage(idata.funds.toString());
          }
          // Remove Homes
          if (result.formValues[10]) {
            idata.homes.splice((result.formValues[10] as number) - 1, 1);

            //world.sendMessage(idata.homes.map((x) => x.name).toString());
          }
          // Set Locked
          idata.status = result.formValues[11] as boolean;

          //world.sendMessage(idata.status ? "true" : "false");

          // Limits
          let i = 12;
          for (let l of Object.keys(idata.limits)) {
            let limit = idata.limits[l as keyof IslandLimits];
            limit.amount = result.formValues[i++] as number;
            limit.max = Number(result.formValues[i++] as string);
            //world.sendMessage(
            //  "Amount: " + limit.amount + " | Max: " + limit.max
            //);
          }
          IslandMethods.updateData(idata);
          sendAlert(
            player,
            `§cSet §6data §cfor §e${idata.name}§c.`,
            PREFIX.moderation
          );
        });
      }, 2);
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
    permission: COMMAND_PERMS.MOD,
    info: "Sets a player's island name.",
    function: function (player: Player, msg: string) {
      let gui = new ModalFormData();
      gui.title("Force Rename");
      gui.textField("Old Name", "Noob");
      gui.textField("New Name", "nubhub");
      gui.show(player).then((result) => {
        if (result.canceled || !result.formValues) return;
        let is = result.formValues[0] as string;
        if (!is) return;
        let island: Island | undefined = islandDB.get(is);
        if (!island) {
          sendError(player, `Island does not exist.`);
          return;
        }
        let name = result.formValues[1] as string;
        if (!name) return;
        for (let owner of island.owners) {
          let odata = playerDB.get(owner.id);
          odata.island = name;
          playerDB.set(owner.id, odata);
        }
        islandDB.delete(island.name);
        IslandMethods.setName(island, name);
        sendAlert(player, `§dIsland has been force renamed.`);
      });
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["personalpool"],
    permission: COMMAND_PERMS.ADMIN,
    info: "Creates a personal pool.",
    function: function (player: Player, msg: string) {
      player.runCommandAsync(`structure load fishing:pool ~-3 ~-7 ~-6`);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["spectator", "vanish"],
    permission: COMMAND_PERMS.MOD,
    info: "Sets a player to spectator.",
    function: function (player: Player, msg: string) {
      if (
        player.runCommand(`gamemode survival @s[m=spectator]`).successCount == 1
      )
        return;
      else player.runCommand(`gamemode spectator @s[m=survival]`);
    },
    arguments: [],
    allowSigns: true,
    closeChat: true,
  },
  {
    alias: ["teleport", "tp"],
    permission: COMMAND_PERMS.MOD,
    info: "Teleports yourself to another player.",
    function: function (player: Player, msg: string) {
      let tpPlayer = world
        .getPlayers()
        .find(
          (x) =>
            x.name.toLowerCase() ==
            msg.substring(msg.indexOf(" ") + 1).toLowerCase()
        );
      if (tpPlayer)
        player.teleport(Vector.add(tpPlayer.location, new Vector(0, 3, 0)));
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
  player.runCommandAsync(`inputpermission set @s movement disabled`);
  system.runTimeout(() => {
    if (
      Math.floor(player.location.x) == 0 &&
      Math.floor(player.location.z) == 0
    )
      return;
    player.teleport(new Vector(0.5, 91, 0.5));
    sendAlert(player, `§aWarped to §eSpawn§a.`, PREFIX.server);
    player.runCommandAsync(`inputpermission set @s movement enabled`);
    player.playSound("note.bell");
  }, 15);
}

export function instantWarpLobby(player: Player) {
  player.teleport(new Vector(0.5, 91, 0.5));
  sendAlert(player, `§aWarped to §eSpawn§a.`, PREFIX.server);
  player.playSound("note.bell");
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

let lastMessage: any = {};

world.beforeEvents.chatSend.subscribe((data) => {
  const player = data.sender;
  let msg = data.message;
  data.cancel = true;
  if (msg.includes("§")) return;
  if (msg.startsWith("-")) {
    parseCommand(player, msg, "chat");
  } else if (msg.charAt(0) != " " && msg.length > 0) {
    system.run(() => {
      if (player.getItemCooldown("chat") > 0) {
        sendError(player, `Chat is on cooldown.`);
        player.startItemCooldown("chat", 25);
        return;
      } else player.startItemCooldown("chat", 25);
      if (data.message == lastMessage[player.id]) {
        sendError(player, `Refrain from sending the same message twice.`);
        return;
      } else lastMessage[player.id] = data.message;
      let tag = player.getTags().find((x) => x.startsWith("island:chat"));
      if (!tag) {
        let staff = "";
        if (USER_PERMS.helpers.includes(player.name)) {
          if (player.name == "The Palm Healer") staff = " ";
          else if (USER_PERMS.admins.includes(player.name)) staff = " ";
          else if (USER_PERMS.mods.includes(player.name)) staff = " ";
          else if (USER_PERMS.helpers.includes(player.name)) staff = " ";
          else if (USER_PERMS.trainee.includes(player.name)) staff = " ";
        }
        let rank = `§7Guest`;
        let color = `§f`;
        if (player.hasTag("role:owner")) {
          rank = "§6Owner";
          color = "§e";
        } else if (player.hasTag("role:creator")) {
          rank = "§cCC";
        } else if (player.hasTag("role:supporter")) {
          rank = "§dSupporter";
        } else if (player.hasTag("role:admin")) {
          rank = "§9Admin";
        } else if (player.hasTag("role:moderator")) {
          rank = "§2Mod";
        } else if (player.hasTag("role:helper")) {
          rank = "§bHelper";
        } else if (player.hasTag("role:trainee")) {
          rank = "§aTrainee";
        }

        let idata = islandDB.get(playerDB.get(player.id).island);
        if (!idata) idata = { points: 0, name: "--" };
        overworld.runCommandAsync(
          `tellraw @a[tag=!"block:${
            player.name
          }",name=!"RB Relay"] {"rawtext": [{"text": "${`§7 - §f[§e${xpToLevel(
            Number(idata.points)
          )}§f] §g${idata.name} ${staff}§7[${rank}§7] §f${
            player.nameTag
          } §p>> ${color}${msg.split('"').join("'")}`}"}]}`
        );
        overworld.runCommandAsync(
          `tellraw "RB Relay" {"rawtext": [{"text": "${`§7 - *[§e${xpToLevel(
            Number(idata.points)
          )}§f]* **§g${idata.name}** §7[${rank}§7] **§f${
            player.nameTag
          }** \`>>\` ${color}${msg.split('"').join("'")}`}"}]}`
        );
      } else {
        let island = tag.split(":")[2];
        let idata: Island | undefined = islandDB.get(island);
        if (!idata) return;
        let rank = `§8Member`;
        if (idata.operator.id == player.id) rank = "§eOwner";
        else if (idata.owners.find((x) => x.id == player.id))
          rank = "§9Co-Owner";
        else {
          let member = idata.members.find(
            (x: IslandMember) => x.id == player.id
          );
          if (member)
            rank =
              Object.values(ISLAND_ROLES).find(
                (x) =>
                  JSON.stringify(x.permissions) ==
                  JSON.stringify(member?.permissions)
              )?.name ?? "§8Member";
        }
        for (let p of world.getPlayers({ tags: [tag] })) {
          p.sendMessage(
            `§e - §f[§e${xpToLevel(Number(idata.points))}§f] §d${
              idata.name
            } §7[${rank}§7] §b${player.nameTag} §p>> §f${msg}`
          );
        }
      }
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
  if (
    !cmd ||
    (cmd.permission == COMMAND_PERMS.HELPER &&
      !USER_PERMS.helpers.includes(player.name)) ||
    (cmd.permission == COMMAND_PERMS.MOD &&
      !USER_PERMS.mods.includes(player.name)) ||
    (cmd.permission == COMMAND_PERMS.ADMIN &&
      !USER_PERMS.admins.includes(player.name))
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
          overworld.runCommandAsync(
            `tellraw @a[tag=admin:bypass] {"rawtext": [{"text": "${`${
              PREFIX.moderation
            } §b${player.name} §cran §e${msg.split('"').join("'")}§c.`}"}]}`
          );
        });
      }
    } else
      system.run(() => {
        cmd.function(player, msg);
        overworld.runCommandAsync(
          `tellraw @a[tag=admin:bypass] {"rawtext": [{"text": "${`${
            PREFIX.moderation
          } §b${player.name} §cran §e${msg.split('"').join("'")}§c.`}"}]}`
        );
      });
    if (cmd.closeChat == true && source == "chat") {
      player.runCommandAsync(`damage @s 0 entity_attack`);
    }
  }
}
