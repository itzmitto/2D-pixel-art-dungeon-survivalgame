import { maxHealth } from './combatRules.ts';
import { extent, spawn } from './layout.ts';

export const cellSize = 20;
export const cellsPerSide = extent * 2 / cellSize;
export const defaultSeed = 294;
export const saveKey = 'vonkje-wilderness-v1';
export type Position = { x: number; z: number; yaw: number };
export type Exploration = { version: 1; seed: number; position: Position; discovered: number[];
  health: number; level: number; xp: number; gold: number; fangs: number;
  defeated: string[]; collected: string[]; pending: Record<string,{x:number;z:number}>;
};

export function cellAt(x: number, z: number) {
  const col = Math.floor((x+extent)/cellSize), row = Math.floor((z+extent)/cellSize);
  return col < 0 || row < 0 || col >= cellsPerSide || row >= cellsPerSide ? -1 : row*cellsPerSide+col;
}

export function reveal(discovered: Set<number>, {x,z}: Position) {
  const radius = 35;
  for (let zz = z-radius; zz <= z+radius+cellSize; zz+=cellSize) {
    for (let xx = x-radius; xx <= x+radius+cellSize; xx+=cellSize) {
      const id = cellAt(xx,zz);
      if (id < 0) continue;
      const cx = -extent + (id%cellsPerSide+.5)*cellSize;
      const cz = -extent + (Math.floor(id/cellsPerSide)+.5)*cellSize;
      if (Math.hypot(cx-x,cz-z) <= radius || id===cellAt(x,z)) discovered.add(id);
    }
  }
}

export function readExploration(raw: string | null): Exploration | null {
  try {
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || !('version' in value) || value.version!==1 ||
      !('seed' in value) || typeof value.seed!=='number' || !Number.isInteger(value.seed) || value.seed<0 || value.seed>0xffffffff ||
      !('position' in value) || !value.position || typeof value.position!=='object' ||
      !('discovered' in value) || !Array.isArray(value.discovered)) return null;
    const {position,seed,discovered}=value;
    if (!('x' in position) || typeof position.x!=='number' || !Number.isFinite(position.x) || Math.abs(position.x)>=extent ||
      !('z' in position) || typeof position.z!=='number' || !Number.isFinite(position.z) || Math.abs(position.z)>=extent ||
      !('yaw' in position) || typeof position.yaw!=='number' || !Number.isFinite(position.yaw)) return null;
    const known=discovered.filter((id: unknown): id is number =>
      typeof id==='number' && Number.isInteger(id) && id>=0 && id<cellsPerSide**2);
    const integer=(key:string,fallback:number,min:number,max:number)=>{
      const number=Object.getOwnPropertyDescriptor(value,key)?.value as unknown;
      return typeof number==='number' && Number.isSafeInteger(number) && number>=min && number<=max ? number : fallback;
    };
    const ids=(key:string)=>{
      const list:unknown=Object.getOwnPropertyDescriptor(value,key)?.value;
      return Array.isArray(list) ? [...new Set(list.filter((id:unknown): id is string =>
        typeof id==='string' && /^wolf-[0-9]+$/.test(id)))] : [];
    };
    const pending: Exploration['pending']={};
    const drops:unknown=Object.getOwnPropertyDescriptor(value,'pending')?.value;
    if(drops&&typeof drops==='object') for(const [id,point] of Object.entries(drops)){
      if(/^wolf-[0-9]+$/.test(id) && point && typeof point.x==='number' && Math.abs(point.x)<extent &&
        typeof point.z==='number' && Math.abs(point.z)<extent) pending[id]={x:point.x,z:point.z};
    }
    return {version:1,seed,position:{x:position.x,z:position.z,yaw:position.yaw},discovered:[...new Set(known)],
      health:integer('health',maxHealth,0,maxHealth),level:integer('level',1,1,1e5),
      xp:integer('xp',0,0,6e6),gold:integer('gold',0,0,1e9),fangs:integer('fangs',0,0,1e9),
      defeated:ids('defeated'),collected:ids('collected'),pending};
  } catch { return null; }
}

export function newExploration(): Exploration {
  return {version:1,seed:defaultSeed,position:{...spawn,yaw:0},discovered:[],health:maxHealth,level:1,xp:0,gold:0,fangs:0,defeated:[],collected:[],pending:{}};
}
