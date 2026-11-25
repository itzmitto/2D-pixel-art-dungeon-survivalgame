import { useId, useRef, useState } from 'react';
import { branchTrails, bridges, extent, forests, hills, landmarks, path, river, southPath } from './layout';
import { cellAt, cellsPerSide, cellSize, type Position } from './exploration';

const span=extent*2;
const samples=Array.from({length:span/2+1},(_,i)=>-extent+i*2);
const riverLine=samples.map(z=>[river(z),z].join(',')).join(' ');
const trails=[
  ...[path,southPath].map(trail=>samples.map(x=>[x,trail(x)].join(',')).join(' ')),
  ...branchTrails.map(trail=>trail.map(point=>point.join(',')).join(' ')),
];
const icons={ruin:'◆',bridge:'═',campfire:'✦',camp:'△',cave:'●',tower:'■',gate:'◇'};
const bound=(value:number, half:number)=>Math.max(-extent+half,Math.min(extent-half,value));

export function WorldMap({position,discovered,close}:{
  position:Position; discovered:number[]; close:()=>void;
}) {
  const mask=useId();
  const seen=new Set(discovered);
  const [view,setView]=useState({x:0,z:0,size:span});
  const drag=useRef<{id:number;x:number;y:number}|undefined>(undefined);
  const zoom=(factor:number)=>setView(current=>{
    const size=Math.max(90,Math.min(span,current.size*factor));
    const x=current.size===span?position.x:current.x;
    const z=current.size===span?position.z:current.z;
    return {size,x:bound(x,size/2),z:bound(z,size/2)};
  });
  return <div className="wild-map-shade">
    <section className="wild-map" role="dialog" aria-modal="true" aria-labelledby="wild-map-title">
      <header><h2 id="wild-map-title">The Blackwater Wilds</h2><button autoFocus type="button" onClick={close}>Close · Esc</button></header>
      <svg viewBox={`${view.x-view.size/2} ${view.z-view.size/2} ${view.size} ${view.size}`}
        role="img" aria-label="Exploration map. North is up. The gold arrow marks your position and facing."
        onWheel={event=>zoom(event.deltaY>0?1.2:1/1.2)}
        onPointerDown={event=>{
          if(event.button!==0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current={id:event.pointerId,x:event.clientX,y:event.clientY};
        }}
        onPointerMove={event=>{
          const previous=drag.current;
          if(previous?.id!==event.pointerId) return;
          const rect=event.currentTarget.getBoundingClientRect();
          const scale=view.size/Math.min(rect.width,rect.height);
          const dx=(previous.x-event.clientX)*scale,dz=(previous.y-event.clientY)*scale;
          drag.current={...previous,x:event.clientX,y:event.clientY};
          setView(v=>({...v,x:bound(v.x+dx,v.size/2),z:bound(v.z+dz,v.size/2)}));
        }}
        onLostPointerCapture={()=>{drag.current=undefined;}}>
        <defs><clipPath id={mask}>{discovered.map(id=>
          <rect key={id} x={-extent+(id%cellsPerSide)*cellSize} y={-extent+Math.floor(id/cellsPerSide)*cellSize}
            width={cellSize} height={cellSize}/>)}</clipPath></defs>
        <rect x={-extent} y={-extent} width={span} height={span} fill="#161d1c"/>
        <g clipPath={`url(#${mask})`}>
          <rect x={-extent} y={-extent} width={span} height={span} fill="#616346"/>
          {forests.map(f=><ellipse key={f.x} cx={f.x} cy={f.z} rx={f.rx} ry={f.rz} fill="#293f33"/>)}
          {hills.map(h=><g key={h.x+','+h.z}>{[.35,.58,.81].map(radius=>
            <circle key={radius} cx={h.x} cy={h.z} r={h.radius*radius} fill="none" stroke="#a4a085" strokeWidth="1.3"/>)}</g>)}
          {trails.map((points,i)=><polyline key={i} points={points} fill="none" stroke="#c2a679" strokeWidth="5" strokeDasharray="4 2"/>)}
          <polyline points={riverLine} fill="none" stroke="#436b7b" strokeWidth="15"/>
          {bridges.map(b=><rect key={b.name} x={b.x-13} y={b.z-2.5} width={26} height={5} fill="#dfb77f" stroke="#292018"/>)}
        </g>
        {landmarks.filter(l=>seen.has(cellAt(l.x,l.z))).map(l=><g key={l.name}>
          <text x={l.x} y={l.z+3} textAnchor="middle">{icons[l.kind]}</text>
          <text x={l.x} y={l.z-7} textAnchor="middle">{l.name}</text>
        </g>)}
        <path d="M 0 6 L 4 -4 L 0 -2 L -4 -4 Z" fill="#ffcf75" stroke="#22190d" strokeWidth="1.2"
          transform={`translate(${position.x} ${position.z}) rotate(${-position.yaw*180/Math.PI})`}/>
      </svg>
      <div className="wild-map-controls">
        <button onClick={()=>zoom(1/1.3)}>Zoom in</button>
        <button onClick={()=>zoom(1.3)}>Zoom out</button>
        <button onClick={()=>setView(v=>({...v,x:bound(position.x,v.size/2),z:bound(position.z,v.size/2)}))}>Center</button>
      </div>
      <p>North is up · Drag to pan · Gold arrow: you · Dark green: forest · Olive: grassland · Rings: hills · Blue: river · Tan: trail</p>
      <p>═ Bridge · ✦ Campfire · △ Camp · ● Cave · ■ Tower · ◆ Ruin · ◇ Dungeon gate</p>
    </section>
  </div>;
}
