import { rarity, weapons, type Rarity, type WeaponId } from './weapons.ts';

export type WeaponItem={id:string;type:WeaponId;rarity:Rarity};
export const legacyItem=(type:WeaponId):WeaponItem=>({id:type,type,rarity:weapons[type].rarity});
export function instanceWeapon(item:WeaponItem){
  return {...weapons[item.type],rarity:item.rarity};
}
export const elementalRarity=(item:WeaponItem)=>1+(rarity[item.rarity].multiplier-1)*.2;
