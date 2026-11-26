import * as T from 'three';
import { loft, meshPart, shapedPlate, rigidBatcher } from './creatureGeometry.ts';
import { surface } from './layout.ts';
import { ritualGrounds as site } from './worldSites.ts';

export function buildRitualGrounds(scene:T.Scene,obstacles:{x:number;z:number;r:number}[]){
  const root=new T.Group(), batch=rigidBatcher();
  const stone=new T.MeshStandardMaterial({color:0x565360,roughness:.96,flatShading:true});
  const slab=loft([[-.25,.43,-.33,.33],[.32,.47,-.36,.33],[1.12,.39,-.29,.31],[2.45,.28,-.24,.22],[2.75,.13,-.16,.17]],6).rotateX(-Math.PI/2);
  const altar=loft([[-.88,.54,-.11,.18],[-.54,.63,-.10,.15],[.04,.54,-.10,.18],[.24,.22,-.09,.10]],8);
  const base=new T.CylinderGeometry(.88,1.09,.29,8);
  const debris=new T.DodecahedronGeometry(.46,0);
  const rune=shapedPlate([[0,.19],[-.075,.046],[-.038,-.09],[.041,-.119],[.096,-.016],[.03,.042]],.015,.005);
  const glow=new T.MeshBasicMaterial({color:0x9d69ef,toneMapped:false});
  const mote=new T.InstancedMesh(new T.OctahedronGeometry(.074),glow,24);
  mote.instanceMatrix.setUsage(T.DynamicDrawUsage);mote.frustumCulled=false;
  const stamp=new T.Object3D();
  function place(dx:number,dz:number){
    const holder=new T.Group(),x=site.x+dx,z=site.z+dz;
    holder.position.set(x,surface(x,z),z);root.add(holder);return holder;
  }
  for(const [dx,dz,angle] of [[-8,-1,1.1],[-5,6,1.7],[3,8,2.1],[9,4,-.8],[9,-4,-.6],[-4,-9,.5]]){
    const holder=place(dx,dz);holder.rotation.y=angle;
    meshPart(holder,slab,stone).rotation.z=.12*Math.sin(dx);
    for(let i=0;i<4;i++) meshPart(holder,rune,glow,Math.sin(i*.91)*.085,.50+i*.39,.32-i*.033).rotation.z=i*.47;
    obstacles.push({x:holder.position.x,z:holder.position.z,r:.56});
  }
  const shrine=place(.28,-3.05);
  meshPart(shrine,base,stone,0,.09);
  meshPart(shrine,slab,stone,0,.22).scale.set(1.28,.245,1.6);
  meshPart(shrine,altar,stone,.28,.87,.23).rotation.y=.69;
  meshPart(shrine,altar,stone,-.78,.23,-.35).rotation.set(.20,-.64,-.23);
  meshPart(shrine,rune,glow,.30,.52,.54).scale.setScalar(1.77);
  for(let i=0;i<11;i++){
    const a=i*2.399;
    const fragment=meshPart(shrine,debris,stone,Math.sin(a)*(1.4+i*.10),.15,Math.cos(a)*(1.4+i*.10));
    fragment.rotation.set(a*.72,a,i);fragment.scale.setScalar(.37+(i%5)*.17);
  }
  obstacles.push({x:shrine.position.x,z:shrine.position.z,r:.85});
  root.add(mote);batch.bake(root);scene.add(root);
  return (time:number,player:T.Vector3)=>{
    root.visible=Math.hypot(player.x-site.x,player.z-site.z)<92;
    if(!root.visible) return;
    mote.visible=Math.hypot(player.x-site.x,player.z-site.z)<45;
    if(!mote.visible) return;
    for(let i=0;i<24;i++){
      const t=(i*.243+time*.41)%1,a=i*2.399+time*.58,r=2.1+i*.24;
      const x=site.x+Math.cos(a)*r,z=site.z+Math.sin(a)*r;
      stamp.position.set(x,surface(x,z)+.1+t*2.2,z);stamp.rotation.set(a,t*4,i);
      stamp.scale.setScalar(Math.sin(t*Math.PI)*(i%3?.7:1.3));stamp.updateMatrix();mote.setMatrixAt(i,stamp.matrix);
    }
    mote.instanceMatrix.needsUpdate=true;
  };
}
