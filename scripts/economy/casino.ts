import { ItemStack, Player, system, world } from "@minecraft/server";
import { ChestFormData } from "../chest-ui/forms";
import {
  PREFIX,
  formatNumber,
  randomIntFromInterval,
  sendAlert,
  sendError,
} from "../main";
import { RELIC_CHANCE, giveRelic } from "../systems/relic";
import { JsonDatabase } from "../database";
import {
  CE_RARITY,
  CHARMS,
  CHARM_DISPLAYS,
  giveBookCE,
  giveCharm,
} from "../custom_enchants/customEnchants";
import { formatItemName } from "./itemcloud";
import { checkItemAmount, findItem } from "./shop";

// Initialize Databases
var playerDB: any = undefined;
world.afterEvents.worldInitialize.subscribe((data) => {
  system.runTimeout(() => {
    playerDB = new JsonDatabase("playerDB", world);
  }, 180);
});

export function blackJackGame(player: Player) {
  if (
    !player.hasTag("blockjack") &&
    (player.getItemCooldown("blockjack") ?? 0) == 1200
  ) {
    player.startItemCooldown("blockjack", 1200);
    system.runTimeout(() => {
      sendAlert(player, `§eWelcome to §l§cBlock§8Jack§e.`, PREFIX.casino);
      system.runTimeout(() => {
        sendAlert(
          player,
          `§7In this game, the objective is simple.`,
          PREFIX.casino
        );
        system.runTimeout(() => {
          sendAlert(
            player,
            `§7Each round, you will be dealt an item, increasing your total.`,
            PREFIX.casino
          );
          system.runTimeout(() => {
            sendAlert(
              player,
              `§7Try to get as close as you can to 32 without going over it.`,
              PREFIX.casino
            );
            system.runTimeout(() => {
              sendAlert(
                player,
                `§7The closer you get, the bigger the prize!`,
                PREFIX.casino
              );
              system.runTimeout(() => {
                sendAlert(player, `§6Good luck!`, PREFIX.casino);
                system.runTimeout(() => {
                  nextBlackJack(player);
                  player.addTag("blockjack");
                }, 50);
              }, 70);
            }, 70);
          }, 100);
        }, 80);
      }, 60);
    }, 40);
  } else {
    if (findItem(player, "palm:lotus_token")) {
      player.runCommandAsync(`clear @s palm:lotus_token 0 1`);
      nextBlackJack(player);
      return;
    }
    let cost =
      20000 +
      Math.ceil((player.getItemCooldown("blockjack") ?? 0) / 2400) * 1000;
    cost += Math.floor(cost * (cost * 0.000004));
    let gui = new ChestFormData("red");
    gui.pattern([0, 0], ["xxxxxxxxx", "xx_____xx", "xxxxxxxxx"], {
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
    gui.button(
      13,
      "§aWould you like to play?",
      [`§9Cost: §c$${formatNumber(cost)}`],
      "netherrack",
      1,
      true
    );
    gui.show(player).then((result) => {
      if (result.canceled || result.selection != 13) return;
      player.startItemCooldown(
        "blockjack",
        2400 + (player.getItemCooldown("blockjack") ?? 0)
      );
      let pdata = playerDB.get(player.id);
      if (cost > pdata.coins) {
        sendError(player, `You cannot afford this game.`, PREFIX.casino);
        return;
      }
      pdata.coins = pdata.coins - cost;
      playerDB.set(player.id, pdata);
      nextBlackJack(player);
    });
  }
}

type Card = {
  color: "red_wool" | "black_wool";
  card: number;
};

function nextBlackJack(player: Player, card1?: Card, card2?: Card) {
  let gui = new ChestFormData("blockjack");
  gui.pattern([0, 0], ["xoxoxoxox", "oo_____oo", "xoxoxoxox"], {
    x: {
      data: {
        itemName: "",
        itemDesc: [],
        enchanted: false,
        stackSize: 1,
      },
      iconPath: "textures/blocks/glass_black.png",
    },
    o: {
      data: {
        itemName: "",
        itemDesc: [],
        enchanted: false,
        stackSize: 1,
      },
      iconPath: "textures/blocks/glass_white.png",
    },
  });
  let card = randomIntFromInterval(5, 21);
  let color: "red_wool" | "black_wool" =
    randomIntFromInterval(1, 2) == 1 ? "red_wool" : "black_wool";
  let n = 11;
  let t = 0;
  let cards: Card[] = [];
  if (card1) {
    gui.button(n++, "§eItem #1", [], card1.color, card1.card, false);
    cards.push(card1);
    t += card1.card;
  }
  if (card2) {
    gui.button(n++, "§eItem #2", [], card2.color, card2.card, false);
    cards.push(card2);
    t += card2.card;
  }
  gui.button(n, `§eItem #${n - 10}`, [], color, card, false);
  cards.push({ color: color, card: card });
  t += card;
  gui.button(
    15,
    "§6§lContinue",
    [`§9Total: §f${t}`, "§cRoll another item."],
    "magenta_glazed_terracotta",
    1,
    true
  );
  gui.button(16, "§c§lFold", ["§4End the game."], "barrier", 1, true);
  gui.show(player).then((result) => {
    if (result.selection == 15) {
      if (t > 32 || (card2 && cards.length == 3)) foldBlackJack(player, t);
      else {
        player.playSound(`random.levelup`, { pitch: 1.1 });
        nextBlackJack(player, cards[0], cards[1]);
      }
      return;
    } else if (!result.canceled) {
      foldBlackJack(player, t);
      return;
    }
  });
}

const blackJackRewards = [
  {
    minimum: 2,
    reward: {
      item: "coal",
      amount: [6, 64],
    },
  },
];

function foldBlackJack(player: Player, total: number) {
  player.playSound("random.fizz", { pitch: 1.1 });
  sendAlert(player, `§o§6§lYou won...`, PREFIX.casino);
  system.runTimeout(() => {
    player.playSound("random.enderchestopen");
    if (total != 32) {
      let gui = new ChestFormData("blockjack");
      gui.pattern([0, 0], ["xoxoxoxox", "oo_____oo", "xoxoxoxox"], {
        x: {
          data: {
            itemName: "",
            itemDesc: [],
            enchanted: false,
            stackSize: 1,
          },
          iconPath: "textures/blocks/glass_black.png",
        },
        o: {
          data: {
            itemName: "",
            itemDesc: [],
            enchanted: false,
            stackSize: 1,
          },
          iconPath: "textures/blocks/glass_white.png",
        },
      });
      let currency = 0;
      if (total < 18) {
        currency = randomIntFromInterval(50 * total, 500 * total);
        gui.button(
          13,
          "§a§lMoney§r",
          [`§6$§e${formatNumber(currency)}`],
          "paper",
          1,
          true
        );
        let pdata = playerDB.get(player.id);
        pdata.coins = pdata.coins + currency;
        playerDB.set(player.id, pdata);
      } else if (total < 22) {
        currency = randomIntFromInterval(100 * total, 600 * total);
        gui.button(
          13,
          "§a§lMoney§r",
          [`§6$§e${formatNumber(currency)}`],
          "paper",
          1,
          true
        );
        let pdata = playerDB.get(player.id);
        pdata.coins = pdata.coins + currency;
        playerDB.set(player.id, pdata);
      } else if (total < 29) {
        currency = randomIntFromInterval(5 * total, 20 * total);
        gui.button(
          13,
          "§l§aXP§r",
          [`§6§e${formatNumber(currency)} §l§aXP`],
          "experience_bottle",
          1,
          true
        );
        player.addExperience(currency);
      } else if (total < 32) {
        function getRelic() {
          let roll = randomIntFromInterval(1, 100);
          let choice = 100;
          if (roll >= (choice -= RELIC_CHANCE.ORE.emerald)) return "emerald";
          if (roll >= (choice -= RELIC_CHANCE.ORE.diamond)) return "diamond";
          if (roll >= (choice -= RELIC_CHANCE.ORE.gold)) return "gold";
          else return "iron";
        }
        let relic = giveRelic(player, getRelic());
        if (!relic) return;
        gui.button(13, relic.nameTag, relic.getLore(), relic.typeId, 1, true);
      } else if (total > 32) {
        sendAlert(player, `§c§lNothing.`, PREFIX.casino, `random.glass`);
        gui.button(
          13,
          "§c§lNothing.",
          [`§7Better luck next time!`, "§o§8womp, womp"],
          "gray_dye",
          1,
          true
        );
        system.runTimeout(() => {
          sendAlert(player, `§7Better luck next time!`, PREFIX.casino);
        }, 40);
      }
      gui.button(
        15,
        "§d§lCongrats!",
        [`§9Total: §f${total}`],
        "red_shulker_box",
        1,
        true
      );
      gui.show(player);
    } else {
      let gui = new ChestFormData("vault");
      gui.pattern([0, 0], ["xxxxxxxxx", "xx_____xx", "xxxxxxxxx"], {
        x: {
          data: {
            itemName: "",
            itemDesc: [],
            enchanted: false,
            stackSize: 1,
          },
          iconPath: "textures/blocks/glass_black.png",
        },
      });
      let r = randomIntFromInterval(1, 10);
      if (r <= 4) {
        gui.button(
          13,
          "§d§lJackpot",
          [`§eMoney: §6$§e$50,000`],
          "crying_obsidian",
          1,
          true
        );
        let pdata = playerDB.get(player.id);
        pdata.coins = pdata.coins + 50000;
        playerDB.set(player.id, pdata);
      } else if (r <= 6) {
        gui.button(
          13,
          "§d§lJackpot",
          [`§a§lXP: §6§e2,500 §l§aXP`],
          "crying_obsidian",
          1,
          true
        );
        player.addExperience(2500);
      } else if (r <= 8) {
        gui.button(
          13,
          "§d§lJackpot",
          [`§@§r§e§lC§6E §d§lBook §r§8(${CE_RARITY.epic}§8)`],
          "enchanted_book",
          1,
          true
        );
        giveBookCE(player, "epic", 1);
      } else if (r == 9) {
        gui.button(
          13,
          "§d§lJackpot",
          [`§@§r§e§lC§6E §d§lBook §r§8(${CE_RARITY.unique}§8)`],
          "enchanted_book",
          1,
          true
        );
        giveBookCE(player, "unique", 1);
      } else if (r == 10) {
        let rarity = randomIntFromInterval(1, 3) == 1 ? "advanced" : "basic";
        gui.button(
          13,
          "§d§lJackpot",
          [
            `§@§r§f§5Charm ${CHARMS.attunement.display} §r§8(${
              CHARM_DISPLAYS[rarity as keyof typeof CHARM_DISPLAYS]
            }§8)`,
          ],
          "enchanted_book",
          1,
          true
        );
        giveCharm(
          player,
          "attunement",
          rarity as keyof typeof CHARM_DISPLAYS,
          1
        );
      }
      gui.show(player);
    }
  }, 80);
}

export function stacksGame(player: Player) {
  if (
    !player.hasTag("stacks") &&
    (player.getItemCooldown("stacks") ?? 0) == 0
  ) {
    player.startItemCooldown("stacks", 1200);
    system.runTimeout(() => {
      sendAlert(player, `§eWelcome to §l§dStacks§e.`, PREFIX.casino);
      system.runTimeout(() => {
        system.runTimeout(() => {
          sendAlert(
            player,
            `§7In this game, you spin the wheels on the stacks machine.`,
            PREFIX.casino
          );
          system.runTimeout(() => {
            sendAlert(
              player,
              `§7With luck, the items you land on will match up!`,
              PREFIX.casino
            );
            system.runTimeout(() => {
              sendAlert(
                player,
                `§7The better the item, and the more of the item, the better the prize!`,
                PREFIX.casino
              );
              system.runTimeout(() => {
                sendAlert(player, `§6Good luck!`, PREFIX.casino);
                system.runTimeout(() => {
                  nextStacks(player, 1000);
                  player.addTag("stacks");
                }, 50);
              }, 70);
            }, 70);
          }, 100);
        }, 80);
      }, 60);
    }, 40);
  } else {
    let cost =
      5000 + Math.ceil((player.getItemCooldown("stacks") ?? 0) / 1200) * 300;
    cost += Math.floor(cost * (cost * 0.000003));
    let gui = new ChestFormData("yellow");
    gui.pattern([0, 0], ["xxxxxxxxx", "xx_____xx", "xxxxxxxxx"], {
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
    gui.button(
      13,
      "§aWould you like to play?",
      [`§9Cost: §c$${formatNumber(cost)}`],
      "gold_block",
      1,
      true
    );
    gui.show(player).then((result) => {
      if (result.canceled || result.selection != 13) return;
      player.startItemCooldown(
        "stacks",
        1200 + (player.getItemCooldown("stacks") ?? 0)
      );
      let pdata = playerDB.get(player.id);
      if (cost > pdata.coins) {
        sendError(player, `You cannot afford this game.`, PREFIX.casino);
        return;
      }
      pdata.coins = pdata.coins - cost;
      playerDB.set(player.id, pdata);
      nextStacks(player, cost);
    });
  }
}

function nextStacks(player: Player, cost: number) {
  let gui = new ChestFormData("stacks");
  gui.pattern([0, 0], ["xx_x_x_xx", "xx_x_x_xx", "xx_x_x_xx"], {
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
  gui.button(13, "§e§lSpin", ["§aBest of luck!"], "emerald_block", 0, true);
  gui.show(player).then((result) => {
    if (result.canceled) return;
    let sm = player.dimension.getEntities({
      type: "palm:slotmachine",
      location: player.location,
      maxDistance: 11,
    })[0];
    if (!sm) return;
    sm.playAnimation(`animation.slotmachine.spin`);
    player.playSound(`random.slots`, { volume: 0.3, pitch: 0.9 });
    system.runTimeout(() => {
      let gui = new ChestFormData("stacks");
      gui.pattern([0, 0], ["xx_x_x_xx", "xx_x_x_xx", "xx_x_x_xx"], {
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
      let items = [
        "diamond",
        "gold_ingot",
        "iron_ingot",
        "emerald",
        "lapis_lazuli",
        "coal",
        "beetroot",
        "wheat",
        "carrot",
        "potato",
        "pumpkin",
        "melon_block",
      ];
      let item = new Array();
      for (let i = 0; i < 3; i++) {
        item.push(items[randomIntFromInterval(1, items.length) - 1]);
      }
      let n = 9;
      for (let i of item) {
        gui.button((n += 2), `§b${formatItemName(i)}`, [], i, 16, false);
      }
      player.playSound(`random.levelup`, { pitch: 1.1 });
      gui.show(player).then((result) => {
        let check = item.filter(
          (i: string, index: number) => item.indexOf(i) !== index
        );
        if (check.length == 1) {
          let prize = randomIntFromInterval(
            Math.floor(cost * 0.85),
            Math.floor(cost * 1.5)
          );
          sendAlert(player, `§aYou won §6$§e${formatNumber(prize)}§a!`);
          let pdata = playerDB.get(player.id);
          pdata.coins = pdata.coins + prize;
          playerDB.set(player.id, pdata);
        } else if (check.length == 2) {
          let prize = randomIntFromInterval(cost, Math.floor(cost * 3));
          sendAlert(player, `§aYou won §6$§e${formatNumber(prize)}§a!`);
          let pdata = playerDB.get(player.id);
          pdata.coins = pdata.coins + prize;
          playerDB.set(player.id, pdata);
        } else {
          let prize = randomIntFromInterval(150, Math.floor(cost / 6.66));
          sendAlert(player, `§aYou won §6$§e${formatNumber(prize)}§a!`);
          let pdata = playerDB.get(player.id);
          pdata.coins = pdata.coins + prize;
          playerDB.set(player.id, pdata);
        }
      });
    }, 140);
  });
}
