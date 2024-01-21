import {
  Block,
  Direction,
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
  IslandMethods,
  PREFIX,
  formatNumber,
  fromRomanNumeral,
  playerDB,
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

const generatorDB = new JsonDatabase("generatorDB", world);
const overworld = world.getDimension("overworld");

// genData: { location: Vector, upgrades: {...} }

const SPEED_DISPLAY = "§aSpeed";
const FORTUNE_DISPLAY = "§bFortune";
type genType = "oregen" | "autominer" | "spawner";

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
          cost: 0.5,
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
      baseCost: 20000,
      chances: [
        {
          // Base Upgrade
          cobblestone: 21,
          netherrack: 12,
          coal: 22,
          iron: 14,
          lapis: 11,
          gold: 11,
          diamond: 5,
          emerald: 4,
        },
        {
          cobblestone: 21,
          netherrack: 12,
          coal: 22,
          iron: 14,
          lapis: 11,
          gold: 11,
          diamond: 5,
          emerald: 4,
        },
        {
          cobblestone: 21,
          netherrack: 12,
          coal: 22,
          iron: 14,
          lapis: 11,
          gold: 11,
          diamond: 5,
          emerald: 4,
        },
        {
          cobblestone: 21,
          netherrack: 12,
          coal: 22,
          iron: 14,
          lapis: 11,
          gold: 11,
          diamond: 5,
          emerald: 4,
        },
        {
          cobblestone: 21,
          netherrack: 12,
          coal: 22,
          iron: 14,
          lapis: 11,
          gold: 11,
          diamond: 5,
          emerald: 4,
        },
        {
          cobblestone: 21,
          netherrack: 12,
          coal: 22,
          iron: 14,
          lapis: 11,
          gold: 11,
          diamond: 5,
          emerald: 4,
        },
      ],
      upgrades: [
        {
          // Base Upgrade
          amount: 4,
          cost: 0.5,
        },
        {
          amount: 5,
          cost: 2.5,
        },
        {
          amount: 7,
          cost: 6,
        },
        {
          amount: 9,
          cost: 14,
        },
        {
          amount: 13,
          cost: 25,
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
          amount: 10,
          cost: 0.5,
        },
        {
          amount: 25,
          cost: 3,
        },
        {
          amount: 40,
          cost: 7,
        },
        {
          amount: 75,
          cost: 14,
        },
        {
          amount: 100,
          cost: 18,
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
        "§6Cost: $$e\nIncreases chance for more entities by $a%\n§9Spawn Chance:\n§o§8$b% §r§b=> §6$c%",
      icon: "prismarine_crystals",
      baseCost: 35000,
      upgrades: [
        {
          // Base Upgrade
          amount: 10,
          cost: 0.5,
        },
        {
          amount: 25,
          cost: 3,
        },
        {
          amount: 40,
          cost: 6,
        },
        {
          amount: 75,
          cost: 10,
        },
        {
          amount: 100,
          cost: 15,
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
              ? (gen.upgrades.fortune + 1) / 2
              : type == "spawner"
              ? upgradeInfo.speed.upgrades[gen.upgrades.fortune].amount / 100
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
        current < 4 ? toRomanNumeral(current + 2) : "§cMAX§r"
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
    // Check for ownership.
    if (gen.ownerID == player.id) upgradeMenu(player, gen);
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
  let item = data.itemStack;
  if (item.getLore().length < 3) return;
  let player = data.player;
  // Check if placement is allowed.
  if (
    data.face != Direction.Up ||
    player.getItemCooldown("genPlacement") != 0 ||
    Object.values(genItems).includes(data.block?.typeId.slice(10) ?? "")
  ) {
    data.cancel = true;
    return;
  }
  let island = getIslandOn(player);
  if (!island || !island?.owners.find((x) => x.id == player.id)) {
    data.cancel = true;
    system.run(() =>
      sendError(player, `§cYou must be §eIsland Owner §cto place that here.`)
    );
    return;
  }
  let type = Object.keys(genItems).find(
    (x) => genItems[x as keyof typeof genItems] == item.typeId.slice(10)
  ) as genType;
  if (IslandMethods.addLimit(island, type, 1) == -2) {
    data.cancel = true;
    system.run(() => {
      sendError(
        player,
        `Island has reached the ${type} limit.\n§dUse §e-is expand §dto increase it.`,
        PREFIX.island
      );
    });
    return;
  }
  system.run(() => {
    if (!island) return;
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
      {
        x: data.block.location.x,
        y: data.block.location.y + 1,
        z: data.block.location.z,
      },
      player.id,
      identifier
    );
    // Store generator data.
    if (!gen.location) return;
    let key = JSON.stringify({
      x: gen.location.x,
      y: gen.location.y,
      z: gen.location.z,
    });
    generatorDB.set(key, gen);
    // Send alert.
    sendAlert(
      player,
      `§ePlaced ${item.nameTag}`,
      undefined,
      "block.lantern.break",
      0.75
    );
    player.startItemCooldown("genPlacement", 15);
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
  // Check if removal is allowed.
  let island = getIslandOn(player);
  if (!island || player.getItemCooldown("genPlacement") != 0) {
    data.cancel = true;
    return;
  }
  if (!island?.owners.find((x) => x.id == player.id)) {
    data.cancel = true;
    system.run(() =>
      sendError(player, `§cYou must be §eIsland Owner §cto break that here.`)
    );
    return;
  }
  system.run(() => {
    if (!island) return;
    // Remove generator data.
    let key = JSON.stringify({
      x: data.block.location.x,
      y: data.block.location.y,
      z: data.block.location.z,
    });
    let gen: Generator = generatorDB.get(key);
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
    player.startItemCooldown("genPlacement", 15);
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
    if (!block || DEF_ORES.includes(block.typeId)) return;
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
      let amount = 1;
      if (
        randomIntFromInterval(1, 100) <=
        upgradeLists.autominer.fortune.upgrades[gen.upgrades.fortune].amount
      )
        amount = randomIntFromInterval(1, gen.upgrades.fortune + 1);
      inv.addItem(
        new ItemStack(
          (BlockOres.find((x) => x[0] == block?.typeId) ?? "")[1].toString(),
          amount
        )
      );
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
      maxDistance: 16,
      scoreOptions: [{ objective: "mobCount", minScore: 1 }],
    })[0];
    if (!c) {
      c = overworld.spawnEntity(
        gen.identifier ?? "",
        new Vector(
          gen.location.x + randomIntFromInterval(0, 3),
          gen.location.y,
          gen.location.z + randomIntFromInterval(0, 3)
        )
      );
      obj?.setScore(c, 1);
    } else count = obj?.addScore(c, 1) ?? 0;
    world.scoreboard
      .getObjective("mobHealth")
      ?.setScore(
        c,
        SpawnerEntities.find((x) => x.id == gen.identifier)?.health ?? -1
      );
    if (count > 129) return;
    c.nameTag = `§l§c${formatItemName(gen.identifier ?? "")} §r§ex${count}`;
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
        randomIntFromInterval(1, 2) == 1
      )
        genBehavior[g.type](g);
    }
  }, s);
}
