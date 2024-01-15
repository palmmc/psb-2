import {
  EntityInventoryComponent,
  GameMode,
  ItemStack,
  world,
} from "@minecraft/server";
import { BlockOres } from "../systems/miscellaneous";
import { PREFIX, randomIntFromInterval } from "../main";
import { itemsBanned } from "./miscellaneous";
import { BREAK_XP } from "../island/levels";
import { genItems } from "./generators";

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
    inv.addItem(itemStack);
    if ((item[3] as number) > 0) {
      data.player.runCommandAsync(
        `xp ${randomIntFromInterval(item[2] as number, item[3] as number)} @s`
      );
      data.player.playSound(`random.orb`, { volume: 0.5 });
    }
  } else if (inv) {
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
