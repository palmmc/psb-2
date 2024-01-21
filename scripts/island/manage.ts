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
  IslandMethods,
  warpLobby,
  IslandLimits,
} from "../main";
import { ISLAND_GENERATOR, islandCreator, testValidName } from "./create";
import {
  ActionFormData,
  MessageFormData,
  ModalFormData,
} from "@minecraft/server-ui";
import { levelToXp, xpToLevel } from "./levels";
import { ChestFormData } from "../chest-ui/forms";
import {
  ISLAND_ROLES,
  inviteDirect,
  islandEditPerms,
  islandInvite,
} from "./permissions";
import { clearIslandGenerators } from "../systems/generators";
import { formatItemName } from "../economy/itemcloud";

// DEFINTIONS

const overworld = world.getDimension("overworld");

// ESSENTIAL FUNCTIONS

export function getIslandOn(player: Player): Island | undefined {
  let island: Island;
  for (island of islandDB.values()) {
    let spawn = island.spawn;
    if (
      Math.floor(
        Math.sqrt(
          Math.pow(spawn.x - player.location.x, 2) +
            Math.pow(spawn.z - player.location.z, 2)
        )
      ) <
      MAX_SIZE + 16
    )
      return island;
    else continue;
  }
}

// ISLAND VISITATION
export function warpIsland(player: Player) {
  let island = playerDB.get(player.id).island;
  let idata: Island = islandDB.get(island);
  if (!island) {
    sendError(
      player,
      `§cYou do not currently own a skyblock island.\nUse §e-is create§c to create one.`,
      PREFIX.server
    );
    return;
  }
  player.teleport(
    {
      x: idata.spawn.x + 0.5,
      y: idata.spawn.y + 1,
      z: idata.spawn.z + 0.5,
    },
    { facingLocation: new Vector(0, 65, idata.spawn.z) }
  );
  sendAlert(
    player,
    `§aYou have been teleported to your §e${island} §aisland.`,
    PREFIX.server
  );
  player.playSound("note.bell");
}

export function visitIsland(player: Player, island: Island, owner?: Player) {
  if (island.banned.includes(player.id)) {
    sendError(player, `§cYou are banned from this island.`, PREFIX.island);
    return;
  }
  if (island.status == false) {
    let member = island.members.find((x) => x.id == player.id);
    if (!member) member = island.owners.find((x) => x.id == player.id);
    if (!member) {
      sendError(player, `§cThis island is locked.`, PREFIX.island);
      return;
    }
  }
  player.teleport(
    {
      x: island.spawn.x + 0.5,
      y: island.spawn.y + 1,
      z: island.spawn.z + 0.5,
    },
    { facingLocation: new Vector(0, 65, island.spawn.z) }
  );
  sendAlert(
    player,
    `§aYou have been teleported to the §e${island.name} §aisland.`,
    PREFIX.server
  );
  if (owner)
    sendAlert(
      owner,
      `§a${player.name} §eteleported to your island.`,
      PREFIX.server
    );
  player.playSound("note.bell");
}

// Old Info
/*
export function islandInfo(player: Player, idata: Island) {
  // Level Data
  let points = idata.points;
  let level = xpToLevel(points);
  let pointsNeeded = levelToXp(level - 1);
  let pointsBefore = levelToXp(level - 2);
  pointsBefore = level > 1 ? pointsBefore : 0;
  // Status
  let status = "§aOPEN";
  if (idata.status == false) status = "§6CLOSED";
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
*/

