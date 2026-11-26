import { fortress, frontierRegions } from '../frontier';
import { instanceWeapon } from '../itemInstances';
import { shadowRank } from '../shadowData';
import { bossCaves, caveRewardTier } from '../bossCaves';
import { briarWatch, floorRemaining, dungeonFloors } from '../briarWatch';
import { armorPiece } from '../armor';
import type { Exploration } from '../exploration';
import { den } from '../denLayout';
import { monsters } from '../huntData';
import { progression, rank, xpNeeded } from '../progression';
import { type Rarity } from '../weapons';
import { Glyph } from './Glyph';
import { tint } from './HunterInventory';

type Reward={icon:string;label:string;tier?:Rarity};
export type Notice={kind:'level'|'item'|'boss'|'dungeon'|'region';title:string;detail:string;tier?:Rarity;rewards?:Reward[]};
export const observe=(hero:Exploration)=>({
  regions:new Set(hero.discoveredRegions),opened:new Set(hero.opened),
  shadows:new Map(hero.shadows.map(shadow=>[shadow.id,shadowRank(shadow.level)])),
  armorItems:new Set(hero.armorItems),level:hero.level,xp:hero.xp,items:new Set(hero.items.map(item=>item.id)),
  bosses:new Set(hero.defeatedBosses),dungeons:new Set(hero.completedDungeons),
  floors:dungeonFloors.map(floor=>floorRemaining(floor,hero.defeated)),
  gold:hero.gold,potions:hero.potions,armor:hero.armor,fangs:hero.fangs,materials:{...hero.materials},
});

export function noticesBetween(before:ReturnType<typeof observe>,hero:Exploration):Notice[]{
  const notices:Notice[]=[];
  for(const region of frontierRegions) if(hero.discoveredRegions.includes(region.id)&&!before.regions.has(region.id)){
    notices.push({kind:'region',title:'New Region Discovered',detail:region.name+' · Recommended '+region.difficulty});
  }
  if(hero.level>before.level){
    const gained=hero.level-before.level;
    let xp=hero.xp-before.xp;
    for(let level=before.level;level<hero.level;level++) xp+=xpNeeded(level);
    notices.push({kind:'level',title:'Level '+before.level+' → '+hero.level,detail:
      '+'+xp+' XP · +'+gained*progression.pointsPerLevel+' stat points · +'+gained*progression.healthPerLevel+' maximum health'+
      (rank(before.level)===rank(hero.level)?'':' · Rank '+rank(before.level)+' → '+rank(hero.level))});
  }
  for(const boss of hero.defeatedBosses){
    if(before.bosses.has(boss)) continue;
    notices.push({kind:'boss',title:'Boss Defeated',detail:bossCaves.find(cave=>cave.id===boss)?.boss??(boss===fortress.boss?monsters.ancientTitan.name:boss===briarWatch.boss?monsters.sentinel.name:monsters.guardian.name)});
  }
  for(const dungeon of hero.completedDungeons){
    if(before.dungeons.has(dungeon)) continue;
    notices.push({kind:'dungeon',title:dungeon===briarWatch.id?'Tower Completed':'Dungeon Cleared',
      detail:bossCaves.find(cave=>cave.id===dungeon)?.name??(dungeon===fortress.id?fortress.name:dungeon===briarWatch.id?briarWatch.name:den.name)});
  }
  for(const [i,floor] of dungeonFloors.entries()){
    if(!floor.final&&before.floors[i]>0&&floorRemaining(floor,hero.defeated)===0)
      notices.push({kind:'dungeon',title:'Floor '+floor.number+' Cleared',detail:'Floor '+(floor.number+1)+' unlocked'});
  }
  const promotions=hero.shadows.filter(shadow=>before.shadows.has(shadow.id)&&before.shadows.get(shadow.id)!==shadowRank(shadow.level));
  if(promotions.length) notices.push({kind:'level',title:'Shadow Promotion',detail:
    promotions.map(shadow=>shadow.name+' → '+shadowRank(shadow.level)).join(' · ')});
  const rewards:Reward[]=[];
  let tier:Rarity|undefined;
  for(const item of hero.items){
    if(before.items.has(item.id)) continue;
    tier=item.rarity;
    rewards.push({icon:item.type,label:instanceWeapon(item).name,tier});
  }
  for(const id of hero.armorItems){
    if(before.armorItems.has(id)) continue;
    const piece=armorPiece(id);
    rewards.push({icon:piece.icon,label:piece.name,tier:piece.rarity});
    tier??=piece.rarity;
  }
  for(const [name,count] of Object.entries(hero.materials)){
    const added=count-(before.materials[name]??0);
    if(added>0) rewards.push({icon:name,label:name+' × '+added});
  }
  if(hero.fangs>before.fangs) rewards.push({icon:'Wolf Fang',label:'Wolf Fang × '+(hero.fangs-before.fangs)});
  if(hero.potions>before.potions) rewards.push({icon:'potion',label:'Health Potion × '+(hero.potions-before.potions)});
  if(hero.armor>before.armor) rewards.push({icon:'armor',label:'Armor '+before.armor+' → '+hero.armor});
  if(hero.gold>before.gold) rewards.push({icon:'coin',label:'+'+(hero.gold-before.gold)+' gold'});
  const caveLoot=bossCaves.find(cave=>{
    const run=hero.caveRuns[cave.id];
    if(!run) return false;
    const id='reward-'+cave.id+'-'+run.cycle;
    return hero.opened.includes(id)&&!before.opened.has(id);
  });
  const caveRun=caveLoot?hero.caveRuns[caveLoot.id]:undefined;
  const caveTier=caveLoot&&caveRun?caveRewardTier(caveLoot,caveRun,hero.seed):undefined;
  if(rewards.length) notices.push({kind:'item',
    title:caveTier?caveTier+' Cave Reward':tier==='Legendary'||tier==='Mythic'?tier+' Loot Acquired':'Loot Acquired',
    detail:caveLoot?caveLoot.boss+' · Cycle '+hero.caveRuns[caveLoot.id]?.cycle:'',tier:caveTier??tier,rewards});
  return notices;
}
export function SystemNotifications({notices}:{notices:readonly Notice[]}){
  if(!notices.length) return null;
  return <div className="system-notices" aria-live="polite" role="status">
    {notices.map((notice,index)=><div className={'system-toast '+notice.kind} key={notice.title+index}
      style={notice.tier?tint(notice.tier):undefined} data-rarity={notice.tier}>
      {notice.kind==='region'&&<span className="system-kicker">System Notification</span>}
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
