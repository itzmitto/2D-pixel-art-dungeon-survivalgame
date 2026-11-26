export const aurelia={id:'aurelia',name:'Aurelia Capital',kind:'capital',x:-27,z:-36,cx:-27,cz:-60,halfWidth:26,halfDepth:24,elevation:1.9} as const;
export const aureliaPlaces=[
  {id:'aurelia-tree',name:'Golden Tree',kind:'capitalService',x:-27,z:-59},
  {id:'merchant',name:'Mira · Merchant',kind:'capitalService',x:-40,z:-51.3},
  {id:'smith',name:'Doran · Blacksmith',kind:'capitalService',x:-13.2,z:-53},
  {id:'guild',name:'Hunter Guild',kind:'capitalService',x:-27,z:-72},
] as const;
export type AureliaService='merchant'|'smith'|'guild';
export const aureliaServices=aureliaPlaces.filter((place):place is Exclude<typeof aureliaPlaces[number],{id:'aurelia-tree'}>=>place.id!=='aurelia-tree');
export const inAurelia=(x:number,z:number)=>Math.abs(x-aurelia.cx)<aurelia.halfWidth+.6&&Math.abs(z-aurelia.cz)<aurelia.halfDepth+.6;
export const aureliaReserved=(x:number,z:number,padding=0)=>
  Math.abs(x-aurelia.cx)<aurelia.halfWidth+padding&&Math.abs(z-aurelia.cz)<aurelia.halfDepth+padding;
export const aureliaRoad=[[-42,2],[-36,-12],[-30,-23],[-27,-36],[-27,-72]] as const;
export const aureliaBuildings=[
  {x:-44,z:-48,w:8,d:8,h:4.7,kind:'house'},{x:-44,z:-64,w:8,d:8,h:5.05,kind:'house'},
  {x:-12,z:-47,w:8,d:8,h:4.7,kind:'smith'},{x:-10,z:-66,w:9,d:8,h:4.8,kind:'house'},
  {x:-27,z:-77,w:15,d:7,h:6.3,kind:'guild'},
] as const;
