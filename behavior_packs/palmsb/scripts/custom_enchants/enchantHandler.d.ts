import type {
  Player,
  Entity,
  Block,
  ItemStack,
  BlockPermutation,
  Direction,
  EntityDamageSource,
  Vector3,
  EquipmentSlot,
} from "@minecraft/server";

type EnchantCallback<Params = {}> = (
  data: { player: Player; level: number; item: ItemStack } & Params
) => void;

interface EnchantInfo {
  maxLevel: number;
  display: string;
  info?: string;
  type?: Array<string>;
  incompatible?: Array<string>;
  rarity: "common" | "rare" | "epic" | "unique" | "forged";
  userHurt?: EnchantCallback<{
    damageSource: EntityDamageSource;
    damage: number;
  }>;
  entityHurt?: EnchantCallback<{ entity: Entity; damage: number }>;
  entityHit?: EnchantCallback<{ entity: Entity }>;
  blockHit?: EnchantCallback<{ block: Block; blockFace: Direction }>;
  blockBreak?: EnchantCallback<{
    block: Block;
    brokenBlockPermutation: BlockPermutation;
  }>;
  itemUse?: EnchantCallback;
  itemUseOn?: EnchantCallback<{
    block: Block;
    blockFace: Direction;
    faceLocation: Vector3;
  }>;
  hold?: EnchantCallback;
}

interface EnchantData {
  level: number;
  id: string;
  info: EnchantInfo;
}

export declare class Enchant {
  constructor(id: string, info: EnchantInfo);
  onUserHurt(callback: EnchantInfo["userHurt"]): Enchant;
  onEntityHurt(callback: EnchantInfo["entityHurt"]): Enchant;
  onEntityHit(callback: EnchantInfo["entityHit"]): Enchant;
  onBlockHit(callback: EnchantInfo["blockHit"]): Enchant;
  onBlockBreak(callback: EnchantInfo["blockBreak"]): Enchant;
  onItemUse(callback: EnchantInfo["itemUse"]): Enchant;
  onItemUseOn(callback: EnchantInfo["itemUseOn"]): Enchant;
  onHold(callback: EnchantInfo["hold"]): Enchant;
  static addEnchant(
    item: ItemStack,
    enchantId: string,
    level?: number
  ): ItemStack;
  static removeEnchant(item: ItemStack, enchantId: string): ItemStack;
  static getEnchant(item: ItemStack, enchantId: string): EnchantData;
  static getEnchants(item: ItemStack): EnchantData[];
  static enchants: Iterable<EnchantInfo>;
}
