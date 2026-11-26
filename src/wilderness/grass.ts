import * as T from 'three';
import { bank, clearing, extent, height, inForest, trailDistance, randomSequence } from './layout';
import { obstacleGrid } from './spatial';
import { orcCamp, waystones } from './worldSites';
import { worldChests } from './treasure';

const actorCount=5, gustCount=4;
function vegetationGeometry(shape:'grass'|'distant'|'fern'|'flower'|'shrub'){
  const vertices:number[]=[], colors:number[]=[], triangles:number[]=[];
  const color=new T.Color();
  function vertex(x:number,y:number,z:number,tint:number){
    const index=vertices.length/3;vertices.push(x,y,z);
    color.setHex(tint);colors.push(color.r,color.g,color.b);
    return index;
  }
  function blade(angle:number,width:number,tall:number,bend:number,offset:number,segments:number,tint:number){
    const s=Math.sin(angle),c=Math.cos(angle),base=vertices.length/3;
    for(let i=0;i<=segments;i++){
      const t=i/segments;
      const taper=(1-t)*(.69+.42*Math.sin(t*2.6))+.017;
      for(const side of [-1,1]){
        const x=width*taper*side,y=tall*t,z=offset+bend*t*t;
        vertex(c*x+s*z,y,s*x-c*z,tint);
      }
      if(i){const j=base+i*2;triangles.push(j-2,j-1,j,j,j-1,j+1);}
    }
  }
  if(shape==='grass'||shape==='distant'){
    const detail=shape==='grass';
    blade(.35,.084,1,.24,.045,detail?4:2,0xf1f7df);
    blade(2.47,.107,.76,.31,.10,detail?4:2,0xffffff);
    if(detail) blade(4.64,.065,.66,.42,.145,3,0xdbeab5);
  }else if(shape==='fern'){
    for(let i=0;i<5;i++){
      const angle=i*2.399,dx=Math.cos(angle),dz=Math.sin(angle);
      blade(-angle-1.57,.021,.56,.62,.02,5,0xc4e193);
      for(let level=1;level<6;level++){
        const t=level/6,y=.56*t,r=.02+.62*t*t,span=.31*Math.sin(t*Math.PI);
        const x=dx*r,z=dz*r;
        for(const side of [-1,1]){
          const a=vertex(x,y,z,0xc5e797);
          const b=vertex(x+dx*.118,y+.075,z+dz*.118,0x77994c);
          const c=vertex(x-dz*span*side+dx*.13,y+.04,z+dx*span*side+dz*.13,0xb0cf7f);
          triangles.push(a,b,c);
        }
      }
    }
  }else if(shape==='flower'){
    for(let stem=0;stem<4;stem++){
      const a=stem*2.399, h=.33+(stem%3)*.13,r=.04+stem*.11;
      blade(a,.035,h,r,.026,3,0x9cbf82);
      const x=Math.sin(a)*(r+.026),z=-Math.cos(a)*(r+.026);
      const center=vertex(x,h+.011,z,0xffd786);
      for(let i=0;i<5;i++){
        const angle=i*1.256, shade=stem%2?0xcac2ff:0xffe2a6;
        const left=vertex(x+Math.cos(angle-.45)*.058,h,z+Math.sin(angle-.45)*.058,shade);
        const right=vertex(x+Math.cos(angle+.45)*.058,h+.016,z+Math.sin(angle+.45)*.058,shade);
        const tip=vertex(x+Math.cos(angle)*.092,h+.005,z+Math.sin(angle)*.092,0xf6e6ff);
        triangles.push(center,left,tip,center,tip,right);
      }
    }
  }else{
    for(let i=0;i<10;i++) blade(i*2.399,.18+(i%3)*.04,.41+(i%5)*.08,.36+(i%3)*.12,.06,3,i%2?0x9bbe73:0xc0c797);
  }
  const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(vertices,3))
    .setAttribute('color',new T.Float32BufferAttribute(colors,3)).setIndex(triangles);
  geometry.computeVertexNormals();
  return geometry;
}

