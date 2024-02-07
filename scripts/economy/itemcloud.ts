import {
  BlockSignComponent,
  Enchantment,
  EntityEquippableComponent,
  EntityInventoryComponent,
  EquipmentSlot,
  GameMode,
  ItemDurabilityComponent,
  ItemStack,
  ItemTypes,
  Player,
  system,
  world,
} from "@minecraft/server";
import { PREFIX, randomIntFromInterval, sendAlert, sendError } from "../main";
import { JsonDatabase } from "../database";

// Initialize Databases
var playerDB: any = undefined;
var itemCloud: any = undefined;
world.afterEvents.worldInitialize.subscribe((data) => {
  system.runTimeout(() => {
    playerDB = new JsonDatabase("playerDB", world);
    itemCloud = new JsonDatabase("itemCloud", world);
  }, 180);
});

export function formatItemName(item: string) {
  let itemName = "";
  if (item.includes(":")) item = item.substring(item.indexOf(":") + 1);
  item.split("_").forEach((i) => {
    itemName = itemName + `${i.charAt(0).toUpperCase() + i.slice(1)} `;
  });
  return itemName.slice(0, itemName.length - 1);
}

export function unformatItemName(item: string) {
  let itemName = "";
  item.split(" ").forEach((e) => {
    itemName = itemName + `${e.toLowerCase()}_`;
  });
  return itemName.slice(0, itemName.length - 1);
}

export function exportToCloud(player: Player, item: string, max: number) {
  const inventory = (<EntityInventoryComponent>player.getComponent("inventory"))
    .container;
  function amountItems(player: Player, item: string) {
    let itemAmount = 0;
    for (let i = 0; i < 36; i++) {
      if (!inventory) return -1;
      let it = inventory.getItem(i);
      if (!it) continue;
      if (it.typeId !== `minecraft:${item}`) continue;
      if (
        it.getLore().length > 0 ||
        (<ItemDurabilityComponent>it.getComponent("durability"))?.damage > 0
      )
        continue;
      itemAmount += it.amount;
      inventory.setItem(i);
    }
    return itemAmount;
  }
  let amount = amountItems(player, item);
  if (amount == 0) {
    sendError(
      player,
      `You need at least one of an item to upload it.`,
      PREFIX.server
    );
    return;
  }
  if (amount > max) amount = max;
  let icdata = itemCloud.get(player.id);
  if (!icdata) {
    itemCloud.set(player.id, { bobblestone: 0 });
    icdata = itemCloud.get(player.id);
  }
  if (icdata[item]) icdata[item] += amount;
  else icdata[item] = amount;
  itemCloud.set(player.id, icdata);
  sendAlert(
    player,
    `§eYour items have been uploaded to storage.\n§7> §c- §7${item} §8x${amount}`,
    PREFIX.server
  );
}

export function importFromCloud(player: Player, item: string, amount: number) {
  let icdata = itemCloud.get(player.id);
  if (!icdata) {
    itemCloud.set(player.id, { bobblestone: 0 });
    icdata = itemCloud.get(player.id);
  }
  if (icdata[item]) {
    let storedAmount = icdata[item];
    if (amount > storedAmount) amount = storedAmount;
    if (storedAmount - amount <= 0) delete icdata[item];
    else icdata[item] -= amount;
  } else {
    sendError(
      player,
      `Your storage does not contain this item.`,
      PREFIX.server
    );
    return;
  }
  itemCloud.set(player.id, icdata);
  player.runCommandAsync(`give @s ${item} ${amount}`);
  sendAlert(
    player,
    `§eYour items have been downloaded from storage.\n§7> §a+ §7${item} §8x${amount}`,
    PREFIX.server
  );
}

export function infoInHand(player: Player) {
  const inventory = <EntityEquippableComponent>(
    player.getComponent("equippable")
  );
  let item = inventory.getEquipment(EquipmentSlot.Mainhand);
  if (!item) {
    sendError(
      player,
      `You must hold an item to show info for it.`,
      PREFIX.server
    );
    return;
  }
  sendAlert(
    player,
    `§eItem Info\n§f=----------------=\n§aItem: §7${item.typeId.slice(
      10
    )}\n§bAmount: §7x${item.amount}\n§f=----------------=`,
    PREFIX.server
  );
}

export function listFromCloud(player: Player, message: string) {
  let icdata = itemCloud.get(player.id);
  if (!icdata) {
    sendError(player, `Your storage is empty.`, PREFIX.server);
    return;
  }
  let items = Object.getOwnPropertyNames(icdata).map((x) => {
    return [x, icdata[x]];
  });
  let PAGE_LENGTH = 7;
  let page = Number(message.split(" ")[2]);
  if (!message.split(" ")[2]) page = 1;
  if (
    !(page > 0) ||
    Math.floor(page - 1) > items?.length / PAGE_LENGTH ||
    Math.floor(page) < 1
  ) {
    sendError(
      player,
      `Invalid format: Try using §e-it list [§gpage: 1-${Math.ceil(
        items.length / PAGE_LENGTH
      )}§e] §cinstead.`,
      PREFIX.server
    );
    return;
  }
  let list = items
    .sort((a, b) => {
      return b[1] - a[1];
    })
    .slice(
      page * PAGE_LENGTH - PAGE_LENGTH,
      Math.min(page * PAGE_LENGTH, items.length)
    )
    .map((x) => {
      return `§f- §d${x[0]} §8// §7${x[1]}`;
    })
    .toString()
    .replace(/,/g, "\n");
  player.sendMessage(`§f========== §l§eItem Store:§r §f==========`);
  player.sendMessage(list);
  player.sendMessage(`§f============ §e-- ${page} --§r §f============`);
}

