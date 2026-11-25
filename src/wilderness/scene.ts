import { den, denWalkable, inDen } from './denLayout';
import { denScenery } from './denScene';
import { legacyItem } from './itemInstances';
import { rarity } from './weapons';
import { allocate, moveSpeed, type Stat } from './progression';
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
  onStatus:()=>void,
  onCombat:(notification:string,prompt:string,cooldown:number,bossHealth:number)=>void,
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
  const canWalk = (x:number,z:number) => inDen(z) ? denWalkable(x,z) : walkable(x,z,nearby(x,z));
  const updateDen=denScenery(scene);
  const start = canWalk(save.position.x,save.position.z) ? save.position : {...spawn,yaw:0};
  body.position.set(start.x,surface(start.x,start.z),start.z);
  body.rotation.y=start.yaw;
  onPosition(start);
  const animateGrass=meadow(scene,body.position,rocks,save.seed);
  const animateNight=atmosphere(scene,fireY);
  const encounters=createEncounters(scene,camera,body,save,canWalk,onSaveChange);
  let blocking=false, frameDelta=0, prompt='', notification='', abilitySeconds=0,bossHealth=0;
  function equip(id:WeaponId,itemId?:string){
    const best=save.items.filter(item=>item.type===id).sort((a,b)=>rarity[b.rarity].multiplier-rarity[a.rarity].multiplier)[0];
    const item=itemId?save.items.find(entry=>entry.id===itemId&&entry.type===id):best;
    if(!item||save.selectedItem===item.id) return;
    if(encounters.weaponLocked||knight.animating){
      encounters.feedback('Finish the current attack before switching weapons.');
      return;
    }
    save.equipped=id;
    save.selectedItem=item.id;
    knight.equip(id);
    abilitySeconds=Math.ceil(encounters.abilityRemaining);
    onCombat(notification,prompt,abilitySeconds,bossHealth);
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
    if(e.code==='KeyM'||e.code==='Tab'||e.code==='KeyP'||(e.code==='Escape'&&uiOpen())){
      e.preventDefault();
      keys.clear();
      blocking=false;
      if(!e.repeat){
        if(e.code==='Tab') onInventory();
        else if(e.code==='KeyP') onStatus();
        else onMapKey(e.code==='Escape');
      }
      return;
    }
    if(!uiOpen()&&!e.repeat){
      if(e.code==='KeyQ'&&!blocking){e.preventDefault();encounters.cast(knight.playAttack);}
      if(/^Digit[1-9]$/.test(e.code)){
        const id=save.hotbar[Number(e.code.slice(-1))-1];
        if(id) equip(id,save.slotItems[Number(e.code.slice(-1))-1]??undefined);
      }
    }
    if(e.code==='KeyR'&&!uiOpen()&&!e.repeat) encounters.drink();
    if(e.code==='KeyE'&&!uiOpen()&&!e.repeat){
      e.preventDefault();
      const p=body.position;
      const atGate=!inDen(p.z)&&Math.hypot(p.x-den.gate.x,p.z-den.gate.z)<3.4;
      const atExit=inDen(p.z)&&Math.hypot(p.x-den.exit.x,p.z-den.exit.z)<2.8;
      const wasInside=inDen(p.z);
      if(save.health&&(atGate||atExit)){
        const point=atGate?den.entry:{x:den.gate.x,z:den.gate.z+3.9};
        p.set(point.x,surface(point.x,point.z),point.z);
        body.rotation.y=atGate?Math.PI:0;
        encounters.transition();
        keys.clear();blocking=false;
      } else encounters.interact();
      if(wasInside!==inDen(p.z)) focus.copy(p);
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
      const speed=(blocking?3:sprinting?12:6)*moveSpeed(save.stats);
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
        if(save.health&&Math.hypot(p.x-den.gate.x,p.z-den.gate.z)<3.4)
          view.prompt='E · Enter Hollow Fang Den · Rank E · Suggested level 5';
        if(save.health&&Math.hypot(p.x-den.exit.x,p.z-den.exit.z)<2.8)
          view.prompt='E · Return to Blackwater Wilds';
        const seconds=Math.ceil(encounters.abilityRemaining);
        if(view.prompt!==prompt||view.notification!==notification||seconds!==abilitySeconds||bossHealth!==encounters.bossHealth){
          prompt=view.prompt; notification=view.notification; abilitySeconds=seconds; bossHealth=encounters.bossHealth;
          onCombat(notification,prompt,abilitySeconds,bossHealth);
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
      updateDen(time);
      encounters.render(frameDelta);
      renderer.render(scene,camera);
    },
  });
  canvas.addEventListener('webglcontextlost',e=>{ e.preventDefault(); loop.stop(); },{signal});
  canvas.addEventListener('webglcontextrestored',()=>loop.start(),{signal});
  loop.start();
  return {
    equip,
    allocate(stat:Stat){if(allocate(save,stat)) onSaveChange();},
    assign(slot:number,itemId:string|null){
      if(!Number.isInteger(slot)||slot<0||slot>=save.hotbar.length) return;
      const item=itemId===null?undefined:save.items.find(entry=>entry.id===itemId);
      if(itemId!==null&&!item) return;
      save.slotItems=save.slotItems.map((id,i)=>i===slot?itemId:id===itemId?null:id);
      save.hotbar=save.slotItems.map(id=>save.items.find(entry=>entry.id===id)?.type??null);
      onSaveChange();
    },
    redeem(id:WeaponId){
      if(id==='longsword'||save.arsenal.includes(id)||save.fangs<1||
        Math.hypot((body.position.x+45)*.85,body.position.z)>=9.5 || !weapons[id].ability) return;
      save.fangs--;
      save.arsenal.push(id);
      save.items.push(legacyItem(id));
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
