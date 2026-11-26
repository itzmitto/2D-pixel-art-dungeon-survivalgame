import * as T from 'three';
import { bank, clearing, extent, height, inForest, trailDistance, randomSequence } from './layout';
import { frontierAt, frontierCrossing, highlandRiver, highlands, marshes, marshWaterLevel, routeDistance } from './frontier';
import { obstacleGrid } from './spatial';
import { orcCamp, waystones } from './worldSites';
import { aureliaReserved } from './aurelia';
import { bossCaves } from './bossCaves';
import { worldChests } from './treasure';
import { fieldNoise } from './surfaceDetail';

const actorCount=12, gustCount=7, span=18, capacity=950;
const step=T.MathUtils.smoothstep;
type Plant='tussock'|'sedge'|'fern'|'flower'|'shrub'|'seed'|'fungi'|'litter';
type TerrainPoint={x:number;z:number;r:number};

function plantGeometry(kind:Plant,lod=0){
  const vertices:number[]=[],colors:number[]=[],bends:number[]=[],folds:number[]=[],triangles:number[]=[];
  const color=new T.Color();
  function vertex(x:number,y:number,z:number,tint:number,fiber:number,fold=.5){
    const index=vertices.length/3;
    vertices.push(x,y,z);bends.push(fiber);folds.push(fold);
    color.setHex(tint);colors.push(color.r,color.g,color.b);
    return index;
  }
  function blade(a:number,width:number,tall:number,lean:number,root:number,tint:number,shape=0,start=0,drift=0){
    const n=lod===2?2:lod===1?3:shape===2?6:5, rails=lod===2?2:3;
    const s=Math.sin(a),c=Math.cos(a),base=vertices.length/3;
    for(let i=0;i<=n;i++){
      const t=i/n, arc=t*t*(1.14-.14*t);
      const w=i===n?.0007:width*(1-t)**(shape===1?.52:.86)*(.57+.57*Math.sin(t*2.8+.31));
      const y=start+t*tall-lean*.16*t**4;
      const forward=root+lean*arc;
      for(let j=0;j<rails;j++){
        const side=2*j/(rails-1)-1, across=side*w+drift*t*t;
        const ridge=forward+(1-Math.abs(side))*w*(.45-.26*t);
        vertex(c*across+s*ridge,y,s*across-c*ridge,tint,t,j===1&&rails===3?1:.28);
      }
      if(i) for(let j=0;j<rails-1;j++){
        const k=base+i*rails+j;
        triangles.push(k-rails,k-rails+1,k,k,k-rails+1,k+1);
      }
    }
  }
  function leaf(x:number,y:number,z:number,a:number,length:number,width:number,rise:number,tint:number,fiber:number){
    const c=Math.cos(a),s=Math.sin(a),b=vertices.length/3;
    vertex(x,y,z,tint,fiber);
    vertex(x+c*length*.45-s*width,y+rise*.55,z+s*length*.45+c*width,tint,fiber);
    vertex(x+c*length*.49,y+rise*.93,z+s*length*.49,0xf0f9db,fiber,1);
    vertex(x+c*length*.45+s*width,y+rise*.53,z+s*length*.45-c*width,tint,fiber);
    vertex(x+c*length,y+rise,z+s*length,tint,fiber);
    triangles.push(b,b+1,b+2,b,b+2,b+3,b+1,b+4,b+2,b+2,b+4,b+3);
  }
  if(kind==='tussock'||kind==='sedge'){
    const n=lod===2?3:lod===1?5:8, sedge=kind==='sedge';
    for(let i=0;i<n;i++){
      const a=i*2.399+.27,h=.37+((i*71)%101)*.0076;
      blade(a,(sedge?.026:.039)+(i%4)*.012,h*(sedge?1.32:1),.12+(i%5)*.149,.02+i*.024,
        [0xddebd0,0xc0d6aa,0xf0ebcd,0xe3edd9][i%4],i%3,0,Math.sin(i*8.1)*.085);
    }
  }else if(kind==='fern'){
    for(let i=0;i<7;i++){
      const a=i*2.399,s=Math.sin(a),c=-Math.cos(a),h=.51+(i%3)*.093,r=.62+(i%2)*.19;
      blade(a,.014,h,r,.012,0xb7c87a);
      for(let j=1;j<9;j++){
        const t=j/9,d=.012+r*t*t,y=h*t-r*.16*t**4,len=.30*Math.sin(t*Math.PI)**.85;
        for(const side of [-1,1]) leaf(s*d,y,c*d,a-Math.PI/2+side*1.12,len,len*.25,.03,
          j%2?0xa1c576:0xd0df99,t);
      }
    }
  }else if(kind==='shrub'){
    for(let i=0;i<14;i++){
      const a=i*2.399,h=.20+(i%5)*.08,r=.15+(i%4)*.11;
      blade(a,.014,h+.04,r,.015,0x93805d);
      for(let j=1;j<=3;j++) for(const side of [-1,1]){
        const t=j/4,d=r*t*t;
        leaf(Math.sin(a)*d,h*t,-Math.cos(a)*d,a+side*.8,.18,.065,.07,
          i%3?0x79995b:0xb1b979,t);
      }
    }
  }else if(kind==='flower'||kind==='seed'){
    for(let i=0;i<4;i++){
      const a=i*2.399,h=.44+(i%3)*.16,r=.065+i*.103;
      blade(a,.010,h,r,.025,0x91aa61);
      const x=Math.sin(a)*(r+.025),z=-Math.cos(a)*(r+.025),y=h-r*.16;
      if(kind==='seed'){
        for(let k=0;k<9;k++) leaf(x,y+k*.021,z,a+k*2.4,.052,.023,.050,k%2?0xc5a470:0xe1ce92,1);
      }else{
        for(let j=0;j<6;j++) leaf(x,y,z,j*1.047,.104,.044,.012,
          i%2?0xa991c1:0xebe1c4,1);
        for(let j=0;j<5;j++) leaf(x,y+.017,z,j*1.257,.031,.019,.016,0xe3ad57,1);
      }
    }
  }else if(kind==='fungi'){
    for(let i=0;i<4;i++){
      const a=i*2.4,x=Math.cos(a)*i*.11,z=Math.sin(a)*i*.11,h=.16+i*.045,w=.075+i*.019;
      const top=vertex(x,h+w*.55,z,i%2?0xca936a:0xd4bc9a,0);
      const base=vertices.length/3;
      for(let j=0;j<9;j++){
        const p=j*Math.PI/4,c=Math.cos(p),s=Math.sin(p);
        vertex(x+c*w*.24,.008,z+s*w*.24,0x998977,0);
        vertex(x+c*w*.28,h,z+s*w*.28,0xddd3af,0);
        vertex(x+c*w,h-w*.13,z+s*w,i%2?0xb57552:0xc49a67,0);
        if(j){const k=base+j*3;triangles.push(k-3,k,k-2,k-2,k,k+1,k-2,k+1,k-1,k-1,k+1,k+2,k-1,k+2,top);}
      }
    }
  }else{
    for(let i=0;i<7;i++){
      const a=i*2.4;
      leaf(Math.cos(a)*.36,.019,Math.sin(a)*.33,a+.5,.11+(i%3)*.07,.041,.026,i%2?0xa9824c:0x8e6544,0);
    }
    for(let i=0;i<3;i++){
      const a=i*2.4;
      leaf(0,.042,0,a,.61,.029,.017,0x6f5140,0);
      leaf(Math.cos(a)*.28,.047,Math.sin(a)*.28,a+.57,.30,.019,.019,0x907056,0);
    }
  }
  const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(vertices,3))
    .setAttribute('color',new T.Float32BufferAttribute(colors,3))
    .setAttribute('flex',new T.Float32BufferAttribute(bends,1))
    .setAttribute('rib',new T.Float32BufferAttribute(folds,1)).setIndex(triangles);
  geometry.computeVertexNormals();
  return geometry;
}

