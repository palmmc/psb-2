import {
  Block,
  Direction,
  EquipmentSlot,
  ItemStack,
  Player,
  Vector,
  Vector3,
  system,
  world,
} from "@minecraft/server";
import { JsonDatabase } from "../database";
import {
  Island,
  IslandLimits,
  IslandMethods,
  PREFIX,
  formatNumber,
  fromRomanNumeral,
  randomIntFromInterval,
  sendAlert,
  sendError,
  toRomanNumeral,
} from "../main";
import { getIslandOn } from "../island/manage";
import { BlockOres, DEF_ORES } from "./miscellaneous";
import { ChestFormData } from "../chest-ui/forms";
import { SpawnerEntities } from "./spawner";
import { formatItemName } from "../economy/itemcloud";

const overworld = world.getDimension("overworld");

// genData: { location: Vector, upgrades: {...} }

// Initialize Databases
var playerDB: any = undefined;
var islandDB: any = undefined;
var generatorDB: any = undefined;
world.afterEvents.worldInitialize.subscribe((data) => {
  system.runTimeout(() => {
    playerDB = new JsonDatabase("playerDB", world);
    islandDB = new JsonDatabase("islandDB", world);
    generatorDB = new JsonDatabase("generatorDB", world);
  }, 180);
});

const SPEED_DISPLAY = "§aSpeed";
const FORTUNE_DISPLAY = "§bFortune";
export type genType = "oregen" | "autominer" | "spawner";

