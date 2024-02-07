import {
  Entity,
  EntityDamageCause,
  EntityEquippableComponent,
  EntityInventoryComponent,
  EquipmentSlot,
  Player,
  ScoreboardObjective,
  Vector,
  system,
  world,
} from "@minecraft/server";
import {
  Island,
  PREFIX,
  formatNumber,
  formatTime,
  randomIntFromInterval,
  sendAlert,
  sendError,
  warpList,
} from "../main";
import { OpenShopBeta } from "../economy/shop";
import { getIslandOn, islandManage } from "../island/manage";
import { Enchant } from "../custom_enchants/enchantHandler";
import {
  CHARMS,
  CombinerItems,
  EnchantSlot,
  animateBlacksmith,
  useCharm,
} from "../custom_enchants/customEnchants";
import { ChestFormData } from "../chest-ui/forms";
import { JsonDatabase } from "../database";
import { xpToLevel } from "../island/levels";
import { blackJackGame, stacksGame } from "../economy/casino";

// Initialize Databases
var playerDB: any = undefined;
var islandDB: any = undefined;
world.afterEvents.worldInitialize.subscribe((data) => {
  system.runTimeout(() => {
    playerDB = new JsonDatabase("playerDB", world);
    islandDB = new JsonDatabase("islandDB", world);

    system.runInterval(() => {
      for (let lb of LEADERBOARDS) {
        // Find leaderboard
        let ent = overworld.getEntities({
          type: "palm:leaderboard",
          location: lb.location,
          maxDistance: 1.5,
        })[0];
        if (!ent) ent = overworld.spawnEntity("palm:leaderboard", lb.location);
        let display = lb.header;
        if (lb.objective) {
          let obj = world.scoreboard.getObjective(`offline:${lb.objective}`);
          if (!obj) return;
          for (let p of world.getPlayers()) {
            obj.setScore(
              "o" + p.name,
              world.scoreboard.getObjective(lb.objective)?.getScore(p) ?? 0
            );
            world.scoreboard
              .getObjective("offline:xp")
              ?.setScore("o" + p.name, p.getTotalXp());
          }
          let i = 1;
          let scores = obj.getScores().sort((a, b) => b.score - a.score);
          scores = scores.slice(0, Math.min(scores.length, 9));
          for (let p of scores) {
            display += `\n ${lb.format
              .replace("%a", i.toString())
              .replace("%b", p.participant.displayName.slice(1))
              .replace(
                "%c",
                lb.objective == "time"
                  ? `${Math.floor(p.score / 3600)}h:§6${
                      Math.floor(p.score / 60) % 60
                    }m`
                  : p.score.toString()
              )} `;
            i++;
          }
        } else if (lb.stat) {
          if (lb.stat.db == "player") {
            let db = playerDB;
            let i = 1;
            let score = new Array();
            for (let data of db.entries()) {
              score.push([data[1].name, Number(data[1].coins)]);
            }
            for (let data of score.sort((a, b) => b[1] - a[1])) {
              if (i > 9) continue;
              display += `\n ${lb.format
                .replace("%a", i.toString())
                .replace("%b", data[0])
                .replace("%c", formatNumber(data[1]))} `;
              i++;
            }
          } else {
            let db = islandDB;
            let i = 1;
            let score = new Array();
            for (let data of db.entries()) {
              score.push([data[1].name, Number(data[1].points)]);
            }
            for (let data of score.sort((a, b) => b[1] - a[1])) {
              if (i > 9) continue;
              display += `\n ${lb.format
                .replace("%a", i.toString())
                .replace("%b", data[0])
                .replace("%c", xpToLevel(data[1]).toString())} `;
              i++;
            }
          }
        }
        ent.nameTag = display;
      }
    }, 240);
  }, 180);
});

const overworld = world.getDimension("overworld");

interface NPC {
  name: string;
  id: string;
  location: Vector;
  facing?: Vector;
  function: Function;
  followPlayer: boolean;
}

