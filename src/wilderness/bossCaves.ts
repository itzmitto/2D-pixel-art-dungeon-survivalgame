import type { ArmorId } from './armor.ts';
import type { Rarity, WeaponId } from './weapons.ts';

type Cave = {
  id:string; name:string; x:number;z:number;arena:number; width:number;depth:number;
  kind:'warlord'|'frostGuardian'|'skeletonKing'|'darkArchmage'|'infernalGolem'|'ancientDragon'|'trollKing'|'cursedWarlord'|'venomQueen';
  boss:string;level:number;recommended:number;rank:string;rarity:Rarity;upgrade?:'Legendary'|'Mythic';chance?:number;
  weapon:WeaponId;armor:ArmorId;gold:number;rating:number;crystals:number;potions:number;color:number;respawnMs:number;
};
export const bossCaves=[
  {id:'ironfang-vault',name:'Bloodfang Cavern',x:-146,z:-111,arena:948,width:17,depth:19,kind:'warlord',boss:'Orc Warlord',level:20,
    recommended:20,rank:'C',rarity:'Epic',weapon:'axe',armor:'blacksteel-chestplate',gold:290,rating:10,crystals:5,potions:2,color:0xffa268,respawnMs:300_000},
  {id:'rimeheart-grotto',name:'Frozen Abyss',x:185,z:185,arena:1068,width:18,depth:19.7,kind:'frostGuardian',boss:'Frost Guardian',level:35,
    recommended:35,rank:'B',rarity:'Epic',upgrade:'Legendary',chance:.40,weapon:'staff',armor:'blacksteel-helmet',gold:480,rating:13,crystals:9,potions:4,color:0x8edaff,respawnMs:300_000},
  {id:'forgotten-crypt',name:'Forgotten Crypt',x:-136,z:142,arena:1188,width:20,depth:21,kind:'skeletonKing',boss:'Skeleton King',level:45,
    recommended:45,rank:'A',rarity:'Legendary',weapon:'greatsword',armor:'abyssal-chestplate',gold:680,rating:15,crystals:13,potions:5,color:0xd6aa64,respawnMs:300_000},
  {id:'arcane-sanctum',name:'Arcane Sanctum',x:102,z:-150,arena:1308,width:22,depth:22,kind:'darkArchmage',boss:'Dark Archmage',level:60,
    recommended:60,rank:'S',rarity:'Legendary',upgrade:'Mythic',chance:.28,weapon:'staff',armor:'abyssal-cape',gold:940,rating:18,crystals:19,potions:6,color:0xc390ff,respawnMs:300_000},
  {id:'infernal-depths',name:'Infernal Depths',x:210,z:-118,arena:1428,width:23,depth:23,kind:'infernalGolem',boss:'Infernal Golem',level:80,
    recommended:80,rank:'SS',rarity:'Legendary',upgrade:'Mythic',chance:.55,weapon:'axe',armor:'abyssal-gauntlets',gold:1320,rating:21,crystals:27,potions:8,color:0xff7f46,respawnMs:300_000},
  {id:'dragons-hollow',name:"Dragon's Hollow",x:207,z:133,arena:1548,width:30,depth:28,kind:'ancientDragon',boss:'Ancient Dragon',level:100,
    recommended:100,rank:'SSS',rarity:'Mythic',weapon:'katana',armor:'abyssal-amulet',gold:1900,rating:25,crystals:40,potions:11,color:0xffa04e,respawnMs:300_000},
  {id:'slatefang-hollow',name:'Slatefang Hollow',x:-43,z:-333,arena:1668,width:21,depth:23,kind:'trollKing',boss:'Mountain Troll King',level:25,
    recommended:25,rank:'C',rarity:'Epic',upgrade:'Legendary',chance:.45,weapon:'axe',armor:'blacksteel-amulet',gold:375,rating:11,crystals:7,potions:3,color:0xc9e18d,respawnMs:300_000},
  {id:'oathbreakers-vault',name:'Oathbreaker’s Vault',x:11,z:-433,arena:1788,width:22,depth:23,kind:'cursedWarlord',boss:'Cursed Warlord',level:40,
    recommended:40,rank:'B',rarity:'Legendary',weapon:'greatsword',armor:'abyssal-cape',gold:575,rating:14,crystals:11,potions:4,color:0xc49aff,respawnMs:300_000},
  {id:'venomroot-grotto',name:'Venomroot Grotto',x:-22,z:-619,arena:1908,width:25,depth:25,kind:'venomQueen',boss:'Venom Queen',level:50,
    recommended:50,rank:'A',rarity:'Legendary',upgrade:'Mythic',chance:.34,weapon:'katana',armor:'abyssal-amulet',gold:710,rating:16,crystals:15,potions:5,color:0x64e1b0,respawnMs:300_000},
] as const satisfies readonly Cave[];
export type BossCave=typeof bossCaves[number];
export type CaveRun={cycle:number;readyAt:number;rewardVersion?:2};
export type CaveRuns=Partial<Record<BossCave['id'],CaveRun>>;
export const caveAt=(z:number)=>bossCaves.find(cave=>Math.abs(z-cave.arena)<cave.depth+4);
export function caveWalkable(x:number,z:number){
  const cave=caveAt(z);
  return !!cave&&(x/cave.width)**2+((z-cave.arena)/cave.depth)**2<1;
}
export const caveEntry=(cave:BossCave)=>({x:0,z:cave.arena+cave.depth-6.7});
export const caveExit=(cave:BossCave)=>({x:0,z:cave.arena+cave.depth-2.5});
export const caveArrival=(cave:BossCave)=>({x:cave.x,z:cave.z});
export const caveBossPoint=(cave:BossCave)=>({x:0,z:cave.arena-(cave.kind==='ancientDragon'?10:7)});
export const caveTreasurePoint=(cave:BossCave)=>({x:0,z:cave.arena-(cave.kind==='ancientDragon'?15:10)});
export const caveBossId=(cave:BossCave,cycle:number)=>'cave-'+cave.id+'-'+cycle;
export const caveRewardId=(cave:BossCave,cycle:number)=>'reward-'+cave.id+'-'+cycle;
export const caveLootLabel=(cave:BossCave)=>'upgrade' in cave?cave.rarity+'–'+cave.upgrade:cave.rarity;
export function caveRewardTier(cave:BossCave,run:CaveRun,seed:number):Rarity{
  if(!run.rewardVersion&&cave.kind==='warlord') return 'Legendary';
  if(!run.rewardVersion&&cave.kind==='frostGuardian') return 'Mythic';
  let hash=seed^run.cycle;
  for(const char of cave.id) hash=Math.imul(hash^char.charCodeAt(0),16777619);
  return 'upgrade' in cave&&(hash>>>0)%100<100*cave.chance?cave.upgrade:cave.rarity;
}
export function caveRewardArmor(cave:BossCave,run:CaveRun,seed:number):ArmorId{
  return cave.kind==='frostGuardian'&&caveRewardTier(cave,run,seed)!=='Epic'?'abyssal-helmet':cave.armor;
}
export function caveStatus(cave:BossCave,runs:CaveRuns,opened:readonly string[],now=Date.now()){
  const run=runs[cave.id];
  if(!run?.readyAt) return 'Boss available';
  const seconds=Math.max(0,Math.ceil((run.readyAt-now)/1000));
  const time=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
  if(!opened.includes(caveRewardId(cave,run.cycle))) return 'Boss defeated · Reward chest available'+(seconds?' · Respawn in '+time:'');
  return seconds?'Reward claimed · Boss respawning in '+time:'Boss available · Previous reward claimed';
}


export const voidReaperDropChance=.085;
export function dragonScytheReward(seed:number,cycle:number,received:boolean){
  if(!received) return true;
  const roll=Math.imul(seed^Math.imul(cycle,0x9e3779b1)^0x6719,0x85ebca6b);
  return ((roll^(roll>>>16))>>>0)/0x1_0000_0000<voidReaperDropChance;
}


export const dragonPhase=(fraction:number)=>fraction<=.30?3:fraction<=.65?2:1;
export const dragonPhaseTitles=['Dragon’s Wrath','Burning Skies','Infernal Awakening'] as const;