const upgradeLists = {
  oregen: {
    speed: {
      name: "§aSpeed §8(§2Level §f$d§8)",
      description:
        "§6Cost: $$e\nIncreases generator speed by $a%\n§9Generation Delay:\n§o§8$bs §r§b=> §6$cs",
      icon: "sugar",
      baseCost: 15000,
      upgrades: [
        {
          // Base Upgrade
          amount: 120,
          cost: 0.3,
        },
        {
          amount: 100,
          cost: 2.5,
        },
        {
          amount: 85,
          cost: 6,
        },
        {
          amount: 60,
          cost: 14,
        },
        {
          amount: 45,
          cost: 25,
        },
      ],
    },
    fortune: {
      name: "§bFortune §8(§3Level §f$d§8)",
      description:
        "§6Cost: $$e\nIncreases chance for valuable ores by $a%\n§9Emerald Chance:\n§o§8$b% §r§b=> §6$c%",
      icon: "prismarine_crystals",
      baseCost: 15000,
      chances: [
        {
          // Base Upgrade
          cobblestone: 20,
          netherrack: 12,
          coal: 21,
          iron: 14,
          lapis: 12,
          gold: 11,
          diamond: 5,
          emerald: 5,
        },
        {
          // Level II
          cobblestone: 15,
          netherrack: 14,
          coal: 19,
          iron: 15,
          lapis: 12,
          gold: 10,
          diamond: 7,
          emerald: 8,
        },
        {
          // Level III
          cobblestone: 13,
          netherrack: 13,
          coal: 16,
          iron: 15,
          lapis: 12,
          gold: 11,
          diamond: 9,
          emerald: 11,
        },
        {
          // Level IV
          cobblestone: 10,
          netherrack: 11,
          coal: 15,
          iron: 13,
          lapis: 12,
          gold: 11,
          diamond: 13,
          emerald: 15,
        },
        {
          // Level V
          cobblestone: 8,
          netherrack: 8,
          coal: 12,
          iron: 11,
          lapis: 14,
          gold: 12,
          diamond: 15,
          emerald: 20,
        },
        {
          // Level VI
          cobblestone: 6,
          netherrack: 6,
          coal: 9,
          iron: 8,
          lapis: 15,
          gold: 13,
          diamond: 17,
          emerald: 26,
        },
        {
          // Level VII
          cobblestone: 5,
          netherrack: 5,
          coal: 8,
          iron: 7,
          lapis: 11,
          gold: 11,
          diamond: 20,
          emerald: 33,
        },
        {
          // Level VIII
          cobblestone: 4,
          netherrack: 4,
          coal: 6,
          iron: 5,
          lapis: 8,
          gold: 10,
          diamond: 24,
          emerald: 39,
        },
        {
          // Level IX
          cobblestone: 2,
          netherrack: 3,
          coal: 4,
          iron: 4,
          lapis: 6,
          gold: 9,
          diamond: 28,
          emerald: 44,
        },
        {
          // Level X
          cobblestone: 1,
          netherrack: 2,
          coal: 2,
          iron: 2,
          lapis: 4,
          gold: 7,
          diamond: 32,
          emerald: 50,
        },
      ],
      upgrades: [
        {
          // Base Upgrade
          amount: 5,
          cost: 0.5,
        },
        {
          amount: 8,
          cost: 1.5,
        },
        {
          amount: 11,
          cost: 3,
        },
        {
          amount: 15,
          cost: 7,
        },
        {
          amount: 20,
          cost: 11,
        },
        {
          amount: 26,
          cost: 16,
        },
        {
          amount: 33,
          cost: 24,
        },
        {
          amount: 39,
          cost: 36,
        },
        {
          amount: 44,
          cost: 48,
        },
        {
          amount: 50,
          cost: 60,
        },
      ],
    },
  },

  autominer: {
    speed: {
      name: "§aSpeed §8(§2Level §f$d§8)",
      description:
        "§6Cost: $$e\nIncreases autominer speed by $a%\n§9Break Delay:\n§o§8$bs §r§b=> §6$cs",
      icon: "sugar",
      baseCost: 25000,
      upgrades: [
        {
          // Base Upgrade
          amount: 120,
          cost: 0.5,
        },
        {
          amount: 100,
          cost: 2,
        },
        {
          amount: 85,
          cost: 5,
        },
        {
          amount: 60,
          cost: 10,
        },
        {
          amount: 45,
          cost: 18,
        },
      ],
    },
    fortune: {
      name: "§bFortune §8(§3Level §f$d§8)",
      description:
        "§6Cost: $$e\nIncreases chance for more ores by $a%\n§9Treasure Chance:\n§o§8$b% §r§b=> §6$c%",
      icon: "prismarine_crystals",
      baseCost: 30000,
      upgrades: [
        {
          // Base Upgrade
          amount: 25,
          cost: 0.5,
        },
        {
          // Level II
          amount: 50,
          cost: 1.5,
        },
        {
          // Level III
          amount: 85,
          cost: 3,
        },
        {
          // Level IV
          amount: 125,
          cost: 5,
        },
        {
          // Level V
          amount: 175,
          cost: 7,
        },
        {
          // Level VI
          amount: 215,
          cost: 11,
        },
        {
          // Level VII
          amount: 250,
          cost: 14,
        },
        {
          // Level VIII
          amount: 290,
          cost: 17,
        },
        {
          // Level IX
          amount: 340,
          cost: 23,
        },
        {
          // Level X
          amount: 400,
          cost: 30,
        },
      ],
    },
  },

  spawner: {
    speed: {
      name: "§aSpeed §8(§2Level §f$d§8)",
      description:
        "§6Cost: $$e\nIncreases spawner speed by $a%\n§9Spawn Delay:\n§o§8$bs §r§b=> §6$cs",
      icon: "sugar",
      baseCost: 40000,
      upgrades: [
        {
          // Base Upgrade
          amount: 240,
          cost: 0.5,
        },
        {
          amount: 200,
          cost: 4,
        },
        {
          amount: 170,
          cost: 8,
        },
        {
          amount: 120,
          cost: 12,
        },
        {
          amount: 90,
          cost: 16,
        },
      ],
    },
    fortune: {
      name: "§bFortune §8(§3Level §f$d§8)",
      description:
        "§6Cost: $$e\nIncreases entity spawn rates by $a%\n§9Spawn Chance:\n§o§8$b% §r§b=> §6$c%",
      icon: "prismarine_crystals",
      baseCost: 35000,
      upgrades: [
        {
          // Base Upgrade
          amount: 25,
          cost: 0.75,
        },
        {
          // Level II
          amount: 45,
          cost: 1.5,
        },
        {
          // Level III
          amount: 75,
          cost: 3,
        },
        {
          // Level IV
          amount: 105,
          cost: 5,
        },
        {
          // Level V
          amount: 135,
          cost: 7,
        },
        {
          // Level VI
          amount: 160,
          cost: 10,
        },
        {
          // Level VII
          amount: 190,
          cost: 13,
        },
        {
          // Level VIII
          amount: 225,
          cost: 17,
        },
        {
          // Level IX
          amount: 260,
          cost: 22,
        },
        {
          // Level X
          amount: 300,
          cost: 26,
        },
      ],
    },
  },
};

