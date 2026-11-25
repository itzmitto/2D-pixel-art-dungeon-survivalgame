import { denWalkable } from './denLayout.ts';
import { legacyItem, type WeaponItem } from './itemInstances.ts';
import type { Drop } from './huntData.ts';
import { isWeaponId, rarity, type Rarity, type WeaponId } from './weapons.ts';
import { freshStats, maxHunterHealth, progression, statNames, type Hunter } from './progression.ts';
import { extent, spawn } from './layout.ts';

export const cellSize = 20;
export const cellsPerSide = extent * 2 / cellSize;
export const defaultSeed = 294;
export const saveKey = 'vonkje-wilderness-v1';
export type Position = { x: number; z: number; yaw: number };
export type Exploration = Hunter & { version: 1; seed: number; position: Position; discovered: number[];
  gold: number; fangs: number; armor: number;
  items: WeaponItem[]; selectedItem: string; slotItems: (string|null)[]; materials: Record<string,number>; potions:number; drops:Record<string,Drop>; returns:Record<string,number>; opened:string[];
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
      !('z' in position) || typeof position.z!=='number' || !Number.isFinite(position.z) || (Math.abs(position.z)>=extent&&!denWalkable(position.x,position.z)) ||
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
        typeof id==='string' && /^(wolf|dire|den|skeleton)-[a-z0-9-]+$/.test(id)))] : [];
    };
    const pending: Exploration['pending']={};
    const savedPending:unknown=Object.getOwnPropertyDescriptor(value,'pending')?.value;
    if(savedPending&&typeof savedPending==='object') for(const [id,point] of Object.entries(savedPending)){
      if(/^(wolf|dire|den|skeleton)-[a-z0-9-]+$/.test(id) && point && typeof point.x==='number' && Math.abs(point.x)<extent &&
        typeof point.z==='number' && (Math.abs(point.z)<extent||denWalkable(point.x,point.z))) pending[id]={x:point.x,z:point.z};
    }
    const storedArsenal:unknown=Object.getOwnPropertyDescriptor(value,'arsenal')?.value;
    const arsenal:WeaponId[]=[...new Set<WeaponId>(['longsword',...(Array.isArray(storedArsenal)?storedArsenal.filter(isWeaponId):[])])];
    const storedEquipped:unknown=Object.getOwnPropertyDescriptor(value,'equipped')?.value;
    const storedHotbar:unknown=Object.getOwnPropertyDescriptor(value,'hotbar')?.value;
    const hotbar=Array.from({length:9},(_,i)=>{
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
    const items:WeaponItem[]=[];
    const storedItems:unknown=Object.getOwnPropertyDescriptor(value,'items')?.value;
    if(Array.isArray(storedItems)) for(const item of storedItems){
      if(item&&typeof item.id==='string'&&/^[a-z0-9-]{1,70}$/.test(item.id)&&isWeaponId(item.type)&&
        typeof item.rarity==='string'&&Object.hasOwn(rarity,item.rarity)&&!items.some(existing=>existing.id===item.id)){
        items.push({id:item.id,type:item.type,rarity:item.rarity as Rarity});
        if(!arsenal.includes(item.type)) arsenal.push(item.type);
      }
    }
    for(const type of arsenal) if(!items.some(item=>item.type===type)) items.push(legacyItem(type));
    const storedSelection:unknown=Object.getOwnPropertyDescriptor(value,'selectedItem')?.value;
    const selectedItem=(items.find(item=>item.id===storedSelection&&item.type===equipped)??items.find(item=>item.type===equipped))?.id??'longsword';
    const storedSlots:unknown=Object.getOwnPropertyDescriptor(value,'slotItems')?.value;
    const slotItems=hotbar.map((type,i)=>{
      const itemId:unknown=Array.isArray(storedSlots)?storedSlots[i]:undefined;
      return (items.find(item=>item.id===itemId&&item.type===type)??items.find(item=>item.type===type))?.id??null;
    });
    const drops:Record<string,Drop>={};
    const storedDrops:unknown=Object.getOwnPropertyDescriptor(value,'drops')?.value;
    if(storedDrops&&typeof storedDrops==='object') for(const [id,drop] of Object.entries(storedDrops)){
      if(!Object.hasOwn(pending,id)||!drop||typeof drop.material!=='string'||!Object.hasOwn(rarity,drop.rarity)||
        !Number.isSafeInteger(drop.gold)||drop.gold<0||drop.gold>1000) continue;
      drops[id]={gold:drop.gold,material:drop.material.slice(0,40),rarity:drop.rarity,weapon:isWeaponId(drop.weapon)?drop.weapon:undefined,
        potion:drop.potion===1?1:0};
    }
    const counts=(key:string)=>{
      const record:Record<string,number>={};
      const raw:unknown=Object.getOwnPropertyDescriptor(value,key)?.value;
      if(raw&&typeof raw==='object') for(const [id,amount] of Object.entries(raw)){
        if(/^[a-zA-Z0-9 -]{1,48}$/.test(id)&&typeof amount==='number'&&Number.isSafeInteger(amount)&&amount>=0)
          record[id]=amount;
      }
      return record;
    };
    const savedHealth:unknown=Object.getOwnPropertyDescriptor(value,'health')?.value;
    const boundHealth=maxHunterHealth({level,stats});
    return {version:1,seed,arsenal,equipped,hotbar,items,selectedItem,slotItems,drops,opened:namedIds('opened'),
      returns:counts('returns'),materials:counts('materials'),potions:integer('potions',0,0,100000),position:{x:position.x,z:position.z,yaw:position.yaw},discovered:[...new Set(known)],
      health:typeof savedHealth==='number'&&Number.isFinite(savedHealth)&&savedHealth>=0?Math.min(boundHealth,savedHealth):boundHealth,level,stats,
      armor:integer('armor',0,0,25),statPoints:integer('statPoints',budget,0,budget),
      kills:integer('kills',ids('defeated').length,0,1e9),
      completedDungeons:namedIds('completedDungeons'),defeatedBosses:namedIds('defeatedBosses'),
      xp:integer('xp',0,0,6e6),gold:integer('gold',0,0,1e9),fangs:integer('fangs',0,0,1e9),
      defeated:ids('defeated'),collected:ids('collected'),pending};
  } catch { return null; }
}

export function newExploration(): Exploration {
  return {version:1,seed:defaultSeed,arsenal:['longsword'],items:[legacyItem('longsword')],selectedItem:'longsword',slotItems:['longsword',null,null,null,null,null,null,null,null],materials:{},potions:0,drops:{},returns:{},opened:[],equipped:'longsword',hotbar:['longsword',null,null,null,null,null,null,null,null],position:{...spawn,yaw:0},discovered:[],health:progression.baseHealth,level:1,stats:freshStats(),statPoints:0,kills:0,armor:0,completedDungeons:[],defeatedBosses:[],xp:0,gold:0,fangs:0,defeated:[],collected:[],pending:{}};
}
