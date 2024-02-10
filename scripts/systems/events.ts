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

const eventDB = new JsonDatabase("eventDB", world);
const overworld = world.getDimension("overworld");

function getEvents() {
  return eventDB.values();
}

function getEvent(id: number) {
  return eventDB.get(id);
}

function addEvent(id: number, name: string) {
  world.scoreboard.getObjective("events")?.addScore(name, id);
  eventDB.set(id, { id: id, name: name });
}

function removeEvent(id: number) {
  let eventData = eventDB.get(id);
  world.scoreboard.getObjective("events")?.removeParticipant(eventData.name);
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

// Example
//clearEvents();
//system.run(() => addEvent(1001, " §cNow in §eAlpha§c!"));

world.afterEvents.playerSpawn.subscribe((data) => {
  if (!data.initialSpawn) return;
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