const NPC_LIST: NPC[] = [
  {
    name: "§a§lShopkeeper§r\n§4[§c§lNEW!§r§4] §dSpawners",
    id: "palm:slapper_guide",
    location: new Vector(-0.5, 92, 9.5),
    function: OpenShopBeta,
    followPlayer: false,
  },
  {
    name: "§6§lManage Island§r\n§eCLICK TO OPEN",
    id: "palm:slapper_farmer",
    location: new Vector(5.5, 92, 8.5),
    function: islandManage,
    followPlayer: false,
  },
  {
    name: "§c§lBattle Arena§r\n§dComing Soon!",
    id: "palm:slapper_miner",
    location: new Vector(10.5, 92, 4.5),
    function: function Empty() {},
    followPlayer: false,
  },
  {
    name: "§d§lWarps§r\n§eCLICK TO OPEN",
    id: "palm:slapper_huntress",
    location: new Vector(11.5, 92, -0.5),
    function: function (player: Player) {
      warpList(player, "-warp list 1");
    },
    followPlayer: false,
  },
  {
    name: "§b§lFountain of §9Refinement§r\n§cRefines §6C§eE §cBooks\n§dINTERACT TO USE",
    id: "palm:leaderboard",
    location: new Vector(-47.5, 92.7, -30.5),
    function: function (player: Player) {},
    followPlayer: false,
  },
  {
    name: "",
    id: "palm:slotmachine",
    location: new Vector(-22.5, 89, -48.3),
    facing: new Vector(-22.5, 90, -45),
    function: function (player: Player) {
      stacksGame(player);
    },
    followPlayer: false,
  },
  {
    name: " ",
    id: "palm:table",
    location: new Vector(-21.5, 89, -44.5),
    facing: new Vector(-21.5, 90, -41),
    function: function (player: Player) {
      blackJackGame(player);
    },
    followPlayer: false,
  },
  {
    name: "§8§lBlacksmith§r\n§cCLICK TO USE",
    id: "palm:blacksmith",
    location: new Vector(-45.5, 90, -15.5),
    facing: new Vector(-45.5, 91.5, -19.5),
    function: function (player: Player, npc: Entity) {
      const gui = new ChestFormData("magenta");
      gui.title("§8§lBlacksmith");
      gui.pattern([0, 0], ["xxxxxxxxx", "x_______x", "xxxxxxxxx"], {
        x: {
          data: { itemName: "", itemDesc: [], enchanted: false, stackSize: 1 },
          iconPath: "textures/blocks/glass_white.png",
        },
      });
      gui.button(
        12,
        "§6§lCombiner",
        [`§cMerge refined enchantments\nonto held item.`],
        "ender_eye",
        1,
        true
      );
      gui.button(
        14,
        "§d§lCharms",
        [`§9Use charms from inventory.`],
        "nautilus_shell",
        1,
        true
      );
      gui.show(player).then((result) => {
        if (result.selection == 12) {
          const equip = <EntityEquippableComponent>(
            player.getComponent("equippable")
          );
          let item = equip.getEquipment(EquipmentSlot.Mainhand);
          if (!item) {
            sendError(
              player,
              `You must hold the item that you want to be enchanted.`,
              PREFIX.ce
            );
            return;
          }
          const enchants = Enchant.getEnchants(item);
          if (enchants.length >= 7) return;
          function getSlotKey() {
            for (const key of Object.keys(EnchantSlot)) {
              //@ts-ignore
              if (EnchantSlot[key].includes(item?.typeId)) {
                return key;
              }
            }
          }
          let type = getSlotKey();
          if (!type) return;
          function findEnchInInv(player: Player) {
            const inventory = (<EntityInventoryComponent>(
              player.getComponent("inventory")
            )).container;
            for (let i = 0; i < 36; i++) {
              if (!inventory) return 0;
              let it = inventory.getItem(i);
              if (it?.typeId !== `minecraft:ender_eye`) continue;
              const lore = it.getLore();
              if (!lore) continue;
              const enchants = Enchant.getEnchants(it);
              if (!enchants) continue;
              const tier = lore[lore.length - 1].slice(16);
              function matchEnch() {
                for (let e of enchants) {
                  if (!e.info.type?.includes(item?.typeId ?? "")) continue;
                  return e;
                }
              }
              return { slot: i, ench: matchEnch(), tier };
            }
          }
          const inv = (<EntityInventoryComponent>(
            player.getComponent("inventory")
          )).container;
          const ench = findEnchInInv(player);
          if (!ench || !ench.ench) {
            sendError(
              player,
              `Found no enchantments to combine in inventory.`,
              PREFIX.ce
            );
            return;
          }
          if (Enchant.getEnchants(item).find((x) => x.id == ench.ench?.id)) {
            sendError(
              player,
              `This enchantment is already applied to this item.`,
              PREFIX.ce
            );
            return;
          }
          if (ench.ench.info.incompatible) {
            let incompatible = ench.ench.info.incompatible;
            let incompEnch = new Array();
            for (let e of enchants) {
              if (incompatible.includes(e.id)) incompEnch.push(e.info.display);
            }
            if (incompEnch.length > 0) {
              sendError(
                player,
                `This enchantment is incompatible with existing enchantments:`,
                PREFIX.ce
              );
              for (let inc of incompEnch) {
                player.sendMessage(`§7 - ${inc}`);
              }
              return;
            }
          }
          if (!inv) return;
          inv.setItem(ench?.slot ?? -1);
          let accuracy = randomIntFromInterval(20, 40);
          if (ench.tier == "Iron") accuracy = randomIntFromInterval(40, 60);
          if (ench.tier == "Gold") accuracy = randomIntFromInterval(60, 80);
          if (ench.tier == "Diamond") accuracy = randomIntFromInterval(80, 100);
          if (ench.tier == "Emerald") accuracy = 100;
          animateBlacksmith(
            player,
            type as CombinerItems,
            ench?.ench,
            accuracy
          );
        } else if (result.selection == 14) {
          const gui = new ChestFormData("magenta");
          gui.title("§d§lCharms");
          gui.pattern([0, 0], ["xxxxxxxxx", "x_______x", "xxxxxxxxx"], {
            x: {
              data: {
                itemName: "",
                itemDesc: [],
                enchanted: false,
                stackSize: 1,
              },
              iconPath: "textures/blocks/glass_white.png",
            },
          });
          let slots = [10, 12, 14, 16];
          let charms = ["binding", "precision", "expulsion", "attunement"];
          for (let i = 0; i < charms.length; i++) {
            let charmName = charms[i];
            let charmInfo = CHARMS[charmName as keyof typeof CHARMS];
            gui.button(
              slots[i],
              charmInfo.display,
              charmInfo.description,
              "nautilus_shell",
              1,
              true
            );
          }
          gui.show(player).then((result) => {
            if (result.canceled || !slots.includes(result.selection ?? -1))
              return;
            let charm = charms[slots.indexOf(result.selection ?? -1)];
            useCharm(player, charm as keyof typeof CHARMS);
          });
        } else return;
      });
    },
    followPlayer: false,
  },
];

