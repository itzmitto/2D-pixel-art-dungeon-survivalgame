import { armorSlots, type ArmorId } from './armor.ts';
import { wolf } from './combatRules.ts';
import { bossResistance, ordinaryResistance } from './statusEffects.ts';
import { commonElementalIds, type Rarity, type WeaponId } from './weapons.ts';

const regional = {...wolf,awareness:31,leash:47,recovery:1.45,windup:1.1,reach:4.3,respawn:0};
export const regionalMonsters={
  swampStalker:{...regional,name:'Swamp Stalker',level:34,levelRange:[30,49],scale:1.12,health:204,damage:18,speed:8.15,xp:795,gold:114,material:'Swamp Essence',resistance:{control:.82,damageOverTime:.51}},
  venomQueen:{...regional,name:'Venom Queen',level:50,levelRange:[50,50],scale:2.05,health:788,damage:34,speed:5.55,xp:3290,gold:710,material:'Swamp Essence',resistance:bossResistance},
  mountainTroll:{...regional,name:'Mountain Troll',level:17,levelRange:[15,23],scale:1.55,health:125,damage:12,speed:2.8,xp:365,gold:58,material:'Troll Fang',resistance:{control:.62,damageOverTime:.94}},
  stoneGolem:{...regional,name:'Stone Golem',level:22,levelRange:[20,28],scale:1.62,health:150,damage:14,speed:2.55,xp:470,gold:71,material:'Ancient Stone',resistance:{control:.38,damageOverTime:.8}},
  cursedKnight:{...regional,name:'Cursed Knight',level:25,levelRange:[22,30],scale:1.26,health:142,damage:15,speed:4.1,xp:550,gold:89,material:'Cursed Steel',resistance:{control:.66,damageOverTime:.9}},
  trollKing:{...regional,name:'Mountain Troll King',level:25,levelRange:[25,25],scale:2.22,health:433,damage:20,speed:3.4,xp:1340,gold:375,material:'Troll Fang',resistance:bossResistance},
  cursedWarlord:{...regional,name:'Cursed Warlord',level:40,levelRange:[40,40],scale:1.88,health:637,damage:29,speed:4.3,xp:2420,gold:575,material:'Cursed Steel',resistance:bossResistance},
  ancientTitan:{...regional,name:'Ancient Titan',level:55,levelRange:[55,55],scale:2.46,health:885,damage:40,speed:3.4,xp:3730,gold:850,material:'Titan Core',resistance:bossResistance},
} as const;
export type RegionalKind=keyof typeof regionalMonsters;
export const isRegional=(kind:string):kind is RegionalKind=>Object.hasOwn(regionalMonsters,kind);

export const monsters={
  ...regionalMonsters,
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
  warlord:{...wolf,name:'Orc Warlord',scale:1.75,level:20,levelRange:[20,20],health:312,damage:16,speed:4.15,
    awareness:34,leash:45,recovery:1.43,windup:1.02,reach:4.8,xp:980,resistance:bossResistance,gold:290,material:'Magic Crystal',respawn:0},
  frostGuardian:{...wolf,name:'Frost Guardian',scale:1.69,level:35,levelRange:[35,35],health:540,damage:23,speed:3.8,
    awareness:34,leash:47,recovery:1.66,windup:1.02,reach:17,xp:1950,resistance:{control:.17,damageOverTime:.71},gold:480,material:'Magic Crystal',respawn:0},
  skeletonKing:{...wolf,name:'Skeleton King',scale:1.77,level:45,levelRange:[45,45],health:705,damage:33,speed:3.85,
    awareness:46,leash:51,recovery:1.52,windup:1.01,reach:6,xp:2800,resistance:bossResistance,gold:680,material:'Magic Crystal',respawn:0},
  darkArchmage:{...wolf,name:'Dark Archmage',scale:1.66,level:60,levelRange:[60,60],health:890,damage:43,speed:3.7,
    awareness:47,leash:53,recovery:1.48,windup:1.01,reach:22,xp:4100,resistance:bossResistance,gold:940,material:'Magic Crystal',respawn:0},
  infernalGolem:{...wolf,name:'Infernal Golem',scale:1.72,level:80,levelRange:[80,80],health:1190,damage:56,speed:3.45,
    awareness:49,leash:55,recovery:1.46,windup:1.01,reach:7.5,xp:6200,resistance:bossResistance,gold:1320,material:'Magic Crystal',respawn:0},
  ancientDragon:{...wolf,name:'Ancient Dragon',scale:1.96,level:100,levelRange:[100,100],health:1530,damage:73,speed:4.1,
    awareness:56,leash:66,recovery:1.58,windup:1.01,reach:17,xp:8700,resistance:bossResistance,gold:1900,material:'Magic Crystal',respawn:0},
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
    ? commonElementalIds[Math.floor(random()*commonElementalIds.length)] : undefined);
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