export function islandInfo(player: Player, idata: Island) {
  const gui = new ChestFormData("cyan");
  gui.title(`Showing Info: §9${idata.name}`);
  gui.pattern([0, 0], ["xxxxxxxxx", "x_______x", "xxxxxxxxx"], {
    x: {
      data: { itemName: "", itemDesc: [], enchanted: false, stackSize: 1 },
      iconPath: "textures/blocks/glass_white.png",
    },
  });
  let points = idata.points;
  let level = xpToLevel(points);
  let pointsNeeded = levelToXp(level - 1);
  let pointsBefore = levelToXp(level - 2);
  pointsBefore = level > 1 ? pointsBefore : 0;

  let status = idata.status == true ? "§aOPEN" : "§6CLOSED";
  if (
    world.getPlayers({ excludeNames: idata.owners.map((x) => x.name) })
      .length == world.getPlayers().length
  )
    status = "§cOFFLINE";
  gui.button(
    4,
    `§e${idata.name}`,
    [
      `§9Status: §l§f[§r ${status} §f§l]`,
      `§bOwner: §f${idata.operator.name}`,
      `§aLevel: §e${level}`,
      `§2Points: §8(§a${points - pointsBefore}§2/§a${
        pointsNeeded - pointsBefore
      }§8)`,
    ],
    "grass",
    0,
    true
  );
  gui.button(
    11,
    `§eIsland Members`,
    [`§d§lCLICK TO OPEN`],
    "iron_block",
    0,
    true
  );
  gui.button(
    12,
    `§dIsland Size`,
    [`§u(§f${idata.size} §dx §f${idata.size}§u)`],
    "emerald_block",
    0,
    false
  );
  let limitsArr = new Array();
  let limitsText = ["§a", "§e", "§b", "§e", "§6", "§c", "§e"];
  let i = 0;
  for (let l of Object.keys(idata.limits)) {
    let limit = idata.limits[l as keyof IslandLimits];
    limitsArr.push(
      `${limitsText[i] + formatItemName(l)}: §f${
        l == "owners" || l == "members" ? idata[l].length : limit.amount
      }§8/§f${limit.max}`
    );
    i++;
  }
  gui.button(13, `§dIsland Limits`, limitsArr, "redstone_block", 0, false);
  gui.button(
    14,
    `§eIsland Funds`,
    [`§6Bank: §f$${idata.funds}`],
    "gold_block",
    0,
    false
  );
  gui.button(
    15,
    `§6Island Owners`,
    [`§d§lCLICK TO OPEN`],
    "diamond_block",
    0,
    true
  );
  gui.button(
    22,
    `§cIsland Ban List`,
    [`§d§lCLICK TO OPEN`],
    "red_concrete",
    0,
    true
  );
  gui.show(player).then((result) => {
    if (result.selection == 11) {
      const gui = new ChestFormData("cyan");
      gui.title("Island Members");
      gui.pattern([0, 0], ["xxxxxxxxx", "x_______x", "xxxxxxxxx"], {
        x: {
          data: { itemName: "", itemDesc: [], enchanted: false, stackSize: 1 },
          iconPath: "textures/blocks/glass_white.png",
        },
      });
      let e = 10;
      let i = e;
      let islandPlayers = new Array();
      for (let x of world.getPlayers()) {
        if (x.name == player.name || x.name == "PalmSkyblock") continue;
        gui.button(
          i++,
          `§a${x.name}`,
          [`§l§2CLICK TO EDIT`],
          "iron_helmet",
          0,
          true
        );
        islandPlayers.push(x);
      }
      if (islandPlayers.length == 0) {
        sendError(player, `Your island has no members.`);
        return;
      }
      gui.show(player).then((result) => {
        if (result.canceled) return;
        let p = islandPlayers[(result.selection ?? i) - e];
        inviteDirect(player, p);
      });
    } else if (result.selection == 12) {
      islandExpand(player);
    } else if (result.selection == 15) {
      const gui = new ChestFormData("cyan");
      gui.title("Island Owners");
      gui.pattern([0, 0], ["xxxxxxxxx", "x_______x", "xxxxxxxxx"], {
        x: {
          data: { itemName: "", itemDesc: [], enchanted: false, stackSize: 1 },
          iconPath: "textures/blocks/glass_white.png",
        },
      });
      let e = 10;
      let i = e;
      let islandPlayers = new Array();
      for (let x of world.getPlayers()) {
        if (x.name == player.name || x.name == "PalmSkyblock") continue;
        gui.button(
          i++,
          `§b${x.name}`,
          [`§l§cCLICK TO REMOVE`],
          "diamond_helmet",
          0,
          true
        );
        islandPlayers.push(x);
      }
      if (islandPlayers.length == 0) {
        sendError(player, `There are no other owners on your island.`);
        return;
      }
      gui.show(player).then((result) => {
        if (result.canceled) return;
        let p = islandPlayers[(result.selection ?? i) - e];
        sendAlert(
          p,
          `§cRemoved ownership from §e${p.name}: Removed by island operator.`
        );
        IslandMethods.removeOwner(idata, p);
        sendAlert(
          player,
          `§e${p.nameTag} §chas been §8removed §cfrom your island.`
        );
      });
    } else if (result.selection == 22) {
    } else return;
  });
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
    if (IslandMethods.isInBounds(idata, player.location) == true) continue;
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
const UPGRADE_LEVEL = 16; // Level requirement increase per upgrade.

// LIMIT INCREASES
// [amount, interval, max]
const LIMIT_INCREMENTS = {
  oregen: [5, 8, 40],
  autominer: [2, 8, 40],
  spawner: [1, 16, 6],
  crop: [125, 8, -1],
  homes: [2, 16, 8],
  members: [1, 8, 8],
  owners: [1, 32, 5],
};

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
  let idata: Island = islandDB.get(island);
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
  let limitsArr = [`§dSize: §u(§f${size} §dx §f${size}§u)`];
  let newLimitsArr = [`§eSize: §6(§f${nextSize} §6x §f${nextSize}§6)`];
  let limitsText = ["§a", "§e", "§b", "§e", "§6", "§c", "§e"];
  let i = 0;
  for (let l of Object.keys(idata.limits)) {
    let limit = idata.limits[l as keyof IslandLimits];
    limitsArr.push(`${limitsText[i] + formatItemName(l)}: §f${limit.max}`);
    let li = LIMIT_INCREMENTS[l as keyof typeof LIMIT_INCREMENTS];
    let la =
      nextSize % li[1] == 0
        ? limit.max >= li[2] && li[2] != -1
          ? 0
          : li[0]
        : 0;
    newLimitsArr.push(
      `${limitsText[i] + formatItemName(l)}: §f${limit.max + la}`
    );
    i++;
  }
  let gui = new ChestFormData("light_blue");
  gui.title("Island Expansion");
  gui.pattern([0, 0], ["xxxxxxxxx", "x___x___x", "xxxxxxxxx"], {
    x: {
      data: { itemName: "", itemDesc: [], enchanted: false, stackSize: 1 },
      iconPath: "textures/blocks/glass_white.png",
    },
  });
  gui.button(11, `§e${idata.name}`, limitsArr, "grass", 0, false);
  gui.button(
    13,
    `§l§aConfirm Expansion`,
    [`§eCost: §2$${formatNumber(price)}`, `§9Level: §b${levelF}`],
    "beacon",
    0,
    true
  );
  gui.button(15, `§b${idata.name}`, newLimitsArr, "cobblestone", 0, false);
  gui.show(player).then((result) => {
    if (result.selection == 13) {
      sendAlert(
        player,
        `§eYour island has been expanded for §a$${formatNumber(price)}§e.`,
        PREFIX.island
      );
      player.sendMessage(`§f===----------------===`);
      player.sendMessage(` §8- §eSize: §2${size} §f-> §a${nextSize}`);
      let u = 0;
      for (let l of Object.keys(idata.limits)) {
        let limit = idata.limits[l as keyof IslandLimits];
        let li = LIMIT_INCREMENTS[l as keyof typeof LIMIT_INCREMENTS];
        let la =
          nextSize % li[1] == 0
            ? limit.max >= li[2] && li[2] != -1
              ? 0
              : li[0]
            : 0;
        player.sendMessage(
          ` §8- ${limitsText[u]}${formatItemName(l)}: §7${limit.max} §f-> §d${
            limit.max + la
          }`
        );
        limit.max = limit.max + la;
        u++;
      }
      player.sendMessage(`§f===----------------===`);
      player.playSound(`conduit.deactivate`, { volume: 0.4 });
      player.playSound(`respawn_anchor.set_spawn`, { volume: 0.4 });
      idata.funds = idata.funds - price;
      idata.size = nextSize;
      IslandMethods.updateData(idata);
    } else return;
  });
}