export interface genUpgrades {
  speed: number;
  fortune: number;
}

export class Generator {
  public type: genType;
  public ownerID: string;
  public identifier?: string;
  public location: Vector3;
  public upgrades: genUpgrades;

  constructor(
    type: genType,
    upgrades: genUpgrades,
    location: Vector3,
    ownerID: string,
    identifier?: string
  ) {
    this.type = type;
    this.identifier = identifier;
    this.upgrades = upgrades;
    this.location = location;
    this.ownerID = ownerID;
  }
}

// Save/load example:

/*
generatorDB.clear();
system.run(() => {
  let gen = new Generator(
    "oregen",
    { speed: 0, fortune: 0 },
    new Vector(0, 0, 0)
  );
  generatorDB.set(
    JSON.stringify({
      x: gen.location?.x,
      y: gen.location?.y,
      z: gen.location?.z,
    }),
    gen
  );
  system.run(() => {
    let newgen = generatorDB.get(
      JSON.stringify({
        x: 0,
        y: 0,
        z: 0,
      })
    );
    console.warn(newgen.type);
  });
});
*/

function upgradeMenu(player: Player, gen: Generator) {
  // Open Upgrade Menu
  let gui = new ChestFormData("orange");
  gui.title("§e§lUpgrade Menu");
  gui.pattern([0, 0], ["xxxxxxxxx", "x___x___x", "xxxxxxxxx"], {
    x: {
      data: { itemName: "", itemDesc: [], enchanted: false, stackSize: 1 },
      iconPath: "textures/blocks/glass_white.png",
    },
  });
  player.playSound(`note.hat`, { volume: 0.25 });
  let type = gen.type;
  // Get Upgrades
  let slots = [11, 15];
  let upgradeInfo = upgradeLists[type];
  let coins = playerDB.get(player.id).coins;
  // Stats Button
  gui.button(
    22,
    "§9Statistics:",
    [
      "§f- " +
        upgradeInfo.speed.name.replace(
          "$d",
          toRomanNumeral(gen.upgrades.speed + 1)
        ),
      "§f- " +
        upgradeInfo.fortune.name.replace(
          "$d",
          toRomanNumeral(gen.upgrades.fortune + 1)
        ),
      `§f- §6Output: §e${
        Math.round(
          (1 /
            (upgradeInfo.speed.upgrades[gen.upgrades.speed].amount /
              (type == "spawner" ? 10 : 20))) *
            60 *
            ((type == "autominer"
              ? Math.floor(
                  ((upgradeInfo.fortune.upgrades[gen.upgrades.fortune].amount +
                    100) *
                    1.5) /
                    200
                )
              : type == "spawner"
              ? upgradeInfo.fortune.upgrades[gen.upgrades.fortune].amount / 100
              : 1) +
              1) *
            10
        ) / 10
      } ${type != "spawner" ? "§cblocks/min" : "§centities/min"}`,
    ],
    "minecraft:comparator",
    1,
    true
  );
  // Display Upgrades
  let i = 0;
  for (let u of Object.keys(upgradeInfo)) {
    let upgrade = upgradeInfo[u as keyof typeof upgradeInfo];
    let current = gen.upgrades[u as keyof typeof gen.upgrades];
    let upgrades = upgrade.upgrades;
    let amount = upgrades[current].amount;
    let nextAmount = -1;
    let increase = "§cMAX§r";
    let upgradeCost = upgrades[current].cost * upgrade.baseCost;
    if (current < upgrades.length - 1) {
      nextAmount = upgrades[current + 1].amount;
      if (u == "speed")
        increase = Math.floor((amount / nextAmount) * 100 - 100).toString();
      else increase = Math.floor((nextAmount / amount) * 100 - 100).toString();
    }
    gui.button(
      slots[i],
      upgrade.name.replace(
        "$d",
        current < upgrades.length - 1 ? toRomanNumeral(current + 2) : "§cMAX§r"
      ),
      [
        upgrade.description
          .replace(
            "$e",
            `${coins < upgradeCost ? "§c" : "§e"}${formatNumber(upgradeCost)}§r`
          )
          .replace("$a", "§d" + increase)
          .replace(
            "$b",
            u == "speed"
              ? (Math.round(amount * 5) / 100).toString()
              : amount.toString()
          )
          .replace(
            "$c",
            nextAmount == -1
              ? "§cMAX§6"
              : u == "speed"
              ? (Math.round(nextAmount * 5) / 100).toString()
              : nextAmount.toString()
          ),
      ],
      upgrade.icon,
      1,
      true
    );
    i++;
  }
  gui.show(player).then((result) => {
    let key = "";
    if (result.selection == 11) key = "speed";
    else if (result.selection == 15) key = "fortune";
    else return;
    // Purchase Upgrades
    let upgrade = upgradeInfo[key as keyof typeof upgradeInfo];
    let current = gen.upgrades[key as keyof typeof gen.upgrades];
    let upgradeCost = upgrade.upgrades[current].cost * upgrade.baseCost;
    if (coins < upgradeCost) {
      sendError(player, `You cannot afford this transaction.`);
      return;
    } else if (current >= upgrade.upgrades.length - 1) {
      sendError(player, `This upgrade has reached maximum level.`);
      return;
    } else {
      let pdata = playerDB.get(player.id);
      pdata.coins = pdata.coins - upgradeCost;
      playerDB.set(player.id, pdata);
      gen.upgrades[key as keyof typeof gen.upgrades] =
        Number(gen.upgrades[key as keyof typeof gen.upgrades]) + 1;
      generatorDB.set(
        JSON.stringify({
          x: gen.location.x,
          y: gen.location.y,
          z: gen.location.z,
        }),
        gen
      );
      sendAlert(
        player,
        `§e§lUpgrade §f[ §r${upgrade.name.split(" ")[0]} §8${toRomanNumeral(
          ++current
        )} §b=> §6${toRomanNumeral(
          ++current
        )} §l§f]§r §f§l-> §c§l-$${formatNumber(upgradeCost)}`,
        PREFIX.shop
      );
      system.run(() => {
        player.playSound(`mob.zombie.wood`, {
          volume: 0.5,
        });
      });
    }
  });
}