// Player Shop Creation
world.afterEvents.entityHitBlock.subscribe((data) => {
  let sign = <BlockSignComponent>data.hitBlock.getComponent("sign");
  if (sign && sign.getText()?.startsWith("pshop")) {
    let player = <Player>data.damagingEntity;
    let signText = sign.getText() ?? "";
    let cost = Number(signText.split("\n")[1]);
    let item = signText.split("\n")[2];
    let amount = Number(signText.split("\n")[3]);
    if (cost < 0 || cost > 999999999) {
      sendError(
        player,
        `Invalid format: Cost must be a value between 0-999M.\n§4Format: §epshop\n§g[cost]\n§eitem\n§g[amount]`,
        PREFIX.server
      );
      return;
    }
    if (amount < 0 || amount > 64) {
      sendError(
        player,
        `Invalid format: Amount must be a value between 0-64.\n§4Format: §epshop\n§g[cost]\n§eitem\n§g[amount]`,
        PREFIX.server
      );
      return;
    }
    if (
      !ItemTypes.getAll()
        .map((x) => {
          return x.id;
        })
        .includes(`minecraft:${item}`)
    ) {
      sendError(
        player,
        `Invalid format: Item must have a valid ID.\n§epshop\n§g[cost]\n§eitem\n§g[amount]`,
        PREFIX.server
      );
      return;
    }
    sign.setText(
      `§.§.§a§@${
        player.nameTag
      }§@\n§eCost: §6$§%${cost}§%\n§b§&${formatItemName(
        item
      )}§&\n§eAmount: §7x§c§^64§^`
    );
    sign.setWaxed(true);
  } else if (sign && sign.getText()?.startsWith("§.§.")) {
    let player = <Player>data.damagingEntity;
    let signText = sign.getText() ?? "";
    let ownerName = signText.split("§@")[1];
    let cost = Number(signText.split("§%")[1]);
    let item = signText.split("§&")[1].toLowerCase();
    let amount = Number(signText.split("§^")[1]);
    //world.sendMessage(`Owner: ${owner}\nCost: ${cost}\nItem: ${item}\nAmount: ${amount}`);
    let owner = world.getPlayers({ name: ownerName })[0];
    if (!owner) {
      sendError(player, `The owner of this shop is not online.`, PREFIX.server);
      return;
    }
    if (player.name.toLowerCase() == owner.name.toLowerCase()) {
      sendError(
        player,
        `You cannot purchase items from your own shop.`,
        PREFIX.server
      );
      return;
    }
    let pdata = playerDB.get(player.id);
    let odata = playerDB.get(owner.id);
    if (cost > pdata.coins) {
      sendError(player, `You cannot afford this item.`, PREFIX.server);
      return;
    }
    let idata = itemCloud.get(owner.id);
    let itemC = idata[item];
    if (!itemC || amount > itemC) {
      sendError(player, `This shop is out of stock.`, PREFIX.server);
      return;
    }
    let confirmObj = world.scoreboard.getObjective("icConfirm");
    let scoreUser = player.scoreboardIdentity;
    if (scoreUser && (confirmObj?.getScore(scoreUser) ?? 0) >= 1) {
      // Take the item from the owner's ItemCloud.
      idata[item] = idata[item] - amount;
      itemCloud.set(owner.id, idata);
      // Take currency from player.
      pdata.coins = pdata.coins - cost;
      playerDB.set(player.id, pdata);
      // Add currency to the owner.
      odata.coins = odata.coins + cost;
      playerDB.set(owner.id, odata);
      // Add item to the player.
      player.runCommandAsync(`give @s ${item} ${amount}`);
      // Reset confirmation timeout.
      player.runCommandAsync(`scoreboard players set @s icConfirm 0`);
      // Run messages.
      sendAlert(
        owner,
        `§a${player.name} §bpurchased §7${formatItemName(
          item
        )} §8x${amount} §bfrom your shop for §d$${cost}§b.`,
        PREFIX.server,
        `mob.villager.haggle`
      );
      owner.playSound(`random.levelup`, { volume: 0.25 });
      sendAlert(
        player,
        `§ePurchased §7${formatItemName(item)} §8x${amount} §efrom §a${
          owner.name
        } §efor §d$${cost}§e.`,
        PREFIX.server,
        `note.iron_xylophone`
      );
    } else {
      // Cooldown/timeout cancelation.
      player.runCommandAsync(`scoreboard players set @s icConfirm 1`);
      sendAlert(
        player,
        `§eTap this shop again to confirm your purchase.`,
        PREFIX.server
      );
      system.runTimeout(() => {
        player.runCommandAsync(`scoreboard players set @s icConfirm 0`);
      }, 50);
    }
  } else return;
});
