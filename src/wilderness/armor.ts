import { enhancedName, enhancementLevel, enhancementTuning } from './materials.ts';
export const armorSlots=['helmet','chestplate','gauntlets','legs','boots','cape','amulet','ring'] as const;
export type ArmorSlot=typeof armorSlots[number];
export const armorLabels:Record<ArmorSlot,string>={
  helmet:'Helmet',chestplate:'Chestplate',gauntlets:'Gauntlets',legs:'Leg Armor',boots:'Boots',cape:'Cape',amulet:'Amulet',ring:'Ring',
};
export const armorSets=['iron','blacksteel','abyssal'] as const;
export type ArmorSet=typeof armorSets[number];
export type ArmorId=`${ArmorSet}-${ArmorSlot}`|'sentinel-chestplate';
export type ArmorEnhancements=Partial<Record<ArmorId,number>>;
export type EquippedArmor=Partial<Record<ArmorSlot,ArmorId>>;
const sets={
  iron:{name:'Iron Hunter',rarity:'Uncommon',description:'Riveted iron and oxblood leather.'},
  blacksteel:{name:'Blacksteel',rarity:'Epic',description:'Tempered blacksteel with silver fittings.'},
  abyssal:{name:'Abyssal Knight',rarity:'Legendary',description:'Blackened plate etched with living violet runes.'},
} as const;
const bonuses={
  helmet:{defense:1,health:1},chestplate:{defense:2,health:2},gauntlets:{strength:1},
  legs:{defense:1,health:1},boots:{agility:1},cape:{health:1,luck:1},amulet:{intelligence:1},ring:{luck:1,strength:1},
};
type BonusKey='defense'|'health'|'strength'|'agility'|'intelligence'|'luck';
const catalog=new Map<ArmorId,{id:ArmorId;slot:ArmorSlot;set:ArmorSet;name:string;description:string;rarity:'Uncommon'|'Epic'|'Legendary';icon:string;bonus:Partial<Record<BonusKey,number>>}>(armorSets.flatMap((set,index)=>armorSlots.map(slot=>{
  const id:ArmorId=`${set}-${slot}`;
  const bonus=Object.fromEntries(Object.entries(bonuses[slot]).map(([key,value])=>[key,value*(index+1)])) as Partial<Record<BonusKey,number>>;
  return [id,{id,set,slot,bonus,...sets[set],name:sets[set].name+' '+armorLabels[slot],icon:id}] as const;
})));
catalog.set('sentinel-chestplate',{id:'sentinel-chestplate',slot:'chestplate',set:'abyssal',rarity:'Legendary',
  name:'Hollow Sentinel Armor',description:'Blackened armor etched with the guardian’s violet runes.',icon:'sentinel-chestplate',bonus:{defense:8,health:8}});
export function isArmorId(value:unknown):value is ArmorId{
  return typeof value==='string'&&catalog.has(value as ArmorId);
}
export const armorPiece=(id:ArmorId)=>catalog.get(id)!;
export function armorBonus(equipped:EquippedArmor={},enhancements:ArmorEnhancements={}){
  const total:Record<BonusKey,number>={defense:0,health:0,strength:0,agility:0,intelligence:0,luck:0};
  for(const slot of armorSlots){
    const id=equipped[slot];
    if(!id) continue;
    const piece=armorPiece(id);
    if(piece.slot!==slot) continue;
    for(const key of Object.keys(piece.bonus) as BonusKey[])
      total[key]+=(piece.bonus[key]??0)*(key==='defense'?1+enhancementLevel(enhancements[id])*enhancementTuning.armorDefense:1);
  }
  return total;
}
export const armorName=(id:ArmorId,level?:number)=>enhancedName(armorPiece(id).name,enhancementLevel(level));
export const armorStats=(id:ArmorId,level=0)=>Object.entries(armorPiece(id).bonus).map(([key,value])=>
  [key==='health'?'Max health':key[0].toUpperCase()+key.slice(1),'+'+Number((value*(key==='defense'?1+enhancementLevel(level)*enhancementTuning.armorDefense:1)).toFixed(2))] as const);