export function meadow(scene:T.Scene,player:T.Vector3,rocks:readonly {x:number;z:number;r:number}[],seed:number){
  const clock={value:0}, dashGust={value:0};
  const actors=Array.from({length:actorCount},()=>new T.Vector4(0,0,1,0));
  const gusts=Array.from({length:gustCount},()=>new T.Vector4(0,0,1,0));
  const grass=vegetationGeometry('grass'), distant=vegetationGeometry('distant');
  const forms=[vegetationGeometry('fern'),vegetationGeometry('flower'),vegetationGeometry('shrub')];
  const material=new T.MeshStandardMaterial({side:T.DoubleSide,roughness:.95,vertexColors:true});
  material.onBeforeCompile=s=>{
    Object.assign(s.uniforms,{windTime:clock,dashGust,walker:{value:player},actors:{value:actors},gusts:{value:gusts}});
    s.vertexShader=`uniform float windTime; uniform float dashGust; uniform vec3 walker;
      uniform vec4 actors[${actorCount}]; uniform vec4 gusts[${gustCount}]; varying float bladeHeight;
      vec2 brushBend(vec2 root,vec4 influence){
        vec2 away=root-influence.xy;
        float d=length(away);
        return away/max(d,.16)*(1.-smoothstep(.17,influence.z,d))*influence.w;
      }
    `+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec3 root=instanceMatrix[3].xyz;
      float wave=sin(root.x*.135+root.z*.19-windTime*2.15);
      float flutter=sin(root.z*.69-root.x*.39+windTime*3.2)*.26;
      vec2 sway=vec2((wave+flutter)*.21, (.45*wave-flutter)*.20);
      float localWeight=1.-smoothstep(8.,45.,length(root.xz-walker.xz));
      if(localWeight>.02){
        sway+=brushBend(root.xz,vec4(walker.xz,2.20+dashGust*2.5,.78+dashGust));
        for(int i=0;i<${actorCount};i++) sway+=brushBend(root.xz,actors[i]);
        for(int i=0;i<${gustCount};i++) sway+=brushBend(root.xz,gusts[i]);
      }
      vec2 sx=instanceMatrix[0].xz, sz=instanceMatrix[2].xz;
      transformed.xz+=vec2(dot(sx,sway)/max(.1,dot(sx,sx)),dot(sz,sway)/max(.1,dot(sz,sz)))*position.y*position.y;
      transformed.y-=min(.31,length(sway)*.17)*position.y*position.y;
      bladeHeight=position.y;`);
    s.fragmentShader='varying float bladeHeight;\n'+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      diffuseColor.rgb*=mix(.52,1.20,smoothstep(.02,.86,bladeHeight));`);
  };
  const rand=randomSequence(seed^733), brush=new T.Object3D(), tint=new T.Color();
  const patches:{mesh:T.InstancedMesh; flora:T.InstancedMesh[]; x:number; z:number; capacity:number}[]=[];
  const nearbyRocks=obstacleGrid(rocks), span=24, capacity=1450;
  const palettes=[0x607044,0x4c6e48,0x61734c,0x7b804c,0x3c563d];
  function nearObject(x:number,z:number){
    return waystones.some(p=>Math.hypot(x-p.x,z-p.z)<1.82)||
      worldChests.some(p=>Math.hypot(x-p.x,z-p.z)<.90);
  }
  function place(mesh:T.InstancedMesh,index:number,x:number,z:number,width:number,tall:number){
    brush.position.set(x,height(x,z)-.058,z);brush.rotation.set(0,rand()*Math.PI*2,0);
    brush.scale.set(width,tall,width*(.72+rand()*.60));
    brush.updateMatrix();mesh.setMatrixAt(index,brush.matrix);mesh.setColorAt(index,tint);
  }
  for(let z=-extent;z<extent;z+=span) for(let x=-extent;x<extent;x+=span){
    const mesh=new T.InstancedMesh(grass,material,capacity);
    const flora=forms.map(form=>new T.InstancedMesh(form,material,26));
    const floraCount=[0,0,0];
    let count=0;
    for(let i=0;i<capacity;i++){
      const px=x+rand()*span,pz=z+rand()*span,trail=trailDistance(px,pz),shore=bank(px,pz);
      const forest=inForest(px,pz),camp=Math.hypot(px-orcCamp.x,pz-orcCamp.z);
      const seedPatch=.86+.18*Math.sin(px*.23+pz*.35)*Math.cos(pz*.19-px*.28);
      const clearance=Math.min(1,Math.max(0,(trail-1.45)/2.8),Math.max(0,(clearing(px,pz)-6)/5),.26+Math.max(0,camp-7)*.105);
      const edge=Math.min(1,Math.max(0,(shore-6.4)/5.5));
      if(rand()>clearance*edge*seedPatch*(forest?1.05:1.09)||nearObject(px,pz)) continue;
      if(nearbyRocks(px,pz).some(o=>Math.hypot(o.x-px,o.z-pz)<o.r*.91)) continue;
      tint.setHex(palettes[Math.floor(rand()*palettes.length)]).multiplyScalar(.76+rand()*.54);
      place(mesh,count++,px,pz,.67+rand()*.69,.30+rand()*(shore<15?1.41:1.0));
      if(camp<13||trail<3.4||rand()>.049) continue;
      const type=forest?(rand()<.64?0:2):(rand()<.64?1:2);
      if(floraCount[type]>=26) continue;
      tint.setHex(type===1?0xfff3d7:0x8ba46c).multiplyScalar(.83+rand()*.22);
      place(flora[type],floraCount[type]++,px,pz,.65+rand()*.74,.55+rand()*.61);
    }
    if(!count){mesh.dispose();flora.forEach(m=>m.dispose());continue;}
    mesh.count=count;
    for(const [i,plant] of flora.entries()){
      plant.count=floraCount[i];
      if(!plant.count){plant.dispose();continue;}
      plant.computeBoundingSphere();plant.receiveShadow=true;scene.add(plant);
    }
    mesh.computeBoundingSphere();
    if(mesh.boundingSphere) mesh.boundingSphere.radius+=2;
    mesh.receiveShadow=true;scene.add(mesh);
    patches.push({mesh,flora:flora.filter(plant=>plant.count>0),x:x+span/2,z:z+span/2,capacity:count});
  }
  return {
    update(time:number,dashing:boolean,influences:(actors:T.Vector4[],gusts:T.Vector4[])=>void){
      dashGust.value=Math.max(dashing?1:0,dashGust.value-Math.max(0,time-clock.value)*3.4);
      clock.value=time;influences(actors,gusts);
      for(const {mesh,flora,x,z,capacity:total} of patches){
        const d=Math.hypot(x-player.x,z-player.z);
        mesh.visible=d<89;
        if(mesh.visible){
          mesh.geometry=d<39?grass:distant;
          mesh.count=Math.ceil(total*(d<31?1:d<48?.68:d<65?.37:.16));
        }
        for(const plant of flora) plant.visible=d<39;
      }
    },
    dispose(){for(const geometry of [grass,distant,...forms]) geometry.dispose();},
  };
}