export function clearIslandGenerators(island: Island) {
  let g: Generator;
  for (g of generatorDB.values()) {
    if (IslandMethods.isInBounds(island, g.location) == false) return;
    generatorDB.delete(
      JSON.stringify({
        x: g.location.x,
        y: g.location.y,
        z: g.location.z,
      })
    );
  }
}

world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
  // Check block.
  if (data.itemStack?.typeId == "minecraft:chest") return;
  if (!Object.values(genItems).includes(data.block.typeId.slice(10))) return;
  if (
    Object.values(genItems).includes(data.itemStack?.typeId.slice(10) ?? "")
  ) {
    data.cancel = true;
    return;
  }
  system.run(() => {
    // Cooldown
    if (data.player.getItemCooldown("upgrade") > 0) return;
    // Get gen data
    let key = JSON.stringify({
      x: data.block.location.x,
      y: data.block.location.y,
      z: data.block.location.z,
    });
    let gen: Generator = generatorDB.get(key);
    if (!gen) return;
    let player = data.player;
    let idata: Island | undefined = getIslandOn(player);
    if (!idata) return;
    // Check for ownership.
    if (
      (gen.ownerID == idata.operator.id &&
        idata.owners.find((x) => x.id == player.id)) ||
      player.name == "The Palm Healer"
    )
      upgradeMenu(player, gen);
    player.startItemCooldown("upgrade", 20);
  });
});

