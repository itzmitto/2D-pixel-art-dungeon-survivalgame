import { extent, forests, landmarks, path, river } from './layout';

const samples=Array.from({length:181},(_,i)=>-extent+i*2);
const riverLine=samples.map(z=>[river(z),z].join(',')).join(' ');
const trailLine=samples.map(x=>[x,path(x)].join(',')).join(' ');

export function WorldMap({x,z,close}:{x:number;z:number;close:()=>void}) {
  return <div className="wild-map-shade">
    <section className="wild-map" role="dialog" aria-modal="true" aria-labelledby="wild-map-title">
      <header><h2 id="wild-map-title">The Blackwater Wilds</h2><button autoFocus type="button" onClick={close}>Close · Esc</button></header>
      <svg viewBox="-182 -182 364 364" role="img" aria-label="World map. North is up. Gold dot marks your position.">
        <rect x="-180" y="-180" width="360" height="360" fill="#555939"/>
        {forests.map(f=><ellipse key={f.x+','+f.z} cx={f.x} cy={f.z} rx={f.rx} ry={f.rz} fill="#253c30" stroke="#687359" strokeWidth="1"/>)}
        <polyline points={trailLine} fill="none" stroke="#c2a679" strokeWidth="5" strokeDasharray="4 2"/>
        <polyline points={riverLine} fill="none" stroke="#8aa1a3" strokeWidth="17"/>
        <polyline points={riverLine} fill="none" stroke="#355965" strokeWidth="13"/>
        <rect x="19" y="-3" width="26" height="6" fill="#c3a17a" stroke="#2a2018"/>
        {landmarks.map(l=><g key={l.name}><circle cx={l.x} cy={l.z} r="2.6" fill="#f2d6a2"/>
          <text x={l.x} y={l.z-6} textAnchor="middle">{l.name}</text></g>)}
        <text x="-159" y="-155" textAnchor="middle">North</text>
        <circle cx={x} cy={z} r="3.4" fill="#ffcf75" stroke="#22190d" strokeWidth="1.5"/>
      </svg>
      <p>Gold dot: you · Olive: grassland · Dark green: forest · Tan: trail · Blue: river</p>
    </section>
  </div>;
}
