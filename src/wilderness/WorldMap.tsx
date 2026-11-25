import { memo, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { branchTrails, bridges, extent, hills, landmarks, path, river, southPath } from './layout';
import { den, inDen } from './denLayout';
import { cellAt, cellsPerSide, cellSize, type Position } from './exploration';
import { regions, type RegionId } from './regions';
import { cartographicTrees, contours, terrainTexture } from './ui/atlasTerrain';
import { SystemPanel } from './ui/SystemPanel';
import './ui/atlas.css';

const span=extent*2;
const samples=Array.from({length:span/2+1},(_,i)=>-extent+i*2);
const riverLine=samples.map(z=>[river(z),z].join(',')).join(' ');
const trails=[
  ...[path,southPath].map(trail=>samples.map(x=>[x,trail(x)].join(',')).join(' ')),
  ...branchTrails.map(trail=>trail.map(point=>point.join(',')).join(' ')),
];
const bound=(value:number,half:number)=>Math.max(-extent+half,Math.min(extent-half,value));
let cartography:string[]|undefined;
const symbols={
  ruin:'M-4 5v-9h2v3h4v-5h2V5z M-1 5v-3h2v3',
  bridge:'M-5 -3H5M-5 3H5M-3 -3v6m3-6v6m3-6v6',
  campfire:'M0 -6C5-1 4 3 0 4c-5-2-5-5 0-10zM-4 6l8-2m-8 0 8 2',
  camp:'M-5 5 0-5 5 5zM0-4v9',
  cave:'M-6 4-3-3 0-5 4-2 6 4zM-2 4V1l2-2 2 2v3',
  tower:'M-4 5v-8l-1-1v-2h2v2h2v-2h2v2h2v-2h2v2l-1 1v8zM0 0v2',
  gate:'M-4 5v-5a4 4 0 1 1 8 0v5M-6 5H6M0-1v4',
  boss:'M-5-5-3 1 0 5 3 1 5-5M-4-2 0-4 4-2M-2 1l2 2 2-2',
};
const descriptions:Record<keyof typeof symbols,string>={
  ruin:'Ancient ruin',bridge:'River crossing',campfire:'Safe campfire',camp:'Abandoned camp',
  cave:'Cave landmark',tower:'Tower landmark · interior closed',gate:'Dungeon gate',boss:'Boss arena',
};
const AtlasTerrain=memo(function AtlasTerrain(){
  const texture=useMemo(terrainTexture,[]);
  const lines=cartography??=contours([2,4,6,8,10,13,16,19]);
  return <>
    {texture?<image href={texture} x={-extent} y={-extent} width={span} height={span}/>:
      <rect x={-extent} y={-extent} width={span} height={span} fill="#4f5440"/>}
    {lines.map((d,i)=><path key={i} d={d} fill="none" stroke={i%2?'#d3b889':'#bbac83'} strokeWidth={i%2?.66:.46} opacity={.37+i*.026}/>)}
    <g fill="#b8ab7b" fillOpacity=".29" stroke="#162a27" strokeWidth=".4">
      {cartographicTrees.map(({x,z,s},i)=><path key={i} d={`M${x} ${z-s}l${-s*.7} ${s*1.7}h${s*1.4}z`}/>)}
    </g>
    {hills.map(h=><path key={h.x} d={`M${h.x-9} ${h.z+4}l7-10 5 6 3-4 6 8z`} fill="#c7b592" fillOpacity=".29" stroke="#d3bb8b" strokeWidth=".55"/>)}
    <g fill="none" strokeLinecap="round">
      {trails.map((line,i)=><polyline key={i} points={line} stroke="#d0b286" strokeWidth={i<2?2.4:1.35} strokeDasharray={i<2?undefined:'2 2'}/>)}
      <polyline points={riverLine} stroke="#9cae9f" strokeWidth="17"/>
      <polyline points={riverLine} stroke="#315e69" strokeWidth="14"/>
      <polyline points={riverLine} stroke="#a1cbcd" strokeWidth=".75" opacity=".65"/>
    </g>
    {bridges.map(b=><rect key={b.name} x={b.x-13} y={b.z-2.5} width={26} height={5} fill="#daba87" stroke="#352820"/>)}
  </>;
});
const Discovery=memo(function Discovery({id,cells}:{id:string;cells:number[]}){
  return <defs><clipPath id={id}>{cells.map(cell=><rect key={cell}
    x={-extent+(cell%cellsPerSide)*cellSize} y={-extent+Math.floor(cell/cellsPerSide)*cellSize} width={cellSize} height={cellSize}/>)}</clipPath></defs>;
});

function Compass(){
  return <svg className="atlas-compass" viewBox="0 0 100 100" aria-label="Compass, north is up">
    <circle cx="50" cy="51" r="28"/><circle cx="50" cy="51" r="19" strokeDasharray="1 4"/>
    <path d="M50 17 56 45 83 51 56 57 50 84 44 57 17 51 44 45z" fill="#9e8054"/>
    <path d="M50 17v34l-6-6zm33 34H50l6-6zM50 84V51l6 6zM17 51h33l-6 6z" fill="#edcf96"/>
    <text x="50" y="12">N</text><text x="50" y="98">S</text><text x="10" y="54">W</text><text x="91" y="54">E</text>
  </svg>;
}
function PlayerMark({position,scale=1}:{position:Position;scale?:number}){
  return <g transform={`translate(${position.x} ${position.z}) rotate(${-position.yaw*180/Math.PI}) scale(${scale})`} pointerEvents="none">
    <circle r="8" fill="#1c2424" stroke="#e2c28b" strokeWidth=".8"/>
    <path d="M0 6 4-4 0-2-4-4Z" fill="#ffe6a7"/>
  </g>;
}

export function WorldMap({position,discovered,cleared,bossDefeated,close}:{
  position:Position;discovered:number[];cleared:boolean;bossDefeated:boolean;close:()=>void;
}){
  const mask=useId();
  const [region,setRegion]=useState<RegionId>('velren');
  const [selection,select]=useState<string>('');
  const seen=useMemo(()=>new Set(discovered),[discovered]);
  const [view,setView]=useState({x:0,z:0,size:span});
  const drag=useRef<{id:number;x:number;y:number;moved:boolean}|null>(null);
  const zoom=(factor:number)=>setView(current=>{
    const size=Math.max(85,Math.min(span,current.size*factor));
    const x=current.size===span?position.x:current.x,z=current.size===span?position.z:current.z;
    return {size,x:bound(x,size/2),z:bound(z,size/2)};
  });
  if(inDen(position.z)) return <SystemPanel title={den.name} section="World Atlas / Subterranean survey" close={close} style="atlas-panel atlas-den">
    <div className="atlas-den-meta">Rank {den.rank} · Recommended level {den.level} · {cleared?'Cleared':'Uncleared'}</div>
    <svg viewBox="-30 300 60 91" aria-label="Den map" role="img">
      <rect x="-30" y="300" width="60" height="91" fill="#10191e"/>
      {den.chambers.filter(room=>room.x<18||position.z<356).map(room=><rect key={room.z+','+room.x}
        x={room.x-room.w/2} y={room.z-room.d/2} width={room.w} height={room.d} fill="#665e55" stroke="#c3a574" strokeWidth=".27"/>)}
      <circle cx={den.exit.x} cy={den.exit.z} r="1.1" fill="#8faccc"/>
      {(position.z<339||bossDefeated)&&<g transform="translate(0 315) scale(.26)" fill="none" stroke="#f0d5a1" strokeWidth="1.5">
        <path d={symbols.boss}/><title>{bossDefeated?'Fang Guardian defeated':'Fang Guardian · Boss arena'}</title>
      </g>}
      <PlayerMark position={position} scale={.27}/>
    </svg><p>Gold arrow: hunter · Blue: exit {bossDefeated?'· Fang Guardian defeated':''}</p>
  </SystemPanel>;

  const selectedRegion=regions.find(item=>item.id===region)??regions[0];
  const selected=landmarks.find(item=>item.name===selection&&seen.has(cellAt(item.x,item.z)));
  const caption=(kind:keyof typeof symbols)=>kind==='gate'
    ? 'Rank '+den.rank+' · Level '+den.level+' · '+(cleared?'Cleared':'Uncleared')+(bossDefeated?' · Fang Guardian defeated':'')
    : descriptions[kind];
  const activate=(event:KeyboardEvent<SVGGElement>,name:string)=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();setRegion('velren');select(name);}
  };
  return <SystemPanel title="World Atlas" section="Cartographer’s archive / surveyed lands" close={close} style="atlas-panel">
    <div className="atlas-layout">
      <div className="atlas-chart">
        <div className="atlas-map-frame">
          <svg className="atlas-map" viewBox={`${view.x-view.size/2} ${view.z-view.size/2} ${view.size} ${view.size}`}
            aria-label="Velren Forest coordinate atlas" onWheel={event=>zoom(event.deltaY>0?1.2:1/1.2)}
            onPointerDown={event=>{if(event.button===0) drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};}}
            onPointerMove={event=>{
              const previous=drag.current;
              if(previous?.id!==event.pointerId||!(event.buttons&1)) return;
              const dx=previous.x-event.clientX,dz=previous.y-event.clientY;
              if(!previous.moved&&Math.hypot(dx,dz)<4) return;
              if(!previous.moved) event.currentTarget.setPointerCapture(event.pointerId);
              const rect=event.currentTarget.getBoundingClientRect(), scale=view.size/Math.min(rect.width,rect.height);
              drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,moved:true};
              setView(v=>({...v,x:bound(v.x+dx*scale,v.size/2),z:bound(v.z+dz*scale,v.size/2)}));
            }}
            onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
            <Discovery id={mask} cells={discovered}/>
            <rect x={-extent} y={-extent} width={span} height={span} fill="#172326"/>
            <defs><g id={mask+'-terrain'}><AtlasTerrain/></g></defs>
            <use href={`#${mask}-terrain`} opacity=".22" pointerEvents="none"/>
            <g clipPath={`url(#${mask})`}><use href={`#${mask}-terrain`} pointerEvents="none"/></g>
            <rect x={-extent+1.3} y={-extent+1.3} width={span-2.6} height={span-2.6}
              fill="none" stroke="#d6ae73" strokeWidth="2" strokeDasharray="5 3" pointerEvents="none"/>
            {landmarks.filter(item=>seen.has(cellAt(item.x,item.z))).map(item=><g
              key={item.name} className={'atlas-pin '+(item.name===selection?'selected':'')} role="button" tabIndex={0}
              aria-label={item.name+' · '+caption(item.kind)} onClick={()=>{setRegion('velren');select(item.name);}} onKeyDown={event=>activate(event,item.name)}
              transform={`translate(${item.x} ${item.z})`}>
              <title>{item.name} · {caption(item.kind)}</title><circle r={item.kind==='gate'?7:5.6} />
              <path d={symbols[item.kind]} />
              <text y={item.kind==='gate'?16:-9} textAnchor="middle">{item.name}{item.kind==='gate'&&cleared?' ✓':''}</text>
            </g>)}
            <PlayerMark position={position}/>
          </svg>
          <Compass/>
          <div className="atlas-caption"><strong>Velren Forest</strong><span>Blackwater Wilds · Levels 1–15</span></div>
        </div>
        <div className="atlas-controls">
          <button onClick={()=>zoom(1/1.27)} aria-label="Zoom in">+</button><button onClick={()=>zoom(1.27)} aria-label="Zoom out">−</button>
          <button onClick={()=>setView(v=>({...v,x:bound(position.x,v.size/2),z:bound(position.z,v.size/2)}))}>Center on hunter</button>
          <small>Wheel to zoom · Drag to chart</small>
        </div>
        <ul className="atlas-legend">{Object.entries(descriptions).map(([key,label])=><li key={key}>
          <svg viewBox="-7 -7 14 14" aria-hidden="true"><path d={symbols[key as keyof typeof symbols]}/></svg>
          {key==='tower'?'Tower':label}</li>)}</ul>
      </div>
      <aside className="atlas-index">
        <span className="system-kicker">Region index</span>
        <div className="atlas-regions" role="group" aria-label="Select region">
          {regions.map(item=><button key={item.id} type="button" aria-pressed={item.id===region} onClick={()=>{setRegion(item.id);select('');}}>
            <strong>{item.name}</strong><small>{item.difficulty} · {item.state}</small>
          </button>)}
        </div>
        <div className="atlas-selection" aria-live="polite">
          <span className="system-kicker">{selected?'Discovered location':selectedRegion.state==='Planned'?'Unsurveyed region':'Charted region'}</span>
          <strong>{selected?.name??selectedRegion.name}</strong>
          <p>{selected?caption(selected.kind):selectedRegion.detail}</p>
          {selectedRegion.state==='Planned'&&<p>Future region · No travel route available.</p>}
        </div>
      </aside>
    </div>
  </SystemPanel>;
}
