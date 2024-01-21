import {
  Entity,
  EntityDamageCause,
  EquipmentSlot,
  Player,
  ScoreboardObjective,
  Vector,
  world,
} from "@minecraft/server";
import { randomIntFromInterval } from "../main";
import { formatItemName } from "../economy/itemcloud";
import { Enchant } from "../custom_enchants/enchantHandler";

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
    xp: [0, 1],
    loot: [
      { item: "chicken", smelt: "cooked_chicken", amount: [1, 1] },
      { item: "feather", amount: [0, 2] },
    ],
    price: 3000000,
  },
  {
    name: "§l§dPig",
    id: "pig",
    health: 10,
    xp: [0, 2],
    loot: [{ item: "porkchop", smelt: "cooked_porkchop", amount: [1, 3] }],
    price: 4000000,
  },
  {
    name: "§l§fSheep",
    id: "sheep",
    health: 10,
    xp: [0, 2],
    loot: [
      { item: "mutton", smelt: "mutton", amount: [1, 2] },
      { item: "white_wool", amount: [1, 1] },
    ],
    price: 5000000,
  },
  {
    name: "§l§6Cow",
    id: "cow",
    health: 10,
    xp: [0, 3],
    loot: [
      { item: "beef", smelt: "cooked_beef", amount: [1, 3] },
      { item: "leather", amount: [1, 2] },
    ],
    price: 6000000,
  },
  {
    name: "§l§cMooshroom",
    id: "mooshroom",
    health: 10,
    xp: [0, 4],
    loot: [
      { item: "beef", smelt: "cooked_beef", amount: [2, 5] },
      { item: "leather", amount: [1, 4] },
    ],
    price: 7000000,
  },
  {
    name: "§l§2Zombie",
    id: "zombie",
    health: 20,
    xp: [1, 3],
    loot: [{ item: "rotten_flesh", amount: [1, 4] }],
    price: 7500000,
  },
  {
    name: "§l§4Spider",
    id: "spider",
    health: 16,
    xp: [1, 4],
    loot: [
      { item: "string", amount: [1, 3] },
      { item: "spider_eye", amount: [1, 1] },
    ],
    price: 8500000,
  },
  {
    name: "§l§aCreeper",
    id: "creeper",
    health: 20,
    xp: [2, 4],
    loot: [{ item: "gunpowder", amount: [1, 4] }],
    price: 9000000,
  },
  {
    name: "§l§7Skeleton",
    id: "skeleton",
    health: 20,
    xp: [1, 3],
    loot: [{ item: "bone", amount: [1, 3] }],
    price: 10000000,
  },
  {
    name: "§l§eBlaze",
    id: "blaze",
    health: 25,
    xp: [2, 5],
    loot: [{ item: "blaze_rod", amount: [1, 2] }],
    price: 11000000,
  },
  {
    name: "§l§8Wither Skeleton",
    id: "wither_skeleton",
    health: 40,
    xp: [2, 6],
    loot: [
      { item: "coal", amount: [1, 4] },
      { item: "bone", amount: [1, 3] },
    ],
    price: 12500000,
  },
  {
    name: "§l§fIron Golem",
    id: "iron_golem",
    health: 90,
    xp: [2, 7],
    loot: [
      { item: "iron_ingot", amount: [1, 5] },
      { item: "red_flower", amount: [1, 2] },
    ],
    price: 13000000,
  },
  {
    name: "§l§cZombie Pigman",
    id: "zombie_pigman",
    health: 50,
    xp: [3, 8],
    loot: [
      { item: "gold_ingot", amount: [1, 6] },
      { item: "gold_nugget", amount: [1, 5] },
    ],
    price: 14000000,
  },
];

function lootTheRoom(
  player: Player,
  id: string,
  entityInfo?: SpawnerEntity,
  fire?: boolean
) {
  if (!entityInfo)
    entityInfo = SpawnerEntities.find((x) => x.id == id.slice(10));
  if (!entityInfo) return;
  let loot = entityInfo.loot;
  let multi = 1;
  let mh = player
    .getComponent("equippable")
    ?.getEquipment(EquipmentSlot.Mainhand);
  if (mh) {
    let procure = Enchant.getEnchant(mh, "procure");
    if (procure) {
      if (randomIntFromInterval(1, 26 - procure.level * 2) == 1) {
        multi = Math.ceil(randomIntFromInterval(1, procure.level) / 3);
      }
    }
  }
  for (let l of loot) {
    if (fire == true && l.smelt) {
      player.runCommandAsync(
        `give @s ${l.smelt} ${randomIntFromInterval(
          l.amount[0],
          l.amount[1] * multi
        )}`
      );
    } else
      player.runCommandAsync(
        `give @s ${l.item} ${randomIntFromInterval(
          l.amount[0],
          l.amount[1] * multi
        )}`
      );
    player.addExperience(
      randomIntFromInterval(entityInfo.xp[0], entityInfo.xp[1])
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
  if (data.damageSource.cause == EntityDamageCause.void) {
    data.hurtEntity.kill();
    return;
  }
  if (
    data.damageSource.cause != EntityDamageCause.entityAttack ||
    !data.damageSource.damagingEntity
  )
    return;
  let obj = world.scoreboard.getObjective("mobCount");
  let ent = data.hurtEntity;
  let healthObj = world.scoreboard.getObjective("mobHealth");
  healthObj?.addScore(ent, -data.damage);
  if ((healthObj?.getScore(data.hurtEntity) ?? 0) <= 0) {
    let fire = ent.getComponent("onfire") ? true : false;
    if (obj && getScoreEnt(obj, data.hurtEntity) <= 1) {
      ent.kill();
      lootTheRoom(
        <Player>data.damageSource.damagingEntity,
        ent.typeId,
        undefined,
        fire
      );
      return;
    }
    data.hurtEntity.getComponent("health")?.resetToMaxValue();
    let entInfo = SpawnerEntities.find((x) => x.id == ent.typeId.slice(10));
    if (!entInfo) return;
    healthObj?.setScore(ent, entInfo?.health);
    let score = obj?.getScore(ent) ?? 0;
    obj?.setScore(ent, --score);
    ent.nameTag = `§l§c${formatItemName(
      ent.typeId.slice(10) ?? ""
    )} §r§ex${score}`;
    lootTheRoom(
      <Player>data.damageSource.damagingEntity,
      ent.typeId,
      entInfo,
      fire
    );
  }
});
