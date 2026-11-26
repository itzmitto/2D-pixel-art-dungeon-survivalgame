import { enhancedName, enhancementLevel, enhancementTuning } from './materials.ts';
import { rarity, weapons, type Rarity, type WeaponId } from './weapons.ts';

export const bossRelics={
  fangblade:{name:'Fangblade',type:'longsword',description:'The Fang Guardian’s curved fang set into a silver hunter’s blade.'},
  bloodfang:{name:'Bloodfang Battle Axe',type:'axe',description:'The Warlord’s notched axes carry a jagged crimson inlay.'},
  frostbound:{name:'Frostbound Staff',type:'staff',description:'Glacial crystal bound in the Frost Guardian’s frozen crown.'},
  boneSovereign:{name:"Bone Sovereign’s Greatsword",type:'greatsword',description:'A royal execution blade engraved with the Skeleton King’s burial runes.'},
  arcaneDominion:{name:'Arcane Dominion Staff',type:'staff',description:'The Archmage’s levitating relic harnesses a fractured violet star.'},
  infernalRuin:{name:'Infernal Ruin Greatsword',type:'greatsword',description:'A black volcanic blade forged from the Infernal Golem’s core.'},
  dragonheart:{name:'Dragonheart Katana',type:'katana',description:'A wind blade edged with the Ancient Dragon’s ember-bright scales.'},
} as const satisfies Record<string,{name:string;type:WeaponId;description:string}>;
export type RelicId=keyof typeof bossRelics;
export type WeaponItem={id:string;type:WeaponId;rarity:Rarity;enhancement?:number;relic?:RelicId};
export const legacyItem=(type:WeaponId):WeaponItem=>({id:type,type,rarity:weapons[type].rarity});
export function relicForReward(id:string):RelicId|undefined{
  if(id.startsWith('den-guardian-')||id==='chest-den-reward') return 'fangblade';
  if(id.startsWith('chest-reward-ironfang-vault-')) return 'bloodfang';
  if(id.startsWith('chest-reward-rimeheart-grotto-')) return 'frostbound';
  if(id.startsWith('chest-reward-forgotten-crypt-')) return 'boneSovereign';
  if(id.startsWith('chest-reward-arcane-sanctum-')) return 'arcaneDominion';
  if(id.startsWith('chest-reward-infernal-depths-')) return 'infernalRuin';
  if(id.startsWith('chest-reward-dragons-hollow-')) return 'dragonheart';
}
export function instanceWeapon(item:WeaponItem){
  const base=weapons[item.type], relic=item.relic?bossRelics[item.relic]:undefined, enhancement=enhancementLevel(item.enhancement);
  return {...base,name:enhancedName(relic?.name??base.name,enhancement),description:relic?.description??base.description,
    rarity:item.rarity,enhancement,damage:base.damage*(1+enhancement*enhancementTuning.weaponDamage)};
}
export const itemIcon=(item:WeaponItem)=>item.relic??item.type;
export const elementalRarity=(item:WeaponItem)=>1+(rarity[item.rarity].multiplier-1)*.2;
export const abilityEnhancement=(item:WeaponItem)=>1+enhancementLevel(item.enhancement)*(enhancementTuning.weaponDamage+enhancementTuning.elemental);
