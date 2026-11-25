import { useEffect, useRef, useState } from 'react';
import { clearing } from './layout';
import { newExploration, readExploration, reveal, saveKey, type Position } from './exploration';
import { maxHunterHealth, rank, xpNeeded } from './progression';
import { CharacterStatus } from './CharacterStatus';
import { startWilderness } from './scene';
import { WorldMap } from './WorldMap';
import { elementalIds, rarity, weaponDamage, weapons, type WeaponId } from './weapons';
import './wilderness.css';

const weaponLab=import.meta.env.DEV && new URLSearchParams(window.location.search).get('weaponLab')==='1';

export default function Wilderness() {
  const canvas=useRef<HTMLCanvasElement>(null);
  const mapButton=useRef<HTMLButtonElement>(null);
  const open=useRef<'map'|'bag'|'status'|null>(null);
  const [panel,setPanel]=useState<'map'|'bag'|'status'|null>(null);
  const [hero,setHero]=useState(newExploration);
  const [message,setMessage]=useState({notification:'',prompt:'',cooldown:0});
  const controller=useRef<ReturnType<typeof startWilderness>|null>(null);
  const [inspected,setInspected]=useState<WeaponId>('longsword');
  const [position,setPosition]=useState<Position>(newExploration().position);
  const [discovered,setDiscovered]=useState<number[]>([]);
  const [error,setError]=useState('');
  const [saveNotice,setSaveNotice]=useState('');

  const showPanel=(value:typeof panel)=>{
    open.current=value;
    setPanel(value);
    if(!value) mapButton.current?.focus();
  };
  useEffect(()=>{
    if(!canvas.current) return;
    let save=newExploration(), writable=true, dirty=false;
    if(weaponLab){
      writable=false;
      save.arsenal.push(...elementalIds);
      save.hotbar=[...elementalIds];
      save.equipped='greatsword';
    } else try {
      const raw=localStorage.getItem(saveKey);
      const restored=readExploration(raw);
      if(restored) save=restored;
      else if(raw!==null) {
        writable=false;
        setSaveNotice('This exploration save is incompatible. This visit will not replace it.');
      }
    } catch {
      writable=false;
      setSaveNotice('Browser storage is unavailable. Exploration will not be saved.');
    }
    const known=new Set(save.discovered);
    setDiscovered([...known]);
    setHero({...save});
    setInspected(save.equipped);
    const flush=()=>{
      if(!dirty||!writable) return;
      try {
        localStorage.setItem(saveKey,JSON.stringify({...save,discovered:[...known]}));
        dirty=false;
      } catch {
        writable=false;
        setSaveNotice('Exploration could not be saved to browser storage.');
      }
    };
    
    try {
      controller.current=startWilderness(canvas.current,save,next=>{
        save.position=next;
        const before=known.size;
        reveal(known,next);
        if(known.size!==before) setDiscovered([...known]);
        setPosition(next);
        dirty=true;
      },closeOnly=>showPanel(closeOnly||open.current==='map'?null:'map'),()=>open.current!==null,
      ()=>showPanel(open.current==='bag'?null:'bag'),
      ()=>showPanel(open.current==='status'?null:'status'),
      (notification,prompt,cooldown)=>setMessage({notification,prompt,cooldown}),
      ()=>{dirty=true;setHero({...save});});
    } catch(e) {
      setError(e instanceof Error?e.message:'The wilderness could not start.');
    }
    const timer=window.setInterval(flush,1500);
    window.addEventListener('pagehide',flush);
    return ()=>{
      controller.current?.dispose();
      controller.current=null;
      window.clearInterval(timer);
      window.removeEventListener('pagehide',flush);
    };
  },[]);

  const equipped=weapons[hero.equipped];
  const detail=weapons[inspected];
  const canRedeem=clearing(position.x,position.z)<9.5&&hero.fangs>0;
  return <main className="wild" aria-label="Vonkje">
    <canvas ref={canvas} aria-label="Blackwater Wilds" />
    <div className="wild-health">
      <span>Health {hero.health}/{maxHunterHealth(hero)} · Armor {hero.armor}</span>
      <span>Level {hero.level} · Rank {rank(hero.level)} <progress aria-label="Experience" value={hero.xp} max={xpNeeded(hero.level)}/></span>
      <span>{hero.gold} gold</span>
    </div>
    <nav><button ref={mapButton} onClick={()=>showPanel(open.current==='map'?null:'map')} aria-expanded={panel==='map'}>Map · M</button>
      <button onClick={()=>showPanel(open.current==='bag'?null:'bag')} aria-expanded={panel==='bag'}>Inventory · Tab</button>
      <button onClick={()=>showPanel(open.current==='status'?null:'status')} aria-expanded={panel==='status'}>Status · P</button></nav>
    {error && <p className="wild-error" role="alert">{error}</p>}
    <footer>
      {clearing(position.x,position.z)<10 && <p>Ember Clearing · Campfire nearby</p>}
      {message.prompt && <p>{message.prompt}</p>}
      {message.notification && <p role="status">{message.notification}</p>}
      {saveNotice && <p role="status">{saveNotice}</p>}
      {weaponLab && <p>Weapon Lab · Unsaved session</p>}
      <div className="weaponHud" aria-label="Equipped weapon and ability">
        <strong style={{color:rarity[equipped.rarity].color}}>{equipped.name} · {equipped.element}</strong>
        {equipped.ability && <span><kbd>Q</kbd> {equipped.abilityName} · {message.cooldown ? message.cooldown+' s' : 'Ready'}</span>}
      </div>
      <div className="wild-hotbar" aria-label="Weapon hotbar">{hero.hotbar.map((id,i)=>
        <button key={i} type="button" disabled={!id||!!panel} aria-pressed={id!==null&&id===hero.equipped}
          title={id?weapons[id].name:'Empty slot'} onClick={()=>id&&controller.current?.equip(id)}>
          {i+1} {id?weapons[id].name:'—'}
        </button>)}</div>
      <small>WASD Walk · Shift Sprint · Click Slash · Right click Block · E Interact · Wheel Zoom · M Map</small>
    </footer>
    {panel==='status' && <CharacterStatus hero={hero} close={()=>showPanel(null)} spend={stat=>controller.current?.allocate(stat)}/>}
    {panel==='map' && <WorldMap position={position} discovered={discovered} close={()=>showPanel(null)}/>}
    {panel==='bag' && <div className="wild-map-shade"><section className="wild-map" role="dialog" aria-modal="true" aria-labelledby="wild-bag-title">
      <header><h2 id="wild-bag-title">Inventory</h2><button autoFocus onClick={()=>showPanel(null)}>Close · Esc</button></header>
      <ul className="weapon-list">{hero.arsenal.map(id=><li key={id}>
        <button type="button" aria-pressed={inspected===id} style={{color:rarity[weapons[id].rarity].color}}
          onClick={()=>setInspected(id)}>{weapons[id].name}{id===hero.equipped?' · Equipped':''}</button>
      </li>)}</ul>
      <div className="weapon-detail">
        <strong style={{color:rarity[detail.rarity].color}}>{detail.rarity} {detail.element} · {detail.name}</strong>
        <p>{detail.description}</p>
        <p>Damage {weaponDamage(detail)} · Range {detail.range} · Attack recovery {detail.cooldown} s
          {detail.ability && ' · '+detail.abilityName+' '+detail.abilityCooldown+' s'}</p>
        <button type="button" disabled={hero.equipped===inspected} onClick={()=>controller.current?.equip(inspected)}>Equip</button>
        <label> Hotbar <select value={hero.hotbar.indexOf(inspected)+1} onChange={e=>{
          const slot=Number(e.target.value)-1;
          if(slot<0) controller.current?.assign(hero.hotbar.indexOf(inspected),null);
          else controller.current?.assign(slot,inspected);
        }}><option value={0}>Unassigned</option>
          {hero.hotbar.map((id,i)=><option key={i} value={i+1}>{i+1}{id?' · '+weapons[id].name:''}</option>)}
        </select></label>
      </div>
      <ul>
        <li>Gold · {hero.gold}</li>
        {hero.fangs>0&&<li>Wolf Fang × {hero.fangs} · Common material</li>}
      </ul>
      {canRedeem&&elementalIds.some(id=>!hero.arsenal.includes(id))&&<details>
        <summary>Ember Clearing exchange · 1 Wolf Fang per weapon</summary>
        {elementalIds.filter(id=>!hero.arsenal.includes(id)).map(id=><button key={id} onClick={()=>controller.current?.redeem(id)}>{weapons[id].name}</button>)}
      </details>}
    </section></div>}
  </main>;
}
