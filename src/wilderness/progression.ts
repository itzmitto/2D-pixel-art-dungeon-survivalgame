export const statNames=['strength','vitality','agility','intelligence','defense','luck'] as const;
export type Stat = typeof statNames[number];
export type Stats = Record<Stat,number>;
export const freshStats=():Stats=>({strength:0,vitality:0,agility:0,intelligence:0,defense:0,luck:0});
export const progression = {
  baseHealth:10, healthPerLevel:5, pointsPerLevel:3, statCap:100,
  xpBase:60, xpLinear:30, xpGrowth:2.6,
  strengthRate:.035, vitalityHealth:3, agilityMove:.018, agilityAttack:.022,
  intelligenceRate:.045, defenseRate:.025, luckRate:.013,
  moveCap:1.45, attackCap:1.65, mitigationCap:.60, luckCap:.65,
};
export interface Hunter {
  level:number; xp:number; health:number; stats:Stats; statPoints:number; kills:number;
  completedDungeons:string[]; defeatedBosses:string[];
}
export const xpNeeded=(level:number)=>{
  const growth=Math.max(0,level-1);
  return Math.ceil(progression.xpBase+progression.xpLinear*growth+progression.xpGrowth*growth**1.65);
};
export function rank(level:number) {
  return level>=200?'SSS':level>=150?'SS':level>=100?'S':level>=75?'A':level>=50?'B':level>=25?'C':level>=10?'D':'E';
}
export const maxHunterHealth=(hero:Pick<Hunter,'level'|'stats'>)=>
  progression.baseHealth+(hero.level-1)*progression.healthPerLevel+hero.stats.vitality*progression.vitalityHealth;
export const physical=(stats:Stats)=>1+stats.strength*progression.strengthRate;
export const elemental=(stats:Stats)=>1+stats.intelligence*progression.intelligenceRate;
export const moveSpeed=(stats:Stats)=>Math.min(progression.moveCap,1+stats.agility*progression.agilityMove);
export const attackSpeed=(stats:Stats)=>Math.min(progression.attackCap,1+stats.agility*progression.agilityAttack);
export const mitigation=(stats:Stats,armor=0)=>Math.min(progression.mitigationCap,stats.defense*progression.defenseRate+armor*.015);
export const lootBonus=(stats:Stats)=>Math.min(progression.luckCap,stats.luck*progression.luckRate);

export function earnXP(hero:Hunter,reward:number){
  if(!Number.isSafeInteger(reward)||reward<=0) return '';
  const oldLevel=hero.level, oldRank=rank(hero.level), oldMax=maxHunterHealth(hero);
  hero.xp+=reward;
  while(hero.xp>=xpNeeded(hero.level)){
    hero.xp-=xpNeeded(hero.level++);
    hero.statPoints+=progression.pointsPerLevel;
  }
  if(hero.level===oldLevel) return '';
  if(hero.health>0) hero.health+=maxHunterHealth(hero)-oldMax;
  return 'Level '+hero.level+' reached · +'+(hero.level-oldLevel)*progression.pointsPerLevel+' stat points'+
    (rank(hero.level)===oldRank?'':' · Hunter rank '+rank(hero.level));
}
export function allocate(hero:Hunter,key:Stat){
  if(!statNames.includes(key)||hero.statPoints<1||hero.stats[key]>=progression.statCap) return false;
  hero.stats={...hero.stats,[key]:hero.stats[key]+1};
  hero.statPoints--;
  if(key==='vitality'&&hero.health>0) hero.health+=progression.vitalityHealth;
  return true;
}