world.afterEvents.worldInitialize.subscribe((data) => {
  system.runTimeout(() => {
    console.warn("Initializing NPCS..");
    for (let npc of NPC_LIST) {
      if (npc.followPlayer == true) continue;
      // Spawn new npc if missing.
      let findNpc = overworld.getEntities({
        location: npc.location,
        maxDistance: 1.5,
        closest: 1,
      })[0];
      if (!findNpc) findNpc = overworld.spawnEntity(npc.id, npc.location);
      findNpc.teleport(findNpc.location, {
        facingLocation: npc.facing ? npc.facing : new Vector(0.5, 92.5, 0.5),
      });
      // Set npc name.
      findNpc.nameTag = npc.name;
    }
  }, 40);
});

world.afterEvents.entityHitEntity.subscribe((data) => {
  let findNpc = NPC_LIST.find((x) => x.id == data.hitEntity.typeId);
  if (!findNpc) return;
  let player = <Player>data.damagingEntity;
  if (player.getItemCooldown("npc") > 0) {
    sendError(player, "This action is on cooldown.");
    return;
  }
  player.startItemCooldown("npc", 30);
  findNpc.function(player, data.hitEntity);
});

world.afterEvents.effectAdd.subscribe((data) => {
  if (data.entity.typeId == "palm:nomad") {
    data.entity.playAnimation("animation.nomad.joy");
    system.runTimeout(() => {
      data.entity.triggerEvent("nomad:kill");
    }, 70);
  }
});

