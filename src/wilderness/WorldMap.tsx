import { fallsX, fortress, frontierAt, highlands } from './frontier';
import { monsters } from './huntData';
import { rarity, type Rarity } from './weapons';
import { bossCaves, caveAt, caveBossPoint, caveExit, caveLootLabel, caveRewardId, caveRewardTier, caveStatus, caveTreasurePoint, type CaveRuns } from './bossCaves';
import { floorRemaining, towerFloorAt } from './briarWatch';
import { waystones } from './worldSites';
import { denChests, towerChests, worldChests } from './treasure';
import { memo, useId, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
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
const boundZ=(value:number,half:number)=>Math.max(highlands.north-half*.15+half,Math.min(extent-half,value));
let cartography:string[]|undefined;
const symbols={
  capital:'M-6 5v-7h3v-3h6v3h3v7zM-2 5V1h4v4',
  capitalService:'M-5 5v-6l5-4 5 4v6z M-2 5V1h4v4',
  ruin:'M-4 5v-9h2v3h4v-5h2V5z M-1 5v-3h2v3',
  bridge:'M-5 -3H5M-5 3H5M-3 -3v6m3-6v6m3-6v6',
  campfire:'M0 -6C5-1 4 3 0 4c-5-2-5-5 0-10zM-4 6l8-2m-8 0 8 2',
  briar:'M-5 5v-9l-1-1v-2h3v2h2v-2h2v2h2v-2h3v2l-1 1v9zM-2 5V1l2-2 2 2v4',
  ritual:'M-6 5H6M-5 5v-8l2-2 2 2v8m2 0v-8l2-2 2 2v8M-3 1 0-2 3 1',
  orcCamp:'M-5 5 0-5 5 5zM-5-5l9 8m1-8-9 8M-5-5h2m8 0H3',
  waystone:'M-5 5H5M-3 3l1-8 2-2 2 2 1 8zM0-3l1.3 2L0 1l-1.3-2Z',
  camp:'M-5 5 0-5 5 5zM0-4v9',
  cave:'M-6 4-3-3 0-5 4-2 6 4zM-2 4V1l2-2 2 2v3',
  tower:'M-4 5v-8l-1-1v-2h2v2h2v-2h2v2h2v-2h2v2l-1 1v8zM0 0v2',
  gate:'M-4 5v-5a4 4 0 1 1 8 0v5M-6 5H6M0-1v4',
  chest:'M-5 5v-8l2-2h6l2 2v8z M-5 0H5 M0 0v2',
  bossCave:'M-7 5-4-2 0-6 4-2 7 5H3V2L0-1-3 2v3zM0 2v3',
  explore:'M-5 5H5M-3 3-4 0 0-6 4 0 3 3H-3zM0-3v5',
  encounter:'M0-6 6 0 0 6-6 0ZM-2 0h4M0-2v4',
  boss:'M-5-5-3 1 0 5 3 1 5-5M-4-2 0-4 4-2M-2 1l2 2 2-2',
};
const descriptions:Record<keyof typeof symbols,string>={
  capital:'Safe capital',capitalService:'Capital landmark',ruin:'Ancient ruin',bridge:'River crossing',campfire:'Safe campfire',camp:'Abandoned camp',
  waystone:'Waystone',orcCamp:'Orc encampment',briar:'Tower dungeon',ritual:'Wizard encounter · Veil Hierophant',
  chest:'Discovered treasure',cave:'Cave landmark',tower:'Tower landmark · interior closed',gate:'Dungeon gate',boss:'Boss arena',bossCave:'Boss cave',encounter:'Active encounter',explore:'Exploration site',
};
const AtlasTerrain=memo(function AtlasTerrain({roads}:{roads:boolean}){
  const texture=useMemo(terrainTexture,[]);
  const lines=cartography??=contours([2,4,6,8,10,13,16,19]);
  return <>
    {texture?<image href={texture} x={-extent} y={-extent} width={span} height={span}/>:
      <rect x={-extent} y={-extent} width={span} height={span} fill="#4f5440"/>}
    {lines.map((d,i)=><path key={i} d={d} fill="none" stroke={i%2?'#d3b889':'#bbac83'} strokeWidth={i%2?.66:.46} opacity={.37+i*.026}/>)}
    <g fill="#334a35" stroke="#d2bd84" strokeWidth=".22" opacity=".87">
      {cartographicTrees.map(({x,z,s},i)=><path key={i}
        d={`M${x} ${z-s}l${-s*.46} ${s*.71}h${s*.15}l${-s*.43} ${s*.73}h${s*.48}v${s*.28}h${s*.47}v${-s*.28}h${s*.48}l${-s*.43} ${-s*.73}h${s*.15}z`}/>)}
    </g>
    <g className="atlas-mountains">
      {hills.map(h=><g key={h.x} transform={`translate(${h.x} ${h.z}) scale(${h.radius/44})`}>
        {[[-13,5,.79],[9,2,.86],[-3,7,1.22],[19,10,.62]].map(([x,z,size])=>
          <g key={x} transform={`translate(${x} ${z}) scale(${size})`}>
            <path d="M-14 7-6-3-2-6 3-14 7-5 10-3 15 7 9 5 2 7-5 5Z" fill="#bcb08a" stroke="#413f37" strokeWidth=".68"/>
            <path d="M3-14 4-6 1-2 6 1 7 4 15 7 10-3 7-5Z" fill="#62624e"/>
            <path d="M-2-6l5-8 4 9-3-2-3 3-1-3Z" fill="#eee0b4"/>
            <path d="m-3-3-5 7m8-5-3 5m11-4 4 5m-9-9 3 6" fill="none" stroke="#565447" strokeWidth=".58"/>
          </g>)}
      </g>)}
    </g>
    <g fill="none" strokeLinecap="round">
      {roads&&trails.map((line,i)=><g key={i}>
        <polyline points={line} stroke="#423a2e" strokeWidth={i<2?3.9:2.3} opacity=".67"/>
        <polyline points={line} stroke={i<2?'#e2c594':'#cda978'} strokeWidth={i<2?1.78:1.30} strokeDasharray={i<2?undefined:'2.2 1.75'}/>
      </g>)}
      <polyline points={riverLine} stroke="#d5bd8b" strokeWidth="17"/>
      <polyline points={riverLine} stroke="#2a555c" strokeWidth="14.2"/>
      <polyline points={riverLine} stroke="#7faab1" strokeWidth="9.1" opacity=".38"/>
      <polyline points={riverLine} stroke="#a4d1d1" strokeWidth="1.3" strokeDasharray="6 10 3 8" opacity=".67"/>
    </g>
    <g className="atlas-place-labels">
      <text x="-95" y="-103" transform="rotate(-8 -95 -103)">VELREN FOREST</text>
      <text x="48" y="61" transform="rotate(77 48 61)">BLACKWATER</text>
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
    <circle r="8.8" fill="#1c2424" stroke="#e2c28b" strokeWidth=".8"/><circle r="10.7" fill="none" stroke="#ffe4a3" strokeWidth=".55" strokeDasharray="2 2"/>
    <path d="M0 6 4-4 0-2-4-4Z" fill="#ffe6a7"/>
  </g>;
}

const filterOptions={
  chest:'Treasure',boss:'Boss caves',tower:'Towers',waystone:'Waystones',camp:'Enemy camps',
  ruin:'Ruins',safe:'Safe zones',encounter:'Enemy groups',roads:'Roads',player:'Player',
} as const;
type MapFilter=keyof typeof filterOptions;
type MarkerKind=keyof typeof symbols;
export type EnemyMarker={id:string;x:number;z:number;count:number;level:number;elite:boolean;permanent?:boolean;defeated?:boolean};
export type AtlasWaypoint={x:number;z:number;name:string};
type Pin=AtlasWaypoint&{id:string;kind:MarkerKind;tier?:Rarity;claimed?:boolean;group?:EnemyMarker};
function filterFor(kind:MarkerKind):MapFilter|undefined{
  switch(kind){
    case 'chest':return 'chest';
    case 'bossCave':case 'boss':case 'gate':return 'boss';
    case 'briar':case 'tower':return 'tower';
    case 'waystone':return 'waystone';
    case 'orcCamp':case 'camp':case 'ritual':return 'camp';
    case 'ruin':return 'ruin';
    case 'campfire':return 'safe';
    case 'encounter':return 'encounter';
    default:return undefined;
  }
}

export function WorldMap({position,discovered,cleared,bossDefeated,opened,waystonesActive,towerCleared,defeated,caveRuns,worldSeed,travel,close,getEncounters,waypoint,onWaypoint}:{
  position:Position;discovered:number[];cleared:boolean;bossDefeated:boolean;opened:readonly string[];towerCleared:boolean;caveRuns:CaveRuns;worldSeed:number;defeated:readonly string[];waystonesActive:readonly string[];getEncounters:()=>EnemyMarker[];waypoint:AtlasWaypoint|null;onWaypoint:(waypoint:AtlasWaypoint|null)=>void;travel:(id:string)=>string;close:()=>void;
}){
  const mask=useId();
  const [region,setRegion]=useState<RegionId>(frontierAt(position.z)?.id??'velren');
  const [selection,setSelection]=useState<string>('');
  const [travelError,reportTravel]=useState('');
  const [filters,setFilters]=useState<Record<MapFilter,boolean>>({
    chest:true,boss:true,tower:true,waystone:true,camp:true,ruin:true,safe:true,encounter:false,roads:true,player:true,
  });
  const select=(id:string)=>{setSelection(id);reportTravel('');};
  const seen=useMemo(()=>new Set(discovered),[discovered]);
  const [view,setView]=useState(()=>frontierAt(position.z)?{x:0,z:-350,size:247}:{x:0,z:0,size:span});
  const drag=useRef<{id:number;x:number;y:number;moved:boolean}|null>(null);
  const unlocked=waystones.filter(stone=>waystonesActive.includes(stone.id));
  const zoom=(factor:number)=>setView(current=>{
    const size=Math.max(85,Math.min(span,current.size*factor));
    const x=current.size===span?position.x:current.x,z=current.size===span?position.z:current.z;
    return {size,x:bound(x,size/2),z:boundZ(z,size/2)};
  });
  const [clock,setClock]=useState(Date.now);
  useEffect(()=>{const timer=window.setInterval(()=>setClock(Date.now()),1000);return ()=>window.clearInterval(timer);},[]);
  const localRange=(p:Pin)=>Math.round(Math.hypot(position.x-p.x,position.z-p.z));
  const localPin=(pin:Pin,detail:string)=><g key={pin.id} role="button" tabIndex={0}
    aria-label={pin.name+' · '+detail} onClick={()=>select(pin.id)} onKeyDown={event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();select(pin.id);}
    }} className={'atlas-pin '+pin.kind+(pin.claimed?' claimed':'')+(selection===pin.id?' selected':'')}
    style={pin.tier?{'--pin-color':rarity[pin.tier].color} as React.CSSProperties:undefined}
    transform={`translate(${pin.x} ${pin.z}) scale(.28)`}>
    <title>{pin.name} · {detail}</title><circle r="5.6"/><path d={symbols[pin.kind]}/>
  </g>;
  const localSelection=(pins:readonly {pin:Pin;detail:string}[])=>{
    const selected=pins.find(entry=>entry.pin.id===selection);
    if(!selected) return null;
    const {pin,detail}=selected;
    return <div className="atlas-selection">
      <strong>{pin.name}</strong><p>{detail} · {localRange(pin)} m away</p>
      <button onClick={()=>onWaypoint({x:pin.x,z:pin.z,name:pin.name})}>Set Waypoint</button>
      {waypoint&&<button className="atlas-clear-waypoint" onClick={()=>onWaypoint(null)}>Clear Waypoint</button>}
    </div>;
  };
  const lootPin=(chest:typeof denChests[number])=>({
    pin:{id:chest.id,name:chest.title??chest.rarity+' Treasure Chest',x:chest.x,z:chest.z,
      kind:'chest' as const,tier:chest.rarity,claimed:opened.includes(chest.id)},
    detail:chest.rarity+' equipment · '+(opened.includes(chest.id)?'Opened':'Unopened'),
  });
  const cave=caveAt(position.z);
  if(cave){
    const exit=caveExit(cave), run=caveRuns[cave.id], reward=caveRewardId(cave,run?.cycle??1);
    const pins=[
      {pin:{...exit,id:'room-exit',name:'Exit cave',kind:'gate' as const},detail:'Cave exit'},
      {pin:{id:'room-boss',...caveBossPoint(cave),name:cave.boss,kind:'boss' as const},detail:caveStatus(cave,caveRuns,opened,clock)},
      {pin:{id:reward,...caveTreasurePoint(cave),name:'Boss Reward Chest',kind:'chest' as const,tier:run?caveRewardTier(cave,run,worldSeed):cave.rarity,claimed:opened.includes(reward)},
        detail:opened.includes(reward)?'Opened':run?.readyAt?'Reward chest available':'Unlocks on boss defeat'},
    ];
    return <SystemPanel title={cave.name} section={'Boss cave · Rank '+cave.rank} close={close} style="atlas-panel atlas-den">
      <div className="atlas-den-meta">{cave.boss} · Lv {cave.level} · Recommended {cave.recommended} · {caveLootLabel(cave)}</div>
      <p>{caveStatus(cave,caveRuns,opened,clock)}</p>
      <svg viewBox={`${-cave.width-4} ${cave.arena-cave.depth-4} ${2*cave.width+8} ${2*cave.depth+8}`} role="img" aria-label={cave.name+' map'}>
        <ellipse cx="0" cy={cave.arena} rx={cave.width} ry={cave.depth}
          fill={'#'+cave.color.toString(16)} fillOpacity={.36} stroke="#c9a978" strokeWidth=".35"/>
        {pins.map(({pin,detail})=>localPin(pin,detail))}
        <PlayerMark position={position} scale={.22}/>
      </svg>
      {localSelection(pins)}
    </SystemPanel>;
  }
  const floor=towerFloorAt(position.z);
  if(floor){
    const pins=[
      {pin:{...floor.exit,id:'room-exit',name:'Exit '+floor.dungeon.name,kind:'gate' as const},detail:'Tower exit'},
      ...towerChests.filter(chest=>towerFloorAt(chest.z)===floor).map(lootPin),
      ...(!floor.final?[{pin:{...floor.stairs,id:'room-stairs',name:'Door to floor '+(floor.number+1),kind:'briar' as const},
        detail:floorRemaining(floor,defeated)?'Locked · Defeat the guardians':'Unlocked'}]:
        [{pin:{id:'room-boss',x:floor.guards[0].x,z:floor.guards[0].z,name:monsters[floor.guards[0].kind].name,kind:'boss' as const},detail:defeated.includes(floor.dungeon.boss)?'Defeated':'Available · Lv '+monsters[floor.guards[0].kind].level}]),
    ];
    return <SystemPanel title={floor.dungeon.name} section={'Tower dungeon · Floor '+floor.number} close={close} style="atlas-panel atlas-den">
    <div className="atlas-den-meta">{floor.title} · {floorRemaining(floor,defeated)} remaining</div>
    <svg viewBox={`-24 ${floor.z-22} 48 44`} role="img" aria-label={floor.dungeon.name+' floor '+floor.number+' map'}>
      <rect x="-24" y={floor.z-22} width="48" height="44" fill="#181621"/>
      {floor.rooms.map(room=><rect key={room.x+','+room.z} x={room.x-room.w/2} y={room.z-room.d/2} width={room.w} height={room.d}
        fill="#655565" stroke="#c9a978" strokeWidth=".35"/>)}
      {pins.map(({pin,detail})=>localPin(pin,detail))}
      <PlayerMark position={position} scale={.22}/>
    </svg>
    {localSelection(pins)}
  </SystemPanel>;
  }

  if(inDen(position.z)){
    const pins=[
      {pin:{...den.exit,id:'room-exit',name:'Exit to Velren Forest',kind:'gate' as const},detail:'Den exit'},
      {pin:{id:'room-boss',x:0,z:315,name:'Fang Guardian',kind:'boss' as const},detail:bossDefeated?'Defeated':'Available · Lv 7'},
      ...denChests.map(lootPin),
    ];
    return <SystemPanel title={den.name} section="World Atlas / Subterranean survey" close={close} style="atlas-panel atlas-den">
    <div className="atlas-den-meta">Rank {den.rank} · Recommended level {den.level} · {cleared?'Cleared':'Uncleared'}</div>
    <svg viewBox="-30 300 60 91" aria-label="Den map" role="img">
      <rect x="-30" y="300" width="60" height="91" fill="#10191e"/>
      {den.chambers.map(room=><rect key={room.z+','+room.x}
        x={room.x-room.w/2} y={room.z-room.d/2} width={room.w} height={room.d} fill="#665e55" stroke="#c3a574" strokeWidth=".27"/>)}
      {pins.map(({pin,detail})=>localPin(pin,detail))}
      <PlayerMark position={position} scale={.27}/>
    </svg>
    {localSelection(pins)}
    {unlocked.length>0&&<div className="atlas-waystations den-travel">
      <span className="system-kicker">Activated Waystones</span>
      {unlocked.map(stone=><button key={stone.id} onClick={()=>reportTravel(travel(stone.id))}>
        Travel to {stone.name} · Free
      </button>)}
      {travelError&&<p className="atlas-travel-error" role="status">{travelError}</p>}
    </div>}
  </SystemPanel>;
  }

  const selectedRegion=regions.find(item=>item.id===region)??regions[0];
  const pins:Pin[]=[
    ...landmarks.map(site=>({...site,id:site.name})),
    ...waystones.map(site=>({...site,kind:'waystone' as const})),
    ...worldChests.map(chest=>({id:chest.id,name:chest.title??chest.rarity+' Treasure Chest',x:chest.x,z:chest.z,kind:'chest' as const,
      tier:chest.rarity,claimed:opened.includes(chest.id)})),
    ...getEncounters().map(marker=>({id:marker.id,name:marker.permanent?'Gravefang':marker.elite?'Elite encounter':'Enemy group',
      x:marker.x,z:marker.z,kind:marker.permanent?'boss' as const:'encounter' as const,group:marker})),
  ];
  const charted=pins.filter(item=>{
    const filter=filterFor(item.kind);
    return !filter||filters[filter];
  });
  const selected=charted.find(item=>item.id===selection);
  const selectedCave=bossCaves.find(cave=>cave.name===selected?.name);
  const caveCaption=(name:string)=>{
    const cave=bossCaves.find(site=>site.name===name);
    return cave?cave.boss+' · Lv '+cave.level+' · Recommended '+cave.recommended+' · Rank '+cave.rank+
      ' · '+caveStatus(cave,caveRuns,opened,clock):'Boss cave';
  };
  const caption=(kind:keyof typeof symbols)=>kind==='gate'
    ? 'Rank '+den.rank+' · Level '+den.level+' · '+(cleared?'Cleared':'Uncleared')+(bossDefeated?' · Fang Guardian defeated':'')
    : kind==='briar'?'Rank D · Recommended level 12 · '+(towerCleared?'Completed':'The Hollow Sentinel awaits'):descriptions[kind];
  const activate=(event:KeyboardEvent<SVGGElement>,name:string)=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();setRegion(frontierAt(charted.find(pin=>pin.id===name)?.z??0)?.id??'velren');select(name);}
  };
  return <SystemPanel title="World Atlas" section="Cartographer’s archive / surveyed lands" close={close} style="atlas-panel">
    <div className="atlas-layout">
      <div className="atlas-chart">
        <div className="atlas-map-frame">
          <svg className="atlas-map" viewBox={`${view.x-view.size/2} ${view.z-view.size/2} ${view.size} ${view.size}`}
            aria-label="World coordinate atlas" onWheel={event=>zoom(event.deltaY>0?1.2:1/1.2)}
            onPointerDown={event=>{if(event.button===0) drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};}}
            onPointerMove={event=>{
              const previous=drag.current;
              if(previous?.id!==event.pointerId||!(event.buttons&1)) return;
              const dx=previous.x-event.clientX,dz=previous.y-event.clientY;
              if(!previous.moved&&Math.hypot(dx,dz)<4) return;
              if(!previous.moved) event.currentTarget.setPointerCapture(event.pointerId);
              const rect=event.currentTarget.getBoundingClientRect(), scale=view.size/Math.min(rect.width,rect.height);
              drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,moved:true};
              setView(v=>({...v,x:bound(v.x+dx*scale,v.size/2),z:boundZ(v.z+dz*scale,v.size/2)}));
            }}
            onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
            <Discovery id={mask} cells={discovered}/>
            <rect x={-extent} y={-extent} width={span} height={span} fill="#172326"/>
            <defs><g id={mask+'-terrain'}><AtlasTerrain roads={filters.roads}/></g></defs>
            <use href={`#${mask}-terrain`} opacity=".22" pointerEvents="none"/>
            <g clipPath={`url(#${mask})`}><use href={`#${mask}-terrain`} pointerEvents="none"/></g>
            <rect x={-extent+1.3} y={-extent+1.3} width={span-2.6} height={span-2.6}
              fill="none" stroke="#d6ae73" strokeWidth="2" strokeDasharray="5 3" pointerEvents="none"/>
            <rect x={-110} y={highlands.north} width={220} height={highlands.south-highlands.north} fill="#303f55" stroke="#96a5bb" strokeWidth="1"/>
            {[-87,83,-72,83,-81].map((x,i)=><g key={i} transform={`translate(${x} ${[-286,-295,-363,-408,-440][i]})`} fill="none" stroke="#76889f" opacity=".55">
              {[8,16,25,35].map(r=><ellipse key={r} rx={r} ry={r*.75} strokeWidth=".7"/>)}
            </g>)}
            <polyline points={Array.from({length:71},(_,i)=>`${fallsX(-349+i)},${-349+i}`).join(' ')} fill="none" stroke="#759cba" strokeWidth="5"/>
            {filters.roads&&<polyline points={highlands.road.map(point=>point.join(',')).join(' ')} fill="none" stroke="#c1b391" strokeWidth="1.8" strokeDasharray="4 2"/>}
            {charted.map(item=><g
              key={item.id} className={'atlas-pin '+item.kind+(item.id===selection?' selected':'')+(item.claimed?' claimed':'')+
                (item.kind==='waystone'&&waystonesActive.includes(item.id)?' unlocked':'')} role="button" tabIndex={0}
              aria-label={item.name+' · '+(item.kind==='bossCave'?caveCaption(item.name):caption(item.kind))} onClick={()=>{setRegion(frontierAt(item.z)?.id??'velren');select(item.id);}} onKeyDown={event=>activate(event,item.id)}
              style={item.tier?{'--pin-color':rarity[item.tier].color} as React.CSSProperties:undefined}
              transform={`translate(${item.x} ${item.z})`}>
              <title>{item.name} · {(item.kind==='bossCave'?caveCaption(item.name):caption(item.kind))}</title><circle r={item.kind==='gate'?6.4:item.kind==='chest'?3.95:5.3} />
              <path d={symbols[item.kind]} transform={item.kind==='chest'?'scale(.67)':undefined}/>
              {(item.id===selection||view.size<210&&item.kind!=='chest'||item.kind==='campfire'||item.kind==='briar')&&<text y={item.kind==='gate'?16:-9} textAnchor="middle">{item.name}{item.kind==='gate'&&cleared?' ✓':''}</text>}
            </g>)}
            {waypoint&&waypoint.z<extent&&<g className="atlas-waypoint-mark" transform={`translate(${waypoint.x} ${waypoint.z})`} pointerEvents="none">
              <path d="M0-7 5 0 0 7-5 0Z" fill="#68dfff" stroke="#eefcff" strokeWidth="1"/>
            </g>}
            {filters.player&&<PlayerMark position={position}/>}
          </svg>
          <Compass/>
          <div className="atlas-caption"><strong>{selectedRegion.name}</strong><span>{selectedRegion.difficulty}</span></div>
        </div>
        <div className="atlas-controls">
          <button onClick={()=>zoom(1/1.27)} aria-label="Zoom in">+</button><button onClick={()=>zoom(1.27)} aria-label="Zoom out">−</button>
          <button onClick={()=>setView(v=>({...v,x:bound(position.x,v.size/2),z:boundZ(position.z,v.size/2)}))}>Center on hunter</button>
          <small>Wheel to zoom · Drag to chart</small>
        </div>
        <div className="atlas-filters" aria-label="Map layers" role="group">
          {Object.entries(filterOptions).map(([id,label])=>{
            const key=id as MapFilter;
            return <button key={id} aria-pressed={filters[key]} onClick={()=>setFilters(previous=>({...previous,[key]:!previous[key]}))}>{label}</button>;
          })}
        </div>
        <ul className="atlas-legend">{Object.entries(descriptions).map(([key,label])=><li key={key}>
          <svg viewBox="-7 -7 14 14" aria-hidden="true"><path d={symbols[key as keyof typeof symbols]}/></svg>
          {key==='tower'?'Tower':label}</li>)}</ul>
      </div>
      <aside className="atlas-index">
        {unlocked.length>0&&<div className="atlas-waystations">
          <span className="system-kicker">Activated Waystones</span>
          {unlocked.map(stone=><button key={stone.id} aria-pressed={selection===stone.id} onClick={()=>{
            setFilters(previous=>({...previous,waystone:true}));setRegion(frontierAt(stone.z)?.id??'velren');select(stone.id);
            setView(current=>{const size=Math.min(current.size,200);return {size,x:bound(stone.x,size/2),z:boundZ(stone.z,size/2)};});
          }}>{stone.name}</button>)}
        </div>}
        <span className="system-kicker">Region index</span>
        <div className="atlas-regions" role="group" aria-label="Select region">
          {regions.map(item=><button key={item.id} type="button" aria-pressed={item.id===region} onClick={()=>{setRegion(item.id);select('');if(item.id==='elaris') setView({x:0,z:-350,size:247});else if(item.id==='velren'||item.id==='aurelia') setView({x:0,z:0,size:span});}}>
            <strong>{item.name}</strong><small>{item.difficulty} · {item.state}</small>
          </button>)}
        </div>
        <div className="atlas-selection" aria-live="polite">
          <span className="system-kicker">{selected?(seen.has(cellAt(selected.x,selected.z))?'Visited area':'Charted location'):selectedRegion.state==='Planned'?'Unsurveyed region':'Charted region'}</span>
          <strong>{selected?.name??selectedRegion.name}</strong>
          <p>{selectedCave?caveCaption(selectedCave.name):selected?.name===fortress.name?'Eight chambers · Ancient Titan · Recommended level 55':selected?caption(selected.kind):selectedRegion.detail}</p>
          {selected&&<>
            <p>{Math.round(Math.hypot(position.x-selected.x,position.z-selected.z))} m away</p>
            {selected.kind==='chest'&&<p>{selected.tier} equipment · {selected.claimed?'Opened':'Unopened'}</p>}
            {selected.kind==='waystone'&&<p>{waystonesActive.includes(selected.id)?'Activated':'Inactive'}</p>}
            {selected.group&&<p>{selected.group.permanent?(selected.group.defeated?'Defeated · Mythic cache':'Available · Recommended level 10'):
              selected.group.count+' enemies · Up to Lv '+selected.group.level+(selected.group.elite?' · Elite present':'')}</p>}
            {selected.kind==='gate'||selected.kind==='briar'?<details>
              <summary>Dungeon treasure</summary>
              <ul className="atlas-dungeon-loot">
                {(selected.kind==='gate'?denChests:towerChests.filter(chest=>towerFloorAt(chest.z)?.dungeon.name===selected.name)).map(chest=><li key={chest.id}>
                  {chest.rarity} chest{towerFloorAt(chest.z)?' · Floor '+towerFloorAt(chest.z)?.number:''} · {opened.includes(chest.id)?'Opened':'Unopened'}
                </li>)}
              </ul>
            </details>:null}
            <button onClick={()=>onWaypoint({x:selected.x,z:selected.z,name:selected.name})}>Set Waypoint</button>
          </>}
          {waypoint&&<button className="atlas-clear-waypoint" onClick={()=>onWaypoint(null)}>Clear Waypoint</button>}
          {selectedCave&&<p>{caveLootLabel(selectedCave)} rewards{caveRuns[selectedCave.id]?.readyAt||
            opened.some(id=>id.startsWith('reward-'+selectedCave.id+'-'))?' · Boss defeated before':''}</p>}
          {selected?.kind==='waystone'&&(waystonesActive.includes(selected.id)
            ? <button onClick={()=>reportTravel(travel(selected.id))}>Travel here · Free</button>
            : <p>Activate this stone in person with E.</p>)}
          {travelError&&<p className="atlas-travel-error" role="status">{travelError}</p>}
          {selectedRegion.state==='Planned'&&<p>Future region · No travel route available.</p>}
        </div>
      </aside>
    </div>
  </SystemPanel>;
}
