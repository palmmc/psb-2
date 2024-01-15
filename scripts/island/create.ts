import {
  world,
  system,
  Player,
  Vector,
  BlockTypes,
  BlockPermutation,
  BlockType,
} from "@minecraft/server";
import {
  ActionFormData,
  ModalFormData,
  ModalFormResponse,
} from "@minecraft/server-ui";
import { bannedWords } from "../resources/bannedwords";
import {
  PREFIX,
  playerDB,
  islandDB,
  sendError,
  sendAlert,
  Island,
  ISLAND_PERMISSIONS,
} from "../main";

// SETTINGS //
const defaultData = { slot: -1, coins: 0 }; // { coins: 0, island: '', }

world.afterEvents.playerSpawn.subscribe((data) => {
  if (!data.initialSpawn) return;
  if (data.player.hasTag("setData")) return;
  playerDB.set(data.player.id, { coins: 0, island: "" });
  data.player.addTag("setData");
});

// SETTINGS //
const overworld = world.getDimension("overworld");

export const ISLAND_GENERATOR = {
  start: 2000,
  dist: 500,
  rowMax: 36,
};

// Island Creator
export function islandCreator(player: Player) {
  system.runTimeout(() => {
    const gui = new ModalFormData();
    gui.title("Island Creator");
    gui.textField(
      "\n§eIsland Name:\n§f[§6§l?§r§f] §7This name will be used by other players to find your island.",
      "E.g. donutland, SPLEEF, Me4Pig ..."
    );
    gui.toggle("Allow Visitors", true);
    gui.show(player).then((result) => {
      if (result.canceled) return;
      if (!result.formValues) return;
      let nameInput = (result.formValues[0] as string).replace(/\s/g, "");
      if (testValidName(player, nameInput) === true) {
        sendAlert(player, `§aYour island name is available!`, PREFIX.island);
        player.playSound(`note.xylophone`);
        let pdata = playerDB.get(player.id);
        let genKey =
          world.scoreboard.getObjective("genKey")?.getScore("server") ?? 0;
        let islandLoc = new Vector(
          ISLAND_GENERATOR.start +
            (genKey % ISLAND_GENERATOR.rowMax) * ISLAND_GENERATOR.dist,
          64,
          ISLAND_GENERATOR.start +
            Math.floor(genKey / ISLAND_GENERATOR.rowMax) * ISLAND_GENERATOR.dist
        );
        system.runTimeout(() => {
          player.camera.fade({
            fadeTime: { fadeInTime: 1.5, holdTime: 6.5, fadeOutTime: 1.5 },
          });
          system.runTimeout(() => {
            sendAlert(player, `§6Setting up your §eisland§6...`, PREFIX.island);
            system.runTimeout(() => {
              player.playSound(`dig.grass`, { volume: 1, pitch: 0.6 });
              system.runTimeout(() => {
                player.playSound(`dig.grass`, { volume: 1, pitch: 0.6 });
                system.runTimeout(() => {
                  player.playSound(`dig.grass`, { volume: 1, pitch: 0.6 });
                  system.runTimeout(() => {
                    player.playSound(`dig.wood`, { volume: 1, pitch: 0.6 });
                    system.runTimeout(() => {
                      player.playSound(`dig.stone`, {
                        volume: 1,
                        pitch: 0.6,
                      });
                      system.runTimeout(() => {
                        player.playSound(`dig.stone`, {
                          volume: 1,
                          pitch: 0.6,
                        });
                        system.runTimeout(() => {}, 10);
                      }, 7);
                    }, 8);
                  }, 6);
                }, 8);
              }, 8);
            }, 25);
          }, 20);
        }, 10);
        let island = new Island(
          nameInput,
          islandLoc,
          {
            name: player.name,
            id: player.id,
            permissions: ISLAND_PERMISSIONS.default,
          },
          result.formValues[1] as boolean
        );
        islandDB.set(nameInput, island);
        pdata.island = nameInput;
        playerDB.set(player.id, pdata);
        system.runTimeout(() => {
          player.runCommandAsync(
            `tp @s ${islandLoc.x + 0.5} ${islandLoc.y + 1} ${islandLoc.z + 0.5}`
          );
          system.runTimeout(() => {
            player.runCommandAsync(
              `structure load island:island_default ~-6 ~-14 ~-6`
            );
          }, 2);
          player.runCommandAsync("gamemode survival @s");
          sendAlert(player, `§aIsland generation is complete!`, PREFIX.island);
          system.runTimeout(() => {
            sendAlert(
              player,
              `§eWelcome to §a${nameInput}§e, your new island!`,
              PREFIX.island
            );
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
    player.sendMessage(
      `${PREFIX.island} §4Error: §cIsland name is already taken.`
    );
    return false;
  } else if (bannedWords.find((x) => x.includes(name))) {
    player.sendMessage(
      `${PREFIX.island} §4Error: §cIsland name contains a banned word.`
    );
    return false;
  } else if (name.length < 3) {
    player.sendMessage(
      `${PREFIX.island} §4Error: §cIsland name must be at least 3 characters long.`
    );
    return false;
  } else if (name.length > 19) {
    player.sendMessage(
      `${PREFIX.island} §4Error: §cIsland name must be at most 18 characters long.`
    );
    return false;
  } else if (/^[a-zA-Z]+$/.test(name) === false) {
    player.sendMessage(
      `${PREFIX.island} §4Error: §cIsland name must not contain symbols, numbers, or spaces.`
    );
    return false;
  }
  return true;
}

function testDuplicate(name: string) {
  for (const [key, value] of islandDB) {
    if (key.toLowerCase() == name.toLowerCase()) return true;
  }
}
