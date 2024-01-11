import { Player, world } from "@minecraft/server";
import { randomIntFromInterval } from "../main";

// Player damage sound fix.
world.afterEvents.entityHurt.subscribe((data) => {
  if (data.hurtEntity.typeId == "minecraft:player" && data.damage > 0)
    (<Player>data.hurtEntity).playSound(`game.player.dmg`);
});

// Banned Items
export const itemsBanned = ["powder_snow_bucket"];
export const itemsSuperBanned = ["command_block"];