export function lockIsland(player: Player) {
  let idata = islandDB.get(playerDB.get(player.id).island);
  let status = IslandMethods.toggleStatus(idata);
  sendAlert(
    player,
    `§aIsland has been ${status == false ? "§clocked" : "unlocked"}`
  );
}

export function kickPlayerIsland(player: Player) {
  let idata = islandDB.get(playerDB.get(player.id).island);
  const gui = new ChestFormData("blue");
  gui.title("Select a Player:");
  gui.pattern([0, 0], ["xxxxxxxxx", "x_______x", "xxxxxxxxx"], {
    x: {
      data: { itemName: "", itemDesc: [], enchanted: false, stackSize: 1 },
      iconPath: "textures/blocks/glass_white.png",
    },
  });
  let e = 10;
  let i = e;
  let islandPlayers = new Array();
  for (let x of world.getPlayers()) {
    if (
      IslandMethods.isInBounds(idata, x.location) == false ||
      x.name == player.name ||
      x.name == "PalmSkyblock"
    )
      continue;
    gui.button(
      i++,
      `§c${x.name}`,
      ["§l§4CLICK TO KICK"],
      "turtle_helmet",
      0,
      true
    );
    islandPlayers.push(x);
  }
  if (islandPlayers.length == 0) {
    sendError(player, `There are no other players on your island.`);
    return;
  }
  gui.show(player).then((result) => {
    if (result.canceled) return;
    let kickP = islandPlayers[(result.selection ?? i) - e];
    sendAlert(kickP, `§cKicked from Island: Kicked by owner.`);
    warpLobby(kickP);
    sendAlert(player, `§c${kickP.nameTag} §6has been kicked from your island.`);
  });
}

