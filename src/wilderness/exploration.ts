import { isWeaponId, type WeaponId } from './weapons.ts';
import { freshStats, maxHunterHealth, progression, statNames, type Hunter } from './progression.ts';
import { extent, spawn } from './layout.ts';

export const cellSize = 20;
export const cellsPerSide = extent * 2 / cellSize;
export const defaultSeed = 294;
export const saveKey = 'vonkje-wilderness-v1';
export type Position = { x: number; z: number; yaw: number };
export type Exploration = Hunter & { version: 1; seed: number; position: Position; discovered: number[];
  gold: number; fangs: number; armor: number;
  arsenal: WeaponId[]; equipped: WeaponId; hotbar: (WeaponId|null)[];
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
    const storedArsenal:unknown=Object.getOwnPropertyDescriptor(value,'arsenal')?.value;
    const arsenal:WeaponId[]=[...new Set<WeaponId>(['longsword',...(Array.isArray(storedArsenal)?storedArsenal.filter(isWeaponId):[])])];
    const storedEquipped:unknown=Object.getOwnPropertyDescriptor(value,'equipped')?.value;
    const storedHotbar:unknown=Object.getOwnPropertyDescriptor(value,'hotbar')?.value;
    const hotbar=Array.from({length:5},(_,i)=>{
      const id:unknown=Array.isArray(storedHotbar)?storedHotbar[i]:i===0?'longsword':null;
      return isWeaponId(id)&&arsenal.includes(id)?id:null;
    });
    const equipped=isWeaponId(storedEquipped)&&arsenal.includes(storedEquipped)?storedEquipped:'longsword';
    const level=integer('level',1,1,1e5);
    const stats=freshStats();
    const storedStats:unknown=Object.getOwnPropertyDescriptor(value,'stats')?.value;
    let budget=(level-1)*progression.pointsPerLevel;
    if(storedStats&&typeof storedStats==='object') for(const key of statNames){
      const count:unknown=Object.getOwnPropertyDescriptor(storedStats,key)?.value;
      if(typeof count==='number'&&Number.isSafeInteger(count)&&count>=0){
        stats[key]=Math.min(budget,count,progression.statCap);
        budget-=stats[key];
      }
    }
    const namedIds=(key:string)=>{
      const list:unknown=Object.getOwnPropertyDescriptor(value,key)?.value;
      return Array.isArray(list)?[...new Set(list.filter((id:unknown):id is string=>
        typeof id==='string'&&/^[a-z0-9-]{1,48}$/.test(id)))]:[];
    };
    return {version:1,seed,arsenal,equipped,hotbar,position:{x:position.x,z:position.z,yaw:position.yaw},discovered:[...new Set(known)],
      health:integer('health',maxHunterHealth({level,stats}),0,maxHunterHealth({level,stats})),level,stats,
      armor:integer('armor',0,0,25),statPoints:integer('statPoints',budget,0,budget),
      kills:integer('kills',ids('defeated').length,0,1e9),
      completedDungeons:namedIds('completedDungeons'),defeatedBosses:namedIds('defeatedBosses'),
      xp:integer('xp',0,0,6e6),gold:integer('gold',0,0,1e9),fangs:integer('fangs',0,0,1e9),
      defeated:ids('defeated'),collected:ids('collected'),pending};
  } catch { return null; }
}

export function newExploration(): Exploration {
  return {version:1,seed:defaultSeed,arsenal:['longsword'],equipped:'longsword',hotbar:['longsword',null,null,null,null],position:{...spawn,yaw:0},discovered:[],health:progression.baseHealth,level:1,stats:freshStats(),statPoints:0,kills:0,armor:0,completedDungeons:[],defeatedBosses:[],xp:0,gold:0,fangs:0,defeated:[],collected:[],pending:{}};
}
