import type { Exploration } from '../exploration';
import { progression, rank } from '../progression';
import { rarity, weapons, type Rarity } from '../weapons';
import { tint } from './HunterInventory';

export type Notice={kind:'level'|'rank'|'item'|'boss'|'dungeon';title:string;detail:string;tier?:Rarity};
type ChangeState={level:number;items:Set<string>;bosses:number;dungeons:number};
export const observe=(hero:Exploration):ChangeState=>({
  level:hero.level,items:new Set(hero.items.map(item=>item.id)),bosses:hero.defeatedBosses.length,dungeons:hero.completedDungeons.length,
});

export function noticesBetween(before:ChangeState,hero:Exploration):Notice[]{
  const notices:Notice[]=[];
  if(hero.level>before.level){
    const gained=hero.level-before.level;
    notices.push({kind:'level',title:'Level Up',detail:
      'Level '+before.level+' → '+hero.level+' · +'+gained*progression.healthPerLevel+' maximum health · +'+gained*progression.pointsPerLevel+' stat points'});
    if(rank(before.level)!==rank(hero.level))
      notices.push({kind:'rank',title:'Hunter Rank Promotion',detail:'Rank '+rank(before.level)+' → '+rank(hero.level)});
  }
  if(hero.defeatedBosses.length>before.bosses) notices.push({kind:'boss',title:'Boss Defeated',detail:'Fang Guardian'});
  if(hero.completedDungeons.length>before.dungeons) notices.push({kind:'dungeon',title:'Dungeon Cleared',detail:'Hollow Fang Den · Rank E'});
  for(const item of hero.items){
    if(before.items.has(item.id)||rarity[item.rarity].multiplier<rarity.Rare.multiplier) continue;
    notices.push({kind:'item',title:item.rarity+' Item Acquired',detail:weapons[item.type].name,tier:item.rarity});
  }
  return notices;
}
export function SystemNotifications({notices}:{notices:readonly Notice[]}){
  if(!notices.length) return null;
  return <div className="system-notices" aria-live="polite" role="status">
    {notices.map((notice,index)=><div className={'system-toast '+notice.kind} key={notice.title+index} style={notice.tier?tint(notice.tier):undefined}>
      <span className="system-kicker">System Notification</span><strong>{notice.title}</strong><small>{notice.detail}</small>
    </div>)}
  </div>;
}
