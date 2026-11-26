import { armorSlots, type ArmorId } from './armor.ts';
import { wolf } from './combatRules.ts';
import { bossResistance, ordinaryResistance } from './statusEffects.ts';
import { elementalIds, type Rarity, type WeaponId } from './weapons.ts';

export const monsters={
  wild:{...wolf,name:'Wild Wolf',scale:1,levelRange:[1,2],resistance:ordinaryResistance,gold:4,material:'Wolf Hide',respawn:95},
  dire:{...wolf,name:'Dire Wolf',scale:1.35,level:4,levelRange:[3,5],health:19,damage:4,speed:5.6,
    awareness:24,recovery:.83,windup:.68,reach:2.35,xp:60,resistance:{control:.85,damageOverTime:1},gold:11,material:'Dire Fang',respawn:140},
  skeleton:{...wolf,name:'Skeleton Warrior',scale:1.10,level:5,levelRange:[4,6],health:23,damage:5,speed:3.2,
    awareness:20,recovery:1.45,windup:1.04,reach:2.65,xp:80,resistance:{control:.78,damageOverTime:.72},gold:16,material:'Bones',respawn:165},
  goblin:{...wolf,name:'Briar Goblin',scale:1.16,level:3,levelRange:[2,4],health:13,damage:3,speed:6.3,
    awareness:21,recovery:.91,windup:.42,reach:2.05,xp:42,resistance:{control:1,damageOverTime:1.1},gold:9,material:'Goblin Hide',respawn:125},
  elite:{...wolf,name:'Gravefang',scale:1.79,level:10,levelRange:[10,10],health:66,damage:7,speed:6.2,
    awareness:23,recovery:1.25,windup:.66,reach:2.72,xp:165,resistance:{control:.38,damageOverTime:.76},gold:32,material:'Dire Fang',respawn:0},
  brute:{...wolf,name:'Orc Brute',scale:1.32,level:7,levelRange:[6,8],health:53,damage:7,speed:2.75,
    awareness:19,leash:24,recovery:1.5,windup:1.02,reach:3.0,xp:135,resistance:{control:.61,damageOverTime:.86},gold:26,material:'Orc Tusks',respawn:0},
  assassin:{...wolf,name:'Orc Assassin',scale:1.07,level:6,levelRange:[5,7],health:32,damage:4,speed:6.4,
    awareness:21,leash:25,recovery:.82,windup:.49,reach:2.15,xp:105,resistance:{control:.84,damageOverTime:1},gold:18,material:'Orc Tusks',respawn:0},
  wizard:{...wolf,name:'Dark Wizard',scale:1.12,level:8,levelRange:[7,9],health:42,damage:6,speed:3.5,
    awareness:24,leash:33,recovery:1.15,windup:.72,reach:15,xp:155,resistance:{control:.73,damageOverTime:.87},gold:34,material:'Magic Crystal',respawn:0},
  ritualElite:{...wolf,name:'Veil Hierophant',scale:1.35,level:11,levelRange:[10,12],health:91,damage:9,speed:3.8,
    awareness:29,leash:37,recovery:1.36,windup:.92,reach:17,xp:265,resistance:{control:.32,damageOverTime:.68},gold:79,material:'Magic Crystal',respawn:0},
  sentinel:{...wolf,name:'The Hollow Sentinel',scale:1.52,level:13,levelRange:[13,13],health:174,damage:11,speed:3.65,
    awareness:34,leash:44,recovery:1.43,windup:.88,reach:4.3,xp:615,resistance:bossResistance,gold:155,material:'Magic Crystal',respawn:0},
  guardian:{...wolf,name:'Fang Guardian',scale:1.95,level:7,levelRange:[7,7],health:85,damage:9,speed:5.8,
    awareness:40,leash:48,recovery:1.4,windup:.85,reach:3.2,xp:210,resistance:bossResistance,gold:45,material:'Magic Crystal',respawn:0},
} as const;
export type MonsterKind=keyof typeof monsters;
export const enemyXpMultiplier=10;
export const enemyXpReward=(kind:MonsterKind,base:number=monsters[kind].xp)=>enemyXpMultiplier*(base+(kind==='guardian'?160:0));
export type Drop={gold:number;material:string;weapon?:WeaponId;rarity:Rarity;potion?:number;armor?:number;armorPiece?:ArmorId;extra?:'Leather'|'Iron'};
export const rarityOrder=['Common','Uncommon','Rare','Epic','Legendary','Mythic'] as const;
const weights=[56,27,12,4,.9,.1] as const;
export function rollDrop(kind:MonsterKind,random:()=>number,luck:number,guaranteed?:WeaponId,ranked?:{level:number;elite:boolean;gold:number}):Drop {
  const spec=monsters[kind];
  const wizard=kind==='wizard'||kind==='ritualElite';
  const orc=kind==='brute'||kind==='assassin';
  const scale=kind==='wild'?1:kind==='dire'?1.8:4;
  const odds=weights.map((weight,index)=>{
    if(!ranked) return index<2?weight:weight*scale*(1+luck);
    if(index<2) return weight;
    if(index>=4&&!ranked.elite) return weight*(ranked.level<7?.22:.68);
    return weight*(1+luck)*(1+ranked.level*.12)*(ranked.elite?2.3:1);
  });
  let roll=random()*odds.reduce((sum,weight)=>sum+weight,0);
  const index=odds.findIndex(weight=>(roll-=weight)<0);
  const tier=kind==='guardian'||kind==='elite'||kind==='ritualElite'||kind==='sentinel'?Math.max(3,index):Math.max(0,index);
  const weapon=guaranteed??(wizard&&(kind==='ritualElite'||random()<.40)?'staff':undefined)??((kind==='guardian'||kind==='elite'||kind==='sentinel')||random()<(orc?.26:.13)+luck*.14
    ? elementalIds[Math.floor(random()*elementalIds.length)] : undefined);
  return {gold:ranked?.gold??spec.gold,material:kind==='skeleton'&&random()<.35?'Iron':spec.material,rarity:rarityOrder[tier],weapon,
    potion:(kind==='guardian'||kind==='elite'||kind==='sentinel')||random()<(wizard?.72:orc?.54:.19)?1:0,
    extra:orc?(kind==='brute'?'Iron':'Leather'):undefined};
}

export function enemyArmor(kind:MonsterKind,id:string,seed:number,kill:number,level:number,owned:readonly ArmorId[]):ArmorId|undefined{
  let key=seed^Math.imul(kill,1103515245);
  for(const char of id) key=Math.imul(key^char.charCodeAt(0),16777619);
  const roll=(key>>>0)%100;
  const repeatable=kind==='dire'||kind==='skeleton';
  const set=kind==='guardian'||kind==='ritualElite'||kind==='sentinel'?(roll<63?'abyssal':'blacksteel'):
    repeatable&&level>=15&&roll<9?'abyssal':
    kind==='wizard'||kind==='elite'||kind==='brute'||repeatable?(roll<59?'blacksteel':undefined):
    roll<35?'iron':undefined;
  if(!set) return;
  if(kind==='ritualElite') return `${set}-ring`;
  const start=(key>>>8)%armorSlots.length;
  const candidates=armorSlots.map((_,i):ArmorId=>`${set}-${armorSlots[(start+i)%armorSlots.length]}`);
  return candidates.find(id=>!owned.includes(id))??candidates[0];
}
