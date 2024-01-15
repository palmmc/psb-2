import {
  world,
  system,
  Player,
  Vector,
  Vector3,
  Direction,
} from "@minecraft/server";
import {
  PREFIX,
  playerDB,
  sendAlert,
  islandDB,
  sendError,
  formatNumber,
  Island,
  ISLAND_PERMISSIONS,
} from "../main";
import { ISLAND_GENERATOR } from "./create";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { levelToXp, xpToLevel } from "./levels";

// DEFINTIONS

const overworld = world.getDimension("overworld");

// ESSENTIAL FUNCTIONS

export function getIslandOn(player: Player): Island | undefined {
  let island: Island;
  for (island of islandDB.values()) {
    if (true == true) return island;
    else continue;
  }
}

// ISLAND VISITATION
export function visitIsland(player: Player, islandPlayer: Player) {
  0;
  let island: Island = islandDB.get(playerDB.get(islandPlayer.id).island);
  player.teleport(island.spawn);
  sendAlert(
    player,
    `§aYou have been teleported to the §e${island.name} §aisland.`,
    PREFIX.server
  );
  sendAlert(
    islandPlayer,
    `§a${player.name} §eteleported to your island.`,
    PREFIX.server
  );
}

export function islandInfo(player: Player, idata: Island) {
  // Level Data
  let points = idata.points;
  let level = xpToLevel(points);
  let pointsNeeded = levelToXp(level - 1);
  let pointsBefore = levelToXp(level - 2);
  pointsBefore = level > 1 ? pointsBefore : 0;
  // Status
  let status = "§aOPEN";
  if ((idata.status = false)) status = "§6CLOSED";
  if (
    world.getPlayers({ excludeNames: idata.owners.map((x) => x.name) })
      .length == world.getPlayers().length
  )
    status = "§cOFFLINE";
  const gui = new ActionFormData();
  gui.title(`Island Info`);
  const info = [
    `§aIsland: §f${idata.name}`,
    `§bOwner: §f${idata.operator.name}`,
    `§6Level: §e${level} §7/ §gPoints: §2(§a${points - pointsBefore}§2/§a${
      pointsNeeded - pointsBefore
    }§2)`,
    `§dSize: §u(§f${idata.size} §dx §f${idata.size}§u)`,
    `§gFunds: §f$${formatNumber(idata.funds as number)}`,
    `§cMembers: §f${idata.members.length > 0 ? idata.members : "§7..."}`,
    `§9Status: §l§f[§r ${status} §f§l]§r`,
    `§dLimits:\n §8- §6Lava: §8[§f${idata.limits.oregen}§7/§f${idata.limits.oregen}§8]\n §8- §aCrops: §8[§f${idata.limits.crop}§7/§f${idata.limits.crop}§8]\n §8- §cSpawners: §8[§f${idata.limits.spawner}§7/§f${idata.limits.spawner}§8]\n`,
  ];
  let infoStr = "\n";
  for (let i of info) {
    infoStr = infoStr + " " + i + `\n`;
  }
  gui.body(infoStr);
  gui.button("Submit");
  gui.show(player);
}

// ISLAND BORDER CHECK
system.runInterval(() => {
  for (let player of world.getPlayers()) {
    // ANTI FARMLAND TRAMPLE
    //if (!player.isOnGround)
    //
    const loc = player.location;
    const idata = getIslandOn(player);
    if (!idata) continue;
    if (idata.isInBounds(player) == true) continue;
    player.applyKnockback(
      -(loc.x - idata.spawn.x),
      -(loc.z - idata.spawn.z),
      1,
      0.5
    );
    player.playSound(`item.trident.return`, { volume: 0.6 });
    player.sendMessage(
      `${PREFIX.island} §cYou have reached the bounds of this island.\n§dUse §e-is expand §dto increase them.`
    );
    overworld.spawnParticle(
      `minecraft:explosion_manual`,
      player.getHeadLocation()
    );
  }
}, 5);

// ISLAND EXPANSION
export const MAX_SIZE = 184; // Max island size.
export const UPGRADE_SIZE = 8; // Size increase per upgrade.
const UPGRADE_LEVEL = 10; // Level requirement increase per upgrade.

// LIMIT INCREASES
const LAVA_INCREASE = 10;
const CROPS_INCREASE = 150;
const SPAWNER_INCREASE = 1;

function UPGRADE_PRICE(size: number) {
  // Upgrade price formula.
  return 125000 + 75000 * ((size - 16) / UPGRADE_SIZE - 1);
}

export function islandExpand(player: Player) {
  let pdata = playerDB.get(player.id);
  let island = pdata.island;
  if (!island) {
    sendError(
      player,
      `§cYou do not currently own a skyblock island.\nUse §e-is create§c to create one.`,
      PREFIX.island
    );
    return;
  }
  let idata = islandDB.get(island);
  let size = Number(idata.size);
  if (size >= MAX_SIZE) {
    sendError(player, `Your island is at maximum size.`, PREFIX.island);
    return;
  }
  let coins = idata.funds;
  let level = xpToLevel(Number(idata.points));
  let levelF = UPGRADE_LEVEL * ((size - 16) / UPGRADE_SIZE) + UPGRADE_LEVEL;
  let nextSize = size + UPGRADE_SIZE;
  let price = UPGRADE_PRICE(nextSize);
  if (level < levelF || price > coins) {
    sendError(player, `Missing requirements to expand.`, PREFIX.island);
    if (price > coins)
      player.sendMessage(
        ` §f> §aFunds: §c$${formatNumber(coins)}§6/§e$${formatNumber(
          price
        )}\n   §f[§6§l?§r§f] §7Use §e-is donate §g[§eamount§g]§7 to add funds.`
      );
    if (level < levelF)
      player.sendMessage(
        ` §f> §bLevel: §c${level}§5/§d${levelF}\n   §f[§6§l?§r§f] §7Level your island by mining and farming.`
      );
    return;
  }
  let limits = idata.limits;
  sendAlert(
    player,
    `§eYour island has been expanded for §a$${formatNumber(price)}§e.`,
    PREFIX.island
  );
  player.sendMessage(`§f===----------------===`);
  player.sendMessage(` §8- §eSize: §2${size} §f-> §a${nextSize}`);
  const maxLava = limits.maxLava;
  player.sendMessage(
    ` §8- §6Lava: §3${maxLava} §f-> §b${maxLava + LAVA_INCREASE}`
  );
  const maxCrops = limits.maxCrops;
  player.sendMessage(
    ` §8- §aCrops: §3${limits.maxCrops} §f-> §b${
      limits.maxCrops + CROPS_INCREASE
    }`
  );
  const maxSpawners = limits.maxSpawners;
  player.sendMessage(
    ` §8- §cSpawners: §3${limits.maxSpawners} §f-> §b${
      limits.maxSpawners + SPAWNER_INCREASE
    }\n§f===----------------===`
  );
  player.playSound(`conduit.deactivate`, { volume: 0.4 });
  player.playSound(`respawn_anchor.set_spawn`, { volume: 0.4 });
  idata.funds -= price;
  idata.size = nextSize;
  idata.limits.maxLava += LAVA_INCREASE;
  idata.limits.maxCrops += CROPS_INCREASE;
  idata.limits.maxSpawners += SPAWNER_INCREASE;
  islandDB.set(island, idata);
}
