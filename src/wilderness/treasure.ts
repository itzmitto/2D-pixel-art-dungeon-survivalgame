import * as T from 'three';
import { surface, randomSequence } from './layout.ts';
import { loft, shapedPlate, joint, meshPart } from './creatureGeometry.ts';
import { rarity, type Rarity, type WeaponId } from './weapons.ts';
import { rarityOrder } from './huntData.ts';

export type Chest={id:string;x:number;z:number;rarity:Rarity;weapon:WeaponId;gold:number;armor:number;boss?:string;guardian?:string};
export const worldChests:Chest[]=[
  {id:'ember-cache',x:-52,z:3,rarity:'Common',weapon:'shield',gold:8,armor:1},
  {id:'raven-cache',x:-189,z:62,rarity:'Uncommon',weapon:'axe',gold:14,armor:2},
  {id:'ruin-cache',x:111,z:-90,rarity:'Rare',weapon:'staff',gold:22,armor:3},
  {id:'greyfen-cache',x:169,z:-160,rarity:'Epic',weapon:'greatsword',gold:32,armor:4},
  {id:'gravespur-cache',x:207,z:-181,rarity:'Mythic',weapon:'katana',gold:156,armor:8,guardian:'elite-gravefang'},
];
export function chestBonus(chest:Chest,seed:number){
  let key=seed;
  for(const char of chest.id) key=Math.imul(key^char.charCodeAt(0),16777619);
  const random=randomSequence(key),tier=rarityOrder.indexOf(chest.rarity);
  const extras=['Iron','Bones','Goblin Hide','Magic Crystal'];
  return {material:extras[Math.floor(random()*(tier<2?2:extras.length))],
    count:1+Math.floor(random()*(tier+1)),potions:1+Math.floor(tier/2)};
}

// Sample the front-to-back lid profile. Bands share the same arc and pivot.
function archedLid(width:number,height:number,depth:number,detail:number,strip=false){
  const profile:(readonly [number,number,number,number])[]=Array.from({length:detail+1},(_,i)=>{
    const t=i/detail;
    const arch=.065 + Math.sin(t*Math.PI)**.78*height;
    return [t*depth,width,strip?arch-.042:.018,arch];
  });
  // A box-like ring has a genuinely flat bottom, vertical edge boards and a rounded vault.
  const p:number[]=[],tri:number[]=[];
  profile.forEach(([z,w,y,h])=>p.push(-w,y,z,w,y,z,w,h,z,-w,h,z));
  for(let i=0;i<profile.length-1;i++) for(let j=0;j<4;j++){
    const a=i*4+j,b=i*4+(j+1)%4;
    tri.push(a,b,a+4,b,b+4,a+4);
  }
  const end=(profile.length-1)*4;
  tri.push(0,2,1,0,3,2,end,end+1,end+2,end,end+2,end+3);
  const indexed=new T.BufferGeometry();
  indexed.setAttribute('position',new T.Float32BufferAttribute(p,3));indexed.setIndex(tri);
  const geometry=indexed.toNonIndexed();indexed.dispose();geometry.computeVertexNormals();
  return geometry;
}

