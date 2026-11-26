export const waystones=[
  {id:'ember',name:'Ember Waystone',x:-37,z:7,yaw:0},
  {id:'raven',name:'Raven Waystone',x:-205,z:84,yaw:0},
  {id:'hollowmouth',name:'Hollowmouth Waystone',x:-207,z:-104,yaw:0},
  {id:'moonwatch',name:'Moonwatch Waystone',x:128,z:-84,yaw:0},
  {id:'southwater',name:'Southwater Waystone',x:54,z:119,yaw:0},
  {id:'crypt-road',name:'Crypt Road Waystone',x:-161,z:144,yaw:0},
  {id:'ember-ridge',name:'Ember Ridge Waystone',x:216,z:-95,yaw:0},
  {id:'lantern',name:'Lantern Waystone',x:165,z:112,yaw:0},
] as const;
export const orcCamp={name:'Thornhide Camp',x:113,z:63,kind:'orcCamp',chest:{x:113,z:54.8},
  guards:[
    {id:'orc-brute-west',kind:'brute',x:108,z:63},
    {id:'orc-brute-east',kind:'brute',x:118,z:61},
    {id:'orc-assassin-south',kind:'assassin',x:115,z:70},
    {id:'orc-assassin-north',kind:'assassin',x:113,z:58},
  ],
} as const;
export const orcApproach=[[121,106],[117,88],[113,75],[113,65]] as const;
export const ritualGrounds={name:'Forgotten Ritual Grounds',x:139,z:-63,kind:'ritual',chest:{x:141,z:-71.5},
  guards:[
    {id:'ritual-wizard-west',kind:'wizard',x:133,z:-63},
    {id:'ritual-wizard-east',kind:'wizard',x:146,z:-65},
    {id:'ritual-skeleton-west',kind:'skeleton',x:136,z:-57},
    {id:'ritual-skeleton-east',kind:'skeleton',x:145,z:-57},
    {id:'ritual-elite',kind:'ritualElite',x:139,z:-68},
  ],
} as const;

export const explorationSites=[
  {id:'ashen-procession',name:'Ashen Procession',x:-73,z:-57,style:'statues',dx:3.1,dz:2.5},
  {id:'mossveil-wagon',name:'Mossveil Wagon',x:-150,z:97,style:'wagon',dx:2.8,dz:2.15},
  {id:'gloamcap-hollow',name:'Gloamcap Hollow',x:84,z:97,style:'mushrooms',dx:2.57,dz:1.6},
  {id:'broken-reliquary',name:'Broken Reliquary',x:127,z:-134,style:'ruin',dx:2.7,dz:2.2},
  {id:'pilgrim-graves',name:'Pilgrim Graves',x:-136,z:-139,style:'graves',dx:2.66,dz:2.38},
  {id:'lost-forester-camp',name:'Lost Forester Camp',x:128,z:146,style:'camp',dx:2.7,dz:2.3},
  {id:'thornhide-armory',name:'Thornhide Armory',x:124,z:63.4,style:'rack',dx:2.7,dz:1.72},
  {id:'veil-pilgrim',name:'Veil Pilgrim Stones',x:147.8,z:-55,style:'crystals',dx:2.52,dz:1.78},
  {id:'rime-forecamp',name:'Rime Forecamp',x:161,z:175,style:'camp',dx:2.72,dz:2.03},
  {id:'gravespur-cairn',name:'Gravespur Cairn',x:198,z:-175,style:'graves',dx:-2.9,dz:2.05},
] as const;
export const explorationTrails=[
  [[-120,-40],[-104,-48],[-88,-53],[-73,-57]],
  [[141,119],[137,128],[133,138],[128,146]],
  [[-164,106],[-157,102],[-150,97]],
] as const;
