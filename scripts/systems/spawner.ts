import {
  Entity,
  EntityDamageCause,
  EquipmentSlot,
  ItemStack,
  Player,
  ScoreboardObjective,
  Vector,
  Vector3,
  system,
  world,
} from "@minecraft/server";
import { IslandMethods, PREFIX, randomIntFromInterval } from "../main";
import { formatItemName } from "../economy/itemcloud";
import { Enchant } from "../custom_enchants/enchantHandler";
import { getIslandOn } from "../island/manage";

const overworld = world.getDimension("overworld");

interface SpawnerEntity {
  name: string;
  id: string;
  health: number;
  xp: [min: number, max: number];
  loot: SpawnerLoot[];
  price: number;
}

type SpawnerLoot = {
  item: string;
  smelt?: string;
  amount: [min: number, max: number];
};

export const SpawnerEntities: SpawnerEntity[] = [
  {
    name: "§l§fChicken",
    id: "chicken",
    health: 4,
    xp: [1, 2],
    loot: [
      { item: "chicken", smelt: "cooked_chicken", amount: [1, 1] },
      { item: "feather", amount: [1, 2] },
    ],
    price: 500000,
  },
  {
    name: "§l§dPig",
    id: "pig",
    health: 10,
    xp: [1, 2],
    loot: [{ item: "porkchop", smelt: "cooked_porkchop", amount: [1, 3] }],
    price: 750000,
  },
  {
    name: "§l§fSheep",
    id: "sheep",
    health: 10,
    xp: [1, 2],
    loot: [
      { item: "mutton", smelt: "mutton", amount: [1, 2] },
      { item: "white_wool", amount: [1, 1] },
    ],
    price: 1000000,
  },
  {
    name: "§l§6Cow",
    id: "cow",
    health: 10,
    xp: [1, 3],
    loot: [
      { item: "beef", smelt: "cooked_beef", amount: [1, 3] },
      { item: "leather", amount: [1, 3] },
    ],
    price: 1500000,
  },
  {
    name: "§l§cMooshroom",
    id: "mooshroom",
    health: 10,
    xp: [2, 3],
    loot: [
      { item: "beef", smelt: "cooked_beef", amount: [2, 5] },
      { item: "leather", amount: [1, 4] },
    ],
    price: 2000000,
  },
  {
    name: "§l§2Zombie",
    id: "zombie",
    health: 20,
    xp: [3, 4],
    loot: [{ item: "rotten_flesh", amount: [1, 6] }],
    price: 2500000,
  },
  {
    name: "§l§4Spider",
    id: "spider",
    health: 16,
    xp: [3, 4],
    loot: [
      { item: "string", amount: [1, 4] },
      { item: "spider_eye", amount: [1, 2] },
    ],
    price: 3000000,
  },
  {
    name: "§l§aCreeper",
    id: "creeper",
    health: 20,
    xp: [3, 5],
    loot: [{ item: "gunpowder", amount: [1, 5] }],
    price: 3250000,
  },
  {
    name: "§l§7Skeleton",
    id: "skeleton",
    health: 20,
    xp: [4, 6],
    loot: [{ item: "bone", amount: [1, 3] }],
    price: 4000000,
  },
  {
    name: "§l§8Wither Skeleton",
    id: "wither_skeleton",
    health: 40,
    xp: [4, 7],
    loot: [
      { item: "coal", amount: [1, 6] },
      { item: "bone", amount: [1, 4] },
    ],
    price: 4500000,
  },
  {
    name: "§l§eBlaze",
    id: "blaze",
    health: 30,
    xp: [5, 7],
    loot: [{ item: "blaze_rod", amount: [1, 6] }],
    price: 5000000,
  },
  {
    name: "§l§fIron Golem",
    id: "iron_golem",
    health: 90,
    xp: [6, 7],
    loot: [
      { item: "iron_ingot", amount: [1, 20] },
      { item: "red_flower", amount: [1, 4] },
    ],
    price: 5500000,
  },
  {
    name: "§l§cZombie Pigman",
    id: "zombie_pigman",
    health: 50,
    xp: [6, 8],
    loot: [
      { item: "gold_ingot", amount: [1, 22] },
      { item: "gold_nugget", amount: [1, 16] },
    ],
    price: 6000000,
  },
];