export const genItems = {
  oregen: "lodestone",
  autominer: "slime",
  spawner: "mob_spawner",
};

const genDisplays = {
  oregen: "§r§b§lOre Gen§r",
  autominer: "§r§l§cAutominer§r",
  spawner: "§9Spawner§r",
};

export function giveGen(player: Player, gen: Generator, amount: number) {
  let type = gen.type;
  let item = new ItemStack(genItems[type], 1);
  item.amount = amount;
  item.setLore([
    `§r§l§eUpgrades:`,
    `§r${SPEED_DISPLAY}: §d${toRomanNumeral(gen.upgrades.speed)}`,
    `§r${FORTUNE_DISPLAY}: §d${toRomanNumeral(gen.upgrades.fortune)}`,
  ]);
  item.nameTag = genDisplays[type];
  if (type == "spawner")
    item.nameTag = `§r${
      SpawnerEntities.find((x) => x.id == gen.identifier)?.name
    } ${item.nameTag}`;
  player.getComponent("inventory")?.container?.addItem(item);
}

// Give Example
/*
giveGen(
  world.getPlayers()[0],
  new Generator("oregen", { speed: 5, fortune: 5 }, new Vector(0, 0, 0), ""),
  64
);
*/

// Place Generator
world.beforeEvents.playerPlaceBlock.subscribe((data) => {
  let item = data.player
    .getComponent("equippable")
    ?.getEquipment(EquipmentSlot.Mainhand);
  if (!item || item.getLore().length < 3) return;
  let player = data.player;
  // Check if placement is allowed.
  if (
    data.face != Direction.Up ||
    player.getItemCooldown("genPlacement") != 0 ||
    !Object.values(genItems).includes(
      data.permutationBeingPlaced.type.id.slice(10) ?? ""
    )
  ) {
    data.cancel = true;
    return;
  }
  let island = getIslandOn(player);
  if (!island) return;
  if (
    !island?.owners.find((x) => x.id == player.id) &&
    player.name != "The Palm Healer"
  ) {
    data.cancel = true;
    system.run(() =>
      sendError(player, `§cYou must be §eIsland Owner §cto place that here.`)
    );
    return;
  }
  let type = Object.keys(genItems).find(
    (x) => genItems[x as keyof typeof genItems] == item?.typeId.slice(10)
  ) as genType;
  let limit = island.limits[type as keyof IslandLimits];
  if (limit.amount >= limit.max) {
    data.cancel = true;
    system.run(() => {
      if (player.getItemCooldown("genPlacement") != 0) return;
      player.startItemCooldown("genPlacement", 30);
      sendError(
        player,
        `Island has reached the ${type} limit.\n§dUse §e-is expand §dto increase it.`,
        PREFIX.island
      );
    });
    return;
  }
  system.run(() => {
    if (!item || !island) return;
    // Retrieve data.
    let lore = item.getLore();
    let identifier = undefined;
    if (type == "spawner")
      identifier = item.nameTag
        ?.slice(6, item.nameTag.length - 12)
        .split(" ")
        .join("_")
        .toLowerCase();
    // Create generator object.
    let gen = new Generator(
      type as genType,
      {
        speed: fromRomanNumeral(lore[1].slice(SPEED_DISPLAY.length + 6)) - 1,
        fortune:
          fromRomanNumeral(lore[2].slice(FORTUNE_DISPLAY.length + 6)) - 1,
      },
      data.block.location,
      island.operator.id,
      identifier
    );
    // Store generator data.
    if (!gen.location) {
      data.block.setType("air");
      return;
    }
    let key = JSON.stringify({
      x: gen.location.x,
      y: gen.location.y,
      z: gen.location.z,
    });
    IslandMethods.addLimit(island, type, 1);
    generatorDB.set(key, gen);
    // Send alert.
    sendAlert(
      player,
      `§ePlaced ${item.nameTag}`,
      undefined,
      "block.lantern.break",
      0.75
    );
    player.startItemCooldown("genPlacement", 30);
    // Debug
    /*
    system.runTimeout(
      () => console.warn(Array.from(generatorDB.keys()).length),
      5
    );
    */
  });
});

