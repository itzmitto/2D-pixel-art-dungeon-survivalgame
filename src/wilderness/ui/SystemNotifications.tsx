import type { Exploration } from '../exploration';
import { den } from '../denLayout';
import { monsters } from '../huntData';
import { progression, rank, xpNeeded } from '../progression';
import { weapons, type Rarity } from '../weapons';
import { Glyph } from './Glyph';
import { tint } from './HunterInventory';

type Reward={icon:string;label:string;tier?:Rarity};
export type Notice={kind:'level'|'item'|'boss'|'dungeon';title:string;detail:string;tier?:Rarity;rewards?:Reward[]};
export const observe=(hero:Exploration)=>({
  level:hero.level,xp:hero.xp,items:new Set(hero.items.map(item=>item.id)),
  bosses:hero.defeatedBosses.length,dungeons:hero.completedDungeons.length,
  gold:hero.gold,potions:hero.potions,armor:hero.armor,fangs:hero.fangs,materials:{...hero.materials},
});

export function noticesBetween(before:ReturnType<typeof observe>,hero:Exploration):Notice[]{
  const notices:Notice[]=[];
  if(hero.level>before.level){
    const gained=hero.level-before.level;
    let xp=hero.xp-before.xp;
    for(let level=before.level;level<hero.level;level++) xp+=xpNeeded(level);
    notices.push({kind:'level',title:'Level '+before.level+' → '+hero.level,detail:
      '+'+xp+' XP · +'+gained*progression.pointsPerLevel+' stat points · +'+gained*progression.healthPerLevel+' maximum health'+
      (rank(before.level)===rank(hero.level)?'':' · Rank '+rank(before.level)+' → '+rank(hero.level))});
  }
  if(hero.defeatedBosses.length>before.bosses) notices.push({kind:'boss',title:'Boss Defeated',detail:
    monsters.guardian.name+(hero.completedDungeons.length>before.dungeons?' · '+den.name+' cleared':'')});
  else if(hero.completedDungeons.length>before.dungeons) notices.push({kind:'dungeon',title:'Dungeon Cleared',detail:den.name});
  const rewards:Reward[]=[];
  let tier:Rarity|undefined;
  for(const item of hero.items){
    if(before.items.has(item.id)) continue;
    tier=item.rarity;
    rewards.push({icon:item.type,label:weapons[item.type].name,tier});
  }
  for(const [name,count] of Object.entries(hero.materials)){
    const added=count-(before.materials[name]??0);
    if(added>0) rewards.push({icon:name,label:name+' × '+added});
  }
  if(hero.fangs>before.fangs) rewards.push({icon:'Wolf Fang',label:'Wolf Fang × '+(hero.fangs-before.fangs)});
  if(hero.potions>before.potions) rewards.push({icon:'potion',label:'Health Potion × '+(hero.potions-before.potions)});
  if(hero.armor>before.armor) rewards.push({icon:'armor',label:'Armor '+before.armor+' → '+hero.armor});
  if(hero.gold>before.gold) rewards.push({icon:'coin',label:'+'+(hero.gold-before.gold)+' gold'});
  if(rewards.length) notices.push({kind:'item',title:'Loot Acquired',detail:'',tier,rewards});
  return notices;
}
export function SystemNotifications({notices}:{notices:readonly Notice[]}){
  if(!notices.length) return null;
  return <div className="system-notices" aria-live="polite" role="status">
    {notices.map((notice,index)=><div className={'system-toast '+notice.kind} key={notice.title+index}
      style={notice.tier?tint(notice.tier):undefined} data-rarity={notice.tier}>
      {notice.kind==='level'&&<span className="system-kicker">Level Up</span>}
      <strong>{notice.title}</strong>
      {notice.detail&&<small>{notice.detail}</small>}
      {notice.rewards&&<ul className="toast-rewards">{notice.rewards.map(reward=>
        <li key={reward.icon} style={reward.tier?tint(reward.tier):undefined}>
          <Glyph kind={reward.icon}/><span>{reward.tier&&<small>{reward.tier}</small>}{reward.label}</span>
        </li>)}</ul>}
    </div>)}
  </div>;
}
