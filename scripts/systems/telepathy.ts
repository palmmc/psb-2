import {
  Block,
  BlockPermutation,
  EntityInventoryComponent,
  EquipmentSlot,
  GameMode,
  ItemStack,
  Player,
  PlayerBreakBlockAfterEvent,
  system,
  world,
} from "@minecraft/server";
import { BlockOres, CROP_DROPS, CROP_TABLES } from "./miscellaneous";
import { PREFIX, randomIntFromInterval } from "../main";
import { itemsBanned } from "./miscellaneous";
import { BREAK_XP } from "../island/levels";
import { genItems } from "./generators";
import { Enchant } from "../custom_enchants/enchantHandler";
import { giveRelic, rollRelic } from "./relic";

export const CustomDrops = [
  ["minecraft:stone", "minecraft:cobblestone", 100],
  ["minecraft:leaves", "minecraft:sapling", 8],
];

export function orelepathy(data: { player: Player; block: Block }) {
  const inv = (<EntityInventoryComponent>data.player.getComponent("inventory"))
    ?.container;
  let item = BlockOres.find((x) => {
    return x[0] == data.block.typeId;
  });
  if (!item || !inv) return;
  let itemStack = new ItemStack(item[1] as string, 1);
  let mh = data.player
    .getComponent("equippable")
    ?.getEquipment(EquipmentSlot.Mainhand);
  if (mh && (item[0] as string).includes("ore")) {
    let trove = Enchant.getEnchant(mh, "trove");
    if (trove) {
      if (randomIntFromInterval(1, 23 - trove.level * 2) == 1) {
        itemStack.amount = randomIntFromInterval(
          1,
          Math.floor(trove.level / 2)
        );
      }
    }
    let forge = Enchant.getEnchant(mh, "forge");
    if (forge) {
      if (randomIntFromInterval(1, 21 - forge.level * 4) == 1) {
        if (itemStack.typeId.includes("ore"))
          itemStack = new ItemStack(
            itemStack.typeId.split("_")[0] + "_ingot",
            itemStack.amount
          );
      }
    }
  }
  inv.addItem(itemStack);
}

// EVENT HANDLER
world.afterEvents.playerBreakBlock.subscribe((data) => {
  if (
    Object.values(genItems).includes(
      data.brokenBlockPermutation.type.id.slice(10)
    )
  )
    return;
  const inv = (<EntityInventoryComponent>data.player.getComponent("inventory"))
    ?.container;
  if (inv && inv.emptySlotsCount == 0) {
    data.player.sendMessage(`${PREFIX.island} §cYour inventory is full!`);
    return;
  }
  let item = BlockOres.find((x) => {
    return x[0] == data.brokenBlockPermutation.type.id;
  });
  if (item && inv) {
    let itemStack = new ItemStack(item[1] as string, 1);
    let mh = data.player
      .getComponent("equippable")
      ?.getEquipment(EquipmentSlot.Mainhand);
    if (mh && (item[0] as string).includes("ore")) {
      let trove = Enchant.getEnchant(mh, "trove");
      if (trove) {
        if (randomIntFromInterval(1, 23 - trove.level * 2) == 1) {
          itemStack.amount = randomIntFromInterval(
            1,
            Math.floor(trove.level / 2)
          );
        }
      }
      let forge = Enchant.getEnchant(mh, "forge");
      if (forge) {
        if (randomIntFromInterval(1, 21 - forge.level * 4) == 1) {
          if (itemStack.typeId.includes("ore"))
            itemStack = new ItemStack(
              itemStack.typeId.split("_")[0] + "_ingot",
              itemStack.amount
            );
        }
      }
      let cryptic = Enchant.getEnchant(mh, "cryptic");
      if (cryptic) {
        giveRelic(data.player, rollRelic("ORE", cryptic.level * 14));
      } else giveRelic(data.player, rollRelic("ORE"));
    }
    inv.addItem(itemStack);
    /*
    data.player.runCommandAsync(
      `give @s ${itemStack.typeId} ${itemStack.amount}`
    );
    */
    if ((item[3] as number) > 0) {
      data.player.runCommandAsync(
        `xp ${randomIntFromInterval(item[2] as number, item[3] as number)} @s`
      );
      if (!data.player.hasTag("pref:quieter_mining"))
        data.player.playSound(`random.orb`, { volume: 0.5 });
    }
  } else if (inv) {
    item = CROP_DROPS.find((x) => x[1] == data.brokenBlockPermutation.type.id);
    if (item) {
      if (data.brokenBlockPermutation.getState("palm:growth_stage") != 7)
        data.player.runCommandAsync(
          `loot give @s loot "${CROP_TABLES[item[0] as number]}young"`
        );
      else
        data.player.runCommandAsync(
          `loot give @s loot "${CROP_TABLES[item[0] as number]}mature"`
        );
      return;
    }
    let it = data.brokenBlockPermutation.getItemStack();
    if (!it) return;
    if (itemsBanned.includes(it.typeId.slice(10))) return;
    let cit = CustomDrops.find((x) => x[0] == it?.typeId);
    if (cit) {
      if (randomIntFromInterval(1, Math.floor(100 / (cit[2] as number))) == 1) {
        inv.addItem(new ItemStack(cit[1] as string, 1));
      }
      return;
    }
    inv.addItem(it);
  }
});

// PREVENT PLACE/BREAK XP
world.beforeEvents.itemUseOn.subscribe((data) => {
  if (
    data.block.typeId.includes("palm") &&
    !data.block.typeId.includes("farmland")
  ) {
    data.cancel = true;
    return;
  }
  let item = BREAK_XP.find((x) => {
    return x[0] == data.itemStack.typeId && (x[1] as number) >= 0 && !x[3];
  });
  if (item) data.cancel = true;
});

world.beforeEvents.playerInteractWithBlock.subscribe((data) => {
  if (
    data.itemStack?.typeId.includes("hoe") &&
    (data.block.typeId.includes("dirt") ||
      data.block.typeId == "minecraft:grass")
  )
    system.run(() => data.block.setType("palm:farmland"));
});

// Chest Mmm inventory
world.beforeEvents.playerBreakBlock.subscribe((data) => {
  let binv = data.block.getComponent("inventory")?.container;
  if (!binv) return;
  let inv = data.player.getComponent("inventory")?.container;
  if (!inv) return;
  if (binv.emptySlotsCount == binv.size) return;
  if (binv.size > 27) return;
  data.cancel = true;
  if (inv.emptySlotsCount == 0) {
    data.player.sendMessage(`${PREFIX.island} §cYour inventory is full!`);
    return;
  }
  system.run(() => {
    if (!inv || !binv) return;
    let emptySlots = inv.emptySlotsCount;
    for (let i = 0; i < binv.size; i++) {
      if (emptySlots - i == 0) return;
      let item = binv.getItem(i);
      if (item) inv.addItem(item);
      binv.setItem(i);
    }
  });
});
