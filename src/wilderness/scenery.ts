import { briarWatch } from './briarWatch';
import { briarScenery } from './briarScenery';
import { buildRitualGrounds } from './ritualGrounds';
import { waystones, orcCamp, orcApproach, ritualGrounds } from './worldSites';
import { buildOrcCamp } from './orcCamp';
import { addedChestSites, cacheBoulders } from './treasure';
import { huntScenery } from './huntScenery';
import * as T from 'three';
import { bank, branchTrails, bridges, clearing, extent, height, inForest, landmarks, randomSequence, trailDistance } from './layout';

export function scenery(scene:T.Scene, seed:number) {
  const obstacles:{x:number;z:number;r:number}[]=[];
  const rand=randomSequence(seed);
  const wood=new T.MeshStandardMaterial({color:'#46382a'});
  const foliage=new T.MeshStandardMaterial({color:'#496247',roughness:1});
  const stone=new T.MeshStandardMaterial({color:'#73766e',roughness:.93});
  const treeGeo=new T.ConeGeometry(1,1,7);
  const trunkGeo=new T.CylinderGeometry(.21,.42,1,6);
  const rockGeo=new T.DodecahedronGeometry(1,0);
  const form=new T.Object3D();
  const batches = new Map<string, {geometry:T.BufferGeometry; material:T.Material; entries:{matrix:T.Matrix4;color?:T.Color}[]}>();
  function write(geo:T.BufferGeometry, mat:T.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number,rot:number,color?:T.Color) {
    const key = [geo.id, Math.floor(x/40), Math.floor(z/40)].join(':');
    let batch = batches.get(key);
    if (!batch) {
      batch = { geometry:geo, material:mat, entries:[] };
      batches.set(key,batch);
    }
    form.position.set(x,y,z); form.scale.set(sx,sy,sz); form.rotation.set(0,rot,0);
    form.updateMatrix();
    batch.entries.push({matrix:form.matrix.clone(),color:color?.clone()});
  }
  const tint=new T.Color();
  const fixedLandmarks=landmarks.filter(location=>location!==orcCamp&&location!==ritualGrounds&&location!==briarWatch);
  const oldTrails=branchTrails.filter(trail=>trail!==orcApproach);
  const landmarkDistance=(x:number,z:number)=>Math.min(...fixedLandmarks.map(location=>Math.hypot(x-location.x,z-location.z)));
  const reservedSite=(x:number,z:number,r:number)=>Math.hypot(x-briarWatch.x,z-(briarWatch.z-4))<13+r||Math.hypot(x-orcCamp.x,z-orcCamp.z)<13+r||Math.hypot(x-ritualGrounds.x,z-ritualGrounds.z)<13+r||
    waystones.some(stone=>Math.hypot(x-stone.x,z-stone.z)<r+3.1)||
    (x>106&&x<129&&z>64&&z<110&&trailDistance(x,z)<r+3.2);
  const nearCache=(x:number,z:number,r:number)=>addedChestSites.some(chest=>Math.hypot(x-chest.x,z-chest.z)<r+1.35);
  for(let i=0;i<5100;i++){
    const x=(rand()*2-1)*extent,z=(rand()*2-1)*extent;
    if((!inForest(x,z)&&rand()>.025)||trailDistance(x,z,oldTrails)<5||bank(x,z)<11||clearing(x,z)<14||landmarkDistance(x,z)<13) continue;
    const y=height(x,z),h=4+rand()*7,rot=rand()*6.3;
    const reserved=nearCache(x,z,h*.08)||reservedSite(x,z,h*.08);
    if(!reserved) write(trunkGeo,wood,x,y+h*.28,z,h*.13,h*.62,h*.13,rot);
    for(let j=0;j<3;j++){
      const r=h*(.29-j*.058);
      tint.setHSL(.26+rand()*.06,.19,.34+rand()*.31);
      if(!reserved) write(treeGeo,foliage,x,y+h*(.60+j*.16),z,r,h*.53,r,rot+j,tint);
    }
    if(!reserved) obstacles.push({x,z,r:h*.08});
  }
  const rocks:{x:number;z:number;r:number}[]=[];
  for(let i=0;i<480;i++){
    const x=(rand()*2-1)*extent,z=(rand()*2-1)*extent,r=.65+rand()*2.1;
    if(trailDistance(x,z,oldTrails)<4||clearing(x,z)<12||bank(x,z)<8||landmarkDistance(x,z)<12) continue;
    const rotation=rand()*6;
    if(nearCache(x,z,r)||reservedSite(x,z,r)) continue;
    write(rockGeo,stone,x,height(x,z)+r*.36,z,r,r*.76,r*.86,rotation);
    rocks.push({x,z,r:r*.88});
  }
  for(const {x,z,r} of cacheBoulders){
    write(rockGeo,stone,x,height(x,z)+r*.44,z,r*1.26,r,r,.8);
    rocks.push({x,z,r});
  }
  for(const {geometry,material,entries} of batches.values()){
    const mesh=new T.InstancedMesh(geometry,material,entries.length);
    entries.forEach(({matrix,color},i)=>{
      mesh.setMatrixAt(i,matrix);
      if(color) mesh.setColorAt(i,color);
    });
    mesh.castShadow=true;
    mesh.receiveShadow=true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
  }
  obstacles.push(...rocks);
  const block=new T.BoxGeometry();
  const place=(mat:T.Material,x:number,y:number,z:number,w:number,h:number,d:number)=>{
    const mesh=new T.Mesh(block,mat);
    mesh.position.set(x,y,z); mesh.scale.set(w,h,d);
    mesh.castShadow=true; mesh.receiveShadow=true; scene.add(mesh);
    return mesh;
  };
  for(const bridge of bridges){
    for(let i=-12;i<=12;i++) place(wood,bridge.x+i,1.48,bridge.z,1,.24,5.1);
    for(const offset of [-2.45,2.45]){
      const z=bridge.z+offset;
      place(wood,bridge.x,2.55,z,24.9,.22,.15);
      for(let i=-11;i<=11;i+=4) place(wood,bridge.x+i,2,z,.25,1.2,.28);
    }
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
  // Reserve the ground around each landmark before scattering rocks and trees.
  const towerX=169,towerZ=-168,towerY=height(towerX,towerZ);
  for(const dx of [-3,3]){
    place(stone,towerX+dx,towerY+4,towerZ,2,10,9);
    obstacles.push({x:towerX+dx,z:towerZ,r:4});
  }
  place(stone,towerX,towerY+7,towerZ,5,5,8);
  for(const dx of [-3,0,3]) place(stone,towerX+dx,towerY+10,towerZ+4,1.4,1.5,1.5);

  const caveX=-187,caveZ=-122,caveY=height(caveX,caveZ);
  const dark=new T.MeshStandardMaterial({color:'#101619',roughness:1});
  place(dark,caveX,caveY+1.7,caveZ-.3,4,3.5,.4);
  for(const [dx,dy,width] of [[-3,1.4,3],[3,1.4,3],[-1.8,3.8,2.7],[1.2,4.3,3.4]]){
    const rock=new T.Mesh(rockGeo,stone);
    rock.position.set(caveX+dx,caveY+dy,caveZ-1);
    rock.scale.set(width,2.35,3.4);
    rock.rotation.y=dx;
    rock.castShadow=true; scene.add(rock);
  }
  obstacles.push({x:caveX,z:caveZ-2,r:4});

  const canvas=new T.MeshStandardMaterial({color:'#79634b',side:T.DoubleSide});
  for(const dx of [-4,4]){
    const x=-189+dx,z=62,y=height(x,z);
    const tent=new T.Mesh(new T.CylinderGeometry(0,2.4,2.45,4),canvas);
    tent.position.set(x,y+1.22,z);
    tent.rotation.y=.25; tent.castShadow=true; scene.add(tent);
    obstacles.push({x,z,r:1.8});
  }
  const restX=154,restZ=103,restY=height(restX,restZ);
  for(let i=0;i<8;i++){
    const angle=i*Math.PI/4;
    place(stone,restX+Math.cos(angle)*1.3,restY+.21,restZ+Math.sin(angle)*1.3,.62,.45,.65);
  }
  place(wood,restX,restY+.24,restZ,1.4,.3,.42);
  const embers=new T.Mesh(rockGeo,new T.MeshStandardMaterial({color:'#e7a556',emissive:'#e86c20',emissiveIntensity:1.4}));
  embers.position.set(restX,restY+.43,restZ);
  embers.scale.set(.5,.38,.45); scene.add(embers);
  const lantern=new T.PointLight('#ff963a',52,20,2);
  lantern.position.set(restX,restY+1.4,restZ); scene.add(lantern);
  obstacles.push({x:restX,z:restZ,r:1.3});

  const fireY=height(-45,0);
  for(let i=0;i<9;i++){
    const a=i*Math.PI*2/9;
    const rock=new T.Mesh(rockGeo,stone);
    rock.position.set(-45+Math.cos(a)*1.12,fireY+.25,Math.sin(a)*1.12);
    rock.scale.setScalar(.39); scene.add(rock);
  }
  for(let i=0;i<3;i++) place(wood,-45,fireY+.23,0,1.5,.28,.28).rotation.y=i*1.1;
  obstacles.push({x:-45,z:0,r:1.04});
  huntScenery(scene,obstacles);
  const animateCamp=buildOrcCamp(scene,obstacles);
  const animateRitual=buildRitualGrounds(scene,obstacles);
  const tower=briarScenery(scene,obstacles);
  return {obstacles,rocks,fireY,animateCamp,animateRitual,tower};
}
