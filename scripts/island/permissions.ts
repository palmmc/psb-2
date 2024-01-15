import {
  world,
  system,
  Player,
  Vector,
  Vector3,
  Direction,
  EntityHealthComponent,
  EntityLifetimeState,
  BlockInventoryComponent,
} from "@minecraft/server";
import { PREFIX, playerDB, sendAlert, sendError, islandDB } from "../main";
import { ModalFormData } from "@minecraft/server-ui";

// DEFINITIONS
const overworld = world.getDimension("overworld");

// PERMISSION PREVENTIONS

/*
world.beforeEvents.playerPlaceBlock.subscribe((data) => {
  const player = data.player;
  const idata = getIslandOn(player);
  const loc = data.block.location;
  if (idata) {
    if (checkBounds(getIslandLoc(idata.slot), loc, readIsland(idata.island, "size"), data.face) != true) {
      if (getIslandPerm(player, idata.island, "place") == 1 || idata.owner == player) return;
      else if (getIslandPerm(player, idata.island, "farm") == 1 && DEF_CROPS_PLACE.includes(data.itemStack.typeId))
        return;
      else if (getIslandPerm(player, idata.island, "build") == 1 && DEF_XP_BLOCKS.includes(data.itemStack.typeId))
        return;
    }
  }
  data.cancel = true;
  system.run(() => {
    if (player.getItemCooldown("place") != 0) return;
    player.playSound(`item.trident.riptide_1`, { volume: 0.6 });
    player.sendMessage(`${PREFIX.island} §cYou cannot build here.`);
    player.startItemCooldown("place", 10);
  });
});

world.beforeEvents.playerBreakBlock.subscribe((data) => {
  const player = data.player;
  const idata = getIslandOn(player);
  if (idata) {
    if (checkBounds(getIslandLoc(idata.slot), data.block.location, readIsland(idata.island, "size")) != true) {
      if (getIslandPerm(player, idata.island, "break") == 1 || idata.owner == player) return;
      else if (getIslandPerm(player, idata.island, "mine") == 1 && DEF_ORES.includes(data.block.typeId)) return;
      else if (getIslandPerm(player, idata.island, "farm") == 1 && DEF_CROPS_BREAK.includes(data.block.typeId)) return;
      //else if (getIslandPerm(player, idata.island, "build") == 1 && DEF_XP_BLOCKS.includes(data.block.typeId)) return;
    }
  }
  data.cancel = true;
  system.run(() => {
    if (player.getItemCooldown("break") != 0) return;
    player.playSound(`item.trident.riptide_1`, { volume: 0.6 });
    player.sendMessage(`${PREFIX.island} §cYou cannot break here.`);
    player.startItemCooldown("break", 10);
  });
});

world.afterEvents.entityHurt.subscribe((data) => {
  const player = <Player>data.damageSource.damagingEntity;
  if (!player) return;
  let ent = data.hurtEntity;
  const idata = getIslandOn(player);
  if (idata) {
    if (checkBounds(getIslandLoc(idata.slot), ent.location, readIsland(idata.island, "size")) != true) {
      if (getIslandPerm(player, idata.island, "attack") == 1 || idata.owner == player) return;
    }
  }
  let health = <EntityHealthComponent>ent.getComponent("health");
  if (health.currentValue == 0) ent.runCommandAsync(`summon ${ent.typeId} ~ ~ ~ minecraft:as_adult`);
  else health.setCurrentValue(health.currentValue + data.damage);
  system.run(() => {
    if (player.getItemCooldown("hit") != 0) return;
    player.playSound(`item.trident.riptide_1`, { volume: 0.6 });
    player.sendMessage(`${PREFIX.island} §cYou cannot hit entities here.`);
    player.startItemCooldown("hit", 15);
  });
});

world.beforeEvents.itemUse.subscribe((data) => {
  const player = data.source;
  const idata = getIslandOn(player);
  if (idata) {
    if (checkBounds(getIslandLoc(idata.slot), data.source.location, readIsland(idata.island, "size")) != true) {
      if (getIslandPerm(player, idata.island, "interact") == 1 || idata.owner == player) return;
    }
  }
  data.cancel = true;
  system.run(() => {
    if (player.getItemCooldown("interact") != 0) return;
    //player.playSound(`item.trident.riptide_1`, { volume: 0.6 });
    //player.sendMessage(`${PREFIX.island} §cYou cannot interact here.`);
    player.startItemCooldown("interact", 15);
  });
});

world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
  const player = data.player;
  const idata = getIslandOn(player);
  let msg = `§cYou cannot interact here.`;
  if (idata) {
    if (
      checkBounds(getIslandLoc(idata.slot), data.block.location, readIsland(idata.island, "size"), data.blockFace) !=
      true
    ) {
      if (getIslandPerm(player, idata.island, "interact") == 1 || idata.owner == player) {
        const inv = <BlockInventoryComponent>data.block.getComponent("inventory");
        let isCrop = DEF_CROPS_PLACE[DEF_CROPS_PLACE.indexOf(data.itemStack?.typeId ?? "")];
        if (!inv && !isCrop) return;
        if (inv) {
          if (getIslandPerm(player, idata.island, "container") == 1 || idata.owner == player) return;
          msg = `§cYou cannot use containers here.`;
        } else if (isCrop) {
          if (getIslandPerm(player, idata.island, "farm") == 1 || idata.owner == player) return;
          msg = `§cYou cannot farm here.`;
        }
      }
    }
  }
  data.cancel = true;
  system.run(() => {
    if (player.getItemCooldown("interact") != 0 || player.getItemCooldown("place") != 0) return;
    player.startItemCooldown("interact", 15);
    player.playSound(`item.trident.riptide_1`, { volume: 0.6 });
    player.sendMessage(`${PREFIX.island} ${msg}`);
  });
});
*/

