import {
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
import { ChestFormData } from "../chest-ui/forms";
import { PREFIX, formatNumber, sendAlert, sendError } from "../main";
import { formatItemName } from "./itemcloud";

// Initialize Databases
var playerDB: any = undefined;
var vendorDB: any = undefined;
world.afterEvents.worldInitialize.subscribe((data) => {
  system.runTimeout(() => {
    playerDB = new JsonDatabase("playerDB", world);
    vendorDB = new JsonDatabase("vendorDB", world);
  }, 180);
});

export class Vendor {
  public ownerID: string;
  public location: Vector3;
  public item: string;
  public amount: number;
  public price: number;

  constructor(location: Vector | Vector3, ownerID: string) {
    this.ownerID = ownerID;
    this.location = location;
    this.item = "";
    this.amount = 0;
    this.price = 0;
  }
}

world.afterEvents.playerPlaceBlock.subscribe((data) => {
  if (data.block.typeId != "palm:vending_machine") return;
  let key = JSON.stringify({
    x: data.block.x,
    y: data.block.y,
    z: data.block.z,
  });
  vendorDB.set(key, new Vendor(data.block.location, data.player.id));
  sendAlert(data.player, `§l§ePlaced §9Vendor`);
});

world.afterEvents.playerBreakBlock.subscribe((data) => {
  if (data.block.typeId != "palm:vending_machine") return;
  let key = JSON.stringify({
    x: data.block.x,
    y: data.block.y,
    z: data.block.z,
  });
  vendorDB.delete(key);
});

world.afterEvents.entityHitBlock.subscribe((data) => {
  let player = <Player>data.damagingEntity;
  if (!player) return;
  if (
    data.hitBlock.typeId != "palm:vending_machine" ||
    player.getComponent("equippable")?.getEquipment(EquipmentSlot.Mainhand)
      ?.typeId != "minecraft:diamond_pickaxe"
  )
    return;
  let key = JSON.stringify({
    x: data.hitBlock.x,
    y: data.hitBlock.y,
    z: data.hitBlock.z,
  });
  let vendor: Vendor = vendorDB.get(key);
  if (!vendor || player.id != vendor.ownerID) return;
  if (vendor.item && vendor.amount > 0) {
    let inv = player.getComponent("inventory")?.container;
    if (!inv) return;
    let amount = vendor.amount;
    if (amount / 64 > inv.emptySlotsCount) {
      sendError(player, `Not enough inventory space.`);
    }
    for (amount; amount > 0; ) {
      let a = Math.min(64, amount);
      amount -= a;
      inv.addItem(new ItemStack(vendor.item, a));
    }
  }
  vendorDB.delete(key);
  data.hitBlock.setType("air");
  player.runCommandAsync(`give @s palm:vending_machine`);
  sendAlert(player, `§l§cRemoved §9Vendor`);
});

world.afterEvents.playerInteractWithBlock.subscribe((data) => {
  if (
    data.block.typeId != "palm:vending_machine" ||
    [Direction.Up, Direction.Down].includes(data.blockFace) ||
    data.player.getItemCooldown("vendor") != 0
  )
    return;
  data.player.startItemCooldown("vendor", 20);
  let key = JSON.stringify({
    x: data.block.x,
    y: data.block.y,
    z: data.block.z,
  });
  let vendor: Vendor = vendorDB.get(key);
  if (!vendor) return;
  let player = data.player;
  let owner = world.getPlayers().find((x) => x.id == vendor.ownerID);
  if (!owner) {
    sendError(player, `Vendor is currently offline.`);
    return;
  }
  if (vendor.ownerID == player.id) {
    if (!player.isSneaking) {
      let equip = player.getComponent("equippable");
      let inv = player.getComponent("inventory")?.container;
      let item = equip?.getEquipment(EquipmentSlot.Mainhand);
      if (!item || !inv) {
        sendError(player, `You must hold the item you want to stock here.`);
        return;
      }
      if (
        item.getLore().length > 0 ||
        !item.isStackable ||
        item.nameTag ||
        item.typeId == "palm:vending_machine" ||
        item.typeId.includes("_gem")
      ) {
        sendError(player, `You cannot stock this item here.`);
        return;
      }
      if (item.typeId == vendor.item) {
        if (vendor.amount == 640) {
          sendError(player, `This vendor is full.`);
          return;
        }
        vendor.amount += item.amount;
        if (vendor.amount > 640) {
          player.runCommandAsync(
            `give @s ${item.typeId} ${vendor.amount % 64}`
          );
          vendor.amount = 640;
        }
        vendorDB.set(key, vendor);
        equip?.setEquipment(EquipmentSlot.Mainhand);
        sendAlert(
          player,
          `§aAdded §b${formatItemName(vendor.item)} §8x§7${
            item.amount
          } §eto §dvendor §estock.`
        );
      } else {
        if (vendor.item) {
          let amount = vendor.amount;
          if (amount / 64 > inv.emptySlotsCount) {
            sendError(player, `Not enough inventory space.`);
          }
          for (amount; amount > 0; ) {
            let a = Math.min(64, amount);
            amount -= a;
            inv.addItem(new ItemStack(vendor.item, a));
          }
        }
        vendor.item = item.typeId;
        vendor.amount = item.amount;
        vendorDB.set(key, vendor);
        equip?.setEquipment(EquipmentSlot.Mainhand);
        sendAlert(
          player,
          `§eThis vendor will now sell §b${formatItemName(vendor.item)} §8x§7${
            vendor.amount
          }§e.`
        );
      }
    } else {
      if (!vendor.item) {
        sendError(player, `You must set the item you want to stock here.`);
        return;
      }
      let price = vendor.price ?? 0;
      function setPrice() {
        let vendUI = new ChestFormData("light_blue");
        vendUI.pattern([0, 0], ["xxxxxxxxx", "x_______x", "xxxxxxxxx"], {
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
        vendUI.title(`§1§lVendor: §r§9${player.name}`);
        vendUI.button(10, "§6Price", ["§a+$100"], `lime_wool`, 1);
        vendUI.button(11, "§6Price", ["§a+$1,000"], `lime_wool`, 5);
        vendUI.button(12, "§6Price", ["§a+$10,000"], `lime_wool`, 20);
        vendUI.button(
          13,
          "§e§lSet Price",
          [
            `§cOld Price: §6$§e${formatNumber(
              vendor.price
            )}§6/e\n§aNew Price: §6$§e${formatNumber(price)}§6/e`,
          ],
          vendor.item,
          vendor.amount,
          true
        );
        vendUI.button(14, "§6Price", ["§c-$10,000"], "red_wool", 20);
        vendUI.button(15, "§6Price", ["§c-$1,000"], "red_wool", 5);
        vendUI.button(16, "§6Price", ["§c-$100"], "red_wool", 1);
        vendUI.show(player).then((result) => {
          if (result.canceled || !result.selection) return;
          const amounts = [100, 1000, 10000, 0, -10000, -1000, -100];
          if (
            result.selection >= 10 &&
            result.selection <= 16 &&
            result.selection != 13
          ) {
            price = Math.max(price + amounts[result.selection % 10], 0);
            if (result.selection == 10 && price == 0) price++;
            setPrice();
            return;
          } else if (result.selection == 13) {
          } else {
            return;
          }
          vendor.price = price;
          vendorDB.set(key, vendor);
          sendAlert(
            player,
            `§bVendor price has been set to §6$§e${formatNumber(
              vendor.price
            )}§6/e§b.`
          );
        });
      }
      setPrice();
    }
  } else {
    if (vendor.amount == 0) {
      sendError(player, `This vendor is empty.`);
      return;
    }
    if (!vendor.item || vendor.price == 0) {
      sendError(player, `This vendor has not been set up yet.`);
      return;
    }
    let vendUI = new ChestFormData("vendor");
    vendUI.title(`\n\n\n\n\n\n\n §1§lVendor: §r§9${owner.name}`);
    let slots = [0, 1, 2, 3, 4, 7, 8, 9, 10, 11];
    let amounts: number[] = [];
    //let amount = vendor.amount;
    let amount = vendor.amount;
    for (let s of slots) {
      if (amount == 0) continue;
      let a = Math.min(64, amount);
      amounts.push(a);
      vendUI.button(
        s,
        formatItemName(vendor.item),
        ["§a§lCLICK TO PURCHASE"],
        vendor.item,
        a
      );
      amount -= a;
    }
    vendUI.show(player).then((result) => {
      if (result.canceled || !slots.includes(result.selection ?? 0)) return;
      let pdata = playerDB.get(player.id);
      let amount = amounts[slots.indexOf(result.selection ?? 0)];
      let price = vendor.price * amount;
      if (!owner) {
        sendError(player, `Vendor is currently offline.`);
        return;
      }
      if (vendor.amount == 0) {
        sendError(player, `This vendor is empty.`);
        return;
      }
      if (price > pdata.coins) {
        sendError(player, `You cannot afford this transaction.`);
        return;
      }
      pdata.coins = pdata.coins - price;
      playerDB.set(player.id, pdata);
      player.runCommandAsync(`give @s ${vendor.item} ${amount}`);
      let odata = playerDB.get(owner.id);
      odata.coins = odata.coins + price;
      playerDB.set(owner.id, odata);
      vendor.amount = vendor.amount - amount;
      vendorDB.set(key, vendor);
      sendAlert(
        player,
        `§aPurchased §b${formatItemName(vendor.item)} §8x§7${amount} §afrom §e${
          owner?.name
        }`
      );
      sendAlert(
        owner,
        `§e${player.name} §apurchased §b${formatItemName(
          vendor.item
        )} §8x§7${amount} §afrom your §dvendor§a.`
      );
    });
  }
});
