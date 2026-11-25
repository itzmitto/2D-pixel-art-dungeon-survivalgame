import * as T from 'three';
import { browserFrameScheduler, createGameLoop } from '../game/core/loop';
import { atmosphere } from './atmosphere';
import { meadow } from './grass';
import { spawn, surface, walkable } from './layout';
import { scenery } from './scenery';
import { terrain } from './terrain';

function scout() {
  const body=new T.Group();
  const steel=new T.MeshStandardMaterial({color:'#a1a7ab',roughness:.55,metalness:.25});
  const cloth=new T.MeshStandardMaterial({color:'#57362b'});
  const dark=new T.MeshStandardMaterial({color:'#302b29'});
  const part=(geo:T.BufferGeometry,mat:T.Material,x:number,y:number,z:number)=>{
    const mesh=new T.Mesh(geo,mat);
    mesh.position.set(x,y,z); mesh.castShadow=true; body.add(mesh); return mesh;
  };
  part(new T.CapsuleGeometry(.35,.43,3,8),steel,0,1.18,0);
  part(new T.SphereGeometry(.26,10,7),steel,0,1.88,0);
  part(new T.BoxGeometry(.31,.067,.1),dark,0,1.9,.235);
  part(new T.BoxGeometry(.6,.88,.13),cloth,0,1.12,-.28).rotation.x=.17;
  for(const side of [-1,1]) part(new T.CapsuleGeometry(.12,.43,2,6),steel,side*.42,1.15,0);
  const legs=[-1,1].map(side=>part(new T.BoxGeometry(.23,.68,.26),dark,side*.17,.35,0));
  part(new T.BoxGeometry(.087,1,.04),steel,.48,.86,.15).rotation.z=-.3;
  return {body,legs};
}

export function startWilderness(
  canvas:HTMLCanvasElement,
  onPosition:(x:number,z:number)=>void,
  onMapKey:(closeOnly:boolean)=>void,
  mapOpen:()=>boolean,
) {
  const context=canvas.getContext('webgl2',{antialias:true});
  if(!context) throw new Error('WebGL2 is required for the wilderness.');
  const renderer=new T.WebGLRenderer({canvas,context,antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.5));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  const scene=new T.Scene();
  const camera=new T.PerspectiveCamera(43,1,.3,400);
  const {body,legs}=scout();
  body.position.set(spawn.x,surface(spawn.x,spawn.z),spawn.z);
  scene.add(body);
  const water=terrain(scene);
  const {obstacles,rocks,fireY}=scenery(scene);
  const animateGrass=meadow(scene,body.position,rocks);
  const animateNight=atmosphere(scene,fireY);
  const destination=body.position.clone();
  const focus=destination.clone();
  const offset=new T.Vector3(0,Math.sin(58*Math.PI/180),Math.cos(58*Math.PI/180));
  const controller=new AbortController();
  const {signal}=controller;
  const keys=new Set<string>();
  let zoom=36,distance=zoom,lastReport=0,reportedX=spawn.x,reportedZ=spawn.z, gait=0;
  function resize(){
    const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
    renderer.setSize(width,height,false);
    camera.aspect=width/height; camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  window.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.altKey||e.metaKey) return;
    if(e.code==='KeyM'||(e.code==='Escape'&&mapOpen())){
      e.preventDefault();
      keys.clear();
      if(!e.repeat) onMapKey(e.code==='Escape');
      return;
    }
    if(!mapOpen()&&['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(e.code)){
      e.preventDefault(); keys.add(e.code);
    }
  },{signal});
  window.addEventListener('keyup',e=>keys.delete(e.code),{signal});
  window.addEventListener('blur',()=>keys.clear(),{signal});
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    if(!mapOpen()) zoom=T.MathUtils.clamp(zoom+Math.sign(e.deltaY)*3,24,57);
  },{passive:false,signal});
  const loop=createGameLoop({
    scheduler:browserFrameScheduler,
    update(dt){
      if(mapOpen()) keys.clear();
      const x=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));
      const z=Number(keys.has('KeyS'))-Number(keys.has('KeyW'));
      const length=Math.hypot(x,z);
      const speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?12:6;
      const p=body.position;
      const beforeX=p.x,beforeZ=p.z;
      if(length){
        const dx=x/length*speed*dt,dz=z/length*speed*dt;
        if(walkable(p.x+dx,p.z,obstacles)) p.x+=dx;
        if(walkable(p.x,p.z+dz,obstacles)) p.z+=dz;
        const target=Math.atan2(x,z);
        body.rotation.y+=Math.atan2(Math.sin(target-body.rotation.y),Math.cos(target-body.rotation.y))*(1-Math.exp(-15*dt));
      }
      const travelled=Math.hypot(p.x-beforeX,p.z-beforeZ);
      gait+=travelled*4;
      for(let i=0;i<legs.length;i++) legs[i].rotation.x=T.MathUtils.lerp(legs[i].rotation.x,travelled?Math.sin(gait+i*Math.PI)*.45:0,1-Math.exp(-18*dt));
      p.y=T.MathUtils.lerp(p.y,surface(p.x,p.z),1-Math.exp(-22*dt));
      destination.set(p.x,p.y+.75,p.z);
      focus.lerp(destination,1-Math.exp(-7*dt));
      distance=T.MathUtils.lerp(distance,zoom,1-Math.exp(-9*dt));
      camera.position.copy(focus).addScaledVector(offset,distance);
      camera.lookAt(focus);
      lastReport+=dt;
      if(lastReport>=.09&&(p.x!==reportedX||p.z!==reportedZ)){
        lastReport=0; reportedX=p.x; reportedZ=p.z; onPosition(p.x,p.z);
      }
    },
    render(time){
      water.value=time;
      animateGrass(time);
      animateNight(time,body.position);
      renderer.render(scene,camera);
    },
  });
  canvas.addEventListener('webglcontextlost',e=>{ e.preventDefault(); loop.stop(); },{signal});
  canvas.addEventListener('webglcontextrestored',()=>loop.start(),{signal});
  loop.start();
  return ()=>{
    loop.stop(); controller.abort(); observer.disconnect();
    const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
    scene.traverse(object=>{
      if(object instanceof T.InstancedMesh) object.dispose();
      if(object instanceof T.DirectionalLight) object.shadow.dispose();
      if(object instanceof T.Mesh||object instanceof T.Points){
        geometries.add(object.geometry);
        for(const material of Array.isArray(object.material)?object.material:[object.material]) materials.add(material);
      }
    });
    geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose());
    renderer.dispose();
  };
}
