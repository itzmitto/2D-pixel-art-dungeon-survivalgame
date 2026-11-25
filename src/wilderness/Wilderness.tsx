import { useEffect, useRef, useState } from 'react';
import { clearing } from './layout';
import { newExploration, readExploration, reveal, saveKey, type Position } from './exploration';
import { longsword, maxHealth, xpNeeded } from './combatRules';
import { startWilderness } from './scene';
import { WorldMap } from './WorldMap';
import './wilderness.css';

export default function Wilderness() {
  const canvas=useRef<HTMLCanvasElement>(null);
  const mapButton=useRef<HTMLButtonElement>(null);
  const open=useRef<'map'|'bag'|null>(null);
  const [panel,setPanel]=useState<'map'|'bag'|null>(null);
  const [hero,setHero]=useState(newExploration);
  const [message,setMessage]=useState({notification:'',prompt:''});
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
    try {
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
    let dispose: (()=>void)|undefined;
    try {
      dispose=startWilderness(canvas.current,save,next=>{
        save.position=next;
        const before=known.size;
        reveal(known,next);
        if(known.size!==before) setDiscovered([...known]);
        setPosition(next);
        dirty=true;
      },closeOnly=>showPanel(closeOnly||open.current==='map'?null:'map'),()=>open.current!==null,
      ()=>showPanel(open.current==='bag'?null:'bag'),
      (notification,prompt)=>setMessage({notification,prompt}),
      ()=>{dirty=true;setHero({...save});});
    } catch(e) {
      setError(e instanceof Error?e.message:'The wilderness could not start.');
    }
    const timer=window.setInterval(flush,1500);
    window.addEventListener('pagehide',flush);
    return ()=>{
      dispose?.();
      window.clearInterval(timer);
      window.removeEventListener('pagehide',flush);
    };
  },[]);

  return <main className="wild" aria-label="Vonkje">
    <canvas ref={canvas} aria-label="Blackwater Wilds" />
    <div className="wild-health">
      <span>Health {hero.health}/{maxHealth}</span>
      <span>Level {hero.level} · {hero.xp}/{xpNeeded(hero.level)} XP</span>
      <span>{hero.gold} gold</span>
    </div>
    <nav><button ref={mapButton} onClick={()=>showPanel(open.current==='map'?null:'map')} aria-expanded={panel==='map'}>Map · M</button>
      <button onClick={()=>showPanel(open.current==='bag'?null:'bag')} aria-expanded={panel==='bag'}>Inventory · Tab</button></nav>
    {error && <p className="wild-error" role="alert">{error}</p>}
    <footer>
      {clearing(position.x,position.z)<10 && <p>Ember Clearing · Campfire nearby</p>}
      {message.prompt && <p>{message.prompt}</p>}
      {message.notification && <p role="status">{message.notification}</p>}
      {saveNotice && <p role="status">{saveNotice}</p>}
      <small>WASD Walk · Shift Sprint · Click Slash · Right click Block · E Interact · Wheel Zoom · M Map</small>
    </footer>
    {panel==='map' && <WorldMap position={position} discovered={discovered} close={()=>showPanel(null)}/>}
    {panel==='bag' && <div className="wild-map-shade"><section className="wild-map" role="dialog" aria-modal="true" aria-labelledby="wild-bag-title">
      <header><h2 id="wild-bag-title">Inventory</h2><button autoFocus onClick={()=>showPanel(null)}>Close · Esc</button></header>
      <ul>
        <li>{longsword.name} · {longsword.rarity} · Equipped · {longsword.damage} damage</li>
        <li>Gold · {hero.gold}</li>
        {hero.fangs>0&&<li>Wolf Fang × {hero.fangs} · Common material</li>}
      </ul>
    </section></div>}
  </main>;
}
