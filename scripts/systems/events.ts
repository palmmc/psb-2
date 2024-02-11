// Event:
// { id: 404, name: "Test Event" }

import {
  DisplaySlotId,
  ObjectiveSortOrder,
  system,
  world,
} from "@minecraft/server";
import { JsonDatabase } from "../database";
import { PREFIX } from "../main";
import { SpawnerEntities } from "./spawner";

// INITALIZE DATABASES
var eventDB: any = undefined;
world.afterEvents.worldInitialize.subscribe((data) => {
  system.runTimeout(() => {
    eventDB = new JsonDatabase("eventDB", world);
    clearEvents();
    system.runTimeout(() => {
      addEvent("1", " §cNow in §eAlpha§c!");
      addEvent("2", " §l§a1.25x", 1.25);
    }, 10);
  }, 180);
});
const overworld = world.getDimension("overworld");

function getEvents() {
  return eventDB.values();
}

export function getGlobalMultiplier() {
  let multi = 1;
  for (let e of eventDB.values())
    if (e.multiplier && e.multiplier > multi) multi = e.multiplier;
  return multi;
}

function getEvent(id: string) {
  return eventDB.get(id);
}

function addEvent(id: string, name: string, multiplier?: number) {
  eventDB.set(id, { id: id, name: name, multiplier: multiplier });
  world.scoreboard.getObjective("events")?.addScore(name, Number(id));
}

function removeEvent(id: string) {
  let ev = world.scoreboard.getObjective("events");
  let p = ev?.getScores().find((x) => x.score == Number(id))?.participant;
  if (!p) return;
  ev?.removeParticipant(p);
  eventDB.delete(id);
}

function clearEvents() {
  eventDB.clear();
  world.scoreboard.removeObjective("events");
  system.run(() => {
    let obj = world.scoreboard.addObjective("events", "events");
    world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
      objective: obj,
      sortOrder: ObjectiveSortOrder.Descending,
    });
  });
}

world.afterEvents.playerSpawn.subscribe((data) => {
  if (!data.initialSpawn) return;
  if (data.player.hasTag("inTutorial")) data.player.removeTag("inTutorial");
  let tpaTags = data.player.getTags().filter((x) => x.includes("tpa:"));
  if (!tpaTags) return;
  for (let tag of tpaTags) data.player.removeTag(tag);
});

// Clear Lag
const CLEAR_INTERVAL = 25; // Interval in minutes.
system.runInterval(() => {
  overworld.runCommandAsync(
    `tellraw @a[name=!"PalmSkyblock"] {"rawtext": [{"text": "${"§l§8[§cC§4T§8]§r §cGround entities will be cleared in §e10§c seconds...\n§6Warning: Dropped items will be lost."}"}]}`
  );
  system.runTimeout(() => {
    overworld.runCommandAsync(
      `tellraw @a[name=!"PalmSkyblock"] {"rawtext": [{"text": "${`§l§8[§cC§4T§8]§r §cGround entities will be cleared in §e3§c seconds...`}"}]}`
    );
    system.runTimeout(() => {
      overworld.runCommandAsync(
        `tellraw @a[name=!"PalmSkyblock"] {"rawtext": [{"text": "${`§l§8[§cC§4T§8]§r §cGround entities will be cleared in §e2§c seconds...`}"}]}`
      );
      system.runTimeout(() => {
        overworld.runCommandAsync(
          `tellraw @a[name=!"PalmSkyblock"] {"rawtext": [{"text": "${`§l§8[§cC§4T§8]§r §cGround entities will be cleared in §e1§c seconds...`}"}]}`
        );
        system.runTimeout(() => {
          for (let s of SpawnerEntities) {
            overworld.runCommand(`kill @e[type=${s.id}]`);
          }
          overworld.runCommand(`kill @e[type=item]`);
          overworld.runCommandAsync(
            `tellraw @a[name=!"PalmSkyblock"] {"rawtext": [{"text": "${`§l§8[§cC§4T§8]§r §bGround entities have been cleared.\n§eIt is now safe to drop items.`}"}]}`
          );
        }, 20);
      }, 20);
    }, 20);
  }, 140);
}, 1200 * CLEAR_INTERVAL + 1200);
