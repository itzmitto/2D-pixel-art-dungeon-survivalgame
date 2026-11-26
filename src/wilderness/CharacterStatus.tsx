import type { Exploration } from './exploration';
import { effectiveStats, attackSpeed, elemental, lootBonus, maxHunterHealth, mitigation, moveSpeed, physical, progression, rank, statNames, xpNeeded, type Stat } from './progression';
import { weapons } from './weapons';
import { SystemPanel } from './ui/SystemPanel';
import { healthNotation } from './ui/HunterInventory';

const labels:Record<Stat,[string,string]>={
  strength:['STR','Strength'],vitality:['VIT','Vitality'],agility:['AGI','Agility'],
  intelligence:['INT','Intelligence'],defense:['DEF','Defense'],luck:['LCK','Luck'],
};
const percent=(n:number)=>Number((n*100).toFixed(1))+'%';

export function CharacterStatus({hero,close,spend}:{hero:Exploration;close:()=>void;spend:(stat:Stat)=>void}){
  const stats=effectiveStats(hero), max=maxHunterHealth(hero), needed=xpNeeded(hero.level);
  const bonuses:Record<Stat,string>={
    strength:'+'+percent(physical(stats)-1)+' physical damage',
    vitality:'+'+stats.vitality*progression.vitalityHealth+' maximum health',
    agility:'+'+percent(moveSpeed(stats)-1)+' move · +'+percent(attackSpeed(stats)-1)+' attack speed',
    intelligence:'+'+percent(elemental(stats)-1)+' elemental damage',
    defense:percent(mitigation(stats,hero.armor))+' damage reduction with armor',
    luck:'+'+percent(lootBonus(stats))+' rare loot weight',
  };
  return <SystemPanel title="Character Status" section="Hunter System / Dossier" close={close} style="hunter-status">
    <div className="hunter-identity"><div><span className="system-kicker">Name</span><h3>Dark Knight</h3>
      <p>Class: Hunter · Title: {hero.defeatedBosses.length?'Fangbreaker':'Blackwater Wanderer'}</p>
      <small>{weapons[hero.equipped].name} · Armor {hero.armor}</small></div>
      <div className="rank-seal"><strong>{rank(hero.level)}</strong><small>Hunter rank</small></div>
    </div>
    <div className="hunter-vitals">
      <label>Health <span>{healthNotation(hero.health)} / {max}</span><progress className="system-meter health" value={hero.health} max={max}/></label>
      <label>Level {hero.level} <span>{hero.xp} / {needed} XP</span><progress className="system-meter" value={hero.xp} max={needed}/></label>
    </div>
    <div className="attribute-heading"><span className="system-kicker">Attributes</span><strong>{hero.statPoints} available points</strong></div>
    <ul className="attribute-list">{statNames.map(stat=><li key={stat}>
      <span className="attribute-code">{labels[stat][0]}</span>
      <div><strong>{labels[stat][1]}</strong><small>{bonuses[stat]}</small></div>
      <b>{stats[stat]}</b>
      <button aria-label={'Increase '+labels[stat][1]} disabled={!hero.statPoints||hero.stats[stat]>=progression.statCap} onClick={()=>spend(stat)}>+</button>
    </li>)}</ul>
    <dl className="hunter-ledger"><div><dt>Gold</dt><dd>{hero.gold}</dd></div><div><dt>Defeated</dt><dd>{hero.kills}</dd></div>
      <div><dt>Dungeons cleared</dt><dd>{hero.completedDungeons.length}</dd></div><div><dt>Bosses defeated</dt><dd>{hero.defeatedBosses.length}</dd></div></dl>
  </SystemPanel>;
}
