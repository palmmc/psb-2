import { Player, system, world } from "@minecraft/server";
import { JsonDatabase } from "../database";
import { PREFIX, formatTime, sendAlert } from "../main";

const overworld = world.getDimension("overworld");

// INITALIZE DATABASES
var playerDB: any = undefined;
var islandDB: any = undefined;
var moderationDB: any = undefined;
world.afterEvents.worldInitialize.subscribe((data) => {
  system.runTimeout(() => {
    playerDB = new JsonDatabase("playerDB", world);
    islandDB = new JsonDatabase("islandDB", world);
    moderationDB = new JsonDatabase("moderationDB", world);
    system.runTimeout(() => {
      //let player = world.getPlayers({ name: "FolkSallyJane" })[0];
      //if (!player) return;
      //console.warn(unbanPlayer("FolkSallyJane"));
      //console.warn(kickPlayer(player, "idk, I felt like it"));
      //console.warn(banPlayer("FolkSallyJane", 4896, "Weirdo, lol"));
    }, 40);
  }, 180);
});

type ModerationMethod =
  | "ban"
  | "unban"
  | "warn"
  | "unwarn"
  | "mute"
  | "freeze"
  | "kick";
type ModerationType = "ban" | "mute" | "freeze" | "warn" | "all";
type Ban = { time: number; appeal: boolean; reason: string };
type Warn = { reason: string; date: string };
type ModerationData = {
  id: string;
  name: string;
  activeBans: Ban[];
  inactiveBans: Ban[];
  warns: Warn[];
  isMuted: boolean;
  isFrozen: boolean;
};

export function longTimestamp(minutes: number) {
  let days = Math.floor(minutes / 1440);
  let hours = Math.floor(minutes / 60) % 24;
  let mins = Math.floor(minutes % 60);
  return `${days < 10 ? "0" + days : days}d:${
    hours < 10 ? "0" + hours : hours
  }h:${mins < 10 ? "0" + mins : mins}m`;
}

export function getModerationData(id: string, type: ModerationType) {
  let data = moderationDB.get(id) as ModerationData;
  if (!data) return undefined;
  if (type == "ban") return data.activeBans;
  if (type == "freeze") return data.isFrozen;
  if (type == "mute") return data.isMuted;
  if (type == "warn") return data.warns;
  else return data;
}

export function banPlayer(
  player: Player | string,
  minutes: number,
  reason?: string,
  appeal?: boolean
) {
  // Time is in minutes.
  let modData: ModerationData | undefined;
  let id: string | undefined;
  let name = player instanceof Player ? player.name : player;
  if (player instanceof Player) {
    modData = getModerationData(player.id, "all") as ModerationData;
    id = player.id;
  } else {
    function getPlayerData() {
      for (let pdata of playerDB.entries()) {
        if (pdata[1].name == player) {
          id = pdata[0];
          return;
        }
      }
    }
    getPlayerData();
    if (!id) return 0;
    modData = moderationDB.get(id);
  }
  if (!modData)
    modData = {
      id: id,
      name: name,
      activeBans: [],
      inactiveBans: [],
      warns: [],
      isMuted: false,
      isFrozen: false,
    };
  let ban = {
    time: Math.floor(Date.now() / 60000 + minutes),
    appeal: appeal ?? true,
    reason: reason ?? "Rule breaking.",
  };
  modData.activeBans.push(ban);
  moderationDB.set(id, modData);
  let time = longTimestamp(minutes);
  world.sendMessage(
    `${PREFIX.moderation} §6§l${name} §ehas been banned for §c'${ban.reason}' §efor §b${time}§e.`
  );
  let banP = world.getPlayers({ name: name })[0];
  if (banP)
    banP.runCommandAsync(
      `kick "${name}" "\n\n§cYou have been banned.\n§3Remaining: §b${time}${
        ban.appeal ? "\n§dAppeal: §9discord.gg/y39XTT9zwE" : ""
      }\n\n"`
    );
  return 1;
}

// Kick banned players on join.
world.afterEvents.playerSpawn.subscribe((data) => {
  if (!data.initialSpawn) return;
  let modData = getModerationData(data.player.id, "ban") as Ban[] | undefined;
  if (modData && modData.length > 0) {
    let ban = modData.sort((a, b) => b.time - a.time)[0];
    let time = longTimestamp(ban.time - Date.now() / 60000);
    data.player.runCommandAsync(
      `kick "${
        data.player.name
      }" "\n\n§cYou have been banned.\n§3Remaining: §b${time}${
        ban.appeal ? "\n§dAppeal: §9discord.gg/y39XTT9zwE" : ""
      }\n\n"`
    );
  }
});

export function removeBanPlayer(player: string, index: number) {
  let modData: ModerationData | undefined;
  let id: string | undefined;
  for (let md of moderationDB.entries()) {
    if (md[1].name == player) {
      id = md[0];
      modData = md[1];
    }
  }
  if (!id || !modData) return 0;
  modData.inactiveBans.push(modData.activeBans[index]);
  modData.activeBans.splice(index, 1);
  moderationDB.set(id, modData);
  return 1;
}

export function unbanPlayer(player: string) {
  let modData: ModerationData | undefined;
  let id: string | undefined;
  for (let md of moderationDB.entries()) {
    if (md[1].name == player) {
      id = md[0];
      modData = md[1];
    }
  }
  if (!id || !modData) return 0;
  for (let ban of modData.activeBans) {
    modData.inactiveBans.push(ban);
  }
  modData.activeBans = [];
  moderationDB.set(id, modData);
  return 1;
}

