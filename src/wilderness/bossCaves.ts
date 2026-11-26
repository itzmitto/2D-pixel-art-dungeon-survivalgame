import type { ArmorId } from './armor.ts';
import type { Rarity, WeaponId } from './weapons.ts';

type Cave = {
  id:string; name:string; x:number;z:number;arena:number;kind:'warlord'|'frostGuardian';
  boss:string;level:number;recommended:number;rank:string;rarity:Rarity;weapon:WeaponId;armor:ArmorId;gold:number;respawnMs:number;
};
export const bossCaves=[
  {id:'ironfang-vault',name:'Ironfang Vault',x:-146,z:-111,arena:948,kind:'warlord',boss:'Orc Warlord',level:20,
    recommended:18,rank:'C',rarity:'Legendary',weapon:'axe',armor:'blacksteel-chestplate',gold:290,respawnMs:300_000},
  {id:'rimeheart-grotto',name:'Rimeheart Grotto',x:185,z:185,arena:1068,kind:'frostGuardian',boss:'Frost Guardian',level:35,
    recommended:30,rank:'B',rarity:'Mythic',weapon:'staff',armor:'abyssal-helmet',gold:480,respawnMs:300_000},
] as const satisfies readonly Cave[];
export type BossCave=typeof bossCaves[number];
export type CaveRun={cycle:number;readyAt:number};
export type CaveRuns=Partial<Record<BossCave['id'],CaveRun>>;
export const caveAt=(z:number)=>bossCaves.find(cave=>Math.abs(z-cave.arena)<23);
export function caveWalkable(x:number,z:number){
  const cave=caveAt(z);
  if(!cave) return false;
  return cave.kind==='warlord'?(x/17)**2+((z-cave.arena)/19)**2<1:
    (x/18)**2+((z-cave.arena)/19.7)**2<1;
}
export const caveEntry=(cave:BossCave)=>({x:0,z:cave.arena+12.3});
export const caveExit=(cave:BossCave)=>({x:0,z:cave.arena+16.5});
export const caveBossId=(cave:BossCave,cycle:number)=>'cave-'+cave.id+'-'+cycle;
export const caveRewardId=(cave:BossCave,cycle:number)=>'reward-'+cave.id+'-'+cycle;
export function caveStatus(cave:BossCave,runs:CaveRuns,opened:readonly string[],now=Date.now()){
  const run=runs[cave.id];
  if(!run?.readyAt) return 'Boss available';
  const seconds=Math.max(0,Math.ceil((run.readyAt-now)/1000));
  const time=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
  if(!opened.includes(caveRewardId(cave,run.cycle))) return 'Boss defeated · Reward chest available'+(seconds?' · Respawn in '+time:'');
  return seconds?'Reward claimed · Boss respawning in '+time:'Boss available · Previous reward claimed';
}
