import * as T from 'three';
import { randomSequence } from './layout.ts';
import { surfaceNoise } from './surfaceDetail.ts';

export function fracturedRock(seed:number,form:'boulder'|'slab'|'pillar'='boulder'){
  const random=randomSequence(seed);
  const segments=form==='slab'?7:9;
  const rings=form==='pillar'?[-.86,-.57,-.12,.10,.48,.74,.88]:[-.72,-.51,-.12,.18,.37,.61,.76];
  const radii=form==='pillar'?[.62,.83,.81,.75,.80,.61,.38]:
    form==='slab'?[.57,.82,.98,.92,.86,.73,.53]:[.52,.78,.96,.87,.81,.59,.37];
  const outline=Array.from({length:segments},(_,i)=>{
    const angle=(i+(random()-.5)*.47)*Math.PI*2/segments;
    const r=.83+random()*.16;
    return [Math.cos(angle)*r,Math.sin(angle)*r] as const;
  });
  const vertices:number[]=[],indices:number[]=[];
  const strike=(random()-.5)*.43, dip=(random()-.5)*.33;
  for(let j=0;j<rings.length;j++){
    const shiftX=(random()-.5)*.18+(j/(rings.length-1)-.5)*(form==='pillar'?.15:.52);
    const shiftZ=(random()-.5)*.21;
    outline.forEach(([x,z],i)=>{
      const ridge=radii[j]*(.91+random()*.14);
      const y=rings[j]+x*strike+z*dip+(random()-.5)*.14;
      vertices.push(x*ridge+shiftX,y,z*ridge+shiftZ);
      if(j===0) return;
      const a=(j-1)*segments+i,b=(j-1)*segments+(i+1)%segments,c=a+segments,d=b+segments;
      if((i+j)%3===0) indices.push(a,c,d,a,d,b);
      else indices.push(a,c,b,b,c,d);
    });
  }
  const top=vertices.length/3;
  vertices.push((random()-.5)*.20,rings.at(-1)!+.055,(random()-.5)*.24);
  for(let i=0;i<segments;i++){
    const last=(rings.length-1)*segments;
    indices.push(last+i,top,last+(i+1)%segments);
    if(i>0&&i<segments-1) indices.push(0,i,i+1);
  }
  const source=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(vertices,3)).setIndex(indices);
  const result=source.toNonIndexed();
  result.computeVertexNormals();source.dispose();
  return result;
}

export function weatherStone(material:T.MeshStandardMaterial,moss=.6){
  material.onBeforeCompile=s=>{
    s.uniforms.stoneMoss={value:moss};
    s.vertexShader='varying vec3 geologyPosition;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec4 geologyPoint=vec4(position,1.);
      #ifdef USE_INSTANCING
        geologyPoint=instanceMatrix*geologyPoint;
      #endif
      geologyPosition=(modelMatrix*geologyPoint).xyz;`);
    s.fragmentShader=surfaceNoise+'varying vec3 geologyPosition; uniform float stoneMoss;\n'+
      s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 g=geologyPosition;
      vec2 face=vec2(g.x+g.z*.63,g.y+g.z*.39-g.x*.21);
      float mass=grain(face*.82), chips=grain(face*5.6), silt=grain(face*21.)*surfaceContrast(face*21.);
      float folded=g.y+g.x*.21-g.z*.17+.36*grain(g.xz*.49);
      float bed=folded*3.7+mass*.84+.18*sin(g.z*2.4);
      float sediment=fract(bed);
      float layers=smoothstep(.06,.26,sediment)*(1.-smoothstep(.71,.98,sediment));
      float fracture=abs(fract(face.x*.51+floor(bed)*.23+chips*.10)-.5);
      float faults=(1.-smoothstep(.014,.074,fracture))*smoothstep(.43,.66,grain(face*.91));
      float seams=(1.-smoothstep(.017,.137,sediment))*(.22+.53*mass)+faults*.62;
      vec3 minerals=mix(vec3(.77,.84,.96),vec3(1.22,1.07,.84),mass);
      diffuseColor.rgb*=minerals*(.68+layers*.24+chips*.24+silt*.16-seams*.57);
      float rockRelief=layers*.31+chips*.27+silt*.16-seams*.65;
    `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor=clamp(roughnessFactor-.23*layers+.14*seams,.35,1.);`)
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      vec3 skyView=mat3(viewMatrix)*vec3(0.,1.,0.);
      float up=dot(normal,skyView);
      float growth=smoothstep(.46,.72,grain(g.xz*.87+g.y*.31)*.64+chips*.36+(up-.3)*.24)*stoneMoss;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.061,.093,.039)*(.64+chips*.66+silt*.28),growth);
      normal=relief(-vViewPosition,normal,rockRelief+growth*silt*.27,.043);
    `);
  };
  return material;
}
