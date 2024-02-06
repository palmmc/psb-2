import { Player, Vector2, system, world } from "@minecraft/server";
import { PREFIX, randomIntFromInterval, sendError } from "../main";

const overworld = world.getDimension("overworld");

world.afterEvents.itemUse.subscribe((data) => {
  if (data.itemStack.typeId != "minecraft:fishing_rod") return;
  let player = <Player>data.source;
  system.runTimeout(() => {
    let bobber = overworld.getEntities({
      location: player.location,
      type: "fishing_hook",
      maxDistance: 9,
      minDistance: 1.5,
    })[0];
    if (!bobber) return;
    // Area Checks
    // Check if there is water.
    let bobberBlock = overworld.getBlock({
      x: bobber.location.x,
      y: bobber.location.y - 2,
      z: bobber.location.z,
    });
    if (!bobberBlock || bobberBlock?.typeId != "minecraft:water") {
      sendError(player, `You cannot cast here.`, PREFIX.fish);
    }
    // Check for size of pool.
    if (
      player.runCommand(
        `testforblocks ${bobber.location.x + 1} ${bobber.location.y - 2} ${
          bobber.location.z + 1
        } ${bobber.location.x - 0.75} ${bobber.location.y - 0.25} ${
          bobber.location.z - 0.75
        } ${bobber.location.x} ${bobber.location.y - 2} ${
          bobber.location.z
        } all`
      ).successCount == 0
    ) {
      sendError(
        player,
        `This area is not large enough to fish in.`,
        PREFIX.fish
      );
      bobber.kill();
      return;
    }
    bobber.kill();
    player.runCommandAsync(`camera @s fade time 1 2 1`);
    //player.runCommand(`inputpermission set @s movement disabled`);
    //player.runCommand(`inputpermission set @s camera disabled`);
    //player.addEffect("slowness", 99999, { amplifier: 5, showParticles: false });
    //player.playSound(`mob.dolphin.splash`);
    system.runTimeout(() => {
      if (!bobberBlock) return;
      player.addTag("palm:fishing");
      player.runCommandAsync(
        `camera @s set palm:cutscene pos ~ ~8 ~ rot 80 -90`
      );
      let fx = system.runInterval(() => {
        if (!bobberBlock) return;
        if (!player.hasTag("palm:fishing")) system.clearRun(fx);
        if (randomIntFromInterval(1, 3) != 1) return;
        player.runCommandAsync(
          `particle palm.fish ${
            bobberBlock.location.x + (randomIntFromInterval(11, 30) - 20) / 10
          } ${bobberBlock.location.y + 2} ${
            bobberBlock.location.z + (randomIntFromInterval(11, 30) - 20) / 10
          }`
        );
      }, 40);
      player.playSound(`random.ocean`);
    }, 40);
  }, 10);
});
