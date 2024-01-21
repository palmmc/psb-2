// Event:
// { id: 404, name: "Test Event" }

import {
  DisplaySlotId,
  ObjectiveSortOrder,
  system,
  world,
} from "@minecraft/server";
import { JsonDatabase } from "../database";

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
