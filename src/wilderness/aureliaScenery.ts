import * as T from 'three';
import { aurelia, aureliaBuildings, aureliaServices, inAurelia } from './aurelia.ts';
import { joint, loft, meshPart, rigidBatcher, shapedPlate } from './creatureGeometry.ts';
import { randomSequence } from './layout.ts';
import type { Obstacle } from './spatial.ts';

export function aureliaScenery(scene:T.Scene,obstacles:Obstacle[]){
  const root=new T.Group(),structures=new T.Group(),batch=rigidBatcher();
  root.add(structures);
  const y=aurelia.elevation;
  const mat=(color:number,roughness=.91)=>new T.MeshStandardMaterial({color,roughness});
  const granite=mat(0x80746d), mortar=mat(0x55474d), slate=mat(0x503d4b), plaster=mat(0x9c7a60);
  const wood=mat(0x594031), dark=mat(0x382a30), brass=mat(0xb38c55,.51), skin=mat(0xb47c60);
  const cloth=[mat(0x694052),mat(0x4b4d5b),mat(0x55336b),mat(0x48626d)];
  const glow=new T.MeshBasicMaterial({color:0xffbf73,toneMapped:false});
  const gold=new T.MeshStandardMaterial({color:0xdb9b43,emissive:0xd29529,emissiveIntensity:.72,roughness:.76});
  const water=new T.MeshStandardMaterial({color:0x587e91,emissive:0x3a6277,emissiveIntensity:.4,roughness:.23,metalness:.28});
  const box=new T.BoxGeometry(1,1,1), pebble=new T.DodecahedronGeometry(1,0), leaf=new T.IcosahedronGeometry(1,0);
  const column=new T.CylinderGeometry(1,1,1,8), torus=new T.TorusGeometry(1,.075,6,27).rotateX(Math.PI/2);
  const shingle=shapedPlate([[-.5,0],[.5,0],[0,1]],.06,.015);
  const arch=shapedPlate([[-.5,0],[-.5,.68],[-.31,.90],[0,1.08],[.31,.90],[.5,.68],[.5,0]],.072,.014);
  const hem=shapedPlate([[-.5,0],[.5,0],[.5,-.75],[.34,-1],[.093,-.84],[-.25,-1],[-.5,-.82]],.025,.009);
  const sigil=shapedPlate([[0,.31],[-.15,.08],[-.31,.024],[-.12,-.07],[0,-.34],[.11,-.07],[.30,.024],[.14,.09]],.018,.007);
  const fountain=new T.CylinderGeometry(1,.93,1,16);
  const rand=randomSequence(159047), stamp=new T.Object3D(), tint=new T.Color();
  function part(g:T.Group,geo:T.BufferGeometry,material:T.Material,x:number,h:number,z:number,w:number,t:number,d:number){
    const mesh=meshPart(g,geo,material,x,h,z);mesh.scale.set(w,t,d);return mesh;
  }
  const b=(g:T.Group,material:T.Material,x:number,h:number,z:number,w:number,t:number,d:number)=>
    part(g,box,material,x,h,z,w,t,d);
  function barrier(x:number,z:number,r:number){obstacles.push({x,z,r});}
  function footprint(x:number,z:number,w:number,d:number){
    for(let dx=-w/2+.65;dx<w/2;dx+=1.3) for(let dz=-d/2+.65;dz<d/2;dz+=1.3) barrier(x+dx,z+dz,.67);
  }
  const roads:{x:number;z:number;w:number;d:number}[]=[];
  for(let x=-50;x<=-4;x+=1.56) for(let z=-82;z<=-36;z+=1.17){
    if(Math.abs(x+27)<5.1||Math.abs(z+59)<3.4||Math.hypot(x+27,z+59)<11.3||Math.abs(z+42)<1.2)
      roads.push({x:x+(Math.floor(z*1.3)%2)*.29,z,w:1.53,d:1.14});
  }
  const pavers=new T.InstancedMesh(box,granite,roads.length);
  for(const [i,{x,z,w,d}] of roads.entries()){
    stamp.position.set(x,y-.035,z);stamp.rotation.set(0,rand()*.071-.035,0);stamp.scale.set(w,.094,d);stamp.updateMatrix();
    pavers.setMatrixAt(i,stamp.matrix);tint.setHSL(.10+rand()*.05,.12+rand()*.08,.48+rand()*.21);pavers.setColorAt(i,tint);
  }
  pavers.receiveShadow=true;pavers.computeBoundingSphere();root.add(pavers);
  const lampCenters:T.Vector3[]=[];
  function lantern(x:number,z:number,h=2.18){
    b(structures,dark,x,y+h*.39,z,.13,h*.79,.13);
    b(structures,brass,x,y+h-.35,z,.34,.09,.34);
    b(structures,glow,x,y+h-.14,z,.25,.34,.25);
    const lid=part(structures,pebble,brass,x,y+h+.09,z,.24,.15,.24);lid.rotation.y=.43;
    lampCenters.push(new T.Vector3(x,y+h,z));
  }
  const west=-53,east=-1,north=-84,south=-36;
  function wall(x:number,z:number,angle:number){
    const wall=joint(structures,x,y,z);wall.rotation.y=angle;
    b(wall,mortar,0,1.53,0,2.29,3.14,1.12);
    for(let row=0;row<5;row++) for(const offset of [-.54,.54])
      b(wall,granite,offset+(row%2)*.045,.38+row*.59,.57,1.08,.55,.21);
    b(wall,granite,0,3.15,0,2.42,.26,1.39);
    b(wall,granite,0,3.55,0,1.25,.66,1.18);
    barrier(x,z,1.08);
  }
  for(let x=west;x<=east;x+=2.1){
    wall(x,north,Math.PI);
    if(Math.abs(x+27)>5) wall(x,south,0);
  }
  for(let z=north+2.1;z<south-1.1;z+=2.1){wall(west,z,-Math.PI/2);wall(east,z,Math.PI/2);}
  for(const [x,z,gate] of [[west,north,0],[east,north,0],[west,south,0],[east,south,0],[-32.6,south,1],[-21.4,south,1],[-37,-82,0],[-17,-82,0]]){
    const height=gate?7.0:6.05;
    part(structures,column,mortar,x,y+height/2,z,2.8,height,2.8);
    part(structures,column,granite,x,y+height-.29,z,3.0,.45,3.0);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      const tooth=b(structures,granite,x+Math.sin(a)*2.53,y+height+.38,z+Math.cos(a)*2.53,1.18,.87,.87);
      tooth.rotation.y=a;
    }
    for(const [dx,dz,a] of [[0,2.59,0],[2.59,0,Math.PI/2]])
      part(structures,arch,dark,x+dx,y+3.65,z+dz,.71,1.32,1).rotation.y=a;
    barrier(x,z,2.8);
  }
  b(structures,granite,-27,y+5.28,south,8.4,1.78,1.64);
  b(structures,mortar,-27,y+6.28,south,9.05,.33,1.95);
  for(const side of [-1,1]){
    b(structures,granite,-27+side*3.80,y+2.14,south,1.0,4.3,1.35);
    part(structures,hem,cloth[2],-27+side*2.06,y+5.72,south+.92,1.23,1.97,1);
    part(structures,sigil,gold,-27+side*2.06,y+4.93,south+.98,.78,.78,.87);
    barrier(-27+side*3.8,south,.60);
    lantern(-27+side*3.27,south+1.84,2.9);
  }
  function window(g:T.Group,x:number,h:number,z:number){
    part(g,arch,wood,x,h,z,1.01,1.14,1);
    part(g,arch,glow,x,h+.12,z+.083,.70,.88,1);
    b(g,wood,x,h+.44,z+.16,.07,.86,.09);b(g,wood,x,h+.43,z+.16,.69,.077,.082);
  }
  for(const house of aureliaBuildings){
    const g=joint(structures,house.x,y,house.z),{w,d,h}=house, open=house.kind!=='house';
    b(g,granite,0,.075,0,w,.15,d);
    if(open){
      b(g,plaster,0,h*.51,-d/2+.26,w,h,.52);
      for(const side of [-1,1]){
        b(g,plaster,side*(w/2-.25),h*.5,-.15,.52,h,d-.3);
        for(let z=-d/2+.56;z<d/2;z+=1.22) barrier(house.x+side*(w/2-.25),house.z+z,.58);
      }
      for(let x=-w/2+.59;x<w/2;x+=1.19) barrier(house.x+x,house.z-d/2+.23,.57);
      b(g,wood,0,h-.22, d/2,w+.38,.45,.39);
      b(g,slate,0,h+.05,-d*.24,w+.84,.43,d*.55);
      for(const side of [-1,1]) b(g,wood,side*(w/2-.41),h*.48,d/2,.27,h,.29);
    }else{
      b(g,plaster,0,h/2,0,w,h,d);
      footprint(house.x,house.z,w,d);
      for(const side of [-1,1]){
        const roof=b(g,slate,side*(w/4+.21),h+.82,0,w*.64,.22,d+.77);
        roof.rotation.z=-side*.46;
        part(g,shingle,slate,0,h-.04,side*(d/2+.025),w,1.97,1);
        for(let i=0;i<3;i++) window(g,(i-1)*w*.25,2.57,d/2+.03);
      }
      part(g,arch,dark,0,.07,d/2+.052,1.46,1.94,1.03);
    }
    for(const sign of [-1,1]){
      b(g,wood,sign*(w/2-.26),h*.5,d/2+.055,.19,h,.18);
      b(g,wood,sign*w*.24,h*.61,d/2+.061,.16,h*.77,.17).rotation.z=sign*.46;
    }
    if(house.kind==='guild'){
      for(const side of [-1,1]){
        part(g,hem,cloth[2],side*4.7,h-.28,d/2+.27,1.42,2.8,1);
        part(g,sigil,gold,side*4.7,h-1.28,d/2+.32,.88,.88,1);
        b(g,wood,side*4.98,.89,.38,2.35,.17,1.14);
        for(const z of [-.70,1.27]) b(g,wood,side*4.98,.45,z,2.45,.17,.34);
        for(const x of [-5.7,-4.3,4.3,5.7]) if(x*side>0) b(g,wood,x,.45,.36,.16,.85,.16);
      }
      b(g,granite,0,1.22,-d/2+.64,2.45,2.41,1.23);
      part(g,arch,dark,0,.16,-d/2+1.27,1.52,1.42,1);
      part(g,pebble,glow,0,.43,-d/2+1.35,.71,.44,.40);
      b(g,wood,2.5,1.56,-d/2+.72,2.16,1.62,.19);
      for(let i=0;i<7;i++) b(g,plaster,1.75+(i%4)*.45,1.29+Math.floor(i/4)*.52,-d/2+.84,.30,.40,.039).rotation.z=i*.061;
    }
  }
  function stall(x:number,z:number,index:number){
    const g=joint(structures,x,y,z);
    b(g,wood,0,.95,0,2.84,.17,1.31);
    for(const sx of [-1,1]) for(const sz of [-1,1])
      b(g,wood,sx*1.32,1.32,sz*.72,.12,2.55,.12);
    for(let i=0;i<6;i++){
      b(g,i%2?cloth[index]:plaster,(i-2.5)*.49,2.53,0,.494,.055,1.87).rotation.x=.19;
      part(g,hem,i%2?cloth[index]:plaster,(i-2.5)*.49,2.45,.92,.49,.29,.56);
    }
    for(let i=0;i<5;i++) part(g,i%3?pebble:box,i%3?brass:hideMaterial,index*.02+(i-2)*.47,1.085,.37,.18,.14,.17);
    barrier(x,z,.71);
  }
  const hideMaterial=mat(0x7b5b43);
  stall(-38,-53.1,0);stall(-37.6,-46.4,3);stall(-19.8,-64.1,2);stall(-36.8,-67.2,1);
  const forge=joint(structures,-12,y,-48.9);
  b(forge,granite,1.37,1.37,-.7,2.28,2.74,1.80);
  part(forge,arch,dark,1.37,.12,.225,1.51,1.61,1);
  part(forge,pebble,glow,1.30,.68,.36,.66,.67,.29);
  part(forge,pebble,glow,1.67,.71,.37,.37,.53,.27);
  b(forge,mortar,1.39,2.85,-1.03,.74,1.52,.74);
  const anvil=loft([[-.58,.08,-.102,.106],[-.30,.21,-.12,.14],[.31,.27,-.13,.14],[.60,.10,-.01,.065]],8);
  b(forge,wood,-1.25,.30,2.58,.75,.57,.71);
  part(forge,anvil,brass,-1.25,.77,2.58,1,1,1).rotation.y=1.58;
  b(forge,wood,-2.4,1.14,.21,.24,2.13,1.62);
  for(let i=0;i<4;i++) b(forge,brass,-2.23,1.40,(i-2)*.34,.085,.95,.13).rotation.x=(i-1)*.19;
  part(forge,hem,brass,-2.12,1.79,1.18,.76,1.34,.82).rotation.y=.47;
  barrier(-10.63,-49.65,.92);
  for(const [x,z] of [[-47,-41],[-35,-40],[-19,-40],[-8,-41],[-46,-70],[-35,-74],[-19,-74],[-7,-75],[-32,-62],[-21,-62]]) lantern(x,z);

  const trimFloor=joint(structures,-27,y,-59);
  part(trimFloor,fountain,granite,0,.12,0,3.42,.24,3.42);
  part(trimFloor,fountain,water,0,.25,0,3.08,.084,3.08);
  part(trimFloor,torus,brass,0,.29,0,3.18,.78,3.18);
  part(trimFloor,fountain,mortar,0,.45,0,1.02,.52,1.02);
  const tree=joint(structures,-27,y+.66,-59);
  const limb=loft([[0,.56,-.48,.48],[1.45,.41,-.39,.41],[2.8,.32,-.30,.31],[4.4,.23,-.24,.24],[5.7,.13,-.11,.14]],10);
  const trunk=part(tree,limb,wood,0,0,0,1,1,1);trunk.rotation.x=-Math.PI/2;trunk.rotation.z=.075;
  for(let i=0;i<11;i++){
    const a=i*2.399,r=1.6+rand()*1.8, h=3.7+rand()*1.68;
    const jointPoint=new T.Vector3(Math.sin(a)*r,h,Math.cos(a)*r);
    const start=new T.Vector3(0,2.25+i*.16,0), direction=jointPoint.clone().sub(start);
    const arm=part(tree,limb,wood,start.x,start.y,start.z,.42,.42,direction.length()/5.7);
    arm.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),direction.normalize());
    for(let j=0;j<4;j++){
      const crown=part(tree,leaf,gold,jointPoint.x+(rand()-.5)*1.5,jointPoint.y+(rand()-.5)*.76,jointPoint.z+(rand()-.5)*1.5,
        .87+rand()*.61,.63+rand()*.51,.86+rand()*.62);crown.rotation.set(a,j,.48*j);
    }
  }
  part(tree,torus,glow,0,1.68,0,1.19,.38,1.19);
  barrier(-27,-59,1.20);
  for(const x of [-19,-35]){
    part(structures,fountain,granite,x,y+.22,-61,.99,.44,.99);
    part(structures,fountain,water,x,y+.44,-61,.89,.08,.89);
    part(structures,column,brass,x,y+.79,-61,.15,.67,.15);
    part(structures,fountain,granite,x,y+1.09,-61,.43,.12,.43);
    barrier(x,-61,.58);
  }
  batch.bake(structures);structures.traverse(node=>{if(node instanceof T.Mesh) node.receiveShadow=true;});

  const torso=loft([[0,.20,-.12,.12],[.46,.27,-.18,.15],[.64,.22,-.14,.13],[.79,.13,-.10,.10]],10).rotateX(-Math.PI/2);
  const headGeo=loft([[0,.13,-.099,.113],[.09,.16,-.12,.137],[.21,.16,-.12,.12],[.29,.075,-.07,.075]],10).rotateX(-Math.PI/2);
  const armGeo=loft([[0,.063,-.069,.068],[.26,.087,-.083,.081],[.54,.062,-.060,.071]],8).rotateX(Math.PI/2);
  function npc(x:number,z:number,role:number){
    const node=joint(root,x,y,z),body=joint(node,0,.88),head=joint(body,0,.73,.04);
    part(body,torso,cloth[role%4],0,0,0,1.02,1,1);
    part(body,hem,role===1?hideMaterial:cloth[role%4],0,.43,.16,.37,.63,1);
    const face=part(head,headGeo,skin,0,0,0,1,1,1);face.rotation.y=-.16;
    part(head,pebble,role===0?brass:dark,0,.24,-.041,.164,.127,.142);
    for(const side of [-1,1]) part(head,pebble,dark,side*.053,.135,.117,.019,.024,.012);
    const arms=[-1,1].map(side=>{
      const arm=joint(body,side*.25,.56,0);
      part(arm,armGeo,cloth[role%4],0,0,0,1,1,1);
      part(arm,pebble,skin,0,-.52,.02,.062,.078,.061);
      return arm;
    });
    if(role===1){
      b(arms[1],wood,0,-.53,.18,.055,.058,.38);
      b(arms[1],brass,0,-.53,.34,.19,.15,.15);
    }
    const legs=[-1,1].map(side=>{
      const leg=joint(node,side*.126,.86);
      part(leg,armGeo,dark,0,0,0,1.37,1.55,1.46);
      b(leg,dark,0,-.79,.056,.18,.17,.28);return leg;
    });
    batch.bake(node);
    return {node,body,head,arms,legs,role,x,z};
  }
  const people=[...aureliaServices.map((site,i)=>npc(site.x,site.z,i)),
    npc(-31,-44,3),npc(-21,-51,3),npc(-39,-71,3),npc(-13,-74,3)];
  const particles=new T.InstancedMesh(leaf,glow,40);
  particles.instanceMatrix.setUsage(T.DynamicDrawUsage);particles.frustumCulled=false;root.add(particles);
  const lights=Array.from({length:3},()=>new T.PointLight(0xffb67d,24,17,2));
  scene.add(root,...lights);
  return {
    update(time:number,p:T.Vector3){
      const near=Math.hypot(p.x+27,p.z+60);
      root.visible=near<113;
      lights.forEach((light,i)=>{light.visible=inAurelia(p.x,p.z);
        if(light.visible){
          const anchors=[new T.Vector3(-27,y+4,-59),...lampCenters].sort((a,b)=>a.distanceToSquared(p)-b.distanceToSquared(p));
          light.position.copy(anchors[i]);light.intensity=21+4*Math.sin(time*4+i);
        }
      });
      if(!root.visible||near>64) return;
      gold.emissiveIntensity=.62+.20*Math.sin(time*1.94);
      for(const [index,person] of people.entries()){
        const {node,body,head,arms,legs,role,x,z}=person;
        const moving=role===3, phase=time*2.8+index;
        if(moving){
          const a=time*.42+index;node.position.set(x+1.24*Math.cos(a),y,z+.91*Math.sin(a));
          node.rotation.y=Math.atan2(-Math.sin(a),Math.cos(a));
        }else node.rotation.y=role===1?-1.23:.15;
        body.position.y=.88+.021*Math.sin(phase);head.rotation.y=Math.sin(time*1.19+index)*.21;
        for(let i=0;i<2;i++){
          const side=i?1:-1;
          legs[i].rotation.x=moving?Math.sin(phase+i*Math.PI)*.39:0;
          arms[i].rotation.set(role===1&&i===1?-1.19-Math.sin(time*4.4)*.76:moving?Math.sin(phase+i*Math.PI)*.27:-.21+Math.sin(phase)*.11,0,side*.16);
        }
      }
      for(let i=0;i<particles.count;i++){
        const spark=i<12,r=(time*(spark?1.4:.38)+i*.271)%1,a=i*2.399+time*.66;
        stamp.position.set((spark?-13.1:-27)+Math.sin(a)*(spark?r*.74:1.9+r*2.2),
          y+(spark?.91:1.4)+r*(spark?1.47:4.7),(spark?-47.2:-59)+Math.cos(a)*(spark?r*.74:1.9+r*2.2));
        stamp.rotation.set(a,r,i);stamp.scale.setScalar((spark?.054:.077)*Math.sin(r*Math.PI));stamp.updateMatrix();
        particles.setMatrixAt(i,stamp.matrix);
      }
      particles.instanceMatrix.needsUpdate=true;
    },
    dispose(){batch.dispose();},
  };
}
