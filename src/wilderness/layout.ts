export const extent = 180;
export const spawn = { x: -43, z: 4 };
export const landmarks = [
  { name: 'Ember Clearing', x: -45, z: 0 },
  { name: 'Blackwater Crossing', x: 32, z: 0 },
  { name: 'Moonwatch Ruin', x: 112, z: -96 },
  { name: 'The Standing Stones', x: -117, z: 79 },
];
export const forests = [
  { x: -100, z: -89, rx: 70, rz: 53 },
  { x: -103, z: 108, rx: 63, rz: 52 },
  { x: 112, z: 75, rx: 59, rz: 64 },
  { x: 109, z: -119, rx: 56, rz: 39 },
];
export const river = (z: number) => 32 + 11 * Math.sin(z / 34);
export const path = (x: number) => x >= 45 ? Math.max(-169, -(x - 45) * 1.43 + 4 * Math.sin((x - 45) / 25))
  : x >= 19 ? 0 : 5 * Math.sin((x - 19) / 30);
export const inForest = (x: number, z: number) => forests.some(f => ((x-f.x)/f.rx)**2 + ((z-f.z)/f.rz)**2 < 1);
export const bank = (x: number, z: number) => Math.abs(x - river(z));
export const clearing = (x: number, z: number) => Math.hypot((x+45)*0.85, z);
export const height = (x: number, z: number) => {
  const hills = 1.7 + 1.3*Math.sin(x*.048)*Math.cos(z*.04) + .65*Math.sin((x+z)*.09);
  const edge = Math.min(1, Math.max(0, (bank(x,z)-4)/8));
  return -.9 + (hills+.9)*edge;
};
export const onBridge = (x: number,z: number) => Math.abs(z)<2.03 && Math.abs(x-32)<13;
export const surface = (x: number,z: number) => onBridge(x,z) ? Math.max(height(x,z),1.6) : height(x,z);
export function walkable(x: number,z: number, obstacles: readonly {x:number;z:number;r:number}[]) {
  return Math.abs(x)<extent-1 && Math.abs(z)<extent-1 &&
    (bank(x,z)>7.8 || onBridge(x,z)) &&
    !(Math.abs(x-32)<12.6 && Math.abs(Math.abs(z)-2.45)<.42) && !obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.45);
}
export function randomSequence(seed: number) {
  return () => ((seed = (Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
}
