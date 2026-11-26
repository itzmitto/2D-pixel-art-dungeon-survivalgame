type Point = readonly [number, number];

export const highlands = {
  id: 'elaris', name: 'Elaris Highlands', difficulty: 'Levels 15–30',
  south: -240, north: -460, color: '#192941', fog: .0135,
  road: [[-27,-205],[-27,-240],[-17,-269],[21,-298],[21,-329],[38,-354],[25,-381],[5,-385],[4,-402],[-14,-413],[-20,-460]] as readonly Point[],
} as const;

export const frontierAt = (z: number) => z < highlands.south && z > highlands.north ? highlands : undefined;
export const frontierBounds = (x: number, z: number) => Math.abs(x) < 109 && !!frontierAt(z);
export const outdoorBounds = (x: number, z: number) => (Math.abs(x)<240 && Math.abs(z)<240) || frontierBounds(x,z) ||
  (z===-240 && Math.abs(x)<109);
export const fallsX = (z:number) => 20 + 8*Math.sin((z+298)*.061);
export const highlandRiver = (x:number,z:number) => z < -279 && z > -349 && Math.abs(x-fallsX(z)) < 4.9;
export const highlandBridge = (x:number,z:number) => Math.abs(x-21)<3.5 && z<=-285 && z>=-342;
export const waterfall = {x:fallsX(-349),z:-349};

export function routeDistance(x:number,z:number,route:readonly Point[]){
  let distance=Infinity;
  for(let i=1;i<route.length;i++){
    const [a,b]=route[i-1], [c,d]=route[i], dx=c-a,dz=d-b;
    const t=Math.max(0,Math.min(1,((x-a)*dx+(z-b)*dz)/(dx*dx+dz*dz)));
    distance=Math.min(distance,Math.hypot(x-a-t*dx,z-b-t*dz));
  }
  return distance;
}

const peaks = [[-84,-287,37,43],[82,-295,42,54],[-72,-367,51,58],[84,-407,53,57],[-83,-441,39,42]] as const;
export function frontierHeight(x:number,z:number,seam:number,deck=false){
  const road=routeDistance(x,z,highlands.road);
  const detail=Math.sin(x*.26+z*.18)*Math.cos(z*.31)*.8;
  const shelf=5+1.25*Math.sin((z+245)*.045)+.8*Math.cos(x*.045);
  const bulk=peaks.reduce((sum,[a,b,r,h])=>{
    const weight=Math.max(0,1-Math.hypot((x-a)*.92,z-b)/r);
    return sum+h*weight**1.18;
  },0);
  const roughness=Math.min(1,Math.max(0,(road-5)/12));
  const riverFade=Math.max(0,1-Math.abs(x-fallsX(z))/8)*Math.max(0,Math.min(1,(-279-z)/5,(z+349)/4));
  const blend=Math.max(0,Math.min(1,(-240-z)/24));
  return seam+(shelf+roughness*(detail+bulk)-(deck?0:riverFade*3.3)-seam)*blend;
}
export const frontierCrossing=(x:number,z:number)=>highlandBridge(x,z);
export const frontierBlocked=(x:number,z:number)=>highlandRiver(x,z)&&!highlandBridge(x,z);

export const fortress={id:'forsaken-fortress',name:'Forsaken Fortress',kind:'briar',x:25,z:-387,boss:'tower-ancient-titan'} as const;
export const frontierLandmarks=[
  {name:'Elaris Pass',kind:'explore',x:-27,z:-243},
  {name:'Moonfall Aqueduct',kind:'bridge',x:21,z:-314},
  {name:'Moonfall Cascade',kind:'explore',...waterfall},
  {name:'Slatefang Camp',kind:'camp',x:-24,z:-364},
  {name:'Crownroad Outpost',kind:'ruin',x:53,z:-376},
  {name:'Frostpine Road',kind:'explore',x:-17,z:-269},
  {name:'Crownroad Pass',kind:'explore',x:-14,z:-413},
  fortress,
] as const;
export const frontierStones=[
  {id:'frostpine',name:'Frostpine Waystone',x:-26,z:-274,yaw:0},
  {id:'crownroad',name:'Crownroad Waystone',x:-5,z:-410,yaw:0},
] as const;

export const frontierCamps=[
  {id:'orc-slatefang-troll',kind:'mountainTroll',x:-24,z:-364},
  {id:'orc-slatefang-golem',kind:'stoneGolem',x:-28,z:-369},
  {id:'orc-slatefang-guard',kind:'cursedKnight',x:-18,z:-367},
  {id:'orc-crownroad-guard',kind:'cursedKnight',x:53,z:-376},
  {id:'orc-crownroad-golem',kind:'stoneGolem',x:55,z:-384},
] as const;