export function getWarnsPlayer(player: Player | string) {
  let warns: Warn[] | undefined;
  let id: string | undefined;
  let name = player instanceof Player ? player.name : player;
  if (player instanceof Player) {
    warns = getModerationData(player.id, "warn") as Warn[];
  } else {
    function getPlayerData() {
      for (let pdata of playerDB.entries()) {
        if (pdata[1].name == player) {
          id = pdata[0];
          return;
        }
      }
    }
    getPlayerData();
    if (!id || !moderationDB.get(id)) return [];
    warns = moderationDB.get(id).warns as Warn[];
  }
  if (!warns) warns = [];
  return warns;
}

export function kickPlayer(player: Player, reason: string) {
  player.runCommandAsync(
    `kick "${player.name}" "\n\n§cYou have been kicked.\n§bReason: §3'§7${reason}§3'\n\n"`
  );
}

export function freezePlayer(player: Player) {
  let modData = getModerationData(player.id, "all") as ModerationData;
  if (!modData)
    modData = {
      id: player.id,
      name: player.name,
      activeBans: [],
      inactiveBans: [],
      warns: [],
      isMuted: false,
      isFrozen: false,
    };
  if (modData.isFrozen == true) {
    player.runCommandAsync(`inputpermission set @s movement enabled`);
    player.runCommandAsync(`inputpermission set @s camera enabled`);
    modData.isFrozen = false;
    sendAlert(player, `§9You have been unfrozen.`, PREFIX.moderation);
  } else {
    player.runCommandAsync(`inputpermission set @s movement disabled`);
    player.runCommandAsync(`inputpermission set @s camera disabled`);
    modData.isFrozen = true;
    sendAlert(player, `§bYou have been frozen.`, PREFIX.moderation);
  }
  moderationDB.set(player.id, modData);
  return modData.isFrozen == true ? 2 : 1;
}

export function mutePlayer(player: Player) {
  let modData = getModerationData(player.id, "all") as ModerationData;
  if (!modData)
    modData = {
      id: player.id,
      name: player.name,
      activeBans: [],
      inactiveBans: [],
      warns: [],
      isMuted: false,
      isFrozen: false,
    };
  if (modData.isMuted == true) {
    player.runCommandAsync(`ability @s mute false`);
    modData.isMuted = false;
    sendAlert(player, `§5You have been unmuted.`, PREFIX.moderation);
  } else {
    player.runCommandAsync(`ability @s mute true`);
    modData.isMuted = true;
    sendAlert(player, `§dYou have been muted.`, PREFIX.moderation);
  }
  moderationDB.set(player.id, modData);
  return modData.isMuted == true ? 2 : 1;
}

export function warnPlayer(player: Player | string, reason?: string) {
  let modData: ModerationData | undefined;
  let id: string | undefined;
  let name = player instanceof Player ? player.name : player;
  if (player instanceof Player) {
    modData = getModerationData(player.id, "all") as ModerationData;
    id = player.id;
  } else {
    function getPlayerData() {
      for (let pdata of playerDB.entries()) {
        if (pdata[1].name == player) {
          id = pdata[0];
          return;
        }
      }
    }
    getPlayerData();
    if (!id) return 0;
    modData = moderationDB.get(id);
  }
  if (!modData)
    modData = {
      id: id,
      name: name,
      activeBans: [],
      inactiveBans: [],
      warns: [],
      isMuted: false,
      isFrozen: false,
    };
  let warn: Warn = {
    reason: reason ?? "Warned by staff.",
    date: new Date(new Date(Date.now() - 18000000).toJSON()).toLocaleString(
      "en-US"
    ),
  };
  modData.warns.push(warn);
  if (modData.warns.length >= 4) {
    banPlayer(player, 4320, "Maximum warns.", true);
    modData.warns = [] as Warn[];
    moderationDB.set(id, modData);
    return;
  }
  moderationDB.set(id, modData);
  let warnP = world.getPlayers({ name: name })[0];
  if (warnP)
    sendAlert(
      warnP,
      `§c§lYou have been warned.§r\n§6Reason: §e${warn.reason}`,
      PREFIX.moderation
    );
  return 1;
}

export function removeWarnPlayer(player: Player | string, index: number) {
  // Time is in minutes.
  let modData: ModerationData | undefined;
  let id: string | undefined;
  let name = player instanceof Player ? player.name : player;
  if (player instanceof Player) {
    modData = getModerationData(player.id, "all") as ModerationData;
    id = player.id;
  } else {
    for (let md of moderationDB.entries()) {
      if (md[1].name == player) {
        id = md[0];
        modData = md[1];
      }
    }
    if (!id || !modData) return 0;
  }
  modData.warns.splice(index, 1);
  moderationDB.set(id, modData);
  return 1;
}

export function clearWarnsPlayer(player: Player | string) {
  // Time is in minutes.
  let modData: ModerationData | undefined;
  let id: string | undefined;
  let name = player instanceof Player ? player.name : player;
  if (player instanceof Player) {
    modData = getModerationData(player.id, "all") as ModerationData;
    id = player.id;
  } else {
    for (let md of moderationDB.entries()) {
      if (md[1].name == player) {
        id = md[0];
        modData = md[1];
      }
    }
    if (!id || !modData) return 0;
  }
  modData.warns = [];
  moderationDB.set(id, modData);
  return 1;
}