// perm format:
// perms = {<island name>: { break: 0, place: 0, interact: 0, attack: 0, container: 0, mine: 0, farm: 0, build: 0 },}

export function listIslandPerms(player: Player) {
  const perms = playerDB.get(player.id).perms;
  if (!perms) {
    sendError(
      player,
      `You have not been invited to any islands yet.`,
      PREFIX.island
    );
    return;
  }
  Object.keys(perms).map((x) => {
    player.sendMessage(
      `§eIsland: §a${x} §8// §fPermissions: §7${Object.values(perms[x])}`
    );
  });
}

export function getIslandPerm(player: Player, island: string, perm: string) {
  let perms = playerDB.get(player.id).perms;
  if (!perms) return -2;
  perms = perms[island];
  if (!perms) return -1;
  else return perms[perm];
}

const ISLAND_PERMS = [
  {
    id: "Break",
    info: "Permission to break any block.",
  },
  {
    id: "Place",
    info: "Permission to place any block.",
  },
  {
    id: "Interact",
    info: "Permission to interact with anything.",
  },
  {
    id: "Attack",
    info: "Permission to attack anything.",
  },
  {
    id: "Container",
    info: "Permission to use any containers.",
  },
];

const ISLAND_ROLES = {
  // Worker
  guest: {
    id: 0,
    info: "No permissions.",
    permissions: {
      break: 0,
      place: 0,
      interact: 0,
      attack: 0,
      container: 0,
      mine: 0,
      farm: 0,
      build: 0,
    },
  },
  builder: {
    id: 1,
    info: "Permission to progress island through building.",
    permissions: {
      break: 0,
      place: 0,
      interact: 0,
      attack: 0,
      container: 0,
      mine: 0,
      farm: 0,
      build: 1,
    },
  },
  farmer: {
    id: 2,
    info: "Permission to progress island through farming.",
    permissions: {
      break: 0,
      place: 0,
      interact: 0,
      attack: 0,
      container: 0,
      mine: 0,
      farm: 1,
      build: 0,
    },
  },
  miner: {
    id: 3,
    info: "Permission to progress island through mining.",
    permissions: {
      break: 0,
      place: 0,
      interact: 0,
      attack: 0,
      container: 0,
      mine: 1,
      farm: 0,
      build: 0,
    },
  },
  // Member
  initiate: {
    id: 4,
    info: "Permission to progress island in every way.",
    permissions: {
      break: 0,
      place: 0,
      interact: 0,
      attack: 0,
      container: 0,
      mine: 1,
      farm: 1,
      build: 1,
    },
  },
  officer: {
    id: 5,
    info: "Full permissions, excluding container access.",
    permissions: {
      break: 1,
      place: 1,
      interact: 1,
      attack: 1,
      container: 0,
      mine: 1,
      farm: 1,
      build: 1,
    },
  },
  admin: {
    id: 6,
    info: "Full permissions, including container access. (Be careful who you give this to).",
    permissions: {
      break: 1,
      place: 1,
      interact: 1,
      attack: 1,
      container: 1,
      mine: 1,
      farm: 1,
      build: 1,
    },
  },
};

