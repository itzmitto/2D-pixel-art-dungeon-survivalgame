import * as T from 'three';
import { bank, clearing, extent, height, trailDistance, river } from './layout';

export function terrain(scene: T.Scene) {
  const material = new T.MeshStandardMaterial({vertexColors:true,roughness:1});
  material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec2 groundXZ;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      groundXZ=position.xz;`);
    shader.fragmentShader='varying vec2 groundXZ;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float fleck=sin(groundXZ.x*13.7+cos(groundXZ.y*18.4))*sin(groundXZ.y*16.7-groundXZ.x*4.);
      float gravel=pow(max(0.,sin(groundXZ.x*26.2+groundXZ.y*17.8)*sin(groundXZ.y*24.4-groundXZ.x*18.6)),5.);
      float moss=sin(groundXZ.x*2.8+sin(groundXZ.y*3.1))*cos(groundXZ.y*2.5+groundXZ.x*.71);
      diffuseColor.rgb*=.94+fleck*.056+moss*.075;
      diffuseColor.rgb+=vec3(.04,.036,.026)*gravel;`);
  };
  const span=40, chunks:{mesh:T.Mesh;x:number;z:number}[]=[];
  for(let cz=-extent;cz<extent;cz+=span) for(let cx=-extent;cx<extent;cx+=span){
  const geo = new T.PlaneGeometry(span,span,26,26).rotateX(-Math.PI/2).translate(cx+span/2,0,cz+span/2);
  const p = geo.attributes.position;
  const colors: number[] = [];
  const normal=new T.Vector3();
  const green = new T.Color('#3b5235'), olive=new T.Color('#565d34'), brown = new T.Color('#74624d'), bankColor = new T.Color('#4a4c41');
  const color = new T.Color();
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),z=p.getZ(i);
    p.setY(i,height(x,z));
    normal.set(height(x-.5,z)-height(x+.5,z),1,height(x,z-.5)-height(x,z+.5)).normalize();
    geo.attributes.normal.setXYZ(i,normal.x,normal.y,normal.z);
    const blend = Math.max(0,1-Math.max(0,Math.min(trailDistance(x,z)-1.5,clearing(x,z)-9))/3);
    const patch=.52+.24*Math.sin(x*.12-z*.17)+.17*Math.sin((x+z)*.34);
    const wet=T.MathUtils.clamp(1-(bank(x,z)-5)/7.6,0,1);
    color.copy(green).lerp(olive,patch*.75).lerp(brown,blend).lerp(bankColor,wet*.86)
      .multiplyScalar(.83+.12*Math.sin(x*.31+z*.17)+.09*Math.cos(z*.7-x*.47));
    colors.push(color.r,color.g,color.b);
  }
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const ground = new T.Mesh(geo,material);
  ground.receiveShadow=true;
  scene.add(ground);chunks.push({mesh:ground,x:cx+span/2,z:cz+span/2});
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
      float flow=.5+.5*sin(riverPos.y*1.13+sin(riverPos.x*8.2)*.46-waterTime*2.7);
      diffuseColor.rgb+=vec3(.028,.051,.072)*ripple*(.53+flow*.47);`);
  };
  const stream=new T.Mesh(waterGeo,water);
  stream.position.y=.12;
  scene.add(stream);
  return {
    update(time:number,player:T.Vector3){
      clock.value=time;
      for(const {mesh,x,z} of chunks) mesh.visible=Math.hypot(x-player.x,z-player.z)<160;
      stream.visible=player.z>-extent-42&&player.z<extent+25&&Math.abs(player.x-32)<135;
    },
  };
}
