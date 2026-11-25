import { wolf } from './combatRules.ts';
import { bossResistance, ordinaryResistance } from './statusEffects.ts';
import { elementalIds, type Rarity, type WeaponId } from './weapons.ts';

export const monsters={
  wild:{...wolf,name:'Wild Wolf',scale:1,levelRange:[1,2],resistance:ordinaryResistance,gold:4,material:'Wolf Hide',respawn:95},
  dire:{...wolf,name:'Dire Wolf',scale:1.35,level:4,levelRange:[3,5],health:19,damage:4,speed:5.6,
    awareness:24,recovery:.83,windup:.68,reach:2.35,xp:60,resistance:{control:.85,damageOverTime:1},gold:11,material:'Dire Fang',respawn:140},
  guardian:{...wolf,name:'Fang Guardian',scale:1.95,level:7,levelRange:[7,7],health:85,damage:9,speed:5.8,
    awareness:40,leash:48,recovery:1.4,windup:.85,reach:3.2,xp:210,resistance:bossResistance,gold:45,material:'Magic Crystal',respawn:0},
} as const;
export type MonsterKind=keyof typeof monsters;
export type Drop={gold:number;material:string;weapon?:WeaponId;rarity:Rarity;potion?:number;armor?:number};
export const rarityOrder=['Common','Uncommon','Rare','Epic','Legendary','Mythic'] as const;
const weights=[56,27,12,4,.9,.1] as const;
export function rollDrop(kind:MonsterKind,random:()=>number,luck:number,guaranteed?:WeaponId):Drop {
  const spec=monsters[kind];
  const scale=kind==='wild'?1:kind==='dire'?1.8:4;
  const odds=weights.map((weight,index)=>index<2?weight:weight*scale*(1+luck));
  let roll=random()*odds.reduce((sum,weight)=>sum+weight,0);
  const index=odds.findIndex(weight=>(roll-=weight)<0);
  const tier=kind==='guardian'?Math.max(3,index):Math.max(0,index);
  const weapon=guaranteed??(kind==='guardian'||random()<.13+luck*.14
    ? elementalIds[Math.floor(random()*elementalIds.length)] : undefined);
  return {gold:spec.gold,material:spec.material,rarity:rarityOrder[tier],weapon,
    potion:kind==='guardian'||random()<.19?1:0};
}
