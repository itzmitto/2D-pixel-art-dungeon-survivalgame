import * as T from 'three';
import { bank, clearing, extent, height, trailDistance, river } from './layout';

export function terrain(scene: T.Scene) {
  const material = new T.MeshStandardMaterial({vertexColors:true,roughness:1});
  const span=40;
  for(let cz=-extent;cz<extent;cz+=span) for(let cx=-extent;cx<extent;cx+=span){
  const geo = new T.PlaneGeometry(span,span,26,26).rotateX(-Math.PI/2).translate(cx+span/2,0,cz+span/2);
  const p = geo.attributes.position;
  const colors: number[] = [];
  const normal=new T.Vector3();
  const green = new T.Color('#344a29'), brown = new T.Color('#685441'), bankColor = new T.Color('#41463d');
  const color = new T.Color();
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),z=p.getZ(i);
    p.setY(i,height(x,z));
    normal.set(height(x-.5,z)-height(x+.5,z),1,height(x,z-.5)-height(x,z+.5)).normalize();
    geo.attributes.normal.setXYZ(i,normal.x,normal.y,normal.z);
    const blend = Math.max(0,1-Math.max(0,Math.min(trailDistance(x,z)-1.5,clearing(x,z)-9))/3);
    color.copy(green).lerp(brown,blend).lerp(bankColor,Math.max(0,1-(bank(x,z)-5)/6)*.7)
      .multiplyScalar(.83+.12*Math.sin(x*.31+z*.17)+.09*Math.cos(z*.7-x*.47));
    colors.push(color.r,color.g,color.b);
  }
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const ground = new T.Mesh(geo,material);
  ground.receiveShadow=true;
  scene.add(ground);
  }
  const waterGeo=new T.PlaneGeometry(15,extent*2,4,180).rotateX(-Math.PI/2);
  const wp=waterGeo.attributes.position;
  for(let i=0;i<wp.count;i++) wp.setX(i,wp.getX(i)+river(wp.getZ(i)));
  waterGeo.computeVertexNormals();
  waterGeo.computeBoundingSphere();
  const water = new T.MeshStandardMaterial({color:'#234753',roughness:.27,metalness:.24});
  const clock={value:0};
  water.onBeforeCompile=s=>{
    s.uniforms.waterTime=clock;
    s.vertexShader='uniform float waterTime; varying vec2 riverPos;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      riverPos=position.xz; transformed.y+=.045*sin(position.z*2.+waterTime*2.+position.x);`);
    s.fragmentShader='uniform float waterTime; varying vec2 riverPos;\n'+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float ripple=pow(.5+.5*sin(riverPos.y*3.+sin(riverPos.x*2.)-waterTime*2.),12.);
      diffuseColor.rgb+=vec3(.022,.045,.055)*ripple;`);
  };
  const stream=new T.Mesh(waterGeo,water);
  stream.position.y=.12;
  scene.add(stream);
  return clock;
}
