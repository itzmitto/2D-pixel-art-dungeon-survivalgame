export const rarity = {
  Common:{color:'#b6b8bc', multiplier:1}, Uncommon:{color:'#91b979', multiplier:1.2},
  Rare:{color:'#89b5e7', multiplier:1.5}, Epic:{color:'#c19bdc', multiplier:1.9},
  Legendary:{color:'#e9bd6f', multiplier:2.5}, Mythic:{color:'#ea9184', multiplier:3.2},
} as const;
export type Rarity = keyof typeof rarity;
export type WeaponId = 'longsword'|'greatsword'|'axe'|'staff'|'shield'|'katana';
export type Element = 'Steel'|'Fire'|'Lightning'|'Ice'|'Water'|'Wind';
export type Ability = 'fire'|'lightning'|'ice'|'water'|'wind';
type Pose = readonly [torso:number, shoulder:number, arm:number, lift:number, elbow:number, wrist:number, pitch:number, roll:number];
export interface Weapon {
  id:WeaponId; name:string; description:string; element:Element; category:string;
  damage:number; range:number; reachAngle:number; cooldown:number; attackDuration:number; impactTime:number;
  ability:Ability|null; abilityName:string; abilityCooldown:number; rarity:Rarity; color:number;
  model:{grip:number; twoHanded?:boolean; shield?:boolean};
  animation:{windup:Pose; strike:Pose};
}
const starterAnimation:Weapon['animation']={
  windup:[-.42,-.62,-.65,.64,-1.08,-.18,.98,1.5],
  strike:[.53,1.28,-1.13,.43,-.26,.28,1.6,2.4],
};
export const weapons:Record<WeaponId,Weapon>={
  longsword:{id:'longsword',name:'Longsword',description:'A reliable steel blade.',category:'Sword',element:'Steel',
    damage:3,range:2.9,reachAngle:1.05,cooldown:.78,attackDuration:.73,impactTime:.32,ability:null,
    abilityName:'',abilityCooldown:0,rarity:'Common',color:0xd9cfb8,model:{grip:-1.93},animation:starterAnimation},
  greatsword:{id:'greatsword',name:'Greatsword',description:'A slow, sweeping blade. A moving fire wave sets foes alight.',category:'Greatsword',element:'Fire',
    damage:5,range:3.65,reachAngle:1.34,cooldown:1.26,attackDuration:1.11,impactTime:.54,ability:'fire',
    abilityName:'Infernal Cleave',abilityCooldown:8,rarity:'Rare',color:0xf38a47,model:{grip:-1.83,twoHanded:true},
    animation:{windup:[-.63,-.82,-1.38,.32,-.85,-.26,1.68,2.08],strike:[.84,1.6,-1.17,.28,-.22,.69,1.43,2.78]}},
  axe:{id:'axe',name:'Battle Axe',description:'Heavy axe strikes. The ground strike chains lightning and briefly stuns.',category:'Battle Axe',element:'Lightning',
    damage:4,range:3.05,reachAngle:.95,cooldown:1.04,attackDuration:.91,impactTime:.46,ability:'lightning',
    abilityName:'Thunderstrike',abilityCooldown:10,rarity:'Uncommon',color:0xb4d9ff,model:{grip:-1.56,twoHanded:true},
    animation:{windup:[-.32,-.25,-2.36,.24,-.5,-.3,.35,1.69],strike:[.19,.37,-.86,.17,-.2,.1,2.12,1.68]}},
  staff:{id:'staff',name:'Magic Staff',description:'Hurls ice bolts. Frozen Domain damages, freezes, then slows enemies.',category:'Magic Staff',element:'Ice',
    damage:2,range:18,reachAngle:.18,cooldown:.93,attackDuration:.78,impactTime:.34,ability:'ice',
    abilityName:'Frozen Domain',abilityCooldown:12,rarity:'Rare',color:0xa2e0f1,model:{grip:-.28},
    animation:{windup:[-.17,-.3,-.65,.26,-1.12,-.3,.48,.15],strike:[.12,.18,-1.36,.0,-.25,.06,1.45,.22]}},
  shield:{id:'shield',name:'Sword & Shield',description:'A balanced sword with a left-arm shield. The water barrier absorbs damage.',category:'Sword & Shield',element:'Water',
    damage:3,range:2.7,reachAngle:.94,cooldown:.72,attackDuration:.66,impactTime:.28,ability:'water',
    abilityName:'Tidal Guardian',abilityCooldown:10,rarity:'Uncommon',color:0x689ddd,model:{grip:-1.89,shield:true},
    animation:{windup:[-.22,-.27,-.6,.63,-.76,-.3,.53,1.42],strike:[.31,.92,-.93,.15,-.37,.42,1.56,2.05]}},
  katana:{id:'katana',name:'Katana',description:'Quick cuts with short recovery. Gale Slash dashes and strikes ahead.',category:'Katana',element:'Wind',
    damage:2,range:2.8,reachAngle:1.12,cooldown:.50,attackDuration:.46,impactTime:.19,ability:'wind',
    abilityName:'Gale Slash',abilityCooldown:6,rarity:'Epic',color:0xc5e3ca,model:{grip:-1.93,twoHanded:true},
    animation:{windup:[-.65,-.45,-.28,.1,-.82,-.45,.15,1.34],strike:[.7,1.39,-1.11,.53,-.25,.64,1.48,2.98]}},
};
export const elementalIds=['greatsword','axe','staff','shield','katana'] as const;
export function isWeaponId(value:unknown):value is WeaponId {
  return typeof value==='string'&&Object.hasOwn(weapons,value);
}
export const weaponDamage=(weapon:Weapon)=>Math.round(weapon.damage*rarity[weapon.rarity].multiplier*10)/10;