export function meadow(scene:T.Scene,player:T.Vector3,obstacles:readonly TerrainPoint[],seed:number){
  const clock={value:0}, stride={value:new T.Vector4(0,0,1,0)};
  const actors=Array.from({length:actorCount},()=>new T.Vector4());
  const gusts=Array.from({length:gustCount},()=>new T.Vector4());
  const elements=Array.from({length:gustCount},()=>new T.Vector2());
  const grass=(['tussock','sedge'] as const).map(kind=>[0,1,2].map(lod=>plantGeometry(kind,lod)));
  const forms=(['fern','flower','shrub','seed','fungi','litter'] as const).map(kind=>plantGeometry(kind));
  const material=new T.MeshStandardMaterial({side:T.DoubleSide,roughness:.79,vertexColors:true});
  material.onBeforeCompile=s=>{
    Object.assign(s.uniforms,{windTime:clock,walker:stride,actors:{value:actors},gusts:{value:gusts},elements:{value:elements}});
    s.vertexShader=`
      attribute float flex,rib;
      uniform float windTime;
      uniform vec4 walker, actors[${actorCount}], gusts[${gustCount}];
      uniform vec2 elements[${gustCount}];
      varying vec4 vegetationLight;
      varying vec2 vegetationShape;
      vec2 pushAway(vec2 root,vec4 source){
        vec2 v=root-source.xy;
        float d=length(v);
        return v/max(d,.27)*(1.-smoothstep(.15,max(.18,source.z),d))*source.w;
      }
    `+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec3 root=instanceMatrix[3].xyz;
      float phase=fract(dot(root.xz,vec2(.372,.716)));
      float broad=sin(dot(root.xz,vec2(.155,.099))-windTime*1.43);
      float gust=pow(.5+.5*sin(dot(root.xz,vec2(.068,.054))-windTime*.89+
        sin(root.z*.089-windTime*.22)),6.);
      float eddy=sin(root.z*.57-root.x*.45+windTime*2.7)*.063;
      float flutter=sin(windTime*(4.7+phase*2.8)+phase*23.+position.x*9.)*.037*flex;
      vec2 sway=vec2(.86,.51)*(.076+broad*.107+gust*.53)+vec2(eddy+flutter,flutter-eddy);
      vegetationLight=vec4(0.);
      if(distance(root.xz,walker.xy)<39.){
        sway+=pushAway(root.xz,walker);
        for(int i=0;i<${actorCount};i++) sway+=pushAway(root.xz,actors[i]);
        for(int i=0;i<${gustCount};i++){
          vec4 event=gusts[i];
          float distanceToEvent=distance(root.xz,event.xy);
          float falloff=1.-smoothstep(event.z*.24,max(.06,event.z),distanceToEvent);
          float ring=sin(distanceToEvent*4.7-windTime*12.);
          sway+=pushAway(root.xz,event)*mix(.8,1.+.57*ring,step(3.,elements[i].x));
          float strength=falloff*elements[i].y;
          if(elements[i].x==1.) vegetationLight.x=max(vegetationLight.x,strength);
          if(elements[i].x==2.) vegetationLight.y=max(vegetationLight.y,strength);
          if(elements[i].x==3.) vegetationLight.z=max(vegetationLight.z,strength);
          if(elements[i].x==4.) vegetationLight.w=max(vegetationLight.w,strength);
        }
      }
      vec2 axisX=instanceMatrix[0].xz,axisZ=instanceMatrix[2].xz;
      float bend=max(0.,position.y)*flex;
      transformed.xz+=vec2(dot(axisX,sway)/max(.06,dot(axisX,axisX)),
        dot(axisZ,sway)/max(.06,dot(axisZ,axisZ)))*bend;
      transformed.y-=min(.47,length(sway)*.25)*bend;
      vegetationShape=vec2(position.y,rib);
    `);
    s.fragmentShader=`varying vec4 vegetationLight; varying vec2 vegetationShape;\n`+
      s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float tip=smoothstep(.015,.76,vegetationShape.x);
      diffuseColor.rgb*=mix(.37,1.15,tip)*mix(.88,1.12,vegetationShape.y);
      diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.49,.23,.13)+vec3(.034,.014,.006),vegetationLight.x*.86);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.28,.47,.56)*(.33+tip*.67),vegetationLight.y*.73);
      diffuseColor.rgb*=1.-vegetationLight.w*.19;`)
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      float transmit=max(0.,dot(normal,normalize(vec3(-.42,-.76,.33))));
      totalEmissiveRadiance+=diffuseColor.rgb*(.09+.22*transmit)*tip;
      totalEmissiveRadiance+=vec3(.27,.46,.79)*vegetationLight.z*(.18+.40*tip);
      totalEmissiveRadiance+=vec3(.052,.013,.001)*vegetationLight.x*tip;`);
  };
  const blockers=obstacleGrid(obstacles), brush=new T.Object3D(), tint=new T.Color();
  const patches=new Map<string,{mesh:T.InstancedMesh;flora:T.InstancedMesh[];count:number;biome:number}>();
  const palettes=[
    [0x456438,0x69794a,0x376946,0x7a8044,0x53693d],
    [0x526654,0x757e53,0x64704a,0x80906d,0x49594c],
    [0x466550,0x6c7740,0x396457,0x839059,0x536f44],
  ];
  function place(mesh:T.InstancedMesh,index:number,x:number,y:number,z:number,w:number,h:number,random:()=>number){
    brush.position.set(x,y,z);brush.rotation.set(0,random()*Math.PI*2,0);
    brush.scale.set(w,h,w*(.78+random()*.45));brush.updateMatrix();
    mesh.setMatrixAt(index,brush.matrix);mesh.setColorAt(index,tint);
  }
  function build(cx:number,cz:number){
    const x=cx*span,z=cz*span,region=frontierAt(z+span/2),biome=region===marshes?2:region===highlands?1:0;
    const random=randomSequence(seed^Math.imul(cx,105497)^Math.imul(cz,518357));
    const mesh=new T.InstancedMesh(grass[biome===2?1:0][0],material,capacity);
    const flora=forms.map(form=>new T.InstancedMesh(form,material,18));
    const counts=forms.map(()=>0);
    let count=0;
    for(let i=0;i<capacity;i++){
      const px=x+span*random(),pz=z+span*random();
      const rim=frontierAt(pz);
      if(pz<marshes.north||pz>=extent||Math.abs(px)>=(rim?109:extent)||aureliaReserved(px,pz,1)) continue;
      const patch=fieldNoise(px*.095,pz*.095),fine=fieldNoise(px*.34+42,pz*.34-21);
      const trail=rim?routeDistance(px,pz,rim.road):trailDistance(px,pz);
      const offRoad=step(trail+(fine-.5)*1.7,1.6,4.1);
      if(!offRoad||frontierCrossing(px,pz)) continue;
      const y=height(px,pz);
      const shore=rim===marshes?step(y,marshWaterLevel-.09,marshWaterLevel+.51):
        rim===highlands?(highlandRiver(px,pz)?0:1):step(bank(px,pz)+(fine-.5)*2,6.9,10.9);
      if(!shore) continue;
      const campClear=rim?1:Math.min(step(clearing(px,pz),6.7,15),step(Math.hypot(px-orcCamp.x,pz-orcCamp.z),9.5,14));
      const forest=!rim&&inForest(px,pz);
      const alpine=rim===highlands?1-step(y,15,40)*.87:1;
      const density=(.41+patch*.63+fine*.29)*(forest?.88:1)*offRoad*shore*campClear*alpine;
      if(random()>density||blockers(px,pz).some(o=>(o.x-px)**2+(o.z-pz)**2<o.r*o.r)||
        waystones.some(p=>(p.x-px)**2+(p.z-pz)**2<4.6)||
        worldChests.some(p=>(p.x-px)**2+(p.z-pz)**2<1.1)||
        bossCaves.some(p=>(p.x-px)**2+(p.z-pz)**2<8)) continue;
      const tall=step(patch+fine*.28,.43,.92);
      const bladeHeight=(.20+random()*.45+tall*.75)*(rim===marshes?1.09:rim===highlands?.72:1);
      const width=(.61+random()*.63)*(.87+tall*.28);
      tint.setHex(palettes[biome][Math.floor(random()*5)]).multiplyScalar(.82+random()*.36);
      place(mesh,count++,px,y-.040,pz,width,bladeHeight,random);
      if(random()>.093||offRoad<.5) continue;
      const r=random();
      const type=r<.18?5:r<.34?4:r<.49?3:r<.65?2:r<.83?(forest||rim===marshes?0:3):forest?0:1;
      if(counts[type]>=18) continue;
      tint.setHex([0x7c9d61,0xfff1d9,0x819765,0xbaa66d,0xd8c8ac,0x94806c][type]).multiplyScalar(.82+random()*.25);
      place(flora[type],counts[type]++,px,y-.012,pz,.63+random()*.69,.62+random()*.62,random);
    }
    if(!count){mesh.dispose();flora.forEach(m=>m.dispose());patches.set(cx+','+cz,{mesh,flora:[],count,biome});return;}
    mesh.count=count;mesh.computeBoundingSphere();
    if(mesh.boundingSphere) mesh.boundingSphere.radius+=2;
    mesh.receiveShadow=true;scene.add(mesh);
    const active=flora.filter((plant,i)=>{
      plant.count=counts[i];
      if(!plant.count){plant.dispose();return false;}
      plant.computeBoundingSphere();
      if(plant.boundingSphere) plant.boundingSphere.radius+=1;
      plant.receiveShadow=true;scene.add(plant);return true;
    });
    patches.set(cx+','+cz,{mesh,flora:active,count,biome});
  }
  function remove(patch:{mesh:T.InstancedMesh;flora:T.InstancedMesh[];count:number}){
    if(!patch.count) return;
    for(const mesh of [patch.mesh,...patch.flora]){mesh.removeFromParent();mesh.dispose();}
  }
  return {
    update(time:number,speed:number,mounted:boolean,dashing:boolean,influences:(actors:T.Vector4[],gusts:T.Vector4[],elements:T.Vector2[])=>void){
      const motion=Math.min(1.5,speed*.09)+(dashing?.94:0);
      stride.value.set(player.x,player.z,(mounted?2.4:1.4)+motion*.86,
        T.MathUtils.lerp(stride.value.w,motion*(mounted?1.02:.74),.24));
      clock.value=time;influences(actors,gusts,elements);
      if((Math.abs(player.x)<extent&&Math.abs(player.z)<extent)||frontierAt(player.z)){
        const ox=Math.floor(player.x/span),oz=Math.floor(player.z/span);
        const missing:{x:number;z:number;d:number}[]=[];
        for(let z=oz-4;z<=oz+4;z++) for(let x=ox-4;x<=ox+4;x++){
          const d=Math.hypot((x+.5)*span-player.x,(z+.5)*span-player.z);
          if(d<74&&z*span<extent&&(z+1)*span>marshes.north&&!patches.has(x+','+z)) missing.push({x,z,d});
        }
        missing.sort((a,b)=>a.d-b.d);
        for(const {x,z} of missing.slice(0,patches.size?3:15)) build(x,z);
      }
      for(const [key,patch] of patches){
        const [x,z]=key.split(',').map(Number);
        const d=Math.hypot((x+.5)*span-player.x,(z+.5)*span-player.z);
        if(d>101){remove(patch);patches.delete(key);continue;}
        if(!patch.count) continue;
        const {mesh,biome,count,flora}=patch;
        mesh.visible=d<76;
        if(mesh.visible){
          const lod=d<24?0:d<43?1:2;
          mesh.geometry=grass[biome===2?1:0][lod];
          mesh.count=Math.ceil(count*(1-.79*step(d,24,75)));
        }
        for(const plant of flora) plant.visible=d<31;
      }
    },
    dispose(){
      patches.forEach(remove);patches.clear();
      for(const geometry of [...grass.flat(),...forms]) geometry.dispose();
      material.dispose();
    },
  };
}
