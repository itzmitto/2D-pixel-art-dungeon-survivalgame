import * as T from 'three';

function hash(x:number,z:number){
  const n=Math.imul(x,374761393)+Math.imul(z,668265263)|0;
  const mixed=Math.imul(n^(n>>>13),1274126177);
  return ((mixed^(mixed>>>16))>>>0)/4294967295;
}

export function fieldNoise(x:number,z:number){
  const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
  const a=fx*fx*(3-2*fx),b=fz*fz*(3-2*fz);
  return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iz),hash(ix+1,iz),a),
    T.MathUtils.lerp(hash(ix,iz+1),hash(ix+1,iz+1),a),b);
}

export const surfaceNoise=`
  float grainHash(vec2 p){
    vec3 q=fract(vec3(p.xyx)*.1031);
    q+=dot(q,q.yzx+33.33);
    return fract((q.x+q.y)*q.z);
  }
  float grain(vec2 p){
    vec2 i=floor(p),f=fract(p);
    f=f*f*(3.-2.*f);
    return mix(mix(grainHash(i),grainHash(i+vec2(1,0)),f.x),
      mix(grainHash(i+vec2(0,1)),grainHash(i+1.),f.x),f.y);
  }
  float surfaceContrast(vec2 p){
    return 1.-smoothstep(.27,.9,max(length(dFdx(p)),length(dFdy(p))));
  }
  vec3 relief(vec3 p,vec3 n,float h,float strength){
    vec3 dx=dFdx(p),dy=dFdy(p);
    vec3 r1=cross(dy,n),r2=cross(n,dx);
    float det=dot(dx,r1);
    vec3 gradient=sign(det)*(dFdx(h)*r1+dFdy(h)*r2);
    return normalize(max(.000001,abs(det))*n-strength*gradient);
  }
`;

export function groundMaterial(){
  const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.98});
  material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 soilPosition; varying vec3 soilMask; attribute vec3 terrainMask;\n'+
      shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      soilPosition=position; soilMask=terrainMask;`);
    shader.fragmentShader=surfaceNoise+'varying vec3 soilPosition; varying vec3 soilMask;\n'+
      shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec2 gp=soilPosition.xz;
      float base=grain(gp*1.24)+grain(gp*3.6)*.42;
      float pathMix=smoothstep(.10,.9,soilMask.x+(base-.65)*.30);
      float moist=smoothstep(.10,.9,soilMask.y+(base-.65)*.38);
      float grit=grain(gp*17.3)*surfaceContrast(gp*17.3);
      float crumbs=grain(gp*6.4);
      vec2 stoneCell=floor(gp*4.8);
      vec2 chip=fract(gp*4.8)-vec2(.32+grainHash(stoneCell)*.31,.49);
      float stone=(1.-smoothstep(.18,.42,length(chip*vec2(.8,1.4))))*
        step(.68-pathMix*.23-soilMask.z*.16,grainHash(stoneCell+8.));
      float litter=pow(max(0.,grain(gp*8.1)*grain(gp*1.9)),4.)*4.;
      float roots=(1.-smoothstep(.027,.13,abs(sin(gp.x*1.1+gp.y*.52+grain(gp*.59)*5.))))*
        smoothstep(.59,.81,grain(gp*.26))*(1.-pathMix)*(1.-moist);
      vec3 earth=mix(vec3(.091,.068,.046),vec3(.054,.048,.037),moist);
      diffuseColor.rgb=mix(diffuseColor.rgb,earth,pathMix*.8);
      diffuseColor.rgb*=.71+base*.34+crumbs*.17+grit*.16;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.13,.121,.099)*(base+.42),stone*(.56+soilMask.z*.32));
      diffuseColor.rgb+=vec3(.10,.048,.013)*litter*(1.-moist)*(1.-pathMix*.7);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.082,.051,.029),roots*.65);
      vec2 fracturePoint=vec2(gp.x+gp.y*.61,soilPosition.y+.22*gp.x-.17*gp.y);
      float band=fract(fracturePoint.y*2.85+grain(fracturePoint*.76)*.43);
      float seam=(1.-smoothstep(.04,.22,band))*(.24+.64*crumbs);
      float mineral=grain(fracturePoint*1.9);
      diffuseColor.rgb*=mix(vec3(1.),mix(vec3(.79,.93,1.10),vec3(1.26,1.14,.94),mineral)*(1.17-seam*.82),soilMask.z*.82);
      float soilRelief=(stone*.8+crumbs*.23+grit*.12+roots*.57)*(1.-moist*.66)-seam*soilMask.z*.82;
    `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor=mix(roughnessFactor,.42,moist*(.51+crumbs*.27)*(1.-stone));`)
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      normal=relief(-vViewPosition,normal,soilRelief,.075);`);
  };
  return material;
}
