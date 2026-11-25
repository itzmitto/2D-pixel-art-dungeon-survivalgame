import * as T from 'three';
import { bank, clearing, extent, height, inForest, path, randomSequence, river } from './layout';

export function scenery(scene:T.Scene) {
  const obstacles:{x:number;z:number;r:number}[]=[];
  const rand=randomSequence(294);
  const wood=new T.MeshStandardMaterial({color:'#46382a'});
  const foliage=new T.MeshStandardMaterial({color:'#496247',roughness:1});
  const stone=new T.MeshStandardMaterial({color:'#73766e',roughness:.93});
  const treeGeo=new T.ConeGeometry(1,1,7);
  const trunkGeo=new T.CylinderGeometry(.21,.42,1,6);
  const rockGeo=new T.DodecahedronGeometry(1,0);
  const form=new T.Object3D();
  const batch=(geo:T.BufferGeometry, mat:T.Material, n:number)=> {
    const mesh=new T.InstancedMesh(geo,mat,n);
    mesh.count=0;
    mesh.castShadow=true; mesh.receiveShadow=true;
    scene.add(mesh);
    return mesh;
  };
  const write=(mesh:T.InstancedMesh,x:number,y:number,z:number,sx:number,sy:number,sz:number,rot:number)=>{
    form.position.set(x,y,z); form.scale.set(sx,sy,sz); form.rotation.set(0,rot,0);
    form.updateMatrix(); mesh.setMatrixAt(mesh.count++,form.matrix);
  };
  const trunks=batch(trunkGeo,wood,2000), leaves=batch(treeGeo,foliage,6000);
  const tint=new T.Color();
  for(let i=0;i<3000;i++){
    const x=(rand()*2-1)*extent,z=(rand()*2-1)*extent;
    if((!inForest(x,z)&&rand()>.025)||Math.abs(z-path(x))<5||bank(x,z)<11||clearing(x,z)<14) continue;
    const y=height(x,z),h=4+rand()*7,rot=rand()*6.3;
    write(trunks,x,y+h*.28,z,h*.13,h*.62,h*.13,rot);
    for(let j=0;j<3;j++){
      const r=h*(.29-j*.058);
      write(leaves,x,y+h*(.60+j*.16),z,r,h*.53,r,rot+j);
      leaves.setColorAt(leaves.count-1,tint.setHSL(.26+rand()*.06,.19,.34+rand()*.31));
    }
    obstacles.push({x,z,r:h*.08});
  }
  const boulders=batch(rockGeo,stone,190);
  const rocks:{x:number;z:number;r:number}[]=[];
  for(let i=0;i<190;i++){
    const x=(rand()*2-1)*extent,z=(rand()*2-1)*extent,r=.65+rand()*2.1;
    if(Math.abs(z-path(x))<4||clearing(x,z)<12||bank(x,z)<8) continue;
    write(boulders,x,height(x,z)+r*.36,z,r,r*.76,r*.86,rand()*6);
    rocks.push({x,z,r:r*.88});
  }
  obstacles.push(...rocks);
  const block=new T.BoxGeometry();
  const place=(mat:T.Material,x:number,y:number,z:number,w:number,h:number,d:number)=>{
    const mesh=new T.Mesh(block,mat);
    mesh.position.set(x,y,z); mesh.scale.set(w,h,d);
    mesh.castShadow=true; mesh.receiveShadow=true; scene.add(mesh);
    return mesh;
  };
  for(let i=-12;i<=12;i++){
    place(wood,river(0)+i,1.48,0,1,.24,5.1);
  }
  for(const z of [-2.45,2.45]) {
    place(wood,32,2.55,z,24.9,.22,.15);
    for(let i=-11;i<=11;i+=4) place(wood,32+i,2,z,.25,1.2,.28);
  }
  for(let i=0;i<9;i++){
    const x=112+i%4*2-3,z=-96;
    const y=height(x,z);
    if(i<4) {
      place(stone,x,y+2.1,z,1.85,4.2+(i%2)*1.4,2);
      obstacles.push({x,z,r:1.25});
    } else place(stone,x,y+4.5+(i%2)*.4,z,1.7,1.1,2);
  }
  for(let i=0;i<7;i++){
    const a=i*Math.PI*2/7,x=-117+Math.cos(a)*7,z=79+Math.sin(a)*7,h=2.3+rand()*2;
    place(stone,x,height(x,z)+h/2,z,1.7,h,1.4).rotation.y=a;
    obstacles.push({x,z,r:1});
  }
  const fireY=height(-45,0);
  for(let i=0;i<9;i++){
    const a=i*Math.PI*2/9;
    const rock=new T.Mesh(rockGeo,stone);
    rock.position.set(-45+Math.cos(a)*1.12,fireY+.25,Math.sin(a)*1.12);
    rock.scale.setScalar(.39); scene.add(rock);
  }
  for(let i=0;i<3;i++) place(wood,-45,fireY+.23,0,1.5,.28,.28).rotation.y=i*1.1;
  obstacles.push({x:-45,z:0,r:1.04});
  return {obstacles,rocks,fireY};
}
