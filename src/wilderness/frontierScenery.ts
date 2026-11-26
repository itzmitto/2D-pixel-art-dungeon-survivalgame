import * as T from 'three';
import { fracturedRock, weatherStone } from './rockDetail';
import { fieldNoise, groundMaterial as detailedGround } from './surfaceDetail';
import { fallsX, fortress, frontierAt, frontierCamps, frontierLandmarks, frontierRegions, frontierStones, highlandRiver, marshBridge, marshes, marshWaterLevel, routeDistance, waterfall } from './frontier.ts';
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
  const naturalStone=weatherStone(new T.MeshStandardMaterial({color:0x79818b,roughness:.84}),.55);
  const cliffStone=weatherStone(new T.MeshStandardMaterial({color:0x707480,roughness:.9}),.36);
  const groundMaterial=detailedGround();
  const waterMaterial=new T.MeshStandardMaterial({color:0x406d8a,roughness:.23,metalness:.38,transparent:true,opacity:.78,side:T.DoubleSide});
  const bogWater=waterMaterial.clone();
  bogWater.color.set(0x244b42);bogWater.opacity=.9;
  const stem=new T.MeshStandardMaterial({color:0x4f625b,roughness:.94});
  const caps=new T.MeshStandardMaterial({color:0x72dfb7,emissive:0x26785e,emissiveIntensity:.84,roughness:.56});
  const mist=new T.ShaderMaterial({
    transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{clock:{value:0}},
    vertexShader:`varying vec2 p;void main(){p=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 p;uniform float clock;void main(){
      float edge=pow(max(0.,1.-dot(p,p)),1.35);
      float current=.60+.31*sin(p.x*8.+sin(p.y*5.+clock*.32)*2.+clock*.55);
      gl_FragColor=vec4(.27,.58,.55,edge*current*.27);
    }`,
  });
  const streamClock={value:0};
  waterMaterial.onBeforeCompile=shader=>{
    shader.uniforms.streamTime=streamClock;
    shader.vertexShader='varying vec3 streamPos;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nstreamPos=position;');
    shader.fragmentShader='uniform float streamTime; varying vec3 streamPos;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float streak=pow(.5+.5*sin(streamPos.x*7.+streamPos.y*1.9+streamPos.z*1.4-streamTime*5.+sin(streamPos.z*3.2)),8.);
      diffuseColor.rgb+=vec3(.18,.29,.36)*streak;`);
  };
  bogWater.onBeforeCompile=waterMaterial.onBeforeCompile;
  const rock=fracturedRock(559,'slab'), shardRock=fracturedRock(317,'pillar'), blockRock=fracturedRock(101), box=new T.BoxGeometry(), cone=new T.ConeGeometry(1,1,7);
  const log=new T.CylinderGeometry(.65,1,1,7), shard=new T.OctahedronGeometry(1);
  const cap=new T.SphereGeometry(1,8,4,0,Math.PI*2,0,Math.PI/2);
  const mistPlane=new T.PlaneGeometry(34,21).rotateX(-Math.PI/2);
  const arch=shapedPlate([[-1,0],[1,0],[1,1.85],[.72,2.64],[0,3.46],[-.72,2.64],[-1,1.85]],.19,.041);
  const geometries:T.BufferGeometry[]=[rock,shardRock,blockRock,box,cone,log,shard,arch,cap,mistPlane];
  const batch=rigidBatcher();
  const chunks:{root:T.Group;x:number;z:number;swamp:boolean}[]=[];
  function block(parent:T.Group,m:T.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number,geo:T.BufferGeometry=box){
    const mesh=meshPart(parent,geo,m,x,y,z);mesh.scale.set(sx,sy,sz);return mesh;
  }
  type Prop=[number,number,number,number,number,number,number];
  function instances(root:T.Group,props:Prop[],geo:T.BufferGeometry,mat:T.Material,shadows=true,randomTint=random){
    if(!props.length) return;
    const mesh=new T.InstancedMesh(geo,mat,props.length);
    props.forEach(([x,y,z,w,h,d,a],i)=>{
      stamp.position.set(x,y,z);stamp.scale.set(w,h,d);stamp.rotation.set(0,a,0);stamp.updateMatrix();
      mesh.setMatrixAt(i,stamp.matrix);mesh.setColorAt(i,tint.setScalar(.67+randomTint()*.33));
    });
    mesh.castShadow=shadows;mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);
  }
  const fractureRandom=randomSequence(seed^0x37f1b9);
  const protectedSpots=[...frontierLandmarks,...frontierStones,...frontierCamps,...bossCaves,...worldChests];
  const shale=new T.Color(0x566176), gravel=new T.Color(0x8a8073), tundra=new T.Color(0x414f4d), frost=new T.Color(0x9aacba);
  const silt=new T.Color(0x343f37), moss=new T.Color(0x4e6452), wet=new T.Color(0x233d38);
  for(const region of frontierRegions) for(let startZ=region.north;startZ<region.south;startZ+=44) for(let startX=-110;startX<110;startX+=44){
    const swamp=region.id==='mournshade';
    const root=new T.Group(), geo=new T.PlaneGeometry(44,44,32,32).rotateX(-Math.PI/2).translate(startX+22,0,startZ+22);
    const pos=geo.attributes.position, colors:number[]=[], masks:number[]=[];
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),z=pos.getZ(i), y=height(x,z);
      const road=routeDistance(x,z,region.road);
      const nearRoad=1-T.MathUtils.smoothstep(road,1.8,5.4);
      const incline=Math.hypot(height(x+.56,z)-height(x-.56,z),height(x,z+.56)-height(x,z-.56));
      const cliff=swamp?0:T.MathUtils.smoothstep(incline,.40,1.3)*T.MathUtils.smoothstep(y,8,19)*(1-nearRoad);
      const rough=fieldNoise(x*.33,z*.31);
      pos.setY(i,y+cliff*(rough-.5)*.70);
      const floorMoisture=swamp?1-T.MathUtils.smoothstep(y,marshWaterLevel-.24,1.6):0;
      if(swamp){
        tint.copy(silt).lerp(moss,.29+rough*.68).lerp(wet,floorMoisture*.86);
      }else tint.copy(tundra).lerp(shale,Math.max(cliff,.21+rough*.42)).lerp(frost,T.MathUtils.smoothstep(y,24,48)*(.34+rough*.62))
        .lerp(gravel,nearRoad);
      colors.push(tint.r,tint.g,tint.b);
      masks.push(nearRoad,floorMoisture,cliff);
    }
    geo.setAttribute('terrainMask',new T.Float32BufferAttribute(masks,3));
    geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();geometries.push(geo);
    const mesh=new T.Mesh(geo,groundMaterial);mesh.receiveShadow=true;root.add(mesh);
    const trunks:Prop[]=[], pines:Prop[]=[], rocks:Prop[]=[], crystals:Prop[]=[], mushrooms:Prop[]=[], stalks:Prop[]=[];
    let reedTintSamples=0;
    const branches=new T.Group(), waterGeo=new T.PlaneGeometry(44,44).rotateX(-Math.PI/2).translate(startX+22,marshWaterLevel,startZ+22);
    if(swamp){geometries.push(waterGeo);root.add(new T.Mesh(waterGeo,bogWater));root.add(branches);}
    else waterGeo.dispose();
    for(let i=0;i<122;i++){
      const x=startX+random()*44,z=startZ+random()*44,y=height(x,z);
      if(z>-244||routeDistance(x,z,region.road)<4.8||highlandRiver(x,z)||
        protectedSpots.some(p=>Math.hypot(x-p.x,z-p.z)<(p===fortress?25:5))) continue;
      const a=random()*6.28;
      if(swamp){
        if(y>.43&&y<1.4){
          // Keep the saved seed's downstream scenery placements stable.
          for(let j=0;j<18;j++) random();
          reedTintSamples+=6;
        }
        if(random()<.23){
          const h=2.2+random()*4.6,r=.19+random()*.23;
          trunks.push([x,y+h*.47,z,r,h,r,a]);
          for(const side of [-1,1]){
            const branch=block(branches,wood,x+side*h*.17,y+h*.69,z+Math.sin(a)*h*.10,r*.62,h*.54,r*.65,log);
            branch.rotation.set(.19*side,a,-side*.84);
          }
          if(y>marshWaterLevel) obstacles.push({x,z,r:r*.87});
        }else if(y>.84&&random()<.46){
          for(let j=0;j<4;j++){
            const xx=x+Math.cos(j*2.39)*j*.25,zz=z+Math.sin(j*2.39)*j*.25;
            const base=height(xx,zz), h=.11+random()*.42;
            stalks.push([xx,base+h*.47,zz,.051,h,.051,a]);
            mushrooms.push([xx,base+h*.91,zz,h*.66,h*.42,h*.66,a]);
          }
        }
      }else if(y<18&&random()<.57){
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
    const shelves:Prop[]=[], ribs:Prop[]=[], chips:Prop[]=[];
    for(let i=0;i<(swamp?32:148);i++){
      const x=startX+fractureRandom()*44,z=startZ+fractureRandom()*44,y=height(x,z);
      if(z>-262||routeDistance(x,z,region.road)<9||highlandRiver(x,z)||
        protectedSpots.some(p=>Math.hypot(x-p.x,z-p.z)<(p===fortress?29:11))) continue;
      const dx=height(x+1.3,z)-height(x-1.3,z),dz=height(x,z+1.3)-height(x,z-1.3);
      const slope=Math.hypot(dx,dz);
      if(swamp&&y<.32||!swamp&&y<7.4) continue;
      const size=.16+fractureRandom()**2*.54;
      chips.push([x,y-.035,z,size,size*.53,size*.86,fractureRandom()*6.28]);
      if(swamp||slope<2.25||y<13) continue;
      const scale=1.55+fractureRandom()*4.4,a=Math.atan2(dx,dz);
      if(i%4) shelves.push([x,y-scale*.44,z,scale*1.35,scale*.68,scale,a+.13]);
      else ribs.push([x,y-scale*.48,z,scale*.81,scale*1.65,scale*.79,a]);
      for(let j=0;j<3;j++){
        const d=(j+1)*.56, xx=x-Math.sin(a)*d,zz=z-Math.cos(a)*d,s=size*(1.58-j*.3);
        chips.push([xx,height(xx,zz)-.05,zz,s,s*.83,s*.86,a+j]);
      }
    }
    instances(root,shelves,rock,cliffStone,true,fractureRandom);
    instances(root,ribs,shardRock,cliffStone,true,fractureRandom);
    instances(root,chips,blockRock,naturalStone,false,fractureRandom);
    instances(root,trunks,log,wood);instances(root,pines,cone,needles);instances(root,rocks,rock,naturalStone);
    instances(root,crystals,shard,crystal,false);
    if(swamp){
      instances(root,stalks,log,stem,false);instances(root,mushrooms,cap,caps,false);
      for(let i=0;i<reedTintSamples;i++) random();
      batch.bake(branches);
      for(let i=0;i<3;i++){
        const haze=new T.Mesh(mistPlane,mist);
        haze.position.set(startX+8+random()*28,.68+i*.21,startZ+6+random()*30);
        haze.rotation.y=i*1.1;root.add(haze);
      }
    }
    scene.add(root);chunks.push({root,x:startX+22,z:startZ+22,swamp});
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
    block(aqueduct,cliffStone,x,fallY+1.6,waterfall.z-2.5,1.45,4.2,2.1,rock);
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
  const boardwalk=new T.Group(), planks:Prop[]=[], pilings:Prop[]=[];
  for(let i=1;i<marshes.road.length;i++){
    const [ax,az]=marshes.road[i-1], [bx,bz]=marshes.road[i];
    const dx=bx-ax,dz=bz-az,length=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz);
    const count=Math.ceil(length/.49);
    for(let j=0;j<count;j++){
      const x=ax+dx*j/count,z=az+dz*j/count;
      if(!marshBridge(x,z)) continue;
      const y=surface(x,z);
      planks.push([x,y-.081,z,6.18+random()*.16,.20,.54,yaw]);
      if(j%6===0) for(const side of [-1,1]){
        const px=x+side*Math.cos(yaw)*2.92,pz=z-side*Math.sin(yaw)*2.92;
        pilings.push([px,y-.30,pz,.21,1.47,.21,yaw]);
      }
    }
  }
  instances(boardwalk,planks,box,wood);instances(boardwalk,pilings,log,wood);
  const camps=new T.Group(), bogRuins=new T.Group();
  for(const site of frontierLandmarks.filter(site=>site.kind==='camp'||site.kind==='ruin')){
    const swamp=site.z<marshes.south, root=swamp?bogRuins:camps;
    if(swamp&&site.kind==='ruin'){
      const y=height(site.x,site.z);
      for(let i=0;i<4;i++){
        const x=site.x+(i-1.5)*2.4;
        block(root,naturalStone,x,y+.93,site.z-2.6,1.14,2.1+i*.17,1.02,rock);
        block(root,slate,x,y-.15,site.z-1.4,2.15,.55,2.15);
      }
      block(root,slate,site.x,y+1.65,site.z-3,1.65,1.25,.77,arch).rotation.z=.21;
    }
    for(let i=0;i<12;i++){
      const angle=i*2.399,r=5+random()*5,x=site.x+Math.sin(angle)*r,z=site.z+Math.cos(angle)*r;
      const y=height(x,z);
      if(site.kind==='camp'){
        block(root,wood,x,y+.95,z,.16,2.2+random(),.19).rotation.z=.16*Math.sin(i);
        if(i%4===0) block(root,torch,x,y+2.4,z,.24,.48,.24,shard);
      }else block(root,naturalStone,x,y+.5,z,.88,1.5+random()*1.8,1.08,rock);
    }
  }
  for(const root of [aqueduct,keep,camps,boardwalk,bogRuins]){batch.bake(root);scene.add(root);}
  return {
    update(time:number,p:T.Vector3){
      streamClock.value=time;mist.uniforms.clock.value=time;
      const near=!!frontierAt(p.z)||p.z>-245&&p.z<-160;
      for(const {root,x,z,swamp} of chunks) root.visible=near&&Math.hypot(p.x-x,p.z-z)<(swamp?86:133);
      aqueduct.visible=near&&Math.abs(p.z+317)<109;
      keep.visible=near&&Math.abs(p.z-fortress.z)<109;
      boardwalk.visible=near&&p.z<-445;bogRuins.visible=near&&p.z<-500;
      camps.visible=near&&Math.abs(p.z+369)<108;
    },
    dispose(){
      batch.dispose();
      for(const resource of [...geometries,stone,slate,naturalStone,cliffStone,wood,needles,torch,crystal,groundMaterial,waterMaterial,bogWater,stem,caps,mist]) resource.dispose();
    },
  };
}