export function banPlayerIsland(player: Player) {
  let idata: Island = islandDB.get(playerDB.get(player.id).island);
  const gui = new ChestFormData("blue");
  gui.title("Select a Player:");
  gui.pattern([0, 0], ["xxxxxxxxx", "x_______x", "xxxxxxxxx"], {
    x: {
      data: { itemName: "", itemDesc: [], enchanted: false, stackSize: 1 },
      iconPath: "textures/blocks/glass_white.png",
    },
  });
  let e = 10;
  let i = e;
  let islandPlayers = new Array();
  for (let x of world.getPlayers()) {
    if (x.name == player.name || x.name == "PalmSkyblock") continue;
    gui.button(
      i++,
      `§c${x.name}`,
      [
        `§l§4CLICK TO ${
          idata.banned.find((a) => a == x.id) ? "PARDON" : "BAN"
        }`,
      ],
      "turtle_helmet",
      0,
      true
    );
    islandPlayers.push(x);
  }
  if (islandPlayers.length == 0) {
    sendError(player, `There are no other players on your island.`);
    return;
  }
  gui.show(player).then((result) => {
    if (result.canceled) return;
    let banP = islandPlayers[(result.selection ?? i) - e];
    if (idata.banned.find((a) => a == banP.id)) {
      sendAlert(banP, `§dPardoned §cfrom Island: Unbanned by owner.`);
      IslandMethods.unbanPlayer(idata, banP);
      sendAlert(
        player,
        `§c${banP.nameTag} §7has been §dunbanned §7from your island.`
      );
      return;
    }
    sendAlert(banP, `§8Banned §cfrom Island: Banned by owner.`);
    IslandMethods.banPlayer(idata, banP);
    if (IslandMethods.isInBounds(idata, banP.location) == true) warpLobby(banP);
    sendAlert(
      player,
      `§c${banP.nameTag} §7has been §8banned §7from your island.`
    );
  });
}

