import * as T from 'three';
import { fallsX, fortress, frontierAt, frontierCamps, frontierLandmarks, frontierStones, highlandRiver, highlands, routeDistance, waterfall } from './frontier.ts';
import { bossCaves } from './bossCaves.ts';
import { height, randomSequence, surface } from './layout.ts';
import { meshPart, rigidBatcher, shapedPlate } from './creatureGeometry.ts';
import { worldChests } from './treasure.ts';

export function frontierScenery(scene:T.Scene, obstacles:{x:number;z:number;r:number}[], seed:number){
  const random=randomSequence(seed^0xe7a915), stamp=new T.Object3D(), tint=new T.Color();
  const stone=new T.MeshStandardMaterial({color:0x737887,roughness:.92,flatShading:true});
  const slate=new T.MeshStandardMaterial({color:0x505866,roughness:1});
  const wood=new T.MeshStandardMaterial({color:0x503d36,roughness:.97});
  const needles=new T.MeshStandardMaterial({color:0x30483f,roughness:.96,flatShading:true});
  const torch=new T.MeshBasicMaterial({color:0xffaa5e,toneMapped:false});
  const crystal=new T.MeshStandardMaterial({color:0x73bdd3,emissive:0x256a9d,emissiveIntensity:.67,roughness:.3});
  const groundMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:1});
  const waterMaterial=new T.MeshStandardMaterial({color:0x406d8a,roughness:.23,metalness:.38,transparent:true,opacity:.78,side:T.DoubleSide});
  const streamClock={value:0};
  waterMaterial.onBeforeCompile=shader=>{
    shader.uniforms.streamTime=streamClock;
    shader.vertexShader='varying vec3 streamPos;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nstreamPos=position;');
    shader.fragmentShader='uniform float streamTime; varying vec3 streamPos;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float streak=pow(.5+.5*sin(streamPos.x*7.+streamPos.y*1.9+streamPos.z*1.4-streamTime*5.+sin(streamPos.z*3.2)),8.);
      diffuseColor.rgb+=vec3(.18,.29,.36)*streak;`);
  };
  const rock=new T.DodecahedronGeometry(1,0), box=new T.BoxGeometry(), cone=new T.ConeGeometry(1,1,7);
  const log=new T.CylinderGeometry(.65,1,1,7), shard=new T.OctahedronGeometry(1);
  const arch=shapedPlate([[-1,0],[1,0],[1,1.85],[.72,2.64],[0,3.46],[-.72,2.64],[-1,1.85]],.19,.041);
  const geometries:T.BufferGeometry[]=[rock,box,cone,log,shard,arch];
  const batch=rigidBatcher();
  const chunks:{root:T.Group;x:number;z:number}[]=[];
  function block(parent:T.Group,m:T.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number,geo:T.BufferGeometry=box){
    const mesh=meshPart(parent,geo,m,x,y,z);mesh.scale.set(sx,sy,sz);return mesh;
  }
  type Prop=[number,number,number,number,number,number,number];
  function instances(root:T.Group,props:Prop[],geo:T.BufferGeometry,mat:T.Material,shadows=true){
    if(!props.length) return;
    const mesh=new T.InstancedMesh(geo,mat,props.length);
    props.forEach(([x,y,z,w,h,d,a],i)=>{
      stamp.position.set(x,y,z);stamp.scale.set(w,h,d);stamp.rotation.set(0,a,0);stamp.updateMatrix();
      mesh.setMatrixAt(i,stamp.matrix);mesh.setColorAt(i,tint.setScalar(.67+random()*.33));
    });
    mesh.castShadow=shadows;mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);
  }
  const protectedSpots=[...frontierLandmarks,...frontierStones,...frontierCamps,...bossCaves,...worldChests];
  const shale=new T.Color(0x566176), gravel=new T.Color(0x8a8073), tundra=new T.Color(0x414f4d), frost=new T.Color(0x9aacba);
  for(let startZ=highlands.north;startZ<highlands.south;startZ+=44) for(let startX=-110;startX<110;startX+=44){
    const root=new T.Group(), geo=new T.PlaneGeometry(44,44,32,32).rotateX(-Math.PI/2).translate(startX+22,0,startZ+22);
    const pos=geo.attributes.position, colors=[];
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),z=pos.getZ(i), y=height(x,z);
      pos.setY(i,y);
      tint.copy(tundra).lerp(shale,.4+.3*Math.sin(x*.26+z*.21)).lerp(frost,T.MathUtils.smoothstep(y,23,43))
        .lerp(gravel,1-T.MathUtils.smoothstep(routeDistance(x,z,highlands.road),1.9,5.2));
      colors.push(tint.r,tint.g,tint.b);
    }
    geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();geometries.push(geo);
    const mesh=new T.Mesh(geo,groundMaterial);mesh.receiveShadow=true;root.add(mesh);
    const trunks:Prop[]=[], pines:Prop[]=[], rocks:Prop[]=[], crystals:Prop[]=[];
    for(let i=0;i<122;i++){
      const x=startX+random()*44,z=startZ+random()*44,y=height(x,z);
      if(z>-244||routeDistance(x,z,highlands.road)<5||highlandRiver(x,z)||
        protectedSpots.some(p=>Math.hypot(x-p.x,z-p.z)<(p===fortress?25:5))) continue;
      const a=random()*6.28;
      if(y<18&&random()<.57){
        const h=2.8+random()*4.6;
        trunks.push([x,y+h*.36,z,.16,h*.78,.16,a]);
        for(let layer=0;layer<3;layer++){
          const r=h*(.26-layer*.055);
          pines.push([x,y+h*(.50+layer*.19),z,r,h*.52,r,a+layer]);
        }
        obstacles.push({x,z,r:.24});
      }else{
        const r=.34+random()**2*1.7;
        rocks.push([x,y+r*.05,z,r,r*(.45+random()*.55),r*.75,a]);
        if(r>.97) obstacles.push({x,z,r:r*.62});
        if(random()<.16) crystals.push([x+.33,y+.37,z,.22,.57,.21,a]);
      }
    }
    instances(root,trunks,log,wood);instances(root,pines,cone,needles);instances(root,rocks,rock,stone);
    instances(root,crystals,shard,crystal,false);
    scene.add(root);chunks.push({root,x:startX+22,z:startZ+22});
  }
  const aqueduct=new T.Group();
  const strip:number[]=[], index:number[]=[];
  for(let i=0;i<=140;i++){
    const z=-349+i*.5,x=fallsX(z);
    for(const side of [-1,1]) strip.push(x+side*4.55,height(x,z)+.63,z);
    if(i>0){const j=i*2;index.push(j-2,j,j-1,j-1,j,j+1);}
  }
  const riverGeo=new T.BufferGeometry();
  riverGeo.setAttribute('position',new T.Float32BufferAttribute(strip,3));
  riverGeo.setIndex(index);riverGeo.computeVertexNormals();geometries.push(riverGeo);
  aqueduct.add(new T.Mesh(riverGeo,waterMaterial));
  const fallY=height(waterfall.x,waterfall.z);
  for(let i=0;i<7;i++){
    const x=waterfall.x+(i-3)*1.18;
    block(aqueduct,stone,x,fallY+1.6,waterfall.z-2.5,1.45,4.2,2.1,rock);
    block(aqueduct,waterMaterial,x,fallY+1.95,waterfall.z-.85,1.32,4.11,.13);
    block(aqueduct,waterMaterial,x,fallY-.29,waterfall.z+.2,1.78,.1,2.71);
  }
  for(let z=-342;z<=-285;z+=1.45){
    const y=surface(21,z);
    block(aqueduct,slate,21,y-.09,z,6.77,.32,1.48);
    if(Math.floor((z+342)/1.45)%2===0) for(const side of [-1,1]){
      block(aqueduct,stone,21+side*3.26,y+.35,z,.38,.86,1.46);
      block(aqueduct,stone,21+side*2.92,y-2.26,z,.67,4.4,.61);
    }
  }
  const keep=new T.Group();
  const at=surface(fortress.x,fortress.z);
  keep.position.set(fortress.x,at,fortress.z);
  block(keep,wood,0,0,-1.29,1.93,1.9,1,arch);
  block(keep,slate,0,5.95,-1.72,7.7,1.36,2.8);
  for(const side of [-1,1]){
    block(keep,stone,side*3.1,2.4,-1.8,1.95,5.5,3.7);
    block(keep,slate,side*9,2.25,-2,9.4,5.3,1.7);
    block(keep,slate,side*13,2.55,-11,1.85,6,18);
    for(const z of [-4,-23]){
      block(keep,stone,side*13,5.2,z,4.3,11.8,4.3,log);
      block(keep,slate,side*13,12.87,z,4.65,5.1,4.65,cone);
      block(keep,wood,side*13,6.1,z+3.48,.56,2.13,.18,arch);
    }
    for(let i=0;i<6;i++){
      block(keep,stone,side*(4+i*1.67),5.3,-2,1.07,.96,1.75);
      obstacles.push({x:fortress.x+side*(4+i*1.82),z:fortress.z-2,r:1.16});
      obstacles.push({x:fortress.x+side*13,z:fortress.z-5-i*2.7,r:1.45});
    }
    block(keep,wood,side*2.48,2.26,.29,.17,.83,.17);
    block(keep,torch,side*2.48,2.81,.29,.33,.58,.33,shard);
    block(keep,stone,side*5.13,.22,3,1.3,.64,1.18);
    block(keep,stone,side*5.13,1.28,3,.55,1.49,.42,rock);
    block(keep,stone,side*5.13,2.22,3,.32,.42,.30,rock);
    block(keep,slate,side*5.9,.29,3.96,.08,.98,.08).rotation.z=side*.85;
  }
  block(keep,slate,0,2.85,-22,26,6.1,1.9);
  for(let x=-12;x<=12;x+=2) obstacles.push({x:fortress.x+x,z:fortress.z-22,r:1.35});
  const camps=new T.Group();
  for(const site of frontierLandmarks.filter(site=>site.kind==='camp'||site.kind==='ruin')){
    for(let i=0;i<12;i++){
      const angle=i*2.399,r=5+random()*5,x=site.x+Math.sin(angle)*r,z=site.z+Math.cos(angle)*r;
      const y=height(x,z);
      if(site.kind==='camp'){
        block(camps,wood,x,y+.95,z,.16,2.2+random(),.19).rotation.z=.16*Math.sin(i);
        if(i%4===0) block(camps,torch,x,y+2.4,z,.24,.48,.24,shard);
      }else block(camps,stone,x,y+.5,z,.88,1.5+random()*1.8,1.08,rock);
    }
  }
  for(const root of [aqueduct,keep,camps]){batch.bake(root);scene.add(root);}
  return {
    update(time:number,p:T.Vector3){
      streamClock.value=time;
      const near=!!frontierAt(p.z)||p.z>-245&&p.z<-160;
      for(const {root,x,z} of chunks) root.visible=near&&Math.hypot(p.x-x,p.z-z)<133;
      aqueduct.visible=near&&Math.abs(p.z+317)<109;
      keep.visible=near&&Math.abs(p.z-fortress.z)<109;
      camps.visible=near&&Math.abs(p.z+369)<108;
    },
    dispose(){
      batch.dispose();
      for(const resource of [...geometries,stone,slate,wood,needles,torch,crystal,groundMaterial,waterMaterial]) resource.dispose();
    },
  };
}
