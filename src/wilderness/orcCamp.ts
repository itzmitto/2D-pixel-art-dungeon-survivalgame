import * as T from 'three';
import { fracturedRock, weatherStone } from './rockDetail.ts';
import { loft, meshPart, rigidBatcher } from './creatureGeometry.ts';
import { surface } from './layout.ts';
import { orcCamp } from './worldSites.ts';

export function buildOrcCamp(scene:T.Scene,obstacles:{x:number;z:number;r:number}[]){
  const root=new T.Group(), fire=new T.Group(), batch=rigidBatcher();
  const wood=new T.MeshStandardMaterial({color:0x463526,roughness:1});
  const hide=new T.MeshStandardMaterial({color:0x735b43,roughness:.96,side:T.DoubleSide});
  const leather=new T.MeshStandardMaterial({color:0x3f3029,roughness:.93});
  const iron=new T.MeshStandardMaterial({color:0x75808a,metalness:.54,roughness:.45});
  const bone=new T.MeshStandardMaterial({color:0xbbad8e,roughness:.81});
  const stone=new T.MeshStandardMaterial({color:0x4a4a43,roughness:.98});
  weatherStone(stone,.43);
  const flame=new T.MeshBasicMaterial({color:0xff732a,toneMapped:false});
  const ember=new T.MeshBasicMaterial({color:0xffde78,toneMapped:false});
  const pole=new T.CylinderGeometry(.093,.19,1,6);
  const spike=new T.ConeGeometry(.13,.46,6).translate(0,.48,0);
  const beam=new T.BoxGeometry(1,1,1), rock=fracturedRock(184);
  const skull=loft([[-.24,.24,-.14,.16],[0,.33,-.19,.28],[.21,.23,-.15,.17],[.44,.135,-.13,.053]],12);
  const horn=new T.TorusGeometry(.28,.061,5,10,2.5);
  const lick=loft([[0,.18,-.10,.10],[.29,.14,-.092,.096],[.56,.09,-.043,.072],[.86,.012,0,.015]],7).rotateX(-Math.PI/2);
  function at(dx:number,dz:number){
    const node=new T.Group(),x=orcCamp.x+dx,z=orcCamp.z+dz;
    node.position.set(x,surface(x,z),z);root.add(node);return node;
  }
  for(const [dx,dz,yaw] of [[-6,-6,.58],[6,-5,-.55],[-7,4,1.22]]){
    const tent=at(dx,dz);tent.rotation.y=yaw;
    const shelter=new T.BufferGeometry();
    shelter.setAttribute('position',new T.Float32BufferAttribute([
      -2,0,-1.8,0,2.74,-1.8,0,2.63,1.8, -2,0,-1.8,0,2.63,1.8,-2.08,0,1.8,
      0,2.74,-1.8,2,0,-1.8,2.08,0,1.8, 0,2.74,-1.8,2.08,0,1.8,0,2.63,1.8,
      -2,0,-1.8,2,0,-1.8,0,2.74,-1.8,
      -2.08,0,1.8,-.52,0,1.8,0,2.63,1.8, 0,2.63,1.8,.52,0,1.8,2.08,0,1.8,
    ],3));shelter.computeVertexNormals();
    meshPart(tent,shelter,hide);
    for(const z of [-1.9,1.9]) meshPart(tent,pole,wood,0,1.4,z).scale.set(.51,2.90,.51);
    meshPart(tent,beam,leather,0,2.66,0).scale.set(.15,.10,3.9);
    obstacles.push({x:tent.position.x,z:tent.position.z,r:1.68});
  }
  for(const [dx,dz,yaw] of [[-8.6,8,-.48],[8,7,.46],[-5,-10,.08],[6,-10,-.18]]){
    const fence=at(dx,dz);fence.rotation.y=yaw;
    for(let i=-2;i<=2;i++){
      const x=i*.60, y=.97+Math.sin(i*2)*.13, post=new T.Group();fence.add(post);
      post.position.set(x,y,0);post.rotation.x=.24;post.rotation.z=i*.095;
      meshPart(post,pole,wood).scale.set(1.2,2.04,1.2);
      meshPart(post,spike,wood,0,.67,0);
      obstacles.push({x:fence.position.x+Math.cos(yaw)*x,z:fence.position.z-Math.sin(yaw)*x,r:.21});
    }
    for(const y of [.60,1.28]) meshPart(fence,beam,leather,0,y,-.24).scale.set(3.2,.20,.16);
  }
  for(const [dx,dz] of [[3.8,-6.0],[-3.6,2.3]]){
    const rack=at(dx,dz);
    for(const x of [-.9,.9]) meshPart(rack,pole,wood,x,.61,0).scale.y=1.42;
    meshPart(rack,beam,wood,0,.89,0).scale.set(2.34,.15,.15);
    for(let i=-1;i<=1;i++){
      const shaft=new T.Group();rack.add(shaft);
      shaft.position.set(i*.61,.76,.17);shaft.rotation.z=.19+i*.18;
      meshPart(shaft,pole,wood).scale.set(.43,1.54,.43);
      meshPart(shaft,spike,iron,0,.42,0).scale.set(.85,1,.82);
    }
    obstacles.push({x:rack.position.x,z:rack.position.z,r:.67});
  }
  const firePit=at(0,-1.2);
  for(let i=0;i<9;i++){
    const a=i*Math.PI*2/9;
    meshPart(firePit,rock,stone,Math.sin(a)*1.06,.14,Math.cos(a)*1.06).scale.set(.34,.26,.28);
  }
  for(let i=0;i<3;i++){
    const log=meshPart(firePit,beam,wood,0,.13+i*.09,0);
    log.scale.set(1.38,.14,.19);log.rotation.y=i*1.14;
  }
  firePit.add(fire);
  const tongues=Array.from({length:5},(_,i)=>meshPart(fire,lick,i%2===0?flame:ember,(i%3-1)*.21,.18,(i%2-.5)*.34));
  const glow=new T.PointLight(0xff9a57,19,12,2);glow.position.y=1.25;firePit.add(glow);
  obstacles.push({x:firePit.position.x,z:firePit.position.z,r:.88});
  for(const [dx,dz,yaw] of [[-2.8,8,.18],[4.1,4,2.25],[2.1,-7.4,3.3]]){
    const bones=at(dx,dz);bones.rotation.y=yaw;
    meshPart(bones,skull,bone,0,.15,0);
    for(const side of [-1,1]){
      meshPart(bones,rock,leather,side*.16,.205,.25).scale.set(.067,.059,.044);
      meshPart(bones,horn,bone,side*.30,.24,-.07).rotation.set(-.7,side*.86,side*.31);
    }
    for(let i=0;i<4;i++){
      const rib=meshPart(bones,pole,bone,.44+i*.14,.04,-.08+i*.07);
      rib.scale.set(.34,.34,.34);rib.rotation.set(Math.PI/2,0,i*.27);
    }
  }
  firePit.remove(fire);batch.bake(root);firePit.add(fire);scene.add(root);
  return (time:number,player:T.Vector3)=>{
    root.visible=Math.hypot(player.x-orcCamp.x,player.z-orcCamp.z)<96;
    if(!root.visible) return;
    glow.intensity=17+4*Math.sin(time*7)+2*Math.cos(time*13.5);
    for(const [i,tongue] of tongues.entries()){
      tongue.scale.set(.8,.70+.31*Math.sin(time*9+i*1.43),.8);
      tongue.rotation.set(.18*Math.cos(time*5+i),i*2,.19*Math.sin(time*7+i));
    }
  };
}