export function islandEditPerms(player: Player) {
  let playerList = world
    .getPlayers()
    .map((x) => {
      if (x.nameTag != player.nameTag) return x.nameTag;
      else return "";
    })
    .filter((x) => x != "");
  if (playerList.length == 0) playerList.push("No Online Players");
  let gui = new ModalFormData();
  gui.title("Permissions Editor");
  gui.dropdown(
    "\nSelect a player to edit:\n§f[§6§l?§r§f] §7Each toggle will control if a player can preform an action on your island.",
    playerList
  );
  gui.show(player).then((result) => {
    if (
      result.canceled ||
      !result.formValues ||
      playerList[0] == "No Online Players"
    )
      return;
    let editPlayer = playerList[result.formValues[0] as number];
    let ep = world.getPlayers({ name: editPlayer })[0];
    if (ep) {
      editPlayer = ep.nameTag;
      let island = playerDB.get(player.id).island;
      let members = islandDB.get(island).members;
      let epdata = playerDB.get(ep.id);
      if (!epdata.perms) epdata.perms = {};
      let allPerms = epdata.perms;
      if (Object.keys(allPerms).length >= 3) {
        sendError(
          player,
          `Player has reached the member limit (3).`,
          PREFIX.island
        );
        return;
      } else if (Object.keys(members).length >= 5) {
        sendError(
          player,
          `Island has reached the member limit (5).`,
          PREFIX.island
        );
        return;
      }
      let perms = allPerms[island];
      if (!perms)
        perms = {
          break: 0,
          place: 0,
          interact: 0,
          attack: 0,
          container: 0,
          mine: 0,
          farm: 0,
          build: 0,
        };
      let permGui = new ModalFormData();
      let permsList = Object.keys(perms);
      permGui.title("Permissions Editor");
      for (let x of ISLAND_PERMS) {
        permGui.toggle(`${x.id}\n§7${x.info}`, !!perms[x.id.toLowerCase()]);
      }
      permGui.show(player).then((result) => {
        if (result.canceled || !result.formValues) return;
        let i = 0;
        for (let x of result.formValues) {
          perms[ISLAND_PERMS[i].id.toLowerCase()] = +x;
          i++;
        }
        sendAlert(
          player,
          `§aPermissions for §e${editPlayer} §ahave been saved.`,
          PREFIX.island
        );
        sendAlert(
          ep,
          `§aYour permissions on island §e${island} §ahave been changed.`,
          PREFIX.island,
          "note.bit"
        );
        if (!Object.values(perms).includes(1)) {
          delete epdata.perms[island];
          if (members.includes(ep.name))
            members.splice(members.indexOf(ep.name));
        } else {
          epdata.perms[island] = perms;
          members.push(ep.name);
        }
        playerDB.set(ep.id, epdata);
        let idata = islandDB.get(island);
        idata.members = members;
        islandDB.set(island, idata);
      });
    } else
      sendError(
        player,
        `Player is not online or doesn't exist.`,
        PREFIX.island
      );
  });
}

export function islandInvite(player: Player) {
  let playerList = world
    .getPlayers()
    .map((x) => {
      if (x.nameTag != player.nameTag) return x.nameTag;
      else return "";
    })
    .filter((x) => x != "");
  if (playerList.length == 0) playerList.push("No Online Players");
  let gui = new ModalFormData();
  gui.title("Invite Friends");
  gui.dropdown(
    "\nSelect a player to edit:\n§f[§6§l?§r§f] §7This player's permissions on your island will be changed.",
    playerList
  );
  gui.dropdown(
    "Select a role:\n§f[§6§l?§r§f] §7Use §e-is roles§7 for more information on each role.",
    Object.keys(ISLAND_ROLES)
  );
  gui.show(player).then((result) => {
    if (
      result.canceled ||
      !result.formValues ||
      playerList[0] == "No Online Players"
    )
      return;
    let editPlayer = playerList[result.formValues[0] as number];
    let rn = result.formValues[1] as number;
    let role =
      ISLAND_ROLES[Object.keys(ISLAND_ROLES)[rn] as keyof typeof ISLAND_ROLES];
    let ep = world.getPlayers({ name: editPlayer })[0];
    if (ep) {
      editPlayer = ep.nameTag;
      let island = playerDB.get(player.id).island;
      let epdata = playerDB.get(ep.id);
      if (!epdata.perms) epdata.perms = {};
      let allPerms = epdata.perms;
      if (Object.keys(allPerms).length >= 3) {
        sendError(
          player,
          `Player has reached the helper limit (3).`,
          PREFIX.island
        );
        return;
      }
      sendAlert(
        player,
        `§aSet §e${editPlayer}'s §aisland role to §6${
          Object.keys(ISLAND_ROLES)[rn]
        }§a.`,
        PREFIX.island
      );
      sendAlert(
        ep,
        `§aYour role on island §e${island} §awas changed to §6${
          Object.keys(ISLAND_ROLES)[rn]
        }§a.`,
        PREFIX.island,
        "note.bell"
      );
      if (role.id == 0) {
        delete epdata.perms[island];
      } else epdata.perms[island] = role.permissions;
      playerDB.set(ep.id, epdata);
    } else
      sendError(
        player,
        `Player is not online or doesn't exist.`,
        PREFIX.island
      );
  });
}