export function visitIslandUI(player: Player) {
  let idata = islandDB.get(playerDB.get(player.id).island);
  const gui = new ChestFormData("light_blue");
  gui.title("Select a Player:");
  gui.pattern([0, 0], ["xxxxxxxxx", "x_______x", "xxxxxxxxx"], {
    x: {
      data: { itemName: "", itemDesc: [], enchanted: false, stackSize: 1 },
      iconPath: "textures/blocks/glass_white.png",
    },
  });
  let e = 10;
  let i = e;
  if (world.getPlayers().length <= 2) {
    sendError(player, `There are no other players online.`);
    return;
  }
  let islands = new Array();
  for (let x of world.getPlayers()) {
    let xi = playerDB.get(x.id).island;
    if (!xi) continue;
    gui.button(
      i++,
      `§d${xi}`,
      [`§6Owner: §e${x.name}`, "§l§aCLICK TO VISIT"],
      "grass",
      0,
      true
    );
    islands.push([islandDB.get(xi), x]);
  }
  gui.show(player).then((result) => {
    if (result.canceled) return;
    let arr = islands[(result.selection ?? i) - e];
    visitIsland(player, arr[0], arr[1]);
  });
}

export function islandManage(player: Player) {
  let island: Island = islandDB.get(playerDB.get(player.id).island);
  let pdata = playerDB.get(player.id);
  let coins = pdata.coins;
  if (!island) {
    const gui = new ActionFormData();
    gui.title("Error: Island not found.");
    gui.body(
      "\n  §cYou don't have an island to manage!\n \n \n \n \n \n \n \n"
    );
    gui.button("Island Creator");
    gui.button("Cancel");
    gui.show(player).then((result) => {
      if (result.selection == 0 && !result.canceled) {
        islandCreator(player);
      } else return;
    });
  }
  const gui = new ChestFormData("light_blue");
  gui.pattern([0, 0], ["xxxxxxxxx", "x_______x", "xxxxxxxxx"], {
    x: {
      data: { itemName: "", itemDesc: [], enchanted: false, stackSize: 1 },
      iconPath: "textures/blocks/glass_white.png",
    },
  });
  gui.title(`Managing: §9${island.name}§r`);
  gui.button(
    11,
    "Visitation",
    [`§7-is visit`],
    "textures/ui/multiplayer_glyph_color.png"
  );
  gui.button(
    12,
    "Permissions",
    [`§7-is edit`],
    `textures/ui/settings_glyph_color_2x.png`
  );
  gui.button(
    13,
    "Expansion",
    [`§7-is size`],
    `textures/ui/world_glyph_desaturated.png`
  );
  gui.button(
    14,
    "Power Actions",
    [`§7-is manage`],
    `textures/ui/random_dice.png`
  );
  gui.button(15, "Stats", [`§7-is info`], `textures/ui/mute_off.png`);
  gui.show(player).then((result) => {
    if (result.canceled) return;
    if (result.selection == 11) {
      let gui = new ChestFormData("light_blue");
      gui.pattern([0, 0], ["xxxxxxxxx", "x_______x", "xxxxxxxxx"], {
        x: {
          data: { itemName: "", itemDesc: [], enchanted: false, stackSize: 1 },
          iconPath: "textures/blocks/glass_white.png",
        },
      });
      gui.title(`Manage / Island Visitation`);
      gui.button(
        12,
        `Go to Island`,
        ["§7-is go"],
        `textures/ui/realmsIcon.png`
      );
      gui.button(
        13,
        `Visit Player`,
        ["§7-is visit"],
        `textures/ui/friend1_black_outline.png`
      );
      gui.button(
        14,
        `Invite Player`,
        ["§7-is invite"],
        `textures/ui/invite_base.png`
      );
      gui.show(player).then((result) => {
        if (result.canceled) islandManage(player);
        if (result.selection == 12) {
          warpIsland(player);
          return;
        } else if (result.selection == 13) {
          visitIslandUI(player);
        } else if (result.selection == 14) {
          islandInvite(player);
        }
      });
    }
    if (result.selection == 12) {
      islandEditPerms(player);
    } else if (result.selection == 13) {
      islandExpand(player);
      return;
    } else if (result.selection == 14) {
      let gui = new ChestFormData("blue");
      gui.pattern([0, 0], ["xxxxxxxxx", "x_______x", "xxxxxxxxx"], {
        x: {
          data: { itemName: "", itemDesc: [], enchanted: false, stackSize: 1 },
          iconPath: "textures/blocks/glass_white.png",
        },
      });
      gui.title(`Power Actions`);
      gui.button(
        11,
        `Lock`,
        [`§7Closes island to visitors.`],
        `textures/ui/lock_color.png`
      );
      gui.button(
        12,
        `Kick`,
        [`§7Kick a player from island.`],
        `textures/ui/cloud_only_storage.png`
      );
      gui.button(
        13,
        `Rename`,
        [`§7Rename your island.`],
        `textures/ui/book_edit_default.png`
      );
      gui.button(
        14,
        `Reset`,
        [`§7Reset your island.`],
        `textures/ui/hammer_l.png`
      );
      gui.button(
        15,
        `Ban`,
        [`§7Bans a player from island.`],
        `textures/ui/speed_effect.png`
      );
      gui.show(player).then((result) => {
        if (result.canceled) islandManage(player);
        if (result.selection == 11) {
          lockIsland(player);
        } else if (result.selection == 12) {
          kickPlayerIsland(player);
        } else if (result.selection == 13) {
          let gui = new ModalFormData();
          gui.title(`Power Actions / Rename Island`);
          gui.textField(
            `\n               §eRename Island\n §6Island renames cost §c$5,000§6, so make\n      sure you choose a good one!\n\n§fChoose a name:`,
            ``
          );
          gui.toggle(`Confirm Rename`, false);
          gui.show(player).then((result) => {
            if (
              result.canceled ||
              !result.formValues ||
              result.formValues[1] == false
            )
              return;
            let name = result.formValues[0] as string;
            if (testValidName(player, name) == false) return;
            if (coins < 5000) {
              sendError(player, `§cYou cannot afford an island rename.`);
              return;
            }
            pdata.coins = pdata.coins - 5000;
            pdata.island = name;
            playerDB.set(player.id, pdata);
            islandDB.delete(island.name);
            IslandMethods.setName(island, name);
            sendAlert(player, `§dYour island has been renamed.`);
            return;
          });
        } else if (result.selection == 14) {
          let gui = new ChestFormData("blue");
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
          gui.title(`Power Actions / Reset Island`);
          gui.button(
            15,
            "§cReset Island",
            [
              "§6Resetting will destroy everything on your island.",
              "§eAre you sure you want to reset?",
              "",
              "§c§lThis cannot be undone.",
            ],
            "red_concrete",
            0,
            true
          );
          gui.show(player).then((result) => {
            if (result.canceled) return;
            if (result.selection === 15) {
              if (coins < 500000 || island.size < 16 + 4 * UPGRADE_SIZE) {
                sendError(
                  player,
                  `You do not meet the requirements to reset your island.\n§3Requirements:\n§b - §c$500,000\n§b - §5Size §d48 §5x §d48`
                );
                return;
              }
              pdata.coins = pdata.coins - 500000;
              playerDB.set(player.id, pdata);
              clearIslandGenerators(island);
              island.size = 16;
              island.points = 0;
              island.members = [];
              island.owners = [island.operator];
              island.limits = {
                oregen: { amount: 0, max: 5 },
                autominer: { amount: 0, max: 2 },
                spawner: { amount: 0, max: 0 },
                crop: { amount: 0, max: 100 },
                homes: { amount: 0, max: 3 },
                members: { amount: 0, max: 3 },
                owners: { amount: 1, max: 2 },
              };
              island.homes = [];
              island.funds = 0;
              IslandMethods.updateData(island);
              world.scoreboard.getObjective("lastIsLevel")?.setScore(player, 0);
              world.scoreboard.getObjective("isReward")?.setScore(player, 0);
              let y = 32 + Math.min(island.size, 64);
              let spawn = island.spawn;
              let islandSize = island.size;
              let r = system.runInterval(() => {
                if (y <= -16) {
                  system.clearRun(r);
                  return;
                }
                overworld.fillBlocks(
                  new Vector(spawn.x + islandSize, y, spawn.z + islandSize),
                  new Vector(spawn.x - islandSize, y, spawn.z - islandSize),
                  "air"
                );
                y--;
              });
              player.teleport(new Vector(spawn.x, -14, spawn.z));
              player.runCommandAsync(`setblock ~ ~-1 ~ barrier`);
              player.runCommandAsync(`fill ~-1 ~ ~-1 ~1 ~2 ~1 barrier hollow`);
              sendAlert(player, `§cReset §6in progress...`);
              let b = system.runInterval(() => {
                if (!r) {
                  warpIsland(player);
                  system.runTimeout(() => {
                    player.runCommandAsync(
                      "structure load island:island_default ~-6 ~-14 ~-3"
                    );
                  }, 2);
                  sendAlert(
                    player,
                    `§aYour island has been successfully reset.`
                  );
                  system.clearRun(b);
                  return;
                }
              }, 30);
            }
          });
        } else if (result.selection == 15) {
          banPlayerIsland(player);
        }
      });
      return;
    } else if (result.selection == 15) {
      islandInfo(player, islandDB.get(playerDB.get(player.id).island));
    } else return;
  });
}