export function chestModels(group:T.Group,chests:readonly Chest[],opened:readonly string[]){
  const beam=new T.CylinderGeometry(.055,.17,1.28,8,1,true);
  const bulk=loft([[-.57,.70,.14,.52],[-.50,.78,.07,.60],[.47,.78,.07,.60],[.55,.70,.14,.54]],8);
  const panel=shapedPlate([[-.70,.08],[-.749,.22],[-.706,.57],[.702,.57],[.749,.22],[.70,.08]],.06,.027);
  const saddle=shapedPlate([[-.10,.037],[-.108,.50],[-.077,.585],[.078,.585],[.108,.50],[.10,.037],[.05,.01],[-.05,.01]],.071,.017);
  const corner=shapedPlate([[-.10,0],[.11,0],[.106,.075],[-.015,.075],[-.015,.213],[-.10,.213]],.051,.016);
  const lock=shapedPlate([[-.10,-.08],[-.133,.01],[-.092,.12],[.09,.12],[.133,.01],[.097,-.08],[0,-.12]],.071,.019);
  const keyhole=shapedPlate([[-.019,-.061],[-.009,-.018],[-.029,.01],[-.018,.037],[.018,.037],[.028,.01],[.01,-.018],[.021,-.061]],.012,0);
  const rivet=new T.IcosahedronGeometry(.034,0);
  const hinge=new T.CylinderGeometry(.066,.066,.24,8).rotateZ(Math.PI/2);
  const jewel=new T.OctahedronGeometry(.091);
  const rune=shapedPlate([[0,.105],[-.042,.012],[-.008,-.069],[.055,.017],[.011,.012]],.012,0);
  const foot=shapedPlate([[-.14,-.055],[-.151,.06],[.132,.056],[.12,-.031],[.015,-.071]],.14,.023);
  const floor=new T.BoxGeometry(1.36,.041,.91);
  const wall=new T.BoxGeometry(1,1,1);
  const stem=new T.CylinderGeometry(.13,.10,.058,9).rotateX(Math.PI/2);
  const dark=new T.MeshStandardMaterial({color:0x1b1718,roughness:.97});
  const coin=new T.MeshStandardMaterial({color:0xe2b55e,metalness:.71,roughness:.36});
  const catalog=[
    [0x563b2b,0x55575b,.155,5],
    [0x654635,0x867650,.205,7],
    [0x34434e,0xa0b9c7,.248,7],
    [0x503d55,0x978192,.30,8],
    [0x69422a,0xd4a750,.32,9],
    [0x302c39,0x705460,.26,8],
  ] as const;
  const styles=catalog.map(([body,metal,height,detail],tier)=>{
    const own=new T.MeshStandardMaterial({color:body,roughness:tier===5?.56:.86,metalness:tier===5?.51:.09,flatShading:true});
    const trim=new T.MeshStandardMaterial({color:metal,roughness:.40,metalness:.68});
    const magic=new T.MeshStandardMaterial({color:rarity[rarityOrder[tier]].color,roughness:.37,metalness:.27,
      emissive:rarity[rarityOrder[tier]].color,emissiveIntensity:tier<2?0:.34});
    return {own,trim,magic,lid:archedLid(.775,height,1.11,detail),band:archedLid(.068,height+.025,1.125,detail,true)};
  });
  const holders=chests.map(chest=>{
    const tier=rarityOrder.indexOf(chest.rarity),style=styles[tier];
    const root=new T.Group(),lid=joint(root,0,.589,-.56);
    root.name=chest.id;
    root.position.set(chest.x,surface(chest.x,chest.z),chest.z);
    meshPart(root,bulk,style.own,0,-.08,0).scale.y=.21;
    meshPart(root,floor,dark,0,.145,0);
    for(const side of [-1,1]){
      meshPart(root,panel,style.own,0,0,side*.476);
      meshPart(root,wall,style.own,side*.699,.315,0).scale.set(.117,.478,.975);
      for(const x of [-.49,.49]){
        const band=meshPart(root,saddle,style.trim,x,0,side*.518);
        if(side<0) band.rotation.y=Math.PI;
        for(const y of [.185,.437]) meshPart(root,rivet,style.trim,x,y,side*.594);
      }
      for(const x of [-.64,.64]){
        const cap=meshPart(root,corner,style.trim,x,.08,side*.566);
        cap.scale.x=x<0?1:-1;
        meshPart(root,foot,style.trim,x,.066,side*.364);
        if(tier>=1) meshPart(root,corner,style.trim,x,.551,side*.566).scale.set(x<0?1:-1,-1,1);
      }
      if(tier>=2) for(let i=0;i<tier-1;i++){
        const x=(i-(tier-2)/2)*.155;
        if(Math.abs(x)<.09) continue;
        meshPart(root,rune,style.magic,x,.32,side*.561).scale.setScalar(tier===5?.92:.66);
      }
    }
    meshPart(lid,style.lid,style.own);
    for(const x of tier>=4?[-.53,0,.53]:[-.49,.49]) meshPart(lid,style.band,style.trim,x);
    for(const x of [-.46,.46]) meshPart(lid,hinge,style.trim,x,.013,-.018);
    const escutcheon=meshPart(lid,lock,style.trim,0,.018,1.11);
    escutcheon.scale.setScalar(1+tier*.07);
    meshPart(lid,keyhole,dark,0,.017,1.207);
    if(tier>=2) meshPart(lid,jewel,style.magic,0,.174,1.13).scale.setScalar(tier<4?.76:1);
    if(tier>=3) for(const side of [-1,1]){
      meshPart(lid,jewel,style.magic,side*.31,.14,1.04).scale.setScalar(.65);
      if(tier>=4){
        const fin=meshPart(lid,corner,style.trim,side*.69,.12,.93);
        fin.rotation.z=side*.29;fin.scale.setScalar(tier===5?1.45:1.16);
      }
    }
    if(tier===5) for(const side of [-1,1]){
      meshPart(lid,rune,style.magic,side*.28,.12,1.101).scale.setScalar(1.22);
      meshPart(lid,jewel,style.magic,side*.68,.17,.50).scale.set(.93,1.33,.86);
    }
    const reveal=joint(root,0,.24,0);
    for(const [x,z,angle] of [[-.26,.06,.15],[.04,-.10,.64],[.20,.17,.74],[-.09,.17,.08]]){
      meshPart(reveal,stem,coin,x,.05,z).rotation.x=angle+Math.PI/2;
    }
    meshPart(reveal,jewel,style.magic,.17,.13,-.18).scale.set(1.2,1.7,1.2);
    const shine=new T.Mesh(beam,new T.MeshBasicMaterial({color:rarity[chest.rarity].color,transparent:true,opacity:.24,depthWrite:false}));
    shine.position.y=1.48;root.add(shine);group.add(root);
    const isOpen=opened.includes(chest.id);
    lid.rotation.x=isOpen?-1.48:0;
    reveal.visible=false;shine.visible=false;
    return {chest,root,lid,shine,reveal,isOpen,opening:0,tier};
  });
  return {
    update(dt:number,bosses:readonly string[],openedIds:readonly string[],defeated:readonly string[]=[]){
      for(const holder of holders){
        holder.root.visible=(!holder.chest.boss||bosses.includes(holder.chest.boss))&&
          (!holder.chest.guardian||defeated.includes(holder.chest.guardian));
        const nowOpen=openedIds.includes(holder.chest.id);
        if(nowOpen&&!holder.isOpen) holder.opening=2.65;
        holder.isOpen=nowOpen;
        holder.opening=Math.max(0,holder.opening-dt);
        holder.lid.rotation.x=T.MathUtils.damp(holder.lid.rotation.x,nowOpen?-1.48:0,7,dt);
        holder.reveal.visible=holder.opening>0;
        holder.reveal.position.y=.22+Math.min(1.0,(2.65-holder.opening)*.87);
        holder.shine.visible=holder.root.visible&&holder.tier>=2&&(!nowOpen||holder.opening>0);
        holder.shine.material.opacity=holder.opening>0?Math.min(.47,holder.opening*.24):.16;
      }
    },
    dispose(){
      for(const resource of [beam,bulk,panel,saddle,corner,lock,keyhole,rivet,hinge,jewel,rune,foot,floor,wall,stem,dark,coin]) resource.dispose();
      for(const {own,trim,magic,lid,band} of styles){own.dispose();trim.dispose();magic.dispose();lid.dispose();band.dispose();}
      for(const holder of holders) holder.shine.material.dispose();
    },
  };
}
