import * as T from 'three';
import { fracturedRock, weatherStone } from './rockDetail.ts';
import { den, denWalkable } from './denLayout';
import { randomSequence, surface } from './layout';

export function denScenery(scene:T.Scene){
  const slate=new T.MeshStandardMaterial({color:0x34343e,roughness:1});
  const basalt=new T.MeshStandardMaterial({color:0x262633,roughness:.94});
  weatherStone(slate,.12);
  weatherStone(basalt,.12);
  const glow=new T.MeshStandardMaterial({color:0x637d99,emissive:0x476888,emissiveIntensity:.85,roughness:.35});
  const rune=new T.MeshBasicMaterial({color:0x8faccc,transparent:true,opacity:.79});
  const rockGeo=fracturedRock(157,'pillar');
  const wallGeo=new T.BoxGeometry(1,1,1);
  const crystal=new T.OctahedronGeometry(1);
  const rand=randomSequence(591);
  function portal(x:number,z:number){
    const y=surface(x,z);
    const stone=new T.Mesh(new T.TorusGeometry(1.67,.28,6,18),basalt);
    stone.position.set(x,y+1.83,z);scene.add(stone);
    const inner=new T.Mesh(new T.TorusGeometry(1.42,.055,6,32),rune);
    inner.position.copy(stone.position);scene.add(inner);
    const disc=new T.Mesh(new T.CircleGeometry(1.37,28),new T.MeshBasicMaterial({
      color:0x426183,transparent:true,opacity:.56,side:T.DoubleSide,depthWrite:false,
    }));
    disc.position.copy(stone.position);scene.add(disc);
    return {inner,disc};
  }
  const portals=[portal(den.gate.x,den.gate.z),portal(den.exit.x,den.exit.z)];
  const floor=new T.InstancedMesh(wallGeo,slate,2200);
  const walls=new T.InstancedMesh(rockGeo,basalt,650);
  floor.count=walls.count=0;
  const transform=new T.Object3D();
  function instance(mesh:T.InstancedMesh,x:number,y:number,z:number,sx:number,sy:number,sz:number,yaw:number){
    transform.position.set(x,y,z);transform.scale.set(sx,sy,sz);transform.rotation.set(0,yaw,0);
    transform.updateMatrix();mesh.setMatrixAt(mesh.count++,transform.matrix);
  }
  for(let z=304;z<389;z+=2) for(let x=-20;x<=26;x+=2){
    if(!denWalkable(x,z)) continue;
    instance(floor,x,-.4,z,2.04,.8,2.04,0);
    if(![[2,0],[-2,0],[0,2],[0,-2]].some(([dx,dz])=>!denWalkable(x+dx,z+dz))) continue;
    // Place tall stones on the exterior side of the corridor boundary.
    for(const [dx,dz] of [[2,0],[-2,0],[0,2],[0,-2]]) if(!denWalkable(x+dx,z+dz)){
      instance(walls,x+dx*.85,1.7,z+dz*.85,1.26+rand()*.4,2.2+rand()*.9,1.46,rand()*6);
    }
  }
  walls.castShadow=true;floor.receiveShadow=true;
  scene.add(floor,walls);
  for(const [x,z] of [[-5,379],[5,372],[-9,351],[19,345],[-14,320],[13,311],[11,326]]){
    for(let i=0;i<4;i++){
      const mesh=new T.Mesh(crystal,glow);
      mesh.position.set(x+rand()*1.1,.5+rand()*.22,z+rand()*.8);
      mesh.scale.set(.17+rand()*.2,.65+rand()*.62,.27);
      mesh.rotation.z=rand()*.6-.3;scene.add(mesh);
    }
  }
  return (time:number)=>{
    for(const {inner,disc} of portals){
      inner.scale.setScalar(1+Math.sin(time*2.5)*.025);
      disc.material.opacity=.44+Math.sin(time*2.3)*.10;
    }
  };
}
