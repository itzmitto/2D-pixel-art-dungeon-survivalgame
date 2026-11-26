import * as T from 'three';
import { bossCaves, caveAt, caveExit, caveWalkable } from './bossCaves.ts';
import { height, randomSequence } from './layout.ts';
import { loft, meshPart, rigidBatcher, shapedPlate } from './creatureGeometry.ts';

export function caveScenery(scene:T.Scene,obstacles:{x:number;z:number;r:number}[]){
  const slab=new T.DodecahedronGeometry(1,0).scale(1,.72,1);
  const stone=new T.MeshStandardMaterial({color:0x5f5b61,roughness:.94,flatShading:true});
  const basalt=new T.MeshStandardMaterial({color:0x43414f,roughness:.95});
  const frozen=new T.MeshStandardMaterial({color:0x647d91,metalness:.29,roughness:.39});
  const voidMaterial=new T.MeshBasicMaterial({color:0x080714});
  const amber=new T.MeshBasicMaterial({color:0xffa86d,toneMapped:false});
  const blue=new T.MeshBasicMaterial({color:0x8edafa,toneMapped:false});
  const crystal=new T.MeshStandardMaterial({color:0x669bdb,emissive:0x33639b,emissiveIntensity:.68,metalness:.27,roughness:.42});
  const timber=new T.MeshStandardMaterial({color:0x44352e,roughness:.98});
  const tile=new T.BoxGeometry(1,1,1);
  const crystalForm=loft([[0,.095,-.11,.11],[.25,.24,-.22,.24],[.81,.20,-.15,.14],[1.32,.04,-.039,.035],[1.47,.002,-.003,.003]],6).rotateX(-Math.PI/2);
  const arch=shapedPlate([[-2.0,0],[2.0,0],[1.94,1.7],[1.48,2.75],[.77,3.35],[-.8,3.42],[-1.67,2.59],[-2.0,1.67]],.12,.035);
  const rune=shapedPlate([[0,.37],[-.10,.10],[-.31,.039],[-.08,-.065],[-.015,-.35],[.062,-.035],[.29,.064],[.074,.13]],.015,.008);
  const ring=new T.RingGeometry(.92,1.02,32).rotateX(-Math.PI/2);
  const dust=new T.OctahedronGeometry(.08);
  const stamp=new T.Object3D(), tint=new T.Color(), random=randomSequence(1023), batch=rigidBatcher();
  const views=bossCaves.map(cave=>{
    const ice=cave.kind==='frostGuardian', light=ice?blue:amber, ground=ice?frozen:basalt;
    const entry=new T.Group(), arena=new T.Group();
    const at=height(cave.x,cave.z);
    entry.position.set(cave.x,at,cave.z-1.35);
    for(const [x,y,z,w,h,d] of [[-3.04,1.14,-.87,2.19,2.37,2.78],[3.04,1.28,-1.02,2.18,2.68,2.43],
      [-1.72,2.90,-1.12,1.92,1.47,2.54],[.26,3.45,-1.90,2.94,1.54,2.84],[2.16,3,-1.55,1.68,1.53,2.35],
      [0,2.27,-3.96,4.27,2.93,2.76],[-3.94,.52,-1.37,1.31,1.41,1.74],[4.02,.42,-1.19,1.39,1.32,1.71]]){
      const rock=meshPart(entry,slab,ground,x,y,z);rock.scale.set(w,h,d);rock.rotation.set(x*.19,z*.37,-x*.28);
    }
    meshPart(entry,arch,voidMaterial,0,.014,-1.48);
    for(const side of [-1,1]){
      const marker=meshPart(entry,slab,stone,side*2.53,.57,1.36);
      marker.scale.set(.48,1.04,.38);marker.rotation.z=side*.09;
      meshPart(entry,rune,light,side*2.53,.83,1.68).scale.setScalar(.66);
      obstacles.push({x:cave.x+side*2.53,z:cave.z+.01,r:.47});
    }
    meshPart(entry,rune,light,0,3.38,.24);
    meshPart(entry,ring,light,0,.039,1.47).scale.setScalar(1.42);
    obstacles.push({x:cave.x,z:cave.z-4.25,r:2.45},
      {x:cave.x-3.1,z:cave.z-2.2,r:1.63},{x:cave.x+3.1,z:cave.z-2.2,r:1.63});
    batch.bake(entry);scene.add(entry);

    const grid=[] as [number,number][];
    for(let x=-20;x<=20;x+=2) for(let z=-20;z<=20;z+=2)
      if(caveWalkable(x,cave.arena+z)) grid.push([x,z]);
    const tiles=new T.InstancedMesh(tile,ground,grid.length);
    grid.forEach(([x,z],i)=>{
      stamp.position.set(x,-.19,cave.arena+z);stamp.scale.set(2.04,.36,2.04);stamp.rotation.set(0,0,0);
      stamp.updateMatrix();tiles.setMatrixAt(i,stamp.matrix);
      tint.setHSL(ice?.59+random()*.055:.69+random()*.043,ice?.24:.10,.48+random()*.20);
      tiles.setColorAt(i,tint);
    });
    tiles.receiveShadow=true;tiles.computeBoundingSphere();arena.add(tiles);
    for(let i=0;i<40;i++){
      const angle=i*Math.PI*2/40,r=1+(i%3)*.014;
      const x=Math.sin(angle)*(ice?18:17)*r,z=cave.arena+Math.cos(angle)*19.25*r;
      const rock=meshPart(arena,slab,ground,x,.79+random()*.8,z);
      rock.scale.set(1.26+random()*1.28,3.1+random()*2.9,1.52+random()*1.19);
      rock.rotation.set(random()*.32,angle,i*.392);
      if(i%3===0){
        if(ice){
          for(let j=0;j<4;j++){
            const mesh=meshPart(arena,crystalForm,crystal,x*.86+(j-1.5)*.28,.04,cave.arena+(z-cave.arena)*.86);
            mesh.rotation.set(j*.31,angle,-.47+j*.26);mesh.scale.set(.90+j*.17,1+j*.49,1);
          }
        }else{
          const banner=meshPart(arena,tile,timber,x*.94,1.01,cave.arena+(z-cave.arena)*.94);
          banner.scale.set(.51,1.91,.37);banner.rotation.y=angle;
          const pole=meshPart(arena,crystalForm,light,banner.position.x,1.96,banner.position.z);
          pole.scale.set(.45,.64,.45);
        }
      }
    }
    for(const r of ice?[3.62,6.42,10.1]:[4.2,9.9]){
      meshPart(arena,ring,light,0,.044,cave.arena-1).scale.setScalar(r);
    }
    const exit=caveExit(cave);
    meshPart(arena,arch,stone,0,0,exit.z+1.39).scale.set(.74,.80,1);
    meshPart(arena,arch,voidMaterial,0,.026,exit.z+1.34).scale.set(.66,.75,1);
    meshPart(arena,rune,light,0,1.41,exit.z+1.24);
    const motes=new T.InstancedMesh(dust,light,26);
    motes.instanceMatrix.setUsage(T.DynamicDrawUsage);motes.frustumCulled=false;
    batch.bake(arena);arena.add(motes);arena.visible=false;scene.add(arena);
    return {cave,entry,arena,motes};
  });
  const roomLight=new T.PointLight(0x9ad6ff,36,35,2);
  roomLight.visible=false;scene.add(roomLight);
  return {
    update(time:number,p:T.Vector3){
      const inside=caveAt(p.z);
      roomLight.visible=!!inside;
      if(inside){
        roomLight.color.setHex(inside.kind==='warlord'?0xff8e58:0x8fbaff);
        roomLight.position.set(0,6,inside.arena+3);
      }
      for(const {cave,entry,arena,motes} of views){
        entry.visible=!inside&&Math.hypot(p.x-cave.x,p.z-cave.z)<98;
        arena.visible=inside===cave;
        if(!arena.visible) continue;
        for(let i=0;i<motes.count;i++){
          const phase=(time*.28+i*.379)%1,angle=i*2.399+time*.22;
          const radius=2+i%11;
          stamp.position.set(Math.sin(angle)*radius,.13+phase*3.6,cave.arena+Math.cos(angle)*radius);
          stamp.rotation.set(angle,phase*5,i);stamp.scale.setScalar(Math.sin(phase*Math.PI)*.85);
          stamp.updateMatrix();motes.setMatrixAt(i,stamp.matrix);
        }
        motes.instanceMatrix.needsUpdate=true;
      }
    },
    dispose(){batch.dispose();},
  };
}
