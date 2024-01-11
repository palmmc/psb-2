import { world, system, Player, Vector, Vector3, Direction } from "@minecraft/server";
import { PREFIX, playerDB, sendAlert, readIsland, islandDB, sendError, formatNumber, storeIsland } from "../main";
import { ISLAND_GENERATOR } from "./create";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { xpToLevel } from "./levels";

// DEFINTIONS

const overworld = world.getDimension("overworld");

// ESSENTIAL FUNCTIONS

export function getIslandLoc(slot: number) {
  return new Vector(
    ISLAND_GENERATOR.start + slot * ISLAND_GENERATOR.dist,
    64,
    ISLAND_GENERATOR.start + slot * ISLAND_GENERATOR.dist
  );
}

export function getIslandOn(player: Player) {
  let slot = Math.floor((player.location.x - ISLAND_GENERATOR.start + 128) / ISLAND_GENERATOR.dist);
  if (slot < 0 || slot > 9) return;
  let owner: Player | undefined;
  for (const [key, value] of playerDB) {
    if (value.slot == slot) {
      owner = world.getPlayers().find((x) => x.id == key);
      return { owner: owner, slot: slot, island: value.island };
    }
  }
  return { owner: owner, slot: slot, island: "" };
}

export function checkBounds(islandLoc: Vector, loc: Vector3, size: number, face?: Direction) {
  if (face) {
    if (face == Direction.North) loc.z--;
    if (face == Direction.East) loc.x++;
    if (face == Direction.South) loc.z++;
    if (face == Direction.West) loc.x--;
  }
  let isDist = Math.floor(Math.sqrt(Math.pow(islandLoc.x - loc.x, 2) + Math.pow(islandLoc.z - loc.z, 2)));
  if (isDist > size && isDist < size + 16) return true;
}

// ISLAND VISITATION
export function visitIsland(player: Player, player2: Player) {
  let p2data = playerDB.get(player2.id);
  let slot = p2data.slot;
  let island = p2data.island;
  player.teleport(getIslandLoc(slot));
  sendAlert(player, `§aYou have been teleported to the §e${island} §aisland.`, PREFIX.server);
  sendAlert(player2, `§a${player.name} §eteleported to your island.`, PREFIX.server);
}

// ISLAND BORDER CHECK
system.runInterval(() => {
  for (let player of world.getPlayers()) {
    // ANTI FARMLAND TRAMPLE
    //if (player.isFalling == true) player.addEffect("slow_falling", 9, { showParticles: false });
    if (!player.isOnGround) player.addEffect("slow_falling", 9, { showParticles: false });
    //
    const loc = player.location;
    const idata = getIslandOn(player);
    if (!idata) continue;
    let islandLoc = getIslandLoc(idata.slot);
    if (checkBounds(islandLoc, loc, readIsland(idata.island, "size")) != true) continue;
    player.applyKnockback(-(loc.x - islandLoc.x), -(loc.z - islandLoc.z), 1, 0.5);
    player.playSound(`item.trident.return`, { volume: 0.6 });
    player.sendMessage(
      `${PREFIX.island} §cYou have reached the bounds of this island.\n§dUse §e-is expand §dto increase them.`
    );
    overworld.spawnParticle(`minecraft:explosion_manual`, player.getHeadLocation());
  }
}, 5);

// ISLAND EXPANSION
const MAX_SIZE = 184; // Max island size.
const UPGRADE_SIZE = 8; // Size increase per upgrade.
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
  sendAlert(player, `§eYour island has been expanded for §a$${formatNumber(price)}§e.`, PREFIX.island);
  player.sendMessage(`§f===----------------===`);
  player.sendMessage(` §8- §eSize: §2${size} §f-> §a${nextSize}`);
  const maxLava = limits.maxLava;
  player.sendMessage(` §8- §6Lava: §3${maxLava} §f-> §b${maxLava + LAVA_INCREASE}`);
  const maxCrops = limits.maxCrops;
  player.sendMessage(` §8- §aCrops: §3${limits.maxCrops} §f-> §b${limits.maxCrops + CROPS_INCREASE}`);
  const maxSpawners = limits.maxSpawners;
  player.sendMessage(
    ` §8- §cSpawners: §3${limits.maxSpawners} §f-> §b${limits.maxSpawners + SPAWNER_INCREASE}\n§f===----------------===`
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
