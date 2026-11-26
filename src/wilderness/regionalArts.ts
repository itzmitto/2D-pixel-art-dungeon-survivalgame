import { inArc } from './combatRules.ts';
import type { RegionalKind } from './huntData.ts';

export type RegionalMove='club'|'slam'|'quakes'|'punch'|'cleave'|'counter'|'rune'|'rush'|'curse';
type Point={x:number;z:number};
export type RegionalCast={move:RegionalMove;duration:number;radius:number;point:Point;yaw:number;color:number};
const patterns:Record<RegionalKind,readonly RegionalMove[]>={
  mountainTroll:['club','slam'], stoneGolem:['punch','quakes'],
  cursedKnight:['counter','cleave'], trollKing:['slam','club','quakes','rush'],
  cursedWarlord:['counter','curse','cleave','rush'],
  ancientTitan:['cleave','slam','rune','rush'],
};
const radius:Record<RegionalMove,number>={club:4.5,slam:6.1,quakes:8.3,punch:3.7,cleave:6,counter:4.1,rune:4.7,rush:13,curse:4.4};
export const regionalReach=(kind:RegionalKind)=>kind==='ancientTitan'||kind==='cursedWarlord'?16:kind==='trollKing'?11:6;
export const regionalName:Partial<Record<RegionalMove,string>>={cleave:'Titan Cleave',slam:'Earthquake Slam',rune:'Ancient Rune Explosion',rush:'Charging Strike'};
export function regionalCast(kind:RegionalKind,strikes:number,origin:Point,target:Point,enraged:boolean):RegionalCast{
  const pattern=patterns[kind], gap=Math.hypot(origin.x-target.x,origin.z-target.z);
  let move=pattern[strikes%pattern.length];
  if(gap>radius[move]&&move!=='rune'&&move!=='curse'&&pattern.includes('rush')) move=strikes%2&&pattern.includes('curse')?'curse':'rush';
  const yaw=Math.atan2(target.x-origin.x,target.z-origin.z);
  const point=move==='rune'||move==='curse'?{x:target.x,z:target.z}: {x:origin.x,z:origin.z};
  const duration=(move==='counter'?1.02:move==='punch'?.72:move==='rune'?1.66:move==='slam'?1.32:1.13)*(enraged?.79:1);
  return {move,point,duration,yaw,radius:radius[move]*(enraged&&move!=='rush'?1.18:1),color:kind==='cursedKnight'||kind==='cursedWarlord'?0xbd88ff:kind==='mountainTroll'||kind==='trollKing'?0xf0ce80:0x7fdbff};
}
export const sweeping=(move:RegionalMove)=>move==='cleave'||move==='club'||move==='punch'||move==='counter';
export function regionalHit(cast:RegionalCast,target:Point){
  return sweeping(cast.move)?inArc(cast.point,target,cast.yaw,cast.radius,cast.move==='punch'?.58:1.05):
    Math.hypot(target.x-cast.point.x,target.z-cast.point.z)<cast.radius;
}
