import * as T from 'three';
import { createKnightModel } from './knight/model.ts';
import { armorModels } from './knight/armorModels.ts';
import { weaponModel } from './weaponModels.ts';
import { meshPart, shapedPlate, type CreatureRig } from './creatureGeometry.ts';

export function hollowSentinel(frost=false):CreatureRig&{dispose:()=>void;barrier?:T.Mesh}{
  const model=createKnightModel(), {root,hips,torso,head,arms,legs,cape}=model;
  const armor=armorModels(model);
  armor.equip({helmet:'abyssal-helmet',chestplate:'abyssal-chestplate',gauntlets:'abyssal-gauntlets',legs:'abyssal-legs',boots:'abyssal-boots',cape:'abyssal-cape'});
  const iron=new T.MeshStandardMaterial({color:frost?0x344d65:0x222837,roughness:.43,metalness:.77});
  const runic=new T.MeshStandardMaterial({color:frost?0xa9edff:0xcba0fa,emissive:frost?0x4eaaff:0x963dff,emissiveIntensity:.73});
  const visor=shapedPlate([[-.16,-.07],[-.18,.12],[-.08,.22],[0,.15],[.08,.22],[.18,.12],[.16,-.07],[0,-.171]],.044);
  const horn=shapedPlate([[-.05,-.17],[.08,-.07],[.133,.249],[.025,.179],[-.083,.017]],.081);
  const sigil=shapedPlate([[0,.142],[-.043,.026],[-.08,-.014],[-.02,-.047],[0,-.128],[.041,-.039],[.085,.01],[.018,.047]],.011);
  meshPart(head,visor,iron,0,.142,.218).scale.set(1.13,.81,.72);
  meshPart(head,sigil,runic,0,.24,.275).scale.setScalar(.72);
  for(const side of [-1,1]){
    meshPart(head,horn,iron,side*.14,.27,.007).rotation.z=-side*.55;
    meshPart(torso,horn,iron,side*.39,.48,.085).rotation.z=-side*.71;
    meshPart(torso,sigil,runic,side*.20,.31,.273).scale.setScalar(.72);
  }
  let barrier:T.Mesh|undefined;
  if(frost){
    cape.material.color.setHex(0x28435d);cape.material.emissive.setHex(0x101c35);
    const crystal=new T.OctahedronGeometry(.17);
    for(const side of [-1,1]){
      for(let i=0;i<4;i++){
        const shard=meshPart(arms[side===-1?0:1].shoulder,crystal,runic,side*(.06+i*.055),.14+i*.035,.065-i*.044);
        shard.scale.set(.53,1.5+i*.23,.51);shard.rotation.z=-side*(.34+i*.20);
      }
      meshPart(head,crystal,runic,side*.12,.31,-.038).scale.set(.55,1.8,.51);
    }
    barrier=new T.Mesh(new T.IcosahedronGeometry(1,2),new T.MeshBasicMaterial({
      color:0x82d7ff,transparent:true,opacity:.26,wireframe:true,depthWrite:false,
    }));
    barrier.visible=false;barrier.position.y=1.16;root.add(barrier);
  }
  const socket=arms[1].socket;
  for(const child of socket.children) child.visible=false;
  const sword=weaponModel(frost?'staff':'greatsword');
  sword.right.scale.set(1.22,1.31,1.22);socket.add(sword.right);
  const buffer=cape.geometry.attributes.position;
  return {root,barrier,animate(p){
    const t=p.frozen?0:p.time, wind=p.windup, follow=p.recovery**1.45, charge=p.leap;
    const fall=T.MathUtils.smoothstep(p.dead,0,1);
    if(barrier?.visible) barrier.rotation.y=t*.54;
    armor.update(t);sword.update(t,'Mythic');
    runic.emissiveIntensity=(p.alert??0)>1.5?1.26+Math.sin(t*7)*.58:.68+Math.sin(t*4)*.21;
    hips.position.y=1-.11*wind-.68*fall+.046*p.gait*Math.cos(p.phase*2);
    hips.rotation.set(.17*p.gait+.31*follow+.38*charge,0,fall*1.38+p.hit*.11);
    torso.rotation.set(-.28*wind+.42*follow,-.67*wind+.92*follow,0);
    head.rotation.set(-.22*wind+.23*p.hit,torso.rotation.y*-.5,0);
    for(const [i,leg] of legs.entries()){
      leg.upper.rotation.set(Math.sin(p.phase+i*Math.PI)*p.gait*.64-wind*.15,0,(i===0?-1:1)*.13);
      leg.lower.rotation.x=.13+Math.max(0,-Math.cos(p.phase+i*Math.PI))*p.gait*.71+wind*.19;
      leg.foot.rotation.x=-(leg.upper.rotation.x+leg.lower.rotation.x)*.73;
      const arm=arms[i];
      arm.upper.rotation.set(-.59-wind*(i===1?1.81:1.12)+follow*.55,-.13+i*.37,(i===0?-1:1)*(.19+wind*.39));
      arm.fore.rotation.x=-.63-.49*wind+.32*follow;
    }
    socket.rotation.set(-.69+wind*1.70+follow*1.7,0,frost?-.17-wind*.45:-1.51-wind*.37+follow*1.33);
    for(let row=0;row<=12;row++) for(let col=0;col<=10;col++){
      const u=col/5-1,d=row/12;
      const tear=(.14*Math.sin(col*2.21)+.08*Math.cos(col*4.03))*d**7;
      buffer.setXYZ(row*11+col,u*(.34+.10*d)+Math.sin(t*3-d*4)*.06*d,
        .43-d*(1.44-tear),-.24-d*(.38+p.gait*.41)+Math.sin(t*5+col*.72-d*8)*.06*d);
    }
    buffer.needsUpdate=true;cape.geometry.computeVertexNormals();
  },dispose(){
    armor.dispose();
    const geometry=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
    root.traverse(node=>{
      if(node instanceof T.InstancedMesh) node.dispose();
      if(node instanceof T.Mesh||node instanceof T.Line){geometry.add(node.geometry);
        for(const material of Array.isArray(node.material)?node.material:[node.material]) materials.add(material);}
    });
    geometry.forEach(resource=>resource.dispose());materials.forEach(resource=>resource.dispose());
  }};
}