// Island Transfer function
/*
          const gui = new ChestFormData("blue");
          gui.title("Select a Player:");
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
          let e = 10;
          let i = e;
          if (world.getPlayers().length <= 2) {
            sendError(player, `There are no other players online.`);
            return;
          }
          let getPlayers = new Array();
          for (let x of world.getPlayers()) {
            if (x.name == player.name || x.name == "PalmSkyblock") continue;
            gui.button(
              i++,
              `§c${x.name}`,
              ["§l§aCLICK TO SELECT"],
              "turtle_helmet",
              0,
              true
            );
            getPlayers.push(x);
          }
          gui.show(player).then((result) => {
            if (result.canceled) return;
            let opPlayer = getPlayers[(result.selection ?? i) - e];
            let gui = new ChestFormData("blue");
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
            gui.title(`Power Actions / Transfer`);
            gui.button(
              13,
              "§cTransfer Ownership",
              [
                "§6This will trade full privilleges of your island.",
                "§cYou will lose access to your island.",
                "§aYou will gain access to their island.",
                "§eAre you sure you want to transfer?",
                "",
                "§c§lThis cannot be undone.",
              ],
              "red_concrete",
              0,
              true
            );
            gui.show(player).then((result) => {
              if (result.canceled || result.selection != 13) return;
              let gui = new ChestFormData("blue");
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
              gui.title(`Power Actions / Transfer`);
              gui.button(
                13,
                "§cTransfer Request",
                [
                  `§e${player.name} §6would like to trade islands.`,
                  "§6This will trade full privilleges of your island.",
                  "§cYou will lose access to your island.",
                  "§aYou will gain access to their island.",
                  "§eAre you sure you want to transfer?",
                  "",
                  "§c§lThis cannot be undone.",
                ],
                "red_concrete",
                0,
                true
              );
              gui.show(opPlayer).then((result) => {
                if (result.canceled || result.selection != 13) return;
                IslandMethods.setOperator(
                  island,
                  opPlayer,
                  ISLAND_ROLES.guest.permissions
                );
                IslandMethods.removeOwner(island, player);
                IslandMethods.addOwner(island, player);
                let opData: Island = islandDB.get(
                  playerDB.get(opPlayer.id).island
                );
                IslandMethods.setOperator(
                  opData,
                  player,
                  ISLAND_ROLES.guest.permissions
                );
                IslandMethods.removeOwner(opData, opPlayer);
                IslandMethods.addOwner(opData, player);
                sendAlert(
                  opPlayer,
                  `§aIsland transfer completed!\n§eWelcome to §a${island.name}§e, your new island!`
                );
                sendAlert(
                  player,
                  `§aIsland transfer completed!\n§eWelcome to §a${opData.name}§e, your new island!`
                );
              });
            });
          });
          */
