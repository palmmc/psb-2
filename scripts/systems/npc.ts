import {
  EnchantmentSlot,
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
import { PREFIX, randomIntFromInterval, sendError, warpList } from "../main";
import { OpenShopBeta } from "../economy/shop";
import { islandManage } from "../island/manage";
import { Enchant } from "../custom_enchants/enchantHandler";
import {
  EnchantSlot,
  animateBlacksmith,
} from "../custom_enchants/customEnchants";

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
    name: "§8§lBlacksmith§r\n§cCLICK TO USE",
    id: "palm:blacksmith",
    location: new Vector(-45.5, 90, -15.5),
    facing: new Vector(-45.5, 91.5, -19.5),
    function: function (player: Player, npc: Entity) {
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
      if (enchants.length >= 5) return;
      function getSlotKey() {
        for (const key of Object.keys(EnchantSlot)) {
          //@ts-ignore
          if (EnchantSlot[key].includes(item?.typeId)) {
            return key as keyof EnchantmentSlot;
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
      const inv = (<EntityInventoryComponent>player.getComponent("inventory"))
        .container;
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
      animateBlacksmith(player, npc, type, ench?.ench, accuracy);
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
  let findNpc = NPC_LIST.find((x) => x.name == data.hitEntity.nameTag);
  if (!findNpc) return;
  let player = <Player>data.damagingEntity;
  if (player.getItemCooldown("npc") > 0) {
    sendError(player, "This action is on cooldown.");
    return;
  }
  player.startItemCooldown("npc", 20);
  findNpc.function(player, data.hitEntity);
});

world.afterEvents.playerInteractWithEntity.subscribe((data) => {
  let findNpc = NPC_LIST.find((x) => x.name == data.target.nameTag);
  if (!findNpc) return;
  let player = data.player;
  if (player.getItemCooldown("npc") > 0) {
    sendError(player, "This action is on cooldown.");
    return;
  }
  player.startItemCooldown("npc", 20);
  findNpc.function(player);
});
