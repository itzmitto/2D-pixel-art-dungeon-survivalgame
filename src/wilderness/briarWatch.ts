import type { MonsterKind } from './huntData.ts';

type Room={x:number;z:number;w:number;d:number};
type Guard={id:string;kind:MonsterKind;x:number;z:number;elite?:boolean};
export const briarWatch={id:'briar-watch',name:'Briar Watch',kind:'briar',x:-111,z:-81,boss:'tower-sentinel'} as const;
const baselines=[
  {title:'Gate Hall',rooms:[{x:0,z:0,w:18,d:29},{x:8,z:-2,w:13,d:13}],
    guards:[['wild',-5,6],['wild',5,4],['skeleton',-5,-3],['skeleton',9,-3]]},
  {title:'Cloister',rooms:[{x:0,z:8,w:24,d:14},{x:-8,z:-1,w:8,d:15},{x:8,z:-1,w:8,d:15},{x:0,z:-10,w:24,d:13}],
    guards:[['skeleton',-7,7],['skeleton',7,-1],['assassin',-7,-7],['assassin',7,-11]]},
  {title:'War Gallery',rooms:[{x:0,z:0,w:27,d:31},{x:-14,z:-3,w:8,d:12}],
    guards:[['brute',-8,5],['brute',7,-5],['assassin',-12,-5],['assassin',8,7]]},
  {title:'Veil Library',rooms:[{x:0,z:0,w:12,d:31},{x:-9,z:-3,w:15,d:17},{x:9,z:-3,w:15,d:17}],
    guards:[['wizard',-10,2],['wizard',10,-4],['skeleton',-9,-6,true],['assassin',5,-10,true]]},
  {title:'Sentinel Sanctum',rooms:[{x:0,z:0,w:32,d:32}],
    guards:[['sentinel',0,-5]]},
] satisfies {title:string;rooms:Room[];guards:[MonsterKind,number,number,boolean?][]}[];

export const towerFloors=baselines.map((floor,index)=>{
  const z=447+index*91,number=index+1;
  return {
    number,title:floor.title,z,rooms:floor.rooms.map(room=>({...room,z:room.z+z})),
    entry:{x:0,z:z+11.6},exit:{x:0,z:z+13.8},stairs:{x:0,z:z-12.3},
    guards:floor.guards.map(([kind,x,dz,elite],i):Guard=>({
      id:kind==='sentinel'?briarWatch.boss:'tower-'+number+'-'+i,kind,x,z:z+dz,elite,
    })),
  };
});
export const towerFloorAt=(z:number)=>towerFloors.find(floor=>Math.abs(z-floor.z)<21);
export const towerWalkable=(x:number,z:number)=>Boolean(towerFloorAt(z)?.rooms.some(room=>
  Math.abs(x-room.x)<room.w/2&&Math.abs(z-room.z)<room.d/2));
export const floorRemaining=(floor:typeof towerFloors[number],defeated:readonly string[])=>
  floor.guards.reduce((count,guard)=>count+Number(!defeated.includes(guard.id)),0);
