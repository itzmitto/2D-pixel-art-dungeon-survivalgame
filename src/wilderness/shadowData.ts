import { rank } from './progression.ts';

export type ShadowKind='wild'|'dire';
export type ShadowSoldier={id:string;kind:ShadowKind;level:number;originLevel:number;xp:number;baseHealth:number;baseDamage:number;
  active:boolean;health:number;readyAt:number};
export type ShadowEssence={id:string;kind:ShadowKind;level:number;baseHealth:number;baseDamage:number;x:number;z:number;expiresAt:number};
export const shadowTuning={
  fraction:.60, essenceMs:90_000,recoveryMs:24_000,maxLevel:60,
  limits:{E:2,D:4,C:6,B:10,A:15,S:20,SS:30,SSS:50},
};
export const shadowCapacity=(level:number)=>shadowTuning.limits[rank(level)];
export const shadowName=(kind:ShadowKind)=>kind==='dire'?'Shadow Dire Wolf':'Shadow Wolf';
export function shadowStats(shadow:Pick<ShadowSoldier,'level'|'baseHealth'|'baseDamage'>&{originLevel?:number}){
  const growth=Math.max(0,shadow.level-(shadow.originLevel??shadow.level));
  return {
    health:Math.max(2,Math.round(shadow.baseHealth*shadowTuning.fraction+growth*.94)),
    damage:Math.max(.6,Math.round((shadow.baseDamage*shadowTuning.fraction+growth*.16)*10)/10),
    xpNeeded:32+shadow.level*13,
  };
}
export function grantShadowXp(shadow:ShadowSoldier,reward:number){
  shadow.xp+=reward;
  while(shadow.level<shadowTuning.maxLevel&&shadow.xp>=shadowStats(shadow).xpNeeded){
    const stats=shadowStats(shadow);
    shadow.xp-=stats.xpNeeded;shadow.level++;
    shadow.health=Math.min(shadowStats(shadow).health,shadow.health+shadowStats(shadow).health-stats.health);
  }
  if(shadow.level===shadowTuning.maxLevel) shadow.xp=Math.min(shadow.xp,shadowStats(shadow).xpNeeded);
}
function validSource(value:Partial<ShadowEssence>){
  return typeof value.id==='string'&&/^[a-z0-9-]{2,75}$/.test(value.id)&&(value.kind==='wild'||value.kind==='dire')&&
    Number.isInteger(value.level)&&value.level!>=1&&value.level!<=shadowTuning.maxLevel&&
    Number.isFinite(value.baseHealth)&&value.baseHealth!>0&&value.baseHealth!<=400&&
    Number.isFinite(value.baseDamage)&&value.baseDamage!>0&&value.baseDamage!<=80;
}
export function readShadows(raw:unknown):ShadowSoldier[]{
  if(!Array.isArray(raw)) return [];
  const unique=new Map<string,ShadowSoldier>();
  for(const value of raw){
    if(!value||typeof value!=='object'||!validSource(value)||unique.has(value.id)) continue;
    if(!Number.isFinite(value.health)||!Number.isFinite(value.xp)||!Number.isSafeInteger(value.readyAt)) continue;
    unique.set(value.id,{id:value.id,kind:value.kind,level:value.level,originLevel:Number.isInteger(value.originLevel)?Math.max(1,Math.min(value.level,value.originLevel)):value.level,baseHealth:value.baseHealth,baseDamage:value.baseDamage,
      health:Math.max(0,Math.min(shadowStats(value).health,value.health)),xp:Math.max(0,Math.min(3000,value.xp)),
      readyAt:Math.max(0,value.readyAt),active:value.active===true&&value.health>0});
  }
  return [...unique.values()];
}
export function readEssences(raw:unknown):ShadowEssence[]{
  if(!Array.isArray(raw)) return [];
  return raw.filter(value=>value&&typeof value==='object'&&validSource(value)&&
    Number.isFinite(value.x)&&Math.abs(value.x)<240&&Number.isFinite(value.z)&&Math.abs(value.z)<1200&&
    Number.isSafeInteger(value.expiresAt)&&value.expiresAt>Date.now()).slice(0,96);
}
