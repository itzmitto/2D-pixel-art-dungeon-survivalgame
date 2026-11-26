import { aurelia, aureliaPlaces, aureliaReserved, aureliaRoad } from './aurelia.ts';
import { bossCaves, caveAt } from './bossCaves.ts';
import { briarWatch, towerFloorAt } from './briarWatch.ts';
import { orcApproach, orcCamp, ritualGrounds, explorationSites, explorationTrails } from './worldSites.ts';
import { inDen } from './denLayout.ts';
export const extent = 240;
export const spawn = { x: -43, z: 4 };
export const landmarks = [
  aurelia,
  ...aureliaPlaces,
  { name: 'Ember Clearing', x: -45, z: 0, kind: 'campfire' },
  { name: 'Blackwater Crossing', x: 32, z: 0, kind: 'bridge' },
  { name: 'Moonwatch Ruin', x: 112, z: -96, kind: 'ruin' },
  { name: 'The Standing Stones', x: -117, z: 79, kind: 'ruin' },
  { name: 'Brokenfang Den', x: -82, z: -24, kind: 'cave' },
  { name: 'Gravespur Memorial', x: 205, z: -182, kind: 'ruin' },
  { name: 'Raven Camp', x: -189, z: 62, kind: 'camp' },
  { name: 'Hollowmouth Cave', x: -187, z: -122, kind: 'cave' },
  { name: 'Hollow Fang Den', x: -187, z: -114, kind: 'gate' },
  { name: 'Greyfen Tower', x: 169, z: -168, kind: 'tower' },
  { name: 'Lantern Rest', x: 154, z: 103, kind: 'campfire' },
  orcCamp,
  ritualGrounds,
  briarWatch,
  ...explorationSites.map(site=>({...site,kind:'explore' as const})),
  ...bossCaves.map(cave=>({...cave,kind:'bossCave' as const})),
  { name: 'Southwater Crossing', x: 32, z: 107, kind: 'bridge' },
] as const;
export const hills = [
  { x: -180,z:-150, radius:52, rise:14 },
  { x: 184,z:-185, radius:52, rise:12 },
  { x: 185,z:165, radius:70, rise:20 },
  { x: -171,z:165, radius:55, rise:12 },
];
export const bridges = landmarks.filter(location => location.kind === 'bridge');
export const forests = [
  { x: -100, z: -89, rx: 70, rz: 53 },
  { x: -103, z: 108, rx: 63, rz: 52 },
  { x: 112, z: 75, rx: 59, rz: 64 },
  { x: 109, z: -119, rx: 56, rz: 39 },
  { x: 181, z: -171, rx: 45, rz: 45 },
  { x: -175, z: -151, rx: 53, rz: 56 },
];
export const river = (z: number) => 32 + 11 * Math.sin(z / 34);
export const path = (x: number) => x >= 45 ? Math.max(-169, -(x - 45) * 1.43 + 4 * Math.sin((x - 45) / 25))
  : x >= 19 ? 0 : 5 * Math.sin((x - 19) / 30);
export const southPath = (x: number) => 107 + 9*Math.sin((x-32)/29)*Math.min(1,Math.abs(x-32)/25);
export const branchTrails = [
  [[-169,-4],[-176,-40],[-198,-81],[-188,-115]],
  [[-176,100],[-185,85],[-189,67]],
  [[-110,99],[-117,85]],
  [[154,99],[154,107]],
  orcApproach,
  aureliaRoad,
  ...explorationTrails,
] as const;
export function trailDistance(x: number,z: number,trails:readonly (readonly (readonly [number,number])[])[]=branchTrails) {
  let distance=Math.min(Math.abs(z-path(x)),Math.abs(z-southPath(x)));
  for(const trail of trails){
    for(let i=1;i<trail.length;i++){
      const [ax,az]=trail[i-1], [bx,bz]=trail[i];
      const vx=bx-ax,vz=bz-az;
      const t=Math.max(0,Math.min(1,((x-ax)*vx+(z-az)*vz)/(vx*vx+vz*vz)));
      distance=Math.min(distance,Math.hypot(x-ax-vx*t,z-az-vz*t));
    }
  }
  return distance;
}
export const landmarkDistance = (x: number,z: number) =>
  Math.min(...landmarks.map(location=>Math.hypot(x-location.x,z-location.z)));
export const inForest = (x: number, z: number) => forests.some(f => ((x-f.x)/f.rx)**2 + ((z-f.z)/f.rz)**2 < 1);
export const bank = (x: number, z: number) => Math.abs(x - river(z));
export const clearing = (x: number, z: number) => Math.hypot((x+45)*0.85, z);
export const height = (x: number, z: number) => {
  if(inDen(z)||towerFloorAt(z)||caveAt(z)) return 0;
  const base = 1.7 + 1.3*Math.sin(x*.048)*Math.cos(z*.04) + .65*Math.sin((x+z)*.09);
  const ridge = hills.reduce((sum,h)=>sum+h.rise*Math.max(0,1-((x-h.x)**2+(z-h.z)**2)/h.radius**2)**2,0);
  const edge = Math.min(1, Math.max(0, (bank(x,z)-4)/8));
  const terrain=-.9+(base+.9+ridge)*edge;
  if(!aureliaReserved(x,z,7)) return terrain;
  const margin=Math.max(0,Math.abs(x-aurelia.cx)-aurelia.halfWidth,Math.abs(z-aurelia.cz)-aurelia.halfDepth);
  const t=Math.min(1,margin/7), blend=t*t*(3-2*t);
  return aurelia.elevation+(terrain-aurelia.elevation)*blend;
};
export const onBridge = (x: number,z: number) => bridges.some(b=>Math.abs(z-b.z)<2.03 && Math.abs(x-b.x)<13);
export const surface = (x: number,z: number) => onBridge(x,z) ? Math.max(height(x,z),1.6) : height(x,z);
export function walkable(x: number,z: number, obstacles: readonly {x:number;z:number;r:number}[]) {
  return Math.abs(x)<extent-1 && Math.abs(z)<extent-1 &&
    (bank(x,z)>7.8 || onBridge(x,z)) &&
    !bridges.some(b=>Math.abs(x-b.x)<12.6 && Math.abs(Math.abs(z-b.z)-2.45)<.42) && !obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.45);
}
export function randomSequence(seed: number) {
  return () => ((seed = (Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
}