world.afterEvents.itemUse.subscribe((data) => {
  if (data.itemStack.typeId.includes("_gem")) {
    let item = data.itemStack;
    let player = <Player>data.source;
    let gems = 0;
    if (item.typeId == "palm:small_gem") gems = randomIntFromInterval(1, 2);
    else if (item.typeId == "palm:medium_gem")
      gems = randomIntFromInterval(2, 5);
    else if (item.typeId == "palm:large_gem")
      gems = randomIntFromInterval(5, 15);
    else return;
    let pdata = playerDB.get(player.id);
    pdata.gems = pdata.gems + gems;
    playerDB.set(player.id, pdata);
    sendAlert(player, `§eRedeemed §c${gems} Gems`);
    let equip = player.getComponent("equippable");
    if (item.amount > 1) {
      item.amount--;
      equip?.setEquipment(EquipmentSlot.Mainhand, item);
    } else equip?.setEquipment(EquipmentSlot.Mainhand);
  }
});

system.runInterval(() => {
  let completedIslands: Island[] = [];
  for (let player of world.getPlayers()) {
    if (randomIntFromInterval(1, 5) != 1) continue;
    let island: Island | undefined = islandDB.get(
      playerDB.get(player.id).island
    );
    if (!island) continue;
    if (completedIslands.includes(island)) continue;
    completedIslands.push(island);
    // Despawn existing nomads.
    let npcs = overworld.getEntities({
      type: "palm:nomad",
      location: island.spawn,
      maxDistance: 20,
    });
    if (npcs.length > 0) {
      for (let npc of npcs) npc.triggerEvent("nomad:kill");
    }
    // Spawn nomad.
    overworld.spawnEntity("palm:nomad", {
      x: island.spawn.x + 0.5,
      y: island.spawn.y + 1,
      z: island.spawn.z + 0.5,
    });
    for (let owner of island.owners) {
      let ow = world.getPlayers({ name: owner.name })[0];
      if (ow)
        sendAlert(
          ow,
          `§eA §dNomadic Visitor §eteleported to your island.`,
          PREFIX.island
        );
    }
  }
}, 3000);

world.beforeEvents.playerInteractWithEntity.subscribe((data) => {
  // NOMAD CODE
  if (data.target.typeId == "palm:nomad") {
    if (!getIslandOn(data.player)?.owners.find((x) => x.id == data.player.id)) {
      data.cancel = true;
      return;
    }
    /*
    if (data.target.hasTag("palm:oneTrade")) {
      data.target.triggerEvent("nomad:kill");
      return;
    }
    data.target.addTag("palm:oneTrade");
    */
    system.run(() => data.target.playAnimation("animation.nomad.wave"));
  }
  system.run(() => {
    let findNpc = NPC_LIST.find((x) => x.id == data.target.typeId);
    if (!findNpc) return;
    let player = data.player;
    if (player.getItemCooldown("npc") > 0) {
      sendError(player, "This action is on cooldown.");
      return;
    }
    player.startItemCooldown("npc", 30);
    findNpc.function(player);
  });
});

interface Leaderboard {
  header: string;
  format: string;
  objective?: string;
  stat?: {
    db: string;
    path: string;
  };
  location: Vector;
}

const LEADERBOARDS: Leaderboard[] = [
  {
    header: "§b§l---= §eTop Coins §b=---",
    format: "§b%a) §f%b - §6$§e%c",
    stat: {
      db: "player",
      path: "coins",
    },
    location: new Vector(-42.5, 92.5, -50.5),
  },
  {
    header: "§b§l---= §aTop §2Level §b=---",
    format: "§b%a) §f%b - §a%c",
    stat: {
      db: "island",
      path: "points",
    },
    location: new Vector(-38.5, 90.5, -60.5),
  },
  {
    header: "§b§l---= §dTime Played §b=---",
    format: "§b%a) §f%b - §e%c",
    objective: "time",
    location: new Vector(-50.5, 92.5, -55.5),
  },
  {
    header: "§b§l---= §9Top §a§lXP§r §b=---",
    format: "§b%a) §f%b - §a%c",
    objective: "xp",
    location: new Vector(-45.5, 91.5, -63.5),
  },
];

system.runInterval(() => {
  let suits = overworld.getEntities({ type: "palm:suit" });
  for (let suit of suits) {
    if (randomIntFromInterval(1, 8) == 1)
      suit.playAnimation("animation.suit.dance");
    else if (randomIntFromInterval(1, 6) == 1)
      suit.playAnimation("animation.suit.gamble");
  }
}, 140);
