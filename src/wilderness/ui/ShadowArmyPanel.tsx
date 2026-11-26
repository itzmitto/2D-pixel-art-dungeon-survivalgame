import { useEffect, useMemo, useState } from 'react';
import type { Exploration } from '../exploration';
import { shadowCapacity, shadowName, shadowStats, shadowProfiles, shadowRank, shadowRankIndex, shadowStrength,
  shadowCommands, type ShadowCommand } from '../shadowData';
import { SystemPanel } from './SystemPanel';

const portraits={
  Giant:'axe',Construct:'Iron',Beast:'M6 28 8 8l10 10 11-2 7 6-3 6-10 2-4 7-8-3Z M23 22l6-2-3 4Zm8 5 3-2',
  Undead:'M9 18 11 9l9-4 10 4 3 9-4 6v7l-5 6h-9l-5-6v-7ZM14 20l4 2-4 2Zm9 2 5-2-2 4ZM16 29v4m4-4v5m4-5v4',
  Raider:'M4 23 7 12l5 4 2-8 6-4 8 6 1 7 6-4 2 10-9 5-3 8H15l-5-8ZM13 19l5 2m5 0 5-2M14 26l4 7m9-7-4 7',
  Caster:'M7 33l4-13 5-11 6-6 7 10 4 12 2 8-15 4ZM13 25l7-14 8 14-8 7Zm3 1 3-1m3 0 4 1M34 29V9m-3 5 3-5 3 5-3 4Z',
  Boss:'M5 31 6 10l6 6 3-11 5 5 6-5 3 11 5-6 1 21-15 6Zm6-6 9-10 9 10-9 8Zm4 0 4-1m3 0 4 1',
};
export function ShadowArmyPanel({hero,close,toggle,summonAll,dismissAll,rename,command}:{
  hero:Exploration;close:()=>void;toggle:(id:string)=>void;summonAll:(strongest?:boolean)=>void;
  dismissAll:()=>void;rename:(id:string,name:string)=>void;command:(value:ShadowCommand)=>void;
}){
  const [time,setTime]=useState(Date.now);
  const [category,setCategory]=useState('All');
  const [sort,setSort]=useState<'strength'|'level'|'rank'>('strength');
  const [editing,setEditing]=useState<string>();
  const [name,setName]=useState('');
  useEffect(()=>{const timer=window.setInterval(()=>setTime(Date.now()),1000);return ()=>window.clearInterval(timer);},[]);
  const active=hero.shadows.filter(shadow=>shadow.active).length, capacity=shadowCapacity(hero.level);
  const candidates=useMemo(()=>hero.shadows.filter(shadow=>category==='All'||
    (category==='Elite'?shadow.grade==='elite':shadowProfiles[shadow.kind].category===category)).sort((a,b)=>{
      if(sort==='level') return b.level-a.level||shadowStrength(b)-shadowStrength(a);
      if(sort==='rank') return shadowRankIndex(b.level)-shadowRankIndex(a.level)||shadowStrength(b)-shadowStrength(a);
      return shadowStrength(b)-shadowStrength(a);
    }),[hero.shadows,category,sort,hero.kills]);
  const ready=hero.shadows.some(shadow=>!shadow.active&&shadow.readyAt<=time);
  return <SystemPanel title="Shadow Army" section="Hunter System" close={close} style="shadow-system">
    <div className="shadow-overview">
      <strong>{hero.shadows.length} collected</strong>
      <span>{active} / {capacity} active</span>
      <button disabled={active>=capacity||!hero.health||!ready} onClick={()=>summonAll()}>Summon All</button>
      <button disabled={!hero.health||!ready} onClick={()=>summonAll(true)}>Summon Strongest</button>
      <button disabled={!active} onClick={dismissAll}>Dismiss All</button>
    </div>
    <div className="shadow-toolbar">
      <div aria-label="Army command" role="group">{shadowCommands.map(value=><button key={value}
        aria-pressed={hero.shadowCommand===value} onClick={()=>command(value)}>{value}</button>)}</div>
      <label>Category <select value={category} onChange={event=>setCategory(event.target.value)}>
        {['All',...Object.keys(portraits),'Elite'].map(value=><option key={value}>{value}</option>)}
      </select></label>
      <label>Sort <select value={sort} onChange={event=>setSort(event.target.value as typeof sort)}>
        <option value="strength">Strength</option><option value="level">Level</option><option value="rank">Rank</option>
      </select></label>
    </div>
    {!hero.shadows.length&&<p>Defeat an enemy, then press F near its shadow essence.</p>}
    {!!hero.shadows.length&&!candidates.length&&<p>No shadows in this category.</p>}
    <ul className="shadow-list">
      {candidates.map(shadow=>{
        const stats=shadowStats(shadow), rest=Math.max(0,Math.ceil((shadow.readyAt-time)/1000));
        const profile=shadowProfiles[shadow.kind], rank=shadowRank(shadow.level);
        return <li key={shadow.id} data-shadow-active={shadow.active}>
          <svg viewBox="0 0 40 40" aria-hidden="true" className="shadow-mark">
            <path d={portraits[profile.category]} fill="#131a32" fillRule="evenodd" stroke="#87c9ff" strokeLinejoin="round"/>
          </svg>
          <div>{editing===shadow.id?<form onSubmit={event=>{event.preventDefault();rename(shadow.id,name);setEditing(undefined);}}>
              <input autoFocus value={name} maxLength={28} aria-label="Shadow name" onChange={event=>setName(event.target.value)}/>
              <button type="submit">Save</button><button type="button" onClick={()=>setEditing(undefined)}>Cancel</button>
            </form>:<strong>{shadow.name}</strong>}
            <small>{shadowName(shadow.kind).replace(/^Shadow /,'')} · {profile.category} · Lv {shadow.level}</small>
            <small className="shadow-rank">{rank} · {rest?'Recovering':shadow.active?'Active':'Inactive'}</small>
          </div>
          <div><small>{shadow.health?Math.ceil(shadow.health):0} / {stats.health} HP · {stats.damage} damage</small>
            <progress className="system-meter" value={shadow.xp} max={stats.xpNeeded} aria-label="Shadow experience"/>
            <small>{Math.floor(shadow.xp)} / {stats.xpNeeded} XP</small></div>
          <div className="shadow-actions">
            <button disabled={!shadow.active&&(rest>0||active>=capacity||!hero.health)} onClick={()=>toggle(shadow.id)}>
              {shadow.active?'Dismiss':rest?'Recovering · '+rest+' s':'Summon'}
            </button>
            {editing!==shadow.id&&<button onClick={()=>{setEditing(shadow.id);setName(shadow.name);}}>Rename</button>}
          </div>
        </li>;
      })}
    </ul>
  </SystemPanel>;
}
