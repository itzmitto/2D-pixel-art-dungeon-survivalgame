import { enhancedName, enhancementLevel, enhancementTuning } from './materials.ts';
import { rarity, weapons, type Rarity, type WeaponId } from './weapons.ts';

export const bossRelics={
  venomReed:{name:'Venomreed Katana',type:'katana',description:'The Venom Queen’s translucent barb honed into a slender wind blade.'},
  slatebreaker:{name:'Slatebreaker',type:'axe',description:'A jagged axe cut from the Troll King’s monumental club.'},
  oathbreaker:{name:'Oathbreaker’s Vow',type:'greatsword',description:'A greatsword etched with the last oath of the vault’s fallen sovereign.'},
  titanEdge:{name:'Moonfall, Edge of the Titan',type:'greatsword',description:'Stone and ancient metal bound around an undying blue rune.'},
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
export function relicForReward(id:string,type:WeaponId):RelicId|undefined{
  if(type==='katana'&&id.startsWith('chest-reward-venomroot-grotto-')) return 'venomReed';
  if(type==='axe'&&id.startsWith('chest-reward-slatefang-hollow-')) return 'slatebreaker';
  if(type==='greatsword'&&id.startsWith('chest-reward-oathbreakers-vault-')) return 'oathbreaker';
  if(type==='greatsword'&&id==='chest-forsaken-titan-reward') return 'titanEdge';
  if(type==='longsword'&&id.startsWith('den-guardian-')) return 'fangblade';
  if(id.startsWith('chest-reward-ironfang-vault-')) return 'bloodfang';
  if(id.startsWith('chest-reward-rimeheart-grotto-')) return 'frostbound';
  if(id.startsWith('chest-reward-forgotten-crypt-')) return 'boneSovereign';
  if(id.startsWith('chest-reward-arcane-sanctum-')) return 'arcaneDominion';
  if(type==='greatsword'&&id.startsWith('chest-reward-infernal-depths-')) return 'infernalRuin';
  if(id.startsWith('chest-reward-dragons-hollow-')) return 'dragonheart';
  return undefined;
}
export function instanceWeapon(item:WeaponItem){
  const base=weapons[item.type], relic=item.relic?bossRelics[item.relic]:undefined, enhancement=enhancementLevel(item.enhancement);
  return {...base,name:enhancedName(relic?.name??base.name,enhancement),description:relic?.description??base.description,
    rarity:item.rarity,enhancement,damage:base.damage*(1+enhancement*enhancementTuning.weaponDamage)};
}
export const itemIcon=(item:WeaponItem)=>item.relic??item.type;
export const elementalRarity=(item:WeaponItem)=>1+(rarity[item.rarity].multiplier-1)*.2;
export const abilityEnhancement=(item:WeaponItem)=>1+enhancementLevel(item.enhancement)*(enhancementTuning.weaponDamage+enhancementTuning.elemental);
