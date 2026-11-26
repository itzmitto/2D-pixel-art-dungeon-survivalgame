import * as T from 'three';
import { fracturedRock, weatherStone } from './rockDetail.ts';
import { height } from './layout';
import { loft, shapedPlate, meshPart } from './creatureGeometry';

export const huntSites={
  den:{x:-82,z:-24}, camp:{x:-189,z:62}, gravespur:{x:205,z:-182},
};
export function huntScenery(scene:T.Scene,obstacles:{x:number;z:number;r:number}[]){
  const stone=new T.MeshStandardMaterial({color:0x50535a,roughness:.95,flatShading:true});
  weatherStone(stone,.45);
  const wood=new T.MeshStandardMaterial({color:0x4c3527,roughness:.92});
  const bone=new T.MeshStandardMaterial({color:0xa89579,roughness:.91});
  const tarp=new T.MeshStandardMaterial({color:0x62604a,roughness:1,side:T.DoubleSide});
  const ash=new T.MeshStandardMaterial({color:0x292521,roughness:1});
  const rock=fracturedRock(305), pole=new T.CylinderGeometry(.06,.11,1,6);
  const plank=new T.BoxGeometry(1,1,1), wheel=new T.TorusGeometry(.68,.066,5,12);
  const skull=loft([[-.22,.10,-.13,.14],[-.13,.17,-.15,.19],[.06,.19,-.12,.15],[.22,.09,-.07,.092]],10);
  const rib=new T.TorusGeometry(.26,.032,5,11,Math.PI*1.1);
  const banner=shapedPlate([[-.23,0],[.19,0],[.17,-.89],[-.028,-.74],[-.23,-.92]],.027,0);
  function part(geo:T.BufferGeometry,mat:T.Material,x:number,z:number,y:number,sx:number,sy:number,sz:number){
    const mesh=meshPart(scene,geo,mat,x,height(x,z)+y,z);
    mesh.scale.set(sx,sy,sz);
    return mesh;
  }

  const den=huntSites.den;
  for(const [dx,dz,sx,sy] of [[-3.2,-1,1.4,1.05],[-1.8,-2.4,1.8,.98],[.05,-3.1,2.12,1.55],[2,-2.6,1.49,1.04],[3.2,-1.3,1.24,.95]]){
    const x=den.x+dx,z=den.z+dz;
    part(rock,stone,x,z,sy*.48,sx,sy,1.16).rotation.y=dx;
    obstacles.push({x,z,r:sx*.72});
  }
  part(skull,bone,den.x+2,den.z+1.35,.18,.91,1.08,1.0).rotation.y=-.71;
  for(let i=0;i<5;i++) part(rib,bone,den.x+.9-i*.186,den.z+1.49,.07,1-i*.09,.91,1).rotation.y=Math.PI/2;

  const camp=huntSites.camp;
  for(let i=0;i<5;i++){
    const x=camp.x+5.5+i*.64,z=camp.z+2.3+Math.sin(i)*.21;
    part(pole,wood,x,z,.71,1.05,1.54,1).rotation.z=-.24+i*.074;
    if(i%2===0) obstacles.push({x,z,r:.32});
  }
  part(plank,wood,camp.x+6.9,camp.z+2.32,.67,3.48,.13,.17).rotation.y=.09;
  for(const dx of [-2.1,2.55]){
    const post=part(pole,wood,camp.x+dx,camp.z-2.6,1.17,1,2.55,1);
    post.rotation.z=.13;
    part(banner,tarp,camp.x+dx,camp.z-2.55,2.07,1.28,1,1).rotation.y=.25;
  }
  const cartX=camp.x+3.8,cartZ=camp.z-6.4;
  part(plank,wood,cartX,cartZ,.46,1.7,.18,2.05).rotation.set(.19,.4,-.19);
  part(wheel,wood,cartX-.61,cartZ,.45,.82,.82,.82).rotation.y=1.73;
  part(wheel,wood,cartX+1.67,cartZ+.31,.16,.82,.82,.82).rotation.x=1.25;
  for(let i=0;i<7;i++){
    const a=i*Math.PI*2/7;
    part(rock,stone,camp.x+Math.cos(a)*1.06,camp.z-4.0+Math.sin(a)*1.06,.1,.34,.20,.28);
  }
  part(rock,ash,camp.x,camp.z-4,.08,.83,.11,.83);
  obstacles.push({x:cartX,z:cartZ,r:.91});

  const grave=huntSites.gravespur;
  for(let i=0;i<6;i++){
    const angle=Math.PI+i*Math.PI/5,x=grave.x+Math.cos(angle)*4.2,z=grave.z+Math.sin(angle)*3.7;
    const monument=part(rock,stone,x,z,.95,.62+i*.032,1.55-i*.063,.62);
    monument.rotation.set(i*.041,angle,.11*Math.sin(i*2.1));
    obstacles.push({x,z,r:.49});
  }
  part(skull,bone,grave.x+2.4,grave.z+1.3,.21,1.26,1.21,1.2).rotation.y=.67;
}
