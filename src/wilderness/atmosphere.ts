import * as T from 'three';
import { height, randomSequence } from './layout';

export function atmosphere(scene:T.Scene, fireY:number) {
  scene.background=new T.Color('#182330');
  scene.fog=new T.FogExp2('#182330',.014);
  scene.add(new T.HemisphereLight('#a6c5f7','#4d4a39',1.65));
  const moon=new T.DirectionalLight('#b5cffc',2.0);
  moon.castShadow=true;
  moon.shadow.mapSize.set(1024,1024);
  Object.assign(moon.shadow.camera,{left:-35,right:35,top:35,bottom:-35,near:1,far:140});
  moon.shadow.camera.updateProjectionMatrix();
  moon.shadow.normalBias=.11;
  moon.shadow.bias=-.0003;
  moon.shadow.radius=2;
  scene.add(moon,moon.target);
  const glow=new T.PointLight('#ff993d',65,22,2);
  glow.position.set(-45,fireY+1.45,0);
  scene.add(glow);

  const rand=randomSequence(74);
  const geometry=new T.BufferGeometry();
  const count=190;
  const data=new Float32Array(count*3);
  const origins=Array.from({length:count},(_,i)=>{
    if(i<55) return [-45,fireY,0];
    const x=-65+rand()*175,z=-70+rand()*140;
    return [x,height(x,z),z];
  });
  geometry.setAttribute('position',new T.BufferAttribute(data,3));
  const colors=new Float32Array(count*3);
  for(let i=0;i<count;i++) colors.set(i<55?[1,.31,.067]:[.85,.77,.29],i*3);
  geometry.setAttribute('color',new T.BufferAttribute(colors,3));
  const sparkMaterial=new T.PointsMaterial({
    vertexColors:true,size:.46,transparent:true,opacity:.86,depthWrite:false,blending:T.AdditiveBlending,
  });
  sparkMaterial.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        diffuseColor.a*=1.-smoothstep(.05,.5,length(gl_PointCoord-.5));`);
  };
  const points=new T.Points(geometry,sparkMaterial);
  points.frustumCulled=false;
  scene.add(points);

  const mistMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,
    uniforms:{time:{value:0}},
    vertexShader:`varying vec2 tex; void main(){tex=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float time; varying vec2 tex;
    void main(){vec2 p=(tex-.5)*2.;float a=pow(max(0.,1.-dot(p,p)),2.);
    float veil=.62+.22*sin(p.x*6.+p.y*4.+time*.24)+.15*cos(p.y*12.-time*.31);
    gl_FragColor=vec4(.35,.44,.53,a*veil*.18);}`,
  });
  const mistGeo=new T.PlaneGeometry(45,22).rotateX(-Math.PI/2);
  const wisps=Array.from({length:16},(_,i)=>{
    const x=14+rand()*33,z=-176+i*23;
    const mesh=new T.Mesh(mistGeo,mistMaterial);
    mesh.position.set(x,1.25,z); scene.add(mesh); return {mesh,x};
  });

  return (time:number,player:T.Vector3)=>{
    moon.position.set(player.x-28,58,player.z-24);
    moon.target.position.copy(player);
    glow.intensity=65+7*Math.sin(time*9)+4*Math.sin(time*15.3);
    mistMaterial.uniforms.time.value=time;
    for(const {mesh,x} of wisps) mesh.position.x=x+Math.sin(time*.13+mesh.position.z)*5;
    for(let i=0;i<count;i++){
      const [x,y,z]=origins[i], phase=i*2.399;
      const life=(time*(.52+(i%6)*.15)+i*.173)%1;
      if(i<55){
        const width=(1-life)*.7+.12;
        data.set([x+Math.cos(phase+time)*width,y+.4+life*(i<37?1.8:4.3),z+Math.sin(phase+time)*width],i*3);
      } else {
        data.set([x+Math.sin(time*.61+phase)*2.5,y+1.1+Math.cos(time*.9+phase)*.8,z+Math.cos(time*.53+phase)*2.5],i*3);
      }
    }
    geometry.attributes.position.needsUpdate=true;
  };
}
