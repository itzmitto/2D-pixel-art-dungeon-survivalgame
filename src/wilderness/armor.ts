export const armorSlots=['helmet','chestplate','gauntlets','legs','boots','cape','amulet','ring'] as const;
export type ArmorSlot=typeof armorSlots[number];
export const armorLabels:Record<ArmorSlot,string>={
  helmet:'Helmet',chestplate:'Chestplate',gauntlets:'Gauntlets',legs:'Leg Armor',boots:'Boots',cape:'Cape',amulet:'Amulet',ring:'Ring',
};
export const armorSets=['iron','blacksteel','abyssal'] as const;
export type ArmorSet=typeof armorSets[number];
export type ArmorId=`${ArmorSet}-${ArmorSlot}`;
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
const catalog=new Map(armorSets.flatMap((set,index)=>armorSlots.map(slot=>{
  const id:ArmorId=`${set}-${slot}`;
  const bonus=Object.fromEntries(Object.entries(bonuses[slot]).map(([key,value])=>[key,value*(index+1)])) as Partial<Record<BonusKey,number>>;
  return [id,{id,set,slot,bonus,...sets[set],name:sets[set].name+' '+armorLabels[slot],icon:id}] as const;
})));
export function isArmorId(value:unknown):value is ArmorId{
  return typeof value==='string'&&catalog.has(value as ArmorId);
}
export const armorPiece=(id:ArmorId)=>catalog.get(id)!;
export function armorBonus(equipped:EquippedArmor={}){
  const total:Record<BonusKey,number>={defense:0,health:0,strength:0,agility:0,intelligence:0,luck:0};
  for(const slot of armorSlots){
    const id=equipped[slot];
    if(!id) continue;
    const piece=armorPiece(id);
    if(piece.slot!==slot) continue;
    for(const key of Object.keys(piece.bonus) as BonusKey[]) total[key]+=piece.bonus[key]??0;
  }
  return total;
}
export const armorStats=(id:ArmorId)=>Object.entries(armorPiece(id).bonus).map(([key,value])=>
  [key==='health'?'Max health':key[0].toUpperCase()+key.slice(1),'+'+value] as const);