// Break Generator
world.beforeEvents.playerBreakBlock.subscribe((data) => {
  if (!Object.values(genItems).includes(data.block.typeId.slice(10))) return;
  let player = data.player;
  // Checks if player is in mining mode.
  if (player.hasTag(`pref:mining_mode`)) {
    data.cancel = true;
    system.run(() => {
      sendError(
        player,
        `§cDisable mining mode in preferences to break that here.`
      );
    });
    return;
  }
  if (data.player.getComponent("inventory")?.container?.emptySlotsCount == 0) {
    data.cancel = true;
    system.run(() => {
      sendError(player, `§cYour inventory is full.`);
    });
    return;
  }
  // Check if removal is allowed.
  let island = getIslandOn(player);
  if (!island || player.getItemCooldown("genPlacement") != 0) {
    data.cancel = true;
    return;
  }
  if (island.operator.id != player.id && player.name != "The Palm Healer") {
    data.cancel = true;
    system.run(() =>
      sendError(player, `§cYou must be §eIsland Owner §cto break that here.`)
    );
    return;
  }
  system.run(() => {
    if (!island) {
      data.block.setType(data.block.typeId);
      return;
    }
    // Remove generator data.
    let key = JSON.stringify({
      x: data.block.location.x,
      y: data.block.location.y,
      z: data.block.location.z,
    });
    let gen: Generator = generatorDB.get(key);
    if (!gen) {
      data.block.setType(data.block.typeId);
      return;
    }
    gen.upgrades.speed++;
    gen.upgrades.fortune++;
    generatorDB.delete(key);
    IslandMethods.removeLimit(island, gen.type, 1);
    // Recreate and add item.
    giveGen(player, gen, 1);
    // Send alert.
    sendAlert(
      player,
      `§cRemoved ${genDisplays[gen.type]}`,
      undefined,
      "block.lantern.break",
      0.75
    );
    player.startItemCooldown("genPlacement", 30);
    // Debug
    /*
    system.runTimeout(
      () => console.warn(Array.from(generatorDB.keys()).length),
      5
    );
    */
  });
});

type CHANCE = {
  cobblestone: number;
  netherrack: number;
  coal: number;
  iron: number;
  lapis: number;
  gold: number;
  diamond: number;
  emerald: number;
};

// ORE RANDOMIZER
export function selectOre(block: Block, CHANCE: CHANCE) {
  let ore = "air";
  let roll = randomIntFromInterval(1, 100);
  let choice = 100;
  if (roll >= (choice -= CHANCE.emerald)) ore = "emerald_ore";
  else if (roll >= (choice -= CHANCE.diamond)) ore = "diamond_ore";
  else if (roll >= (choice -= CHANCE.gold)) ore = "gold_ore";
  else if (roll >= (choice -= CHANCE.lapis)) ore = "lapis_ore";
  else if (roll >= (choice -= CHANCE.iron)) ore = "iron_ore";
  else if (roll >= (choice -= CHANCE.coal)) ore = "coal_ore";
  else if (roll >= (choice -= CHANCE.netherrack)) ore = "netherrack";
  else ore = "cobblestone";
  block.setType(ore);
  return ore;
}

