import { useEffect, useRef, useState } from 'react';
import { clearing } from './layout';
import { newExploration, readExploration, reveal, saveKey, type Position } from './exploration';
import { startWilderness } from './scene';
import { WorldMap } from './WorldMap';
import './wilderness.css';

export default function Wilderness() {
  const canvas=useRef<HTMLCanvasElement>(null);
  const mapButton=useRef<HTMLButtonElement>(null);
  const open=useRef(false);
  const [map,setMap]=useState(false);
  const [position,setPosition]=useState<Position>(newExploration().position);
  const [discovered,setDiscovered]=useState<number[]>([]);
  const [error,setError]=useState('');
  const [saveNotice,setSaveNotice]=useState('');

  const changeMap=(value:boolean)=>{
    open.current=value;
    setMap(value);
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
      },closeOnly=>changeMap(!closeOnly&&!open.current),()=>open.current);
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
    <nav><button ref={mapButton} onClick={()=>changeMap(!open.current)} aria-expanded={map}>Map · M</button></nav>
    {error && <p className="wild-error" role="alert">{error}</p>}
    <footer>
      {clearing(position.x,position.z)<10 && <p>Ember Clearing · Campfire nearby</p>}
      {saveNotice && <p role="status">{saveNotice}</p>}
      <small>WASD Walk · Shift Sprint · Click Slash · Wheel Zoom · M Map</small>
    </footer>
    {map && <WorldMap position={position} discovered={discovered} close={()=>changeMap(false)}/>}
  </main>;
}
