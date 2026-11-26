import { rank } from './progression.ts';

export const shadowKinds=['wild','dire','skeleton','goblin','brute','assassin','wizard','elite','ritualElite','guardian','warlord','frostGuardian','sentinel'] as const;
export type ShadowKind=typeof shadowKinds[number];
export type ShadowGrade='ordinary'|'elite'|'boss';
export const shadowCommands=['Defensive','Aggressive','Follow'] as const;
export type ShadowCommand=typeof shadowCommands[number];
export const shadowKeys={panel:'KeyK',extract:'KeyF',command:'KeyJ'} as const;
export type ShadowSoldier={id:string;kind:ShadowKind;grade:ShadowGrade;name:string;level:number;originLevel:number;xp:number;
  baseHealth:number;baseDamage:number;active:boolean;health:number;readyAt:number};
export type ShadowEssence={id:string;kind:ShadowKind;grade:ShadowGrade;attempts:number;level:number;baseHealth:number;baseDamage:number;x:number;z:number;expiresAt:number};
export const shadowTuning={
  fraction:.60,essenceMs:90_000,recoveryMs:24_000,maxLevel:60,
  limits:{E:4,D:8,C:12,B:20,A:30,S:40,SS:60,SSS:100},
  extraction:{ordinary:1,elite:.8,boss:.5},
  attempts:{ordinary:1,elite:1,boss:3},
  ranks:[[1,'Soldier'],[6,'Elite'],[12,'Knight'],[20,'Elite Knight'],[33,'General'],[48,'Marshal']] as const,
};

export const shadowCapacity=(level:number)=>shadowTuning.limits[rank(level)];
export const shadowRankIndex=(level:number)=>shadowTuning.ranks.reduce((best,[required],i)=>level>=required?i:best,0);
export const shadowRank=(level:number)=>shadowTuning.ranks[shadowRankIndex(level)][1];

export const shadowProfiles={
  wild:{name:'Shadow Wolf',category:'Beast',range:1.9,cooldown:.92,windup:.27,color:0x5297ff,style:'bite'},
  dire:{name:'Shadow Dire Wolf',category:'Beast',range:2.13,cooldown:1.02,windup:.28,color:0x6cd8ff,style:'bite'},
  skeleton:{name:'Shadow Skeleton',category:'Undead',range:2.27,cooldown:1.29,windup:.44,color:0x8edcff,style:'sword'},
  goblin:{name:'Shadow Goblin',category:'Raider',range:2.0,cooldown:1.08,windup:.34,color:0x67c1ed,style:'dash'},
  brute:{name:'Shadow Orc Brute',category:'Raider',range:2.65,cooldown:1.85,windup:.62,color:0x518cfa,style:'slam'},
  assassin:{name:'Shadow Orc Assassin',category:'Raider',range:3.7,cooldown:1.12,windup:.34,color:0x46b8ed,style:'dash'},
  wizard:{name:'Shadow Dark Wizard',category:'Caster',range:11.0,cooldown:1.83,windup:.52,color:0x858cff,style:'spell'},
  elite:{name:'Shadow Gravefang',category:'Beast',range:2.6,cooldown:1.32,windup:.39,color:0x4db6ff,style:'bite'},
  ritualElite:{name:'Shadow Veil Hierophant',category:'Caster',range:12,cooldown:1.95,windup:.56,color:0x829bff,style:'spell'},
  guardian:{name:'Shadow Fang Guardian',category:'Boss',range:4.5,cooldown:1.8,windup:.47,color:0x679aff,style:'charge'},
  warlord:{name:'Shadow Orc Warlord',category:'Boss',range:3.25,cooldown:2.27,windup:.70,color:0x4c98f9,style:'slam'},
  frostGuardian:{name:'Shadow Frost Guardian',category:'Boss',range:12.5,cooldown:2.13,windup:.62,color:0x8ceeff,style:'frost'},
  sentinel:{name:'Shadow Hollow Sentinel',category:'Boss',range:3.35,cooldown:2.18,windup:.69,color:0x718bff,style:'slam'},
} as const;
export const shadowName=(kind:ShadowKind)=>shadowProfiles[kind].name;
export const defaultShadowGrade=(kind:ShadowKind):ShadowGrade=>
  shadowProfiles[kind].category==='Boss'?'boss':kind==='elite'||kind==='ritualElite'?'elite':'ordinary';