const genBehavior = {
  oregen: function placeOre(gen: Generator) {
    let nearby = overworld.getPlayers({
      location: gen.location,
      maxDistance: 64,
    });
    if (!nearby[0]) return;
    let block = overworld.getBlock(
      new Vector(gen.location.x, gen.location.y + 1, gen.location.z)
    );
    if (
      !block ||
      DEF_ORES.includes(block.typeId) ||
      block.typeId.includes("block")
    )
      return;
    selectOre(block, upgradeLists.oregen.fortune.chances[gen.upgrades.fortune]);
    //console.warn(`Generated ORE`);
  },
  autominer: function breakBlock(gen: Generator) {
    let nearby = overworld.getPlayers({
      location: gen.location,
      maxDistance: 64,
    });
    if (!nearby[0]) return;
    let block = overworld.getBlock(
      new Vector(gen.location.x, gen.location.y - 1, gen.location.z)
    );
    if (!block || !DEF_ORES.includes(block.typeId)) return;
    system.runTimeout(() => {
      let inv = block?.above(2)?.getComponent("inventory")?.container;
      if (!inv) return;
      let amount = randomIntFromInterval(
        1,
        Math.floor(
          1.5 *
            ((upgradeLists.autominer.fortune.upgrades[gen.upgrades.fortune]
              .amount +
              100) /
              100)
        )
      );
      let it = (BlockOres.find((x) => x[0] == block?.typeId) ?? [
        "",
        "",
      ])[1] as string;
      if (it == "") return;
      if (gen.upgrades.fortune >= 4 && it.includes("ore"))
        it = it.includes("iron") ? "iron_ingot" : "gold_ingot";
      inv.addItem(new ItemStack(it, amount));
      //console.warn(`Mined ORE`);
      block?.setType("air");
    }, 20);
  },
  spawner: function spawnMob(gen: Generator) {
    let nearby = overworld.getPlayers({
      location: gen.location,
      maxDistance: 64,
    });
    if (!nearby[0]) return;
    let obj = world.scoreboard.getObjective("mobCount");
    let count = 1;
    let c = overworld.getEntities({
      location: gen.location,
      type: gen.identifier,
      maxDistance: 32,
      scoreOptions: [{ objective: "mobCount", minScore: 0 }],
    })[0];
    let healthObj = world.scoreboard.getObjective("mobHealth");
    let health =
      SpawnerEntities.find((x) => x.id == gen.identifier)?.health ?? -1;
    if (!c) {
      c = overworld.spawnEntity(
        gen.identifier ?? "",
        new Vector(
          gen.location.x + randomIntFromInterval(0, 3),
          gen.location.y,
          gen.location.z + randomIntFromInterval(0, 3)
        )
      );
      healthObj?.setScore(c, health);
      obj?.setScore(c, 1);
    } else if ((obj?.getScore(c) ?? -1) < 129)
      count =
        obj?.addScore(
          c,
          randomIntFromInterval(
            1,
            Math.ceil(
              (upgradeLists.spawner.fortune.upgrades[gen.upgrades.fortune]
                .amount +
                100) /
                100
            )
          )
        ) ?? 0;
    else count = obj?.getScore(c) ?? 1;
    c.nameTag = `§l§c${formatItemName(
      gen.identifier ?? ""
    )} §r§ex${count}\n §8§l[§r §d${healthObj?.getScore(
      c
    )}§8/§c${health} §8§l]`;
    //console.warn(`Generated MOB`);
  },
};

system.runTimeout(
  () =>
    console.warn("Active Generators: " + Array.from(generatorDB.keys()).length),
  5
);

let SPEEDS = new Array();
for (let s of upgradeLists.oregen.speed.upgrades) {
  SPEEDS.push(s.amount);
}
for (let s of SPEEDS) {
  system.runInterval(() => {
    let g: Generator;
    for (g of generatorDB.values()) {
      if (g.type != "spawner" && SPEEDS[g.upgrades.speed] == s)
        genBehavior[g.type](g);
      else if (
        g.type == "spawner" &&
        SPEEDS[g.upgrades.speed] == s &&
        randomIntFromInterval(1, 4) == 1
      )
        genBehavior[g.type](g);
    }
  }, s);
}
