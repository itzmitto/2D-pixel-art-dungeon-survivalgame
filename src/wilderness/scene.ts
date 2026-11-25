import * as T from 'three';
import { browserFrameScheduler, createGameLoop } from '../game/core/loop';
import { atmosphere } from './atmosphere';
import { meadow } from './grass';
import { spawn, surface, walkable } from './layout';
import { scenery } from './scenery';
import { terrain } from './terrain';
import { createEncounters } from './encounters';
import { obstacleGrid } from './spatial';
import type { Exploration, Position } from './exploration';

import { weapons, type WeaponId } from './weapons';
import { createDarkKnight } from './knight/animation';

export function startWilderness(
  canvas:HTMLCanvasElement,
  save: Exploration,
  onPosition:(position:Position)=>void,
  onMapKey:(closeOnly:boolean)=>void,
  uiOpen:()=>boolean,
  onInventory:()=>void,
  onCombat:(notification:string,prompt:string,cooldown:number)=>void,
  onSaveChange:()=>void,
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
  const knight=createDarkKnight();
  const body=knight.root;
  knight.equip(save.equipped);

  scene.add(body);
  const water=terrain(scene);
  const {obstacles,rocks,fireY}=scenery(scene,save.seed);
  const nearby = obstacleGrid(obstacles);
  const canWalk = (x:number,z:number) => walkable(x,z,nearby(x,z));
  const start = canWalk(save.position.x,save.position.z) ? save.position : {...spawn,yaw:0};
  body.position.set(start.x,surface(start.x,start.z),start.z);
  body.rotation.y=start.yaw;
  onPosition(start);
  const animateGrass=meadow(scene,body.position,rocks,save.seed);
  const animateNight=atmosphere(scene,fireY);
  const encounters=createEncounters(scene,camera,body,save,canWalk,onSaveChange);
  let blocking=false, frameDelta=0, prompt='', notification='', abilitySeconds=0;
  function equip(id:WeaponId){
    if(!save.arsenal.includes(id)) return;
    save.equipped=id;
    knight.equip(id);
    onSaveChange();
  }
  const destination=body.position.clone();
  const focus=destination.clone();
  const offset=new T.Vector3(0,Math.sin(58*Math.PI/180),Math.cos(58*Math.PI/180));
  const controller=new AbortController();
  const {signal}=controller;
  const keys=new Set<string>();
  let zoom=36,distance=zoom,lastReport=0,reportedX=start.x,reportedZ=start.z,reportedYaw=start.yaw;
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
    if(e.code==='KeyM'||e.code==='Tab'||(e.code==='Escape'&&uiOpen())){
      e.preventDefault();
      keys.clear();
      blocking=false;
      if(!e.repeat){
        if(e.code==='Tab') onInventory();
        else onMapKey(e.code==='Escape');
      }
      return;
    }
    if(!uiOpen()&&!e.repeat){
      if(e.code==='KeyQ'&&!blocking){e.preventDefault();encounters.cast(knight.playAttack);}
      if(/^Digit[1-5]$/.test(e.code)){
        const id=save.hotbar[Number(e.code.slice(-1))-1];
        if(id) equip(id);
      }
    }
    if(e.code==='KeyE'&&!uiOpen()&&!e.repeat){
      e.preventDefault();
      encounters.interact();
      onPosition({x:body.position.x,z:body.position.z,yaw:body.rotation.y});
    }
    if(!uiOpen()&&['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(e.code)){
      e.preventDefault(); keys.add(e.code);
    }
  },{signal});
  window.addEventListener('keyup',e=>keys.delete(e.code),{signal});
  window.addEventListener('blur',()=>{keys.clear();blocking=false;},{signal});
  window.addEventListener('pointerup',e=>{if(e.button===2) blocking=false;},{signal});
  window.addEventListener('pointercancel',()=>{blocking=false;},{signal});
  canvas.addEventListener('contextmenu',e=>e.preventDefault(),{signal});
  canvas.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||uiOpen()) return;
    if(e.button===2) blocking=true;
    if(e.button===0&&!blocking) encounters.attack(knight.playAttack);
  },{signal});
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    if(!uiOpen()) zoom=T.MathUtils.clamp(zoom+Math.sign(e.deltaY)*3,24,57);
  },{passive:false,signal});
  const loop=createGameLoop({
    scheduler:browserFrameScheduler,
    update(dt){
      frameDelta=uiOpen()?0:dt;
      if(uiOpen()||!save.health) {keys.clear(); blocking=false;}
      const x=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));
      const z=Number(keys.has('KeyS'))-Number(keys.has('KeyW'));
      const length=encounters.dashing?0:Math.hypot(x,z);
      const sprinting=keys.has('ShiftLeft')||keys.has('ShiftRight');
      const speed=blocking?3:sprinting?12:6;
      const p=body.position;
      const beforeX=p.x,beforeZ=p.z;
      if(length){
        const dx=x/length*speed*dt,dz=z/length*speed*dt;
        if(canWalk(p.x+dx,p.z)) p.x+=dx;
        if(canWalk(p.x,p.z+dz)) p.z+=dz;
      }
      const travelled=Math.hypot(p.x-beforeX,p.z-beforeZ);
      knight.update(frameDelta,{
        speed:dt>0?travelled/dt:0,
        sprinting:sprinting&&!blocking,
        blocking,
        facing:length?Math.atan2(x,z):undefined,
      });
      p.y=T.MathUtils.lerp(p.y,surface(p.x,p.z),1-Math.exp(-22*dt));
      if(!uiOpen()) {
        encounters.update(dt,blocking);
        const view=encounters.ui();
        const seconds=Math.ceil(encounters.abilityRemaining);
        if(view.prompt!==prompt||view.notification!==notification||seconds!==abilitySeconds){
          prompt=view.prompt; notification=view.notification; abilitySeconds=seconds;
          onCombat(notification,prompt,abilitySeconds);
        }
      }
      destination.set(p.x,p.y+.75,p.z);
      focus.lerp(destination,1-Math.exp(-7*dt));
      distance=T.MathUtils.lerp(distance,zoom,1-Math.exp(-9*dt));
      camera.position.copy(focus).addScaledVector(offset,distance);
      camera.lookAt(focus);
      lastReport+=dt;
      if(lastReport>=.09&&(p.x!==reportedX||p.z!==reportedZ||Math.abs(body.rotation.y-reportedYaw)>.025)){
        lastReport=0; reportedX=p.x; reportedZ=p.z; reportedYaw=body.rotation.y; onPosition({x:p.x,z:p.z,yaw:reportedYaw});
      }
    },
    render(time){
      water.value=time;
      animateGrass(time);
      animateNight(time,body.position);
      encounters.render(frameDelta);
      renderer.render(scene,camera);
    },
  });
  canvas.addEventListener('webglcontextlost',e=>{ e.preventDefault(); loop.stop(); },{signal});
  canvas.addEventListener('webglcontextrestored',()=>loop.start(),{signal});
  loop.start();
  return {
    equip,
    assign(slot:number,id:WeaponId|null){
      if(!Number.isInteger(slot)||slot<0||slot>=save.hotbar.length||(id&&!save.arsenal.includes(id))) return;
      save.hotbar=save.hotbar.map((item,i)=>i===slot?id:id&&item===id?null:item);
      onSaveChange();
    },
    redeem(id:WeaponId){
      if(id==='longsword'||save.arsenal.includes(id)||save.fangs<1||
        Math.hypot(body.position.x+45,body.position.z)>10 || !weapons[id].ability) return;
      save.fangs--;
      save.arsenal.push(id);
      onSaveChange();
    },
    dispose(){
    loop.stop(); controller.abort(); observer.disconnect(); encounters.dispose();
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
    },
  };
}