export function shadowStats(shadow:Pick<ShadowSoldier,'level'|'baseHealth'|'baseDamage'>&{originLevel?:number;grade?:ShadowGrade}){
  const growth=Math.max(0,shadow.level-(shadow.originLevel??shadow.level));
  const boss=shadow.grade==='boss';
  const damage=shadow.baseDamage*(boss?.44:shadowTuning.fraction)+growth*.16;
  return {
    health:Math.max(2,Math.round(shadow.baseHealth*(boss?.39:shadowTuning.fraction)+growth*(boss?1.32:.94))),
    damage:Math.max(.6,Math.round(damage*10)/10),
    xpNeeded:32+shadow.level*13,
  };
}
export const shadowStrength=(shadow:ShadowSoldier)=>shadowStats(shadow).damage/shadowProfiles[shadow.kind].cooldown+shadowStats(shadow).health*.035;
export function grantShadowXp(shadow:ShadowSoldier,reward:number){
  shadow.xp+=reward;
  while(shadow.level<shadowTuning.maxLevel&&shadow.xp>=shadowStats(shadow).xpNeeded){
    const stats=shadowStats(shadow);
    shadow.xp-=stats.xpNeeded;shadow.level++;
    if(shadow.health>0) shadow.health=Math.min(shadowStats(shadow).health,shadow.health+shadowStats(shadow).health-stats.health);
  }
  if(shadow.level===shadowTuning.maxLevel) shadow.xp=Math.min(shadow.xp,shadowStats(shadow).xpNeeded);
}
export const cleanShadowName=(value:unknown)=>typeof value==='string'?value.replace(/[\x00-\x1f\x7f]/g,'').trim().slice(0,28):'';
const isKind=(kind:unknown):kind is ShadowKind=>shadowKinds.some(value=>value===kind);
const validSource=(value:Partial<ShadowEssence>)=>
  typeof value.id==='string'&&/^[a-z0-9-]{2,75}$/.test(value.id)&&isKind(value.kind)&&
  Number.isInteger(value.level)&&value.level!>=1&&value.level!<=shadowTuning.maxLevel&&
  Number.isFinite(value.baseHealth)&&value.baseHealth!>0&&value.baseHealth!<=2500&&
  Number.isFinite(value.baseDamage)&&value.baseDamage!>0&&value.baseDamage!<=120;
export const readShadowCommand=(value:unknown):ShadowCommand=>shadowCommands.find(command=>command===value)??'Defensive';
function readGrade(kind:ShadowKind,value:unknown):ShadowGrade{
  const grade=defaultShadowGrade(kind);
  return grade==='ordinary'&&value==='elite'?'elite':grade;
}
export function readShadows(raw:unknown):ShadowSoldier[]{
  if(!Array.isArray(raw)) return [];
  const unique=new Map<string,ShadowSoldier>(), bosses=new Set<ShadowKind>();
  for(const value of raw){
    if(!value||typeof value!=='object'||!validSource(value)||unique.has(value.id)) continue;
    if(!Number.isFinite(value.health)||!Number.isFinite(value.xp)||!Number.isSafeInteger(value.readyAt)) continue;
    const grade=readGrade(value.kind,value.grade);
    if(grade==='boss'){
      if(bosses.has(value.kind)) continue;
      bosses.add(value.kind);
    }
    const record:ShadowSoldier={id:value.id,kind:value.kind,grade,name:cleanShadowName(value.name)||shadowName(value.kind),
      level:value.level,originLevel:Number.isInteger(value.originLevel)?Math.max(1,Math.min(value.level,value.originLevel)):value.level,
      baseHealth:value.baseHealth,baseDamage:value.baseDamage,health:value.health,
      xp:Math.max(0,Math.min(3000,value.xp)),readyAt:Math.max(0,value.readyAt),active:value.active===true&&value.health>0};
    record.health=Math.max(0,Math.min(shadowStats(record).health,record.health));
    unique.set(record.id,record);
  }
  return [...unique.values()];
}
export function readEssences(raw:unknown):ShadowEssence[]{
  if(!Array.isArray(raw)) return [];
  const unique=new Map<string,ShadowEssence>();
  for(const value of raw.slice(-96)){
    if(!value||typeof value!=='object'||!validSource(value)||!Number.isFinite(value.x)||Math.abs(value.x)>=240||
      !Number.isFinite(value.z)||Math.abs(value.z)>=1200||!Number.isSafeInteger(value.expiresAt)||value.expiresAt<=Date.now()) continue;
    const grade=readGrade(value.kind,value.grade);
    const attempts=Number.isInteger(value.attempts)?Math.max(0,value.attempts):0;
    if(attempts>=shadowTuning.attempts[grade]) continue;
    unique.set(value.id,{...value,grade,attempts});
  }
  return [...unique.values()];
}
