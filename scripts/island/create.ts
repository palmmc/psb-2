import { world, system, Player, Vector, BlockTypes, BlockPermutation, BlockType } from "@minecraft/server";
import { ActionFormData, ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
import { bannedWords } from "../resources/bannedwords";
import { PREFIX, playerDB, islandDB, writeIsland, storeIsland, sendError, sendAlert, readIsland } from "../main";

// SETTINGS //
const defaultData = { slot: -1, coins: 0 }; // { slot: -1, coins: 0, island: '', }
export const ISLAND_GENERATOR = {
  start: 3000,
  dist: 1000,
};

// SETTINGS //
const overworld = world.getDimension("overworld");
const removal_Y = 100;

const CHUNKS = [
  {
    id: 0,
    x: 0,
    z: 0,
  },
  {
    id: 1,
    x: 63,
    z: 0,
  },
  {
    id: 2,
    x: -63,
    z: 0,
  },
  {
    id: 3,
    x: 0,
    z: 63,
  },
  {
    id: 4,
    x: 0,
    z: -63,
  },
  {
    id: 5,
    x: 63,
    z: 63,
  },
  {
    id: 6,
    x: 63,
    z: -63,
  },
  {
    id: 7,
    x: -63,
    z: -63,
  },
  {
    id: 8,
    x: -63,
    z: 63,
  },
];

// Select slot on join.
world.afterEvents.playerSpawn.subscribe((data) => {
  if (!data.initialSpawn) return;
  let players = world.getPlayers();
  let slots = new Array();
  for (const [key, value] of playerDB) {
    let findPlayer = players.find((x) => x.id == key);
    if (findPlayer && value && findPlayer.name != data.player.name) slots.push(value.slot);
  }
  let playerData = playerDB.get(data.player.id);
  if (!playerData) playerData = defaultData;
  let avSlots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(function (dt) {
    return !slots.includes(dt);
  });
  playerData.slot = avSlots[0];
  let slot = avSlots[0];
  console.warn(slot);
  let islandLoc = new Vector(
    ISLAND_GENERATOR.start + slot * ISLAND_GENERATOR.dist,
    64,
    ISLAND_GENERATOR.start + slot * ISLAND_GENERATOR.dist
  );
  let player = world.getPlayers({ name: data.player.name })[0];
  if (playerData.island) {
    player.runCommandAsync(`tp @s ${islandLoc.x + 0.5} ${islandLoc.y + 3} ${islandLoc.z + 0.5}`);
    console.warn(3);
    system.runTimeout(() => {
      for (let i = 0; i < 9; i++) {
        let chunk = CHUNKS[i];
        player.runCommandAsync(
          `structure load "${data.player.id}-${chunk.id}" ${islandLoc.x - 31 + chunk.x} 0 ${islandLoc.z - 31 + chunk.z}`
        );
      }
    }, 20);
    console.warn(4);
  }
  playerDB.set(data.player.id, playerData);
  players.find((x) => x.name == data.player.name)?.sendMessage(`Data loaded!`);
});
// Remove slot on leave.
world.afterEvents.playerLeave.subscribe((data) => {
  let playerData = playerDB.get(data.playerId);
  let slot = playerData.slot;
  let islandLoc = new Vector(
    ISLAND_GENERATOR.start + slot * ISLAND_GENERATOR.dist,
    64,
    ISLAND_GENERATOR.start + slot * ISLAND_GENERATOR.dist
  );
  for (let i = 0; i < 9; i++) {
    let chunk = CHUNKS[i];
    overworld.runCommandAsync(
      `structure save "${data.playerId}-${chunk.id}" ${islandLoc.x - 31 + chunk.x} 0 ${islandLoc.x - 31 + chunk.z} ${
        islandLoc.x + 31 + chunk.x
      } 100 ${islandLoc.x + 31 + chunk.z} disk`
    );
  }
  playerData.slot = -1;
  playerDB.set(data.playerId, playerData);
  /*
  system.runTimeout(() => {
    let slots = new Array();
    for (const [key, value] of playerDB) {
      let findPlayer = world.getPlayers().find((x) => x.id == key);
      if (findPlayer && value) slots.push(value.slot);
    }
    let avSlots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(function (dt) {
      return !slots.includes(dt);
    });
    if (!avSlots.includes(slot)) {
      console.warn("Aborting Island Clear: Slot has been taken.");
      return;
    } else console.warn("Starting Clear");
    let y = removal_Y;
    let size = Number(readIsland(playerData.island, "size"));
    console.warn(`Clear Size: ${size}`);
    if (size <= 80)
      system.runInterval(() => {
        if (y <= 0) return;
        try {
          overworld.fillBlocks(
            new Vector(islandLoc.x + size, y, islandLoc.z + size),
            new Vector(islandLoc.x - size, y, islandLoc.z - size),
            "minecraft:air"
          );
        } catch (e) {}
        y--;
      });
  }, 300);
  */
});

// Island Creator
export function islandCreator(player: Player) {
  system.runTimeout(() => {
    const gui = new ModalFormData();
    gui.title("Island Creator");
    gui.textField(
      "\n§eIsland Name:\n§f[§6§l?§r§f] §7This name will be used by other players to find your island.",
      "E.g. donutland, SPLEEF, Me4Pig ..."
    );
    gui.toggle("Visual Effects", true);
    gui.show(player).then((result) => {
      if (result.canceled) return;
      if (!result.formValues) return;
      let nameInput = (result.formValues[0] as string).replace(/\s/g, "");
      let fx = result.formValues[1] as boolean;
      if (testValidName(player, nameInput) === true) {
        sendAlert(player, `§aYour island name is available!`, PREFIX.island);
        player.playSound(`note.xylophone`);
        let pdata = playerDB.get(player.id);
        let slot = pdata.slot;
        let islandLoc = new Vector(
          ISLAND_GENERATOR.start + slot * ISLAND_GENERATOR.dist,
          64,
          ISLAND_GENERATOR.start + slot * ISLAND_GENERATOR.dist
        );
        let y = 120;
        let r = system.runInterval(() => {
          if (y == 110 && fx == true)
            player.camera.fade({ fadeTime: { fadeInTime: 1.5, holdTime: 6.5, fadeOutTime: 1.5 } });
          if (y == 90) sendAlert(player, `§6Setting up your §eisland§6...`, PREFIX.island);
          if (y == 65 && fx == true) player.playSound(`dig.grass`, { volume: 1, pitch: 0.6 });
          if (y == 56 && fx == true) player.playSound(`dig.grass`, { volume: 1, pitch: 0.6 });
          if (y == 46 && fx == true) player.playSound(`dig.grass`, { volume: 1, pitch: 0.6 });
          if (y == 32 && fx == true) player.playSound(`dig.wood`, { volume: 1, pitch: 0.6 });
          if (y == 20 && fx == true) player.playSound(`dig.stone`, { volume: 1, pitch: 0.6 });
          if (y == 11 && fx == true) player.playSound(`dig.stone`, { volume: 1, pitch: 0.6 });
          if (y <= 0) system.clearRun(r);
          try {
            overworld.fillBlocks(
              new Vector(islandLoc.x + 32, y, islandLoc.z + 32),
              new Vector(islandLoc.x - 32, y, islandLoc.z - 32),
              "minecraft:air"
            );
          } catch (e) {}
          y = y - 1;
        });
        storeIsland(nameInput, player.name, player.id.toString(), new Array<string>(), 0, 16, 0, {
          lava: 2,
          maxLava: 5,
          crops: 0,
          maxCrops: 100,
          spawners: 0,
          maxSpawners: 0,
        });
        pdata.island = nameInput;
        playerDB.set(player.id, pdata);
        system.runTimeout(() => {
          player.runCommandAsync(`tp @s ${islandLoc.x + 0.5} ${islandLoc.y + 1} ${islandLoc.z + 0.5}`);
          system.runTimeout(() => {
            player.runCommandAsync(`structure load island:island_default ~-6 ~-14 ~-6`);
          }, 2);
          player.runCommandAsync("gamemode survival @s");
          sendAlert(player, `§aYour island was generated successfully!`, PREFIX.island);
          system.runTimeout(() => {
            sendAlert(player, `§eWelcome to §a${nameInput}§e, your new island!`, PREFIX.island);
            player.playSound(`beacon.ambient`);
          }, 25);
        }, 130);
      }
    });
  }, 3);
}

// Check island names
export function testValidName(player: Player, name: string) {
  if (testDuplicate(name) == true) {
    player.sendMessage(`${PREFIX.island} §4Error: §cIsland name is already taken.`);
    return false;
  } else if (bannedWords.find((x) => x.includes(name))) {
    player.sendMessage(`${PREFIX.island} §4Error: §cIsland name contains a banned word.`);
    return false;
  } else if (name.length < 3) {
    player.sendMessage(`${PREFIX.island} §4Error: §cIsland name must be at least 3 characters long.`);
    return false;
  } else if (name.length > 19) {
    player.sendMessage(`${PREFIX.island} §4Error: §cIsland name must be at most 18 characters long.`);
    return false;
  } else if (/^[a-zA-Z]+$/.test(name) === false) {
    player.sendMessage(`${PREFIX.island} §4Error: §cIsland name must not contain symbols, numbers, or spaces.`);
    return false;
  }
  return true;
}

function testDuplicate(name: string) {
  for (const [key, value] of islandDB) {
    if (key.toLowerCase() == name.toLowerCase()) return true;
  }
}
