import { useEffect, useRef, useState } from 'react';
import { HealthBar } from '../components/hud/HealthBar';
import { ArmorBar } from '../components/hud/ArmorBar';
import { spawn, clearing } from './layout';
import { startWilderness } from './scene';
import { WorldMap } from './WorldMap';
import './wilderness.css';

export default function Wilderness() {
  const canvas=useRef<HTMLCanvasElement>(null);
  const open=useRef(false);
  const [map,setMap]=useState(false);
  const [position,setPosition]=useState(spawn);
  const [error,setError]=useState('');
  const [selected,setSelected]=useState(0);
  const changeMap=(value:boolean)=>{open.current=value;setMap(value);};
  useEffect(()=>{
    if(!canvas.current) return;
    let dispose: (()=>void)|undefined;
    try {
      dispose=startWilderness(canvas.current,(x,z)=>setPosition({x,z}),
        closeOnly=>changeMap(!closeOnly&&!open.current),()=>open.current);
    } catch(e) {
      setError(e instanceof Error?e.message:'The wilderness could not start.');
    }
    return ()=>dispose?.();
  },[]);
  useEffect(()=>{
    const controller=new AbortController();
    window.addEventListener('keydown',event=>{
      if(!open.current && /^[1-9]$/.test(event.key)) setSelected(Number(event.key)-1);
    },{signal:controller.signal});
    return ()=>controller.abort();
  },[]);
  const nearFire=clearing(position.x,position.z)<10;
  return <main className="wild" aria-label="Vonkje 3D wilderness">
    <canvas ref={canvas} aria-label="3D wilderness" />
    <div className="wild-health"><HealthBar hearts={3}/><ArmorBar defense={0}/></div>
    <nav><button onClick={()=>changeMap(!open.current)}>Map · M</button><a href="./">2D game</a></nav>
    {error && <p className="wild-error" role="alert">{error}</p>}
    <footer>
      {nearFire && <p>Ember Clearing · Campfire nearby</p>}
      <div className="wild-hotbar" aria-label="Prototype hotbar">
        {Array.from({length:9},(_,i)=><button key={i} aria-label={`Empty slot ${i+1}`} aria-pressed={i===selected} onClick={()=>setSelected(i)}>{i+1}</button>)}
      </div>
      <small>WASD Walk · Shift Sprint · Click Slash · Wheel Zoom · M Map</small>
      <small>Exploration prototype</small>
    </footer>
    {map && <WorldMap {...position} close={()=>changeMap(false)}/>}
  </main>;
}
