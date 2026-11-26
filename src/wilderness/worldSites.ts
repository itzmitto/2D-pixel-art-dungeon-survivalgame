export const waystones=[
  {id:'ember',name:'Ember Waystone',x:-37,z:7,yaw:0},
  {id:'raven',name:'Raven Waystone',x:-205,z:84,yaw:0},
  {id:'hollowmouth',name:'Hollowmouth Waystone',x:-207,z:-104,yaw:0},
  {id:'moonwatch',name:'Moonwatch Waystone',x:128,z:-84,yaw:0},
  {id:'southwater',name:'Southwater Waystone',x:54,z:119,yaw:0},
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
