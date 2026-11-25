import * as T from 'three';
import { bank, clearing, extent, height, path, randomSequence } from './layout';

export function meadow(scene:T.Scene, player:T.Vector3, rocks:readonly {x:number;z:number;r:number}[]) {
  const clock={value:0};
  const geometry=new T.BufferGeometry();
  const vertices: number[] = [], triangles: number[] = [];
  const blade = [[-.095,0,0],[.095,0,0],[-.055,.58,.07],[.055,.58,.07],[.005,1,.15]];
  for (let i=0;i<3;i++) {
    const angle=i*2.399, c=Math.cos(angle), s=Math.sin(angle);
    for (const [x,y,z] of blade) {
      vertices.push(x*c+z*s+.24*c,y*(1-i*.16),z*c-x*s+.24*s);
    }
    triangles.push(...[0,1,2,1,3,2,2,3,4].map(index=>index+i*5));
  }
  geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geometry.setIndex(triangles);
  geometry.computeVertexNormals();
  const material=new T.MeshStandardMaterial({side:T.DoubleSide,roughness:.97});
  material.onBeforeCompile=s=>{
    s.uniforms.windTime=clock;
    s.uniforms.walker={value:player};
    s.vertexShader='uniform float windTime; uniform vec3 walker; varying float bladeHeight;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec3 root=instanceMatrix[3].xyz;
      vec2 away=root.xz-walker.xz;
      float d=length(away);
      float gust=sin(root.x*.17+root.z*.14-windTime*2.2)+.35*sin(root.z*.7+windTime*3.);
      vec2 sway=vec2(gust*.19,gust*.09)+away/max(d,.01)*(1.-smoothstep(.05,2.3,d))*.8;
      transformed.xz+=vec2(dot(instanceMatrix[0].xz,sway),dot(instanceMatrix[2].xz,sway))*position.y*position.y;
      bladeHeight=position.y;`);
    s.fragmentShader='varying float bladeHeight;\n'+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      diffuseColor.rgb*=mix(.49,1.28,bladeHeight);`);
  };
  const rand=randomSequence(733), brush=new T.Object3D();
  const patches:{mesh:T.InstancedMesh; x:number; z:number; capacity:number}[]=[];
  const tint=new T.Color();
  const span=24;
  for(let z=-extent;z<extent;z+=span) for(let x=-extent;x<extent;x+=span) {
    const mesh=new T.InstancedMesh(geometry,material,960);
    let count=0;
    for(let i=0;i<960;i++) {
      const px=x+rand()*span,pz=z+rand()*span;
      const trail=Math.abs(pz-path(px));
      const coverage=Math.min(1,Math.max(0,(trail-1.8)/3),Math.max(0,(clearing(px,pz)-6)/5));
      if(rand()>coverage || bank(px,pz)<8 || rocks.some(o=>Math.abs(o.x-px)<o.r && Math.hypot(o.x-px,o.z-pz)<o.r)) continue;
      brush.position.set(px,height(px,pz)-.06,pz);
      brush.scale.set(.65+rand()*.85,.32+rand()*1.15,1);
      brush.rotation.y=rand()*Math.PI*2;
      brush.updateMatrix();
      mesh.setMatrixAt(count,brush.matrix);
      tint.setHSL(.235+rand()*.048,.31+rand()*.23,.19+rand()*.15);
      mesh.setColorAt(count++,tint);
    }
    if(!count) { mesh.dispose(); continue; }
    mesh.count=count;
    mesh.computeBoundingSphere();
    if(mesh.boundingSphere) mesh.boundingSphere.radius+=2;
    mesh.receiveShadow=true;
    scene.add(mesh);
    patches.push({mesh,x:x+span/2,z:z+span/2,capacity:count});
  }
  return (time:number)=>{
    clock.value=time;
    for(const {mesh,x,z,capacity} of patches) {
      const d=Math.hypot(x-player.x,z-player.z);
      mesh.visible=d<102;
      mesh.count=Math.ceil(capacity*(d<29?1:d<51?.56:.23));
    }
  };
}
