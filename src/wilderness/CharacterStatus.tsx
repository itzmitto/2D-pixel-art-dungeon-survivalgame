import type { Exploration } from './exploration';
import { maxHunterHealth, progression, rank, statNames, xpNeeded, type Stat } from './progression';
import { weapons } from './weapons';

const descriptions:Record<Stat,string>={
  strength:'Physical damage',vitality:'Maximum health',agility:'Movement and attack speed',
  intelligence:'Elemental damage',defense:'Damage reduction',luck:'Better chance of rare loot',
};

export function CharacterStatus({hero,close,spend}:{hero:Exploration;close:()=>void;spend:(stat:Stat)=>void}){
  return <div className="wild-map-shade"><section className="wild-map hunter-status" role="dialog" aria-modal="true" aria-labelledby="hunter-title">
    <header><h2 id="hunter-title">Character Status</h2><button autoFocus onClick={close}>Close · Esc</button></header>
    <p>Hunter rank {rank(hero.level)} · Level {hero.level} · {hero.xp} / {xpNeeded(hero.level)} XP</p>
    <p>Maximum health {maxHunterHealth(hero)} · Armor {hero.armor} · {weapons[hero.equipped].name}</p>
    <p>{hero.kills} defeated · {hero.completedDungeons.length} dungeons cleared · {hero.defeatedBosses.length} bosses defeated</p>
    <h3>Available stat points: {hero.statPoints}</h3>
    <ul>{statNames.map(stat=><li key={stat}>
      <span><strong>{stat}</strong> · {descriptions[stat]}</span>
      <button aria-label={`Increase ${stat}`} disabled={!hero.statPoints||hero.stats[stat]>=progression.statCap} onClick={()=>spend(stat)}>{hero.stats[stat]} +</button>
    </li>)}</ul>
  </section></div>;
}
