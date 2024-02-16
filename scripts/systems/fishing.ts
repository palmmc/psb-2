import {
  Entity,
  EntityLifetimeState,
  EquipmentSlot,
  Player,
  Vector,
  Vector2,
  system,
  world,
} from "@minecraft/server";
import {
  PREFIX,
  formatNumber,
  playTutorial,
  randomIntFromInterval,
  sendAlert,
  sendError,
} from "../main";
import { JsonDatabase } from "../database";
import { Enchant, EnchantData } from "../custom_enchants/enchantHandler";
import { giveRelic, rollRelic } from "./relic";

// INITALIZE DATABASES
var playerDB: any = undefined;
world.afterEvents.worldInitialize.subscribe((data) => {
  system.runTimeout(() => {
    playerDB = new JsonDatabase("playerDB", world);
  }, 180);
});

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
    if (player.getItemCooldown("fishing") > 0) {
      sendError(
        player,
        `This action is on cooldown. §8(§4${Math.floor(
          player.getItemCooldown("fishing") / 20
        )}s§8)`
      );
      bobber.kill();
      return;
    }
    // You can only fish at spawn.
    if (
      player.location.x > 1000 &&
      player.location.z > 1000 &&
      overworld.getBlock(
        new Vector(player.location.x, player.location.y - 1, player.location.z)
      )?.typeId != "minecraft:verdant_froglight"
    ) {
      sendError(player, `Invalid fishing spot.`);
      bobber.kill();
      return;
    }
    player.startItemCooldown("fishing", 320);
    // Area Checks
    // Check if there is water.
    let bobberBlock = overworld.getBlock({
      x: bobber.location.x,
      y: bobber.location.y - 1,
      z: bobber.location.z,
    });
    if (!bobberBlock || bobberBlock?.typeId != "minecraft:water") {
      bobber.kill();
      sendError(player, `You cannot cast here.`, PREFIX.fish);
      return;
    }
    // Check for size of pool.
    let depth = 1;
    let dc = system.runInterval(() => {
      bobberBlock = bobberBlock?.below(1);
      if (bobberBlock && bobberBlock.typeId == "minecraft:water" && depth < 6)
        depth++;
      else system.clearRun(dc);
    }, 2);
    system.runTimeout(() => {
      if (!bobber.isValid()) return;
      let rot = player.getRotation().y;
      if (rot < -135 || rot > 135) rot = 180;
      else if (rot > -135 && rot < -45) rot = -90;
      else if (rot > -45 && rot < 45) rot = 0;
      else rot = 90;
      if (rot != 180) {
        sendError(player, `Invalid fishing spot.`);
        bobber.kill();
        return;
      }
      playTutorial(player, {
        id: "fishing",
        lines: [
          "Welcome to §3Fishing§f!",
          "Here on §dskyblock§f, fishing is a little different, so §cpay attention§f!",
          "Shortly after §ecasting§f, you should see a §bfish§f in the water.",
          "Strafe §bleft§r and §aright§r to try and §6catch§f it.",
          "Once the §6catch §emeter§f reaches §2100%%§f, you've caught the fish!",
          "§9That's all there is to it!\n§3Good luck out there, §bAngler§3!",
        ],
      });
      player.runCommandAsync(`camera @s fade time 1 1.5 1`);
      player.runCommand(`inputpermission set @s movement disabled`);
      player.runCommand(`inputpermission set @s camera disabled`);
      player.addEffect("slowness", 99999, {
        amplifier: 5,
        showParticles: false,
      });
      system.runTimeout(() => {
        player.playSound(`random.ocean`);
        player.runCommand(`inputpermission set @s movement enabled`);
        player.runCommandAsync(
          `camera @s set palm:cutscene ease 3 linear pos ~ ~6 ~ rot 70 ${rot}`
        );
        player.addTag("palm:fishing");
        let checkCamera = 0;
        let elapsed = 0;
        let catcher = 0;
        let fish: Entity | undefined;
        let mh = player
          .getComponent("equippable")
          ?.getEquipment(EquipmentSlot.Mainhand);
        let enchants: EnchantData[] = [];
        if (mh) enchants = Enchant.getEnchants(mh);
        let wire = enchants.find((x) => x.id == "wire");
        let stopFish = system.runInterval(() => {
          elapsed++;
          if (
            !bobber.isValid() ||
            elapsed > 90 ||
            Math.abs((bobberBlock?.location.z ?? -9999) - player.location.z) >
              8 ||
            overworld.getBlock(player.location)?.typeId == "minecraft:water"
          ) {
            player.removeTag("palm:fishing");
            player.runCommandAsync(`camera @s fade time 0.5 1 0.5`);
            system.runTimeout(() => {
              if (fish) fish.remove();
              if (elapsed > 90)
                sendAlert(
                  player,
                  `§cThe fish got away.\n§r§7Better luck next time!`
                );
              else if (
                Math.abs(
                  (bobberBlock?.location.z ?? -9999) - player.location.z
                ) > 8
              )
                sendAlert(player, `§cCast too far.\n§r§7Your line snapped!`);
              player.camera.clear();
              player.removeEffect("slowness");
              if (wire) player.removeEffect("speed");
              player.runCommandAsync(`stopsound @s random.ocean`);
              player.runCommand(`inputpermission set @s camera enabled`);
              if (bobber.isValid()) bobber.kill();
            }, 12);
            system.clearRun(stopFish);
            return;
          }
          if (wire && !player.getEffect("speed"))
            player.addEffect("speed", 99999, {
              amplifier: Math.ceil(wire.level / 4) - 1,
              showParticles: false,
            });
          if (!fish && elapsed > 20 && randomIntFromInterval(1, 3) == 1) {
            fish = overworld.spawnEntity(
              "cod",
              bobberBlock?.above(1)?.location ?? bobber.location
            );
            player.playSound(`mob.dolphin.splash`);
          }
          if (fish && Math.abs(fish.location.x - player.location.x) < 0.25)
            if (randomIntFromInterval(1, 2) && catcher < 9) {
              let chum = enchants.find((x) => x.id == "chum");
              if (chum && randomIntFromInterval(1, 8 - chum.level) == 1)
                catcher++;
              catcher++;
              fish.nameTag = `§b${player.name}§3's Fish\n§6Catching: ${
                catcher < 3
                  ? "§c"
                  : catcher < 5
                  ? "§e"
                  : catcher < 8
                  ? "§a"
                  : "§2"
              }${Math.min(catcher, 10) * 10}%`;
            } else {
              fish.nameTag = `§b${player.name}§3's Fish\n§6Catching: §2100%`;
              player.removeTag("palm:fishing");
              player.runCommand(`inputpermission set @s camera enabled`);
              player.runCommandAsync(`camera @s fade time 0.5 1 0.5`);
              system.runTimeout(() => {
                let v = fish?.getComponent("variant")?.value;
                if (fish) fish.remove();
                player.camera.clear();
                player.removeEffect("slowness");
                if (wire) player.removeEffect("speed");
                player.runCommandAsync(`stopsound @s random.ocean`);
                if (bobber.isValid()) bobber.kill();
                //
                let variant = FISH_VARIANTS[v ?? 0];
                player.playSound(`note.bell`, { pitch: 1.5 });
                sendAlert(player, `§aYou caught a ${variant.name}§a!`);
                let twindle = enchants.find((x) => x.id == "twindle");
                player.runCommandAsync(
                  `give @s ${variant.item} ${
                    twindle
                      ? randomIntFromInterval(1, 7 - twindle.level) == 1
                        ? 2
                        : 1
                      : 1
                  }`
                );
                if (variant.id < 3) {
                  let angler = enchants.find((x) => x.id == "angler");
                  if (randomIntFromInterval(10, 20 - depth * 2 + 2) < 12) {
                    if (randomIntFromInterval(1, 3) == 1) {
                      giveMoney(player, variant, 50, 500);
                    } else
                      giveXP(player, variant, 6, 15 + (angler?.level ?? 0));
                  }
                } else {
                  let m = 1;
                  if (variant.id == 4) m = 2;
                  if (randomIntFromInterval(1, 3) == 1) {
                    giveMoney(player, variant, 500 * m, 10000 * m);
                  } else giveXP(player, variant, 80 * m, 180 * m);
                }
                let privateer = enchants.find((x) => x.id == "privateer");
                if (privateer)
                  giveRelic(
                    player,
                    rollRelic("FISHING", privateer.level * 7),
                    1
                  );
                //
              }, 12);
              system.clearRun(stopFish);
            }
          let bobLoc = bobber.location;
          bobLoc.x = player.location.x;
          if (overworld.getBlock(bobLoc)?.typeId != "minecraft:water") {
            if (!bobberBlock) return;
            let dirZ = bobLoc.z - player.location.z;
            player.applyKnockback(
              dirZ,
              0,
              bobberBlock.location.x - player.location.x > 0 ? -0.25 : 0.25,
              0
            );
          }
          if (checkCamera < 3) checkCamera++;
          else {
            player.runCommandAsync(
              `camera @s set palm:cutscene ease 0.5 linear pos ~ ~6 ~ rot 70 ${rot}`
            );
            checkCamera = 0;
          }
          bobber.teleport(bobLoc);
        }, 5);
      }, 25);
    }, randomIntFromInterval(20, 80));
  }, 20);
});

