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
import { PREFIX, sendError, sendAlert, Island } from "../main";
import { ISLAND_ROLES } from "./permissions";
import { JsonDatabase } from "../database";

// SETTINGS //
// { name: '', coins: 0, island: '', }

// Initialize Databases
var playerDB: any = undefined;
var islandDB: any = undefined;
world.afterEvents.worldInitialize.subscribe((data) => {
  system.runTimeout(() => {
    playerDB = new JsonDatabase("playerDB", world);
    islandDB = new JsonDatabase("islandDB", world);
  }, 180);
});

world.afterEvents.playerSpawn.subscribe((data) => {
  if (!data.initialSpawn) return;
  if (data.player.hasTag("setData")) return;
  playerDB.set(data.player.id, {
    name: data.player.nameTag,
    coins: 100,
    island: "",
  });
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
    gui.dropdown(
      "§6Generator:\n§f[§6§l?§r§f] §7This changes how your island will be generated.",
      [
        "Default - Recommended choice.",
        "§2Classic§r - Classic Skyblock.",
        "§4Shattered§r - Minimal resources.",
        "§3Memorial§r - In memoriam regis.",
      ]
    );
    gui.toggle("Allow Visitors", true);
    gui.show(player).then((result) => {
      if (result.canceled) return;
      if (!result.formValues) return;
      let nameInput = (result.formValues[0] as string).replace(/\s/g, "");
      let generator = ["default", "classic", "shattered", "memorial"][
        (result.formValues[1] ?? 0) as number
      ];
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
            permissions: ISLAND_ROLES.guest.permissions,
          },
          result.formValues[2] as boolean
        );
        world.scoreboard.getObjective("genKey")?.addScore("server", 1);
        islandDB.set(nameInput, island);
        pdata.island = nameInput;
        playerDB.set(player.id, pdata);
        system.runTimeout(() => {
          player.runCommandAsync(
            `tp @s ${islandLoc.x + 0.5} ${islandLoc.y + 1} ${islandLoc.z + 0.5}`
          );
          system.runTimeout(() => {
            player.runCommandAsync(
              `structure load island:island_${generator} ~-6 ~-14 ~-6`
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
    sendError(player, `Island name is already taken.`);
    return false;
  } else if (bannedWords.find((x) => x.includes(name))) {
    sendError(player, `Island name contains a banned word.`);
    return false;
  } else if (name.length < 4) {
    sendError(player, `Island name must be at least 4 characters long.`);
    return false;
  } else if (name.length > 19) {
    sendError(player, `Island name must be at most 18 characters long.`);
    return false;
  } else if (/^[a-zA-Z]+$/.test(name) === false) {
    sendError(
      player,
      `Island name must not contain symbols, numbers, or spaces.`
    );
  }
  return true;
}

function testDuplicate(name: string) {
  for (const [key, value] of islandDB) {
    if (key.toLowerCase() == name.toLowerCase()) return true;
  }
}
