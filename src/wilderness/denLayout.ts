export const den = {
  id:'hollow-fang-den', name:'Hollow Fang Den', rank:'E', level:5, boss:'den-guardian',
  gate:{x:-187,z:-114}, entry:{x:0,z:383}, exit:{x:0,z:385},
  chambers:[
    {x:0,z:378,w:14,d:19},
    {x:0,z:363,w:6,d:16},
    {x:0,z:349,w:23,d:19},
    {x:9,z:349,w:18,d:6},
    {x:20,z:349,w:9,d:12},
    {x:0,z:335,w:7,d:15},
    {x:0,z:318,w:34,d:23},
  ],
  encounters:[
    {id:'den-wolf-a',kind:'wild',x:-4,z:376},
    {id:'den-wolf-b',kind:'wild',x:-7,z:352},
    {id:'den-dire',kind:'dire',x:5,z:347},
    {id:'den-guardian',kind:'guardian',x:0,z:315},
  ],
} as const;
export const inDen=(z:number)=>z>280;
export const denWalkable=(x:number,z:number)=>den.chambers.some(room=>
  Math.abs(x-room.x)<room.w/2&&Math.abs(z-room.z)<room.d/2);