interface FishVariant {
  id: number;
  name: string;
  item: string;
}

interface FishCrate {
  id: number;
  name: string;
  weight: number;
  table: FishLoot[];
}

type FishLoot = {
  weight: number;
  item?: {
    id: string;
    amount?: [min: number, max: number];
  };
  function?: Function;
};

function giveXP(
  player: Player,
  variant: FishVariant,
  min: number,
  max: number
) {
  let amount = randomIntFromInterval(min, max);
  player.addExperience(amount);
  sendAlert(
    player,
    `§eYou found §d${formatNumber(amount)} §l§aXP§r §efrom ${variant.name}§e!`
  );
}

function giveMoney(
  player: Player,
  variant: FishVariant,
  min: number,
  max: number
) {
  let amount = randomIntFromInterval(min, max);
  let pdata = playerDB.get(player.id);
  pdata.coins = pdata.coins + amount;
  playerDB.set(player.id, pdata);
  sendAlert(
    player,
    `§eYou found §5$§d${formatNumber(amount)} §efrom ${variant.name}§e!`
  );
}

let FISH_VARIANTS: FishVariant[] = [
  {
    id: 0,
    name: "§cRed Snapper",
    item: "tropical_fish",
  },
  {
    id: 1,
    name: "§2Sea Bass",
    item: "salmon",
  },
  {
    id: 2,
    name: "§3Mackerel",
    item: "cod",
  },
  {
    id: 3,
    name: "§fSilve§7rboi",
    item: "palm:silverboi",
  },
  {
    id: 4,
    name: "§eGol§gden§6boi",
    item: "palm:goldenboi",
  },
];
