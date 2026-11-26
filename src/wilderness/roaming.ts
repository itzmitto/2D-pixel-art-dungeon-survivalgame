import { frontierAt } from './frontier.ts';
import { clearing, inForest, landmarkDistance, trailDistance } from './layout.ts';
import type { MonsterKind } from './huntData.ts';

export const roaming={nearbyLimit:27,totalLimit:39,activeDistance:57,despawnDistance:79,minSpawnDistance:29} as const;
const roamingKinds:MonsterKind[]=['wild','dire','skeleton','goblin','brute','assassin','wizard','elite','ritualElite','mountainTroll','stoneGolem','cursedKnight'];
export type EncounterMember={kind:MonsterKind;level:number;elite:boolean};
export const encounterCell=(x:number,z:number)=>'roam-cell-'+(Math.floor(x/24)+16)+'-'+(Math.floor(z/24)+16);
export function roamingKind(id:string){
  if(!id.startsWith('roam-')) return undefined;
  return roamingKinds.find(kind=>kind.toLowerCase()===id.split('-')[1]);
}
export function roamingEncounter(x:number,z:number,random:()=>number):EncounterMember[]{
  if(frontierAt(z)){
    const leader:MonsterKind=z>-315?'mountainTroll':z>-374?'stoneGolem':'cursedKnight';
    return ([leader,random()<.5?'mountainTroll':'cursedKnight'] satisfies MonsterKind[]).map((kind,i)=>({kind,level:(z>-315?15:z>-374?21:26)+i+Math.floor(random()*4),elite:i===0&&random()<.12}));
  }
  const distance=clearing(x,z), forest=inForest(x,z), road=trailDistance(x,z)<4;
  const level=distance<45?1:distance<86?3:distance<135?5:distance<185?7:9;
  const faction=random();
  let kinds:MonsterKind[];
  const repeat=(kind:MonsterKind,min:number,max:number)=>Array<MonsterKind>(min+Math.floor(random()*(max-min+1))).fill(kind);
  if(level<=3||faction<.23) kinds=random()<(forest?.74:.52)?repeat('wild',3,7):['wild'];
  else if(faction<.43&&forest) kinds=repeat('dire',2,5);
  else if(faction<.60||road&&faction<.70) kinds=repeat('skeleton',2,5);
  else if(faction<.77) kinds=['brute',...repeat('assassin',1,3),...(level>=7&&random()<.38?['brute' as const]:[])];
  else if(faction<.88) kinds=['wizard'];
  else if(level>=7&&random()<.14) kinds=[random()<.55?'elite':'ritualElite','mountainTroll','stoneGolem','cursedKnight'];
  else kinds=random()<.46?['skeleton','skeleton','wizard']:['brute','assassin',random()<.5?'dire':'goblin'];
  const eliteIndex=level>=5&&random()<(landmarkDistance(x,z)<24?.115:.075)?Math.floor(random()*kinds.length):-1;
  return kinds.map((kind,i)=>({kind,level:level+Math.floor(random()*3),elite:i===eliteIndex&&kind!=='elite'&&kind!=='ritualElite'}));
}
const eliteNames:Partial<Record<MonsterKind,string>>={
  wild:'Alpha Wolf',dire:'Alpha Dire Wolf',skeleton:'Cursed Skeleton',goblin:'Briar Reaver',
  brute:'Orc Champion',assassin:'Orc Nightblade',wizard:'Ancient Dark Wizard',
};
export function eliteName(kind:MonsterKind,name:string){return eliteNames[kind]??name;}
