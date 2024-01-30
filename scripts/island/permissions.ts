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
import {
  PREFIX,
  sendAlert,
  sendError,
  Island,
  MemberPermissions,
  IslandMethods,
} from "../main";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { getIslandOn } from "./manage";
import {
  DEF_CROPS_BREAK,
  DEF_CROPS_PLACE,
  DEF_ORES,
  DEF_XP_BLOCKS,
  itemsBanned,
} from "../systems/miscellaneous";
import { JsonDatabase } from "../database";

// Initialize Databases
var playerDB: any = undefined;
var islandDB: any = undefined;
world.afterEvents.worldInitialize.subscribe((data) => {
  system.runTimeout(() => {
    playerDB = new JsonDatabase("playerDB", world);
    islandDB = new JsonDatabase("islandDB", world);
  }, 180);
});

// DEFINITIONS
const overworld = world.getDimension("overworld");

// PERMISSION PREVENTIONS

world.beforeEvents.playerPlaceBlock.subscribe((data) => {
  const player = data.player;
  const idata = getIslandOn(player);
  const loc = data.block.location;
  if (player.hasTag("admin:bypass")) return;
  if (idata && !itemsBanned.includes(data.itemStack.typeId.slice(10))) {
    if (IslandMethods.isInBounds(idata, player.location) == true) {
      if (
        IslandMethods.getPermission(idata, player, "place") == true ||
        idata.owners.find((x) => x.id == player.id)
      )
        return;
      else if (
        IslandMethods.getPermission(idata, player, "farm") == true &&
        DEF_CROPS_PLACE.includes(data.itemStack.typeId)
      )
        return;
      else if (
        IslandMethods.getPermission(idata, player, "build") == true &&
        DEF_XP_BLOCKS.includes(data.itemStack.typeId)
      )
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
  if (player.hasTag("admin:bypass")) return;
  if (idata) {
    if (IslandMethods.isInBounds(idata, player.location) == true) {
      if (
        IslandMethods.getPermission(idata, player, "break") == true ||
        idata.owners.find((x) => x.id == player.id)
      )
        return;
      else if (
        IslandMethods.getPermission(idata, player, "mine") == true &&
        DEF_ORES.includes(data.block.typeId)
      )
        return;
      else if (
        IslandMethods.getPermission(idata, player, "farm") == true &&
        DEF_CROPS_BREAK.includes(data.block.typeId)
      )
        return;
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
  if (player.hasTag("admin:bypass")) return;
  if (idata) {
    if (IslandMethods.isInBounds(idata, player.location) == true) {
      if (
        IslandMethods.getPermission(idata, player, "attack") == true ||
        idata.owners.find((x) => x.id == player.id)
      )
        return;
    }
  }
  let health = <EntityHealthComponent>ent.getComponent("health");
  if (health.currentValue == 0)
    ent.runCommandAsync(`summon ${ent.typeId} ~ ~ ~ minecraft:as_adult`);
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
  if (player.hasTag("admin:bypass")) return;
  if (idata) {
    if (IslandMethods.isInBounds(idata, player.location) == true) {
      if (
        IslandMethods.getPermission(idata, player, "interact") == true ||
        idata.owners.find((x) => x.id == player.id)
      )
        return;
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
  if (data.block.typeId == "minecraft:end_portal_frame") return;
  if (player.hasTag("admin:bypass")) return;
  if (idata) {
    if (IslandMethods.isInBounds(idata, player.location) == true) {
      if (idata.owners.find((x) => x.id == player.id)) return;
      else if (IslandMethods.getPermission(idata, player, "interact") == true) {
        const inv = <BlockInventoryComponent>(
          data.block.getComponent("inventory")
        );
        let isCrop =
          DEF_CROPS_PLACE[
            DEF_CROPS_PLACE.indexOf(data.itemStack?.typeId ?? "")
          ];
        if (!inv && !isCrop) return;
        if (inv) {
          if (IslandMethods.getPermission(idata, player, "container") == true)
            return;
          msg = `§cYou cannot use containers here.`;
        } else if (isCrop) {
          if (IslandMethods.getPermission(idata, player, "farm") == true)
            return;
          msg = `§cYou cannot farm here.`;
        }
      }
    }
  }
  data.cancel = true;
  system.run(() => {
    if (
      player.getItemCooldown("interact") != 0 ||
      player.getItemCooldown("place") != 0
    )
      return;
    player.startItemCooldown("interact", 15);
    player.playSound(`item.trident.riptide_1`, { volume: 0.6 });
    player.sendMessage(`${PREFIX.island} ${msg}`);
  });
});

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

export const ISLAND_ROLES = {
  // Worker
  guest: {
    id: 0,
    info: "No permissions.",
    permissions: {
      break: false,
      place: false,
      interact: false,
      attack: false,
      container: false,
      mine: false,
      farm: false,
      build: false,
    },
  },
  builder: {
    id: 1,
    info: "Permission to progress island through building.",
    permissions: {
      break: false,
      place: false,
      interact: false,
      attack: false,
      container: false,
      mine: false,
      farm: false,
      build: true,
    },
  },
  farmer: {
    id: 2,
    info: "Permission to progress island through farming.",
    permissions: {
      break: false,
      place: false,
      interact: false,
      attack: false,
      container: false,
      mine: false,
      farm: true,
      build: false,
    },
  },
  miner: {
    id: 3,
    info: "Permission to progress island through mining.",
    permissions: {
      break: false,
      place: false,
      interact: false,
      attack: false,
      container: false,
      mine: true,
      farm: false,
      build: false,
    },
  },
  slayer: {
    id: 4,
    info: "Permission to progress island through mob farming.",
    permissions: {
      break: false,
      place: false,
      interact: false,
      attack: true,
      container: false,
      mine: false,
      farm: false,
      build: false,
    },
  },
  // Member
  initiate: {
    id: 5,
    info: "Permission to progress island in every way.",
    permissions: {
      break: false,
      place: false,
      interact: false,
      attack: true,
      container: false,
      mine: true,
      farm: true,
      build: true,
    },
  },
  officer: {
    id: 6,
    info: "Full permissions, excluding container access.",
    permissions: {
      break: true,
      place: true,
      interact: true,
      attack: true,
      container: false,
      mine: true,
      farm: true,
      build: true,
    },
  },
  admin: {
    id: 7,
    info: "Full permissions, including container access. (Be careful who you give this to).",
    permissions: {
      break: true,
      place: true,
      interact: true,
      attack: true,
      container: true,
      mine: true,
      farm: true,
      build: true,
    },
  },
  coowner: {
    id: 8,
    info: "Full co-ownership of your island. (Be careful who you give this to).",
    permissions: {
      break: false,
      place: false,
      interact: false,
      attack: false,
      container: false,
      mine: false,
      farm: false,
      build: false,
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
    if (!ep) {
      sendError(
        player,
        `Player is not online or doesn't exist.`,
        PREFIX.island
      );
      return;
    }
    inviteDirect(player, ep);
  });
}

export function inviteDirect(player: Player, ep: Player) {
  let editPlayer = ep.nameTag;
  let island = playerDB.get(player.id).island;
  let idata: Island = islandDB.get(island);
  let members = idata.members;
  let epMember = idata.members.find((x) => x.id == ep.id);
  let perms = ISLAND_ROLES.guest.permissions;
  let lm = idata.limits.members.max;
  if (epMember) perms = epMember.permissions;
  else if (idata.members.length >= lm && !epMember) {
    sendError(
      player,
      `Island has reached the helper limit (§4${lm}§c).\n§dUse §e-is expand §dto increase it.`,
      PREFIX.island
    );
    return;
  }
  let permGui = new ModalFormData();
  permGui.title("Permissions Editor");
  for (let x of ISLAND_PERMS) {
    permGui.toggle(
      `${x.id}\n§7${x.info}`,
      perms[x.id.toLowerCase() as keyof MemberPermissions]
    );
  }
  permGui.show(player).then((result) => {
    if (result.canceled || !result.formValues) return;
    let i = 0;
    for (let x of result.formValues) {
      //@ts-ignore
      perms[ISLAND_PERMS[i].id.toLowerCase() as boolean] = x;
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
    if (!Object.values(perms).includes(true)) {
      IslandMethods.removeMember(idata, ep);
    } else if (epMember) {
      idata.members[idata.members.indexOf(epMember)].permissions = perms;
    } else IslandMethods.addMember(idata, ep, perms);
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
      editPlayer = ep.name;
      let island = playerDB.get(player.id).island;
      let idata: Island = islandDB.get(island);
      let epMember = idata.members.find((x) => x.id == ep.id);
      let perms = {};
      if (epMember) perms = epMember.permissions;
      let lm = idata.limits.members.max;
      if (idata.members.length >= lm) {
        sendError(
          player,
          `Island has reached the helper limit (§4${lm}§c).\n§dUse §e-is expand §dto increase it.`,
          PREFIX.island
        );
        return;
      }
      let epOwner = idata.owners.find((x) => x.id == ep.id);
      if (role.id == 8) {
        let lm = idata.limits.owners.max;
        if (idata.owners.length >= lm) {
          sendError(
            player,
            `Island has reached the owner limit (§4${lm}§c).\n§dUse §e-is expand §dto increase it.`,
            PREFIX.island
          );
          return;
        }
        let gui = new ActionFormData();
        gui.title("Island Invitation");
        gui.body(
          `\n§d${player.name} §ehas invited you to be §6Co-Owner §eof the §a${idata.name} §eisland!\n\n§dPerks:\n§7 - §eFull island access, even when the owner is offline.\n§7 - §6All permissions.\n\n\n§c         You will lose access to\n           your current island.`
        );
        gui.button("Accept");
        gui.button("Decline");
        gui.show(ep).then((result) => {
          if (result.selection == 0) {
            IslandMethods.addOwner(idata, ep);
            if (epMember) IslandMethods.removeMember(idata, ep);
            sendAlert(
              player,
              `§dPromoted §e${editPlayer} §ato §6Co-Owner§a.`,
              PREFIX.island
            );
            sendAlert(
              ep,
              `§aYour were §dpromoted §ato §6Co-Owner§a on §e${island}§a.`,
              PREFIX.island,
              "note.bell"
            );
            return;
          } else {
            sendAlert(player, `§cYour request was declined.`, PREFIX.island);
            return;
          }
        });
      } else if (epOwner && role.id != 8) {
        IslandMethods.removeOwner(idata, ep);
        let pdata = playerDB.get(ep.id);
        pdata.island = "";
        playerDB.set(ep.id, pdata);
        sendAlert(player, `§cDemoted §e${editPlayer}.`, PREFIX.island);
        sendAlert(
          ep,
          `§aYour were §cdemoted §afrom §6Co-Owner§a on §e${island}§a.`,
          PREFIX.island,
          "note.bell"
        );
        return;
      } else {
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
      }
      if (epMember) {
        let index = idata.members.indexOf(epMember);
        if (role.id == 0) {
          IslandMethods.removeMember(idata, ep);
        } else idata.members[index].permissions = role.permissions;
      } else if (role.id != 0)
        IslandMethods.addMember(idata, ep, role.permissions);
      else return;
    } else
      sendError(
        player,
        `Player is not online or doesn't exist.`,
        PREFIX.island
      );
  });
}
