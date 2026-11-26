import { useEffect, useState } from 'react';
import type { Exploration } from '../exploration';
import { shadowCapacity, shadowName, shadowStats } from '../shadowData';
import { SystemPanel } from './SystemPanel';

export function ShadowArmyPanel({hero,close,toggle,summonAll}:{
  hero:Exploration;close:()=>void;toggle:(id:string)=>void;summonAll:()=>void;
}){
  const [time,setTime]=useState(Date.now);
  useEffect(()=>{const timer=window.setInterval(()=>setTime(Date.now()),1000);return ()=>window.clearInterval(timer);},[]);
  const active=hero.shadows.filter(shadow=>shadow.active).length, capacity=shadowCapacity(hero.level);
  return <SystemPanel title="Shadow Army" section="Hunter System" close={close} style="shadow-system">
    <div className="shadow-overview">
      <strong>{hero.shadows.length} collected</strong>
      <span>{active} / {capacity} active</span>
      <button disabled={active>=capacity||!hero.health||!hero.shadows.some(shadow=>!shadow.active&&shadow.readyAt<=time)} onClick={summonAll}>Summon All</button>
    </div>
    {!hero.shadows.length&&<p>Defeat a Wild Wolf or Dire Wolf, then press F near its shadow essence.</p>}
    <ul className="shadow-list">
      {hero.shadows.map(shadow=>{
        const stats=shadowStats(shadow), rest=Math.max(0,Math.ceil((shadow.readyAt-time)/1000));
        return <li key={shadow.id}>
          <svg viewBox="0 0 40 40" aria-hidden="true" className="shadow-mark">
            <path d="m6 28 3-19 9 10 9-2 7 6-2 4-7 1-4 8-9-3Z" fill="#121527" stroke="#6d97fe"/>
            <path d="m23 22 6-1-4 4Zm8 4 3-1" fill="#6ad9ff" stroke="#88dfff"/>
          </svg>
          <div><strong>{shadowName(shadow.kind)}</strong><small>{shadow.kind==='dire'?'Dire Wolf':'Wild Wolf'} · Lv {shadow.level}</small></div>
          <div><small>{shadow.health?Math.ceil(shadow.health):rest?0:stats.health} / {stats.health} HP · {stats.damage} damage</small>
            <progress className="system-meter" value={shadow.xp} max={stats.xpNeeded} aria-label="Shadow experience"/></div>
          <button disabled={!shadow.active&&(rest>0||active>=capacity||!hero.health)} onClick={()=>toggle(shadow.id)}>
            {shadow.active?'Dismiss':rest?'Recovering · '+rest+' s':'Summon'}
          </button>
        </li>;
      })}
    </ul>
  </SystemPanel>;
}