export function lootTheRoom(
  id: string,
  loc: Vector3,
  player?: Player,
  fire?: boolean,
  am?: number
) {
  let entityInfo = SpawnerEntities.find((x) => x.id == id.slice(10));
  if (!entityInfo) return;
  let loot = entityInfo.loot;
  let multi = 1;
  if (player) {
    let mh = player
      .getComponent("equippable")
      ?.getEquipment(EquipmentSlot.Mainhand);
    if (mh) {
      let procure = Enchant.getEnchant(mh, "procure");
      if (procure) {
        if (randomIntFromInterval(1, 23 - procure.level * 2) == 1) {
          multi = Math.ceil(
            randomIntFromInterval(1, Math.floor(procure.level / 2.5))
          );
        }
      }
    }
  }
  for (let l of loot) {
    let a =
      randomIntFromInterval(l.amount[0] * multi, l.amount[1] * multi) *
      (am ?? 1);
    if (fire == true && l.smelt) {
      if (player) player.runCommandAsync(`give @s ${l.smelt} ${a}`);
      else overworld.spawnItem(new ItemStack(l.smelt, a), loc);
    } else {
      if (player) player.runCommandAsync(`give @s ${l.item} ${a}`);
      else overworld.spawnItem(new ItemStack(l.item, a), loc);
    }
    if (player)
      player.addExperience(
        randomIntFromInterval(entityInfo.xp[0], entityInfo.xp[1]) * (am ?? 1)
      );
  }
}

function getScoreEnt(obj: ScoreboardObjective, entity: Entity) {
  try {
    return obj?.getScore(entity) ?? 99;
  } catch (e) {
    return 99;
  }
}

world.afterEvents.entityHurt.subscribe((data) => {
  if (
    data.damageSource.cause == EntityDamageCause.void ||
    data.damageSource.cause == EntityDamageCause.suicide
  ) {
    data.hurtEntity.kill();
    return;
  }
  if (
    overworld.getBlock(data.hurtEntity.location)?.typeId == "minecraft:campfire"
  )
    return;
  // ISLAND PERMS
  if (data.damageSource.cause == EntityDamageCause.entityAttack) {
    let player = <Player>data.damageSource.damagingEntity;
    if (player) {
      const idata = getIslandOn(player);
      if (idata && !player.hasTag("admin:bypass")) {
        if (IslandMethods.isInBounds(idata, player.location) == true) {
          if (
            IslandMethods.getPermission(idata, player, "attack") == true ||
            idata.owners.find((x) => x.id == player.id)
          ) {
          } else {
            data.hurtEntity.getComponent("health")?.resetToMaxValue();
            data.hurtEntity.clearVelocity();
            system.run(() => {
              if (player.getItemCooldown("hit") != 0) return;
              player.playSound(`item.trident.riptide_1`, { volume: 0.6 });
              player.sendMessage(
                `${PREFIX.island} §cYou cannot hit entities here.`
              );
              player.startItemCooldown("hit", 15);
            });
            return;
          }
        }
      }
    }
  }
  //

  let damage = data.damage;
  if (data.damageSource.cause == EntityDamageCause.freezing) damage *= 5;
  let obj = world.scoreboard.getObjective("mobCount");
  let ent = data.hurtEntity;
  let healthObj = world.scoreboard.getObjective("mobHealth");
  healthObj?.addScore(ent, -damage);
  if ((healthObj?.getScore(data.hurtEntity) ?? 0) <= 0) {
    let fire = ent.getComponent("onfire") ? true : false;
    if (obj && getScoreEnt(obj, data.hurtEntity) <= 1) {
      if (!ent.location) return;
      lootTheRoom(
        ent.typeId,
        ent.location,
        <Player>data.damageSource.damagingEntity,
        fire
      );
      ent.kill();
      return;
    }
    ent.getComponent("health")?.resetToMaxValue();
    let entInfo = SpawnerEntities.find((x) => x.id == ent.typeId.slice(10));
    if (!entInfo) return;
    healthObj?.setScore(ent, entInfo?.health);
    let score = obj?.getScore(ent) ?? 0;
    let amount = 1;
    if (data.damageSource.damagingEntity) {
      let player = <Player>data.damageSource.damagingEntity;
      let mh = player
        .getComponent("equippable")
        ?.getEquipment(EquipmentSlot.Mainhand);
      if (mh) {
        let fracture = Enchant.getEnchant(mh, "fracture");
        if (fracture) {
          if (randomIntFromInterval(1, 22 - fracture.level * 2) == 1) {
            amount += randomIntFromInterval(1, 2);
          }
        }
      }
    }
    obj?.setScore(ent, score - amount);
    ent.nameTag = `§l§c${formatItemName(
      ent.typeId.slice(10) ?? ""
    )} §r§ex${score}\n §8§l[§r §d${healthObj?.getScore(ent)}§8/§c${
      entInfo.health
    } §8§l]`;
    if (!ent.location) return;
    lootTheRoom(
      ent.typeId,
      ent.location,
      <Player>data.damageSource.damagingEntity,
      fire,
      amount
    );
  }
});
