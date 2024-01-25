import {
  EntityInventoryComponent,
  EquipmentSlot,
  GameMode,
  ItemStack,
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
    giveRelic(data.player, rollRelic("ORE"));
    let mh = data.player
      .getComponent("equippable")
      ?.getEquipment(EquipmentSlot.Mainhand);
    if (mh) {
      let trove = Enchant.getEnchant(mh, "trove");
      if (trove) {
        if (randomIntFromInterval(1, 26 - trove.level * 2) == 1) {
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
    if (!itemsBanned.includes(it.typeId.slice(10))) inv.addItem(it.clone());
  }
});

// PREVENT PLACE/BREAK XP
world.beforeEvents.playerPlaceBlock.subscribe((data) => {
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
