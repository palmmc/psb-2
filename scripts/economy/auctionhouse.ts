import { Player, ItemStack, world, system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { ChestFormData } from "../chest-ui/forms";
import {
  returnTime,
  nameToID,
  sendAlert,
  sendError,
  formatNumber,
} from "../main";
import { JsonDatabase } from "../database";
import { formatItemName } from "./itemcloud";

//Used for features in this pack
export const auctionDB = new JsonDatabase("auctionDB");

type itemTexture = Map<string, [string, boolean]>;

const itemTextures: itemTexture = new Map([
  //Used to find custom items, if not defined in extensions/typeIds.js (non-vanilla ones, for instance)
  ["palm:beetroot_seeds", ["minecraft:beetroot_seeds", false]],
  ["palm:wheat_seeds", ["minecraft:wheat_seeds", false]],
  ["palm:carrot", ["minecraft:carrot", false]],
  ["palm:potato", ["minecraft:potato", false]],
  ["palm:sweet_berries", ["minecraft:sweet_berries", false]],
  ["palm:berry_seeds", ["textures/items/berry_seeds", false]],
  ["palm:pumpkin_seeds", ["minecraft:pumpkin_seeds", false]],
  ["palm:melon_seeds", ["minecraft:melon_seeds", false]],
  ["palm:farmland", ["minecraft:farmland", false]],
  ["palm:lotus_token", ["textures/items/lotus_token", false]],
  ["palm:small_gem", ["textures/items/smallgem", false]],
  ["palm:medium_gem", ["textures/items/mediumgem", false]],
  ["palm:large_gem", ["textures/items/largegem", false]],
  //Repeat the above as many times as is needed
]);
const fakeItemNames = new Map([
  //Used for items that only have a lang file definition for their nametag. Vanilla items work without this, but feel free to add whatever format to whatever item typeIds you want here
  ["minecraft:example", "§r§l§2Ye Olde Dirte Blocke"],
]);
//Used for quick money formatting for players
const prefixMulti = new Map([
  ["null", 1],
  ["k", 1e3],
  ["m", 1e6],
  ["b", 1e9],
  ["t", 1e12],
]);

const enchantRarityColors = ["§a", "§9", "§5", "§6", "§c", "§b"]; //Colors for custom enchant rarities

const defaultAuctions = 3; //3 auctions per player, upper limit max is 9 at a time (Because of the UI limit, nothing else lol)

// Initialize Databases
var playerDB: any = undefined;
world.afterEvents.worldInitialize.subscribe((data) => {
  system.runTimeout(() => {
    playerDB = new JsonDatabase("playerDB", world);
  }, 180);
});

//Custom storage entity is called 'custom:storage'
//SUMMON IN THE AUCTION ENTITY BEFORE AUCTION STUFF!

/**
 * [UI] Auction menu.
 */

type AuctionInfo = {
  info: {
    slot: number;
    price: number;
    expiry: number;
    seller: string;
    numLeft: number;
  };
  item: ItemStack;
  name: string;
};

const overworld = world.getDimension("overworld");
export function auctionMenu(player: Player) {
  const auc = overworld.getEntities({
    type: "custom:storage",
    closest: 1,
    location: { x: 0, y: 6, z: 0 },
  })[0];
  const auctionInfo: AuctionInfo[] = [];
  for (const [id, itemInfo] of auctionDB.entries()) {
    itemInfo.forEach(
      (info: {
        slot: number;
        price: number;
        expiry: number;
        numLeft: number;
        seller: string;
      }) => {
        if (info.expiry > Date.now()) {
          const item = auc
            .getComponent("inventory")
            ?.container?.getItem(info.slot);
          if (item && info.numLeft > 0)
            auctionInfo.push({
              info: info,
              item: item,
              name:
                item.nameTag ??
                fakeItemNames.get(item.typeId) ??
                formatItemName(item.typeId),
            });
        }
      }
    );
  }
  auctionInfo
    .sort(function (a, b) {
      const x = a.name.replace(/§./g, "").toLowerCase(),
        y = b.name.replace(/§./g, "").toLowerCase();
      if (x < y) return -1;
      if (x > y) return 1;
      return 0;
    })
    .sort(function (a, b) {
      if (a.item.typeId !== b.item.typeId) return 0;
      const x = a.info.price,
        y = b.info.price;
      if (x < y) return -1;
      if (x > y) return 1;
      return 0;
    });
  type Page = {
    info: {
      slot: number;
      price: number;
      expiry: number;
      seller: string;
      numLeft: number;
    };
    item: ItemStack;
    name: string;
  }[];
  const pages: Page[] = [];
  let pageIndex = 0;
  while (pageIndex < auctionInfo.length / 36) {
    const pageItems = auctionInfo.slice(pageIndex * 36, (pageIndex + 1) * 36);
    if (pageItems.length) pages.push(pageItems);
    pageIndex++;
  }
  ahShow(0);
  function ahShow(selectedPage: number) {
    const ahForm = new ChestFormData("large")
      .title("§l§cAuction House")
      .button(45, "§l§c<< First Page", [], "textures/items/potion_bottle_empty")
      .button(46, "", [], "textures/blocks/glass_black")
      .button(47, "§l§c<  Prev Page", [], "textures/blocks/glass_lime")
      .button(48, "", [], "textures/blocks/glass_black")
      .button(
        49,
        `§9Page ${selectedPage + 1}`,
        [],
        "minecraft:paper",
        selectedPage + 1,
        true
      )
      .button(50, "", [], "textures/blocks/glass_black")
      .button(51, "§l§cNext Page  >", [], "textures/blocks/glass_red")
      .button(52, "", [], "textures/blocks/glass_black")
      .button(
        53,
        "§l§cLast Page >>",
        [],
        "textures/items/potion_bottle_drinkable"
      );
    for (let i = 0; i < 9; i++) {
      ahForm.button(i, "", undefined, "textures/blocks/glass_black");
      if (i === 4)
        ahForm.button(
          4,
          "§l§bActive Offers",
          [
            "",
            "§7Click to show what items\nyou have for sale, and",
            "§7claim any pending auctions.",
          ],
          "minecraft:gold_block",
          1,
          true
        );
    }
    if (pages[selectedPage])
      pages[selectedPage].forEach((info, index) => {
        const textureRef = itemTextures.get(info.item.typeId) ?? [
          info.item.typeId,
          undefined,
        ];
        ahForm.button(
          index + 9,
          info.name,
          info.item
            .getLore()
            .concat(
              ..."",
              `§7Price §8(§7ea§8)§7: §a$${formatNumber(info.info.price)}`,
              `§7Remaining Stock: §e${info.info.numLeft}`,
              `§7Expires: §c${returnTime(info.info.expiry - Date.now())}`,
              `§7Seller: §b${nameToID(undefined, info.info.seller)}`
            ),
          textureRef[0],
          info.info.numLeft,
          textureRef[1]
        );
      });
    ahForm.show(player).then((response) => {
      if (response.canceled || !response.selection) return;
      if (response.selection === 4) return viewAuc(player);
      if (response.selection === 45) return ahShow(0);
      if (response.selection === 47)
        return ahShow(Math.max(0, selectedPage - 1));
      if (response.selection === 51)
        return ahShow(Math.min(pages.length - 1, selectedPage + 1));
      if (response.selection === 53) return ahShow(pages.length - 1);
      if (response.selection < 9 || response.selection > 44)
        return ahShow(selectedPage);
      if (!response.selection) return;
      const item = pages[selectedPage][response.selection - 9].item;
      const ahInfo = pages[selectedPage][response.selection - 9].info;
      let auctions = auctionDB.get(player.id);
      if (auctions && auctions.some((v: any) => v.slot === ahInfo.slot))
        return sendError(player, `§cYou cannot buy items from yourself.`);
      new ModalFormData()
        .slider(
          `\n§aHow many §b${pages[selectedPage][
            response.selection - 9
          ].name.replace(
            /%/g,
            "%%"
          )}§r§a do you want to buy?\n§7Price/e: §6$§e${formatNumber(
            ahInfo.price
          )}\n§7Amount to buy`,
          1,
          ahInfo.numLeft,
          1
        )
        .show(player)
        .then((res) => {
          if (res.canceled || !res.formValues) return;
          const amountBought = res.formValues[0] as number;
          let pdata = playerDB.get(player.id);
          if (pdata.coins < amountBought * ahInfo.price)
            return sendError(player, `You cannot afford this transaction.`);
          const sellerInfo: {
            slot: number;
            price: number;
            expiry: number;
            seller: string;
            numLeft: number;
          }[] = auctionDB.get(ahInfo.seller) ?? [];
          const boughtItem = sellerInfo.find((v) => v.slot === ahInfo.slot);
          if (!boughtItem)
            return sendError(player, `You cannot buy this item.`);
          if (amountBought < boughtItem.numLeft)
            return sendError(player, `Not enough item in auction.`);
          if (Date.now() > boughtItem.expiry)
            return sendError(player, `This auction has expired.`);
          pdata.coins = pdata.coins - amountBought * ahInfo.price;
          playerDB.set(player.id, pdata);
          sendAlert(
            player,
            `§aSuccessfully bought §f${amountBought}x §b${
              item.nameTag ??
              fakeItemNames.get(item.typeId) ??
              formatItemName(item.typeId)
            }§r§a for §6$§e${formatNumber(amountBought * ahInfo.price)}§a.`
          );
          item.amount = amountBought;
          player.getComponent("inventory")?.container?.addItem(item);
          boughtItem.numLeft -= amountBought;
          auctionDB.set(ahInfo.seller, sellerInfo);
          let sellerP = world.getPlayers().find((p) => p.id == ahInfo.seller);
          if (sellerP)
            sendAlert(
              sellerP,
              `§b${player.name}§a bought your §f${amountBought}x §b${
                item.nameTag ?? formatItemName(item.typeId)
              }§r§a for §6$§e${formatNumber(amountBought * ahInfo.price)}§a.`
            );
        });
    });
  }
}
/**
 * [UI] Auction menu.
 */
export function viewAuc(player: Player) {
  const auc = player.dimension.getEntities({
    type: "custom:storage",
    closest: 1,
    location: { x: 0, y: 6, z: 0 },
  })[0];
  const aInv = auc.getComponent("inventory")?.container;
  if (!aInv) return;
  const auctionInfo: AuctionInfo[] = [];
  const auctionItems: {
    slot: number;
    price: number;
    expiry: number;
    seller: string;
    numLeft: number;
  }[] = auctionDB.get(player.id) ?? [];
  let pendingMoney = 0;
  auctionItems.forEach((info, index) => {
    const item = aInv.getItem(info.slot);
    if (!item) {
      delete auctionItems[index];
      return;
    }
    if (info.numLeft < item.amount) {
      pendingMoney += (item.amount - info.numLeft) * info.price;
      if (info.numLeft === 0) {
        delete auctionItems[index];
        aInv.setItem(info.slot);
      } else {
        item.amount = info.numLeft;
        aInv.setItem(info.slot, item);
      }
    }
    if (item && info.numLeft > 0)
      auctionInfo.push({
        info: info,
        item: item,
        name:
          item.nameTag ??
          fakeItemNames.get(item.typeId) ??
          formatItemName(item.typeId),
      });
  });
  if (auctionItems.filter((v) => v).length !== auctionItems.length)
    auctionItems.filter((v) => v).length
      ? auctionDB.set(
          player.id,
          auctionItems.filter((v) => v)
        )
      : auctionDB.delete(player.id);
  if (pendingMoney) {
    let pdata = playerDB.get(player.id);
    pdata.coins = pdata.coins + pendingMoney;
    playerDB.set(player.id, pdata);
    sendAlert(
      player,
      `§eClaimed §2$§a${formatNumber(
        pendingMoney
      )}§e in money from pending auctions!`,
      undefined,
      "random.orb"
    );
  }
  auctionInfo
    .sort(function (a, b) {
      const x = a.name.replace(/§./g, "").toLowerCase(),
        y = b.name.replace(/§./g, "").toLowerCase();
      if (x < y) return -1;
      if (x > y) return 1;
      return 0;
    })
    .sort(function (a, b) {
      if (a.item.typeId !== b.item.typeId) return 0;
      const x = a.info.price,
        y = b.info.price;
      if (x < y) return -1;
      if (x > y) return 1;
      return 0;
    });
  const ownForm = new ChestFormData().title("§l§cYour Auctions");
  for (let i = 0; i < 9; i++) {
    ownForm.button(i, "", [], "textures/blocks/glass_black");
    if (i === 2)
      ownForm.button(
        i,
        "§l§cBack",
        ["", "§7Click to go back to\nthe main menu."],
        "textures/items/redstone_dust"
      );
    if (
      i === 6 &&
      auctionInfo.length < Math.min(defaultAuctions, 18) &&
      aInv.emptySlotsCount > 0
    )
      ownForm.button(
        i,
        "§l§aCreate an Auction",
        ["", "§7Click to create an auction."],
        "blaze_powder"
      );
  }
  auctionInfo.forEach((info, index) => {
    const textureRef = itemTextures.get(info.item.typeId) ?? [
      info.item.typeId,
      undefined,
    ];
    ownForm.button(
      index + 9,
      info.name,
      info.item
        .getLore()
        .concat(
          ..."",
          `§7Remaining Stock: §6${info.info.numLeft}`,
          `§7Expires: §6${
            info.info.expiry - Date.now() > 0
              ? returnTime(info.info.expiry - Date.now())
              : "§l§cEXPIRED"
          }`
        ),
      textureRef[0],
      info.info.numLeft,
      textureRef[1]
    );
  });
  ownShow();
  function ownShow() {
    ownForm.show(player).then((response) => {
      if (response.canceled || !response.selection) {
        auctionMenu(player);
        return;
      }
      if (response.selection === 2) return auctionMenu(player);
      const aInv = auc.getComponent("inventory")?.container;
      if (!aInv) return;
      if (
        response.selection === 6 &&
        auctionInfo.length < Math.min(defaultAuctions, 18) &&
        aInv.emptySlotsCount > 0
      )
        return placeAuc(player);
      if (response.selection < 9) return ownShow();
      const item = auctionInfo[response.selection - 9].item;
      const aucInfo = auctionInfo[response.selection - 9].info;
      const textureRef = itemTextures.get(item.typeId) ?? [
        item.typeId,
        undefined,
      ];
      new ChestFormData()
        .title("§l§cYour Auctions")
        .button(
          13,
          auctionInfo[response.selection - 9].name,
          item
            .getLore()
            .concat(
              ..."",
              `§7Remaining Stock: §6${aucInfo.numLeft}`,
              `§7Expires: §6${
                aucInfo.expiry - Date.now() > 0
                  ? returnTime(aucInfo.expiry - Date.now())
                  : "§l§cEXPIRED"
              }`
            ),
          textureRef[0],
          aucInfo.numLeft,
          textureRef[1]
        )
        .button(21, "§aRenew Auction", [], "textures/blocks/glass_lime")
        .button(23, "§cCancel Auction", [], "textures/blocks/glass_red")
        .show(player)
        .then((resp) => {
          if (resp.canceled || resp.selection === 13) return;
          const sellerInfo: {
            slot: number;
            price: number;
            expiry: number;
            seller: string;
            numLeft: number;
          }[] = auctionDB.get(aucInfo.seller) ?? [];
          const boughtItem = sellerInfo.find((v) => v.slot === aucInfo.slot);
          if (!boughtItem)
            return sendError(player, `You cannot edit this item.`);
          if (resp.selection === 21) {
            boughtItem.expiry = Date.now() + 1 * 8.64e7;
            sendAlert(
              player,
              `§dRenewed your §b${
                item.nameTag ??
                fakeItemNames.get(item.typeId) ??
                formatItemName(item.typeId)
              }§r §8x§7${item.amount}§d for another §f${returnTime(8.64e7)}§d!`
            );
          }
          if (resp.selection === 23) {
            const [auc] = player.dimension.getEntities({
              type: "custom:storage",
              closest: 1,
              location: { x: 0, y: 6, z: 0 },
            });
            aInv.setItem(aucInfo.slot);
            player.getComponent("inventory")?.container?.addItem(item);
            sellerInfo.splice(
              sellerInfo.findIndex(
                (v: (typeof sellerInfo)[0]) => v.slot === aucInfo.slot
              ),
              1
            );
            sendAlert(
              player,
              `§cRemoved §b${
                item.nameTag ??
                fakeItemNames.get(item.typeId) ??
                formatItemName(item.typeId)
              } §8x§7${item.amount} §cfrom the auction house.`
            );
          }
          auctionDB.set(player.id, sellerInfo);
        });
    });
  }
}
/**
 * [UI] Auction menu.
 */
export function placeAuc(player: Player) {
  const validItems: ItemStack[] = [];
  const validItemSlot: number[] = [];
  for (let i = 0; i < 36; i++) {
    const item = player.getComponent("inventory")?.container?.getItem(i);
    if (!item) continue;
    validItems.push(item);
    validItemSlot.push(i);
  }
  if (!validItems.length)
    return sendError(player, `You have no items to sell.`);
  const sellForm = new ChestFormData("large").title("§l§cYour Auctions");
  validItems.forEach((item, index) => {
    const textureRef = itemTextures.get(item.typeId) ?? [
      item.typeId,
      undefined,
    ];
    sellForm.button(
      index,
      item.nameTag ??
        fakeItemNames.get(item.typeId) ??
        formatItemName(item.typeId),
      item.getLore().concat(...["§e§lCLICK TO AUCTION"]),
      textureRef[0],
      item.amount,
      textureRef[1]
    );
  });
  for (let i = 45; i < 54; i++) {
    sellForm.button(i, "", [], "textures/blocks/glass_black");
    if (i === 49)
      sellForm.button(
        i,
        "§l§6Choose an Item to Sell",
        [
          "",
          "§7Putting an item on the market",
          "§7allows all other players to",
          "§7view & purchase this item",
          "§7for a price of your choosing.",
        ],
        "minecraft:paper",
        1,
        true
      );
  }
  sellShow();
  function sellShow() {
    sellForm.show(player).then((r) => {
      if (r.canceled) return;
      let selection = r.selection ?? 0;
      if (selection > 44) return sellShow();
      /** @type {ItemStack} */
      const item = validItems[selection];
      if (item.typeId.includes("gem")) {
        sendError(player, `§cYou cannot auction this item.`);
        return;
      }
      if (
        JSON.stringify(
          (
            player
              .getComponent("inventory")
              ?.container?.getItem(validItemSlot[selection]) ??
            new ItemStack("stick", 1)
          ).getLore()
        ) != JSON.stringify(item.getLore())
      )
        return;
      new ModalFormData()
        .title("§l§cYour Auctions")
        .textField(
          "\n§fEnter a price for this item.\n§f[§6§l?§r§f] §7This is the price §o§cper unit§r§7 for sale.",
          "100, 10k, 1m, etc."
        )
        .slider("Select an amount to auction§e", 1, item.amount, 1)
        .show(player)
        .then((res) => {
          if (res.canceled || !res.formValues) return;
          const price = res.formValues[0] as string;
          const amount = Number(res.formValues[1]);
          const multiplier =
            prefixMulti.get(
              (price.match(/\D$/)?.shift() ?? "").toLowerCase()
            ) ?? 1;
          const finalPrice = Math.floor(
            parseInt(
              price
                .replace(/,|-/g, "")
                .match(/[0-9.]+/)
                ?.shift() ?? "0"
            ) * multiplier
          );
          if (finalPrice < 1) return sendError(player, `Invalid item price.`);
          if (item.amount <= amount) {
            player
              .getComponent("inventory")
              ?.container?.setItem(validItemSlot[selection]);
          } else {
            const clonedItem = item.clone();
            clonedItem.amount = item.amount - amount;
            item.amount = amount;
            player
              .getComponent("inventory")
              ?.container?.setItem(validItemSlot[selection], clonedItem);
          }
          const [auc] = player.dimension.getEntities({
            type: "custom:storage",
            closest: 1,
            location: { x: 0, y: 6, z: 0 },
          });
          const aInv = auc.getComponent("inventory")?.container;
          if (!aInv) return;
          for (let i = 0; i < aInv.size; i++) {
            if (aInv.getItem(i)) continue;
            aInv.setItem(i, item);
            const data: {
              slot: number;
              price: number;
              expiry: number;
              seller: string;
              numLeft?: number;
            }[] = auctionDB.get(player.id) ?? [];
            data.push({
              slot: i,
              price: finalPrice,
              expiry: Date.now() + 1 * 8.64e7,
              numLeft: item.amount,
              seller: player.id,
            });
            auctionDB.set(player.id, data);
            return sendAlert(
              player,
              `§aListed §b${
                item.nameTag ??
                fakeItemNames.get(item.typeId) ??
                formatItemName(item.typeId)
              }§r §8x§7${item.amount} §afor §6§e$${formatNumber(
                finalPrice
              )}§a/each.`
            );
          }
        });
    });
  }
}
