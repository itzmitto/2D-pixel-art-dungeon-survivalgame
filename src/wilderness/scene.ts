import { shadowKeys } from './shadowData';
import { bossCaves, caveAt, caveEntry, caveExit, caveRewardId, caveStatus, caveWalkable } from './bossCaves';
import { briarWatch, floorRemaining, towerFloorAt, towerFloors, towerWalkable } from './briarWatch';
import { armorPiece, type ArmorId, type ArmorSlot } from './armor';
import { warhorse } from './horse';
import { waystones } from './worldSites';
import { waystoneModels } from './waystones';
import { den, denWalkable, inDen } from './denLayout';
import { denScenery } from './denScene';
import { legacyItem } from './itemInstances';
import { rarity } from './weapons';
import { allocate, effectiveStats, maxHunterHealth, moveSpeed, type Stat } from './progression';
import * as T from 'three';
import { browserFrameScheduler, createGameLoop } from '../game/core/loop';
import { atmosphere } from './atmosphere';
import { meadow } from './grass';
import { onBridge, spawn, surface, walkable } from './layout';
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
  onShadows:()=>void,
  onCombat:(notification:string,prompt:string,cooldown:number,bossHealth:number,shadowAvailable:boolean)=>void,
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
  knight.equip(save.equipped,save.items.find(item=>item.id===save.selectedItem)?.rarity);

  knight.equipArmor(save.equippedArmor);
  const horse=warhorse();
  scene.add(body,horse.root);
  let mounted=false,summoning=0;
  function dismissHorse(){
    mounted=false;summoning=0;horse.root.visible=false;
  }
  const water=terrain(scene);
  const {obstacles,rocks,fireY,animateCamp,animateRitual,tower,caves}=scenery(scene,save.seed);
  const stones=waystoneModels(scene);
  obstacles.push(...waystones.map(({x,z})=>({x,z,r:.95})));
  const nearby = obstacleGrid(obstacles);
  const canWalk = (x:number,z:number) => caveAt(z)?caveWalkable(x,z):towerFloorAt(z) ? towerWalkable(x,z) : inDen(z) ? denWalkable(x,z) : walkable(x,z,nearby(x,z));
  const updateDen=denScenery(scene);
  const start = canWalk(save.position.x,save.position.z) ? save.position : {...spawn,yaw:0};
  body.position.set(start.x,surface(start.x,start.z),start.z);
  body.rotation.y=start.yaw;
  onPosition(start);
  const grass=meadow(scene,body.position,rocks,save.seed);
  const animateNight=atmosphere(scene,fireY);
  const encounters=createEncounters(scene,camera,body,save,canWalk,onSaveChange);
  const loadedCave=caveAt(start.z);
  if(loadedCave) encounters.prepareCave(loadedCave,false);
  let travel:{target:Position;remaining:number;arrived:boolean}|undefined;
  function horseClear(x:number,z:number,yaw:number){
    if(inDen(z)||towerFloorAt(z)||caveAt(z)||!canWalk(x,z)) return false;
    const a=Math.sin(yaw),b=Math.cos(yaw),y=surface(x,z);
    for(const [forward,side] of [[1.23,0],[-1.15,0],[.28,.54],[.28,-.54],[-.72,.54],[-.72,-.54]]){
      const xx=x+a*forward+b*side,zz=z+b*forward-a*side;
      const heightLimit=onBridge(x,z)||onBridge(xx,zz)?1.32:.78;
      if(!canWalk(xx,zz)||Math.abs(surface(xx,zz)-y)>heightLimit) return false;
    }
    return true;
  }
  function groundLink(from:T.Vector3,x:number,z:number){
    for(let i=1;i<=5;i++){
      const xx=T.MathUtils.lerp(from.x,x,i/5),zz=T.MathUtils.lerp(from.z,z,i/5);
      if(!canWalk(xx,zz)||Math.abs(surface(xx,zz)-from.y)>.85) return false;
    }
    return true;
  }
  const nearStone=()=>waystones.find(stone=>Math.hypot(body.position.x-stone.x,body.position.z-stone.z)<3.65);
  let blocking=false, frameDelta=0, prompt='', notification='', abilitySeconds=0,bossHealth=0,shadowAvailable=false;
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
    knight.equip(id,item.rarity);
    abilitySeconds=Math.ceil(encounters.abilityRemaining);
    onCombat(notification,prompt,abilitySeconds,bossHealth,shadowAvailable);
    onSaveChange();
  }
  const destination=body.position.clone();
  const focus=destination.clone();
  const offset=new T.Vector3(0,Math.sin(58*Math.PI/180),Math.cos(58*Math.PI/180));
  camera.position.copy(focus).addScaledVector(offset,36);
  camera.lookAt(focus);
  const controller=new AbortController();
  const {signal}=controller;
  const keys=new Set<string>();
  let shakePhase=0;
  let zoom=36,distance=zoom,lastReport=0,reportedX=start.x,reportedZ=start.z,reportedYaw=start.yaw;
  function handleHorse(){
    if(!save.health||inDen(body.position.z)||towerFloorAt(body.position.z)||caveAt(body.position.z)) return;
    const p=body.position,yaw=body.rotation.y;
    if(mounted){
      for(const angle of [yaw+Math.PI/2,yaw-Math.PI/2,yaw+Math.PI,yaw]){
        const x=p.x+Math.sin(angle)*1.65,z=p.z+Math.cos(angle)*1.65;
        if(!groundLink(p,x,z)) continue;
        mounted=false;
        p.set(x,surface(x,z),z);
        onPosition({x,z,yaw});
        encounters.feedback('Dismounted.');
        return;
      }
      encounters.feedback('Move onto open ground to dismount.');
      return;
    }
    if(knight.animating||encounters.weaponLocked||summoning>0) return;
    if(horse.root.visible&&horse.root.position.distanceTo(p)<3.15&&
      horseClear(horse.root.position.x,horse.root.position.z,horse.root.rotation.y)&&
      groundLink(p,horse.root.position.x,horse.root.position.z)){
      mounted=true;blocking=false;
      p.copy(horse.root.position);body.rotation.y=horse.root.rotation.y;
      encounters.feedback('Mounted · Hold Shift to gallop');
      return;
    }
    if(encounters.inCombat){encounters.feedback('Leave combat before summoning your warhorse.');return;}
    for(const angle of [yaw+Math.PI/2,yaw-Math.PI/2,yaw+Math.PI,yaw,yaw+.75,yaw-.75]){
      const x=p.x+Math.sin(angle)*2.74,z=p.z+Math.cos(angle)*2.74;
      if(!horseClear(x,z,yaw)||!groundLink(p,x,z)) continue;
      horse.root.position.set(x,surface(x,z),z);horse.root.rotation.y=yaw;horse.root.visible=true;
      horse.root.scale.setScalar(.61);summoning=.42;
      encounters.waystoneEffect(horse.root.position,0x9778ff);
      encounters.feedback('Warhorse summoned · H to mount');
      return;
    }
    encounters.feedback('Move onto open ground to summon your warhorse.');
  }
  type Door={x:number;z:number;target:{x:number;z:number};entering:boolean;label:string;message:string;locked?:boolean;detail?:string};
  const mouse=new T.Vector2(), ray=new T.Raycaster(), box=new T.Box3();
  function nearbyDoor(pointer?:PointerEvent):Door|undefined{
    if(!save.health) return;
    const p=body.position, floor=towerFloorAt(p.z), cave=caveAt(p.z);
    const doors:Door[]=[];
    if(floor){
      doors.push({...floor.exit,target:{x:briarWatch.x,z:briarWatch.z+3.15},entering:false,label:'Leave Briar Watch',message:'Returned from Briar Watch.'});
      if(floor.number<5){
        const next=towerFloors[floor.number], remaining=floorRemaining(floor,save.defeated);
        doors.push({...floor.stairs,target:next.entry,entering:true,label:'Enter floor '+next.number,
          locked:remaining>0,detail:remaining+' guardians remaining',
          message:next.number===5&&!save.defeatedBosses.includes(briarWatch.boss)?'Boss encounter · The Hollow Sentinel':
            'Briar Watch · Floor '+next.number+' · '+next.title});
      }
    }else if(cave){
      doors.push({...caveExit(cave),target:{x:cave.x,z:cave.z+3.1},entering:false,label:'Leave '+cave.name,message:'Returned from '+cave.name+'.'});
    }else if(!inDen(p.z)){
      doors.push({x:briarWatch.x,z:briarWatch.z,target:towerFloors[0].entry,entering:true,label:'Enter Briar Watch',
        message:'Briar Watch · Floor 1 · '+towerFloors[0].title});
      for(const site of bossCaves){
        const run=save.caveRuns[site.id];
        const waiting=Boolean(run?.readyAt&&run.readyAt>Date.now()&&save.opened.includes(caveRewardId(site,run.cycle)));
        const openReward=Boolean(run?.readyAt&&!save.opened.includes(caveRewardId(site,run.cycle)));
        doors.push({x:site.x,z:site.z,target:caveEntry(site),entering:true,label:'Enter '+site.name,locked:waiting,
          detail:caveStatus(site,save.caveRuns,save.opened),
          message:openReward?'Cave reward · '+site.name:'Boss encounter · '+site.boss+' · Lv '+site.level+
            ' · Recommended '+site.recommended+' · Rank '+site.rank+' · '+site.rarity+' reward'});
      }
    }
    if(pointer){
      const rect=canvas.getBoundingClientRect();
      mouse.set((pointer.clientX-rect.left)/rect.width*2-1,-(pointer.clientY-rect.top)/rect.height*2+1);
      camera.updateMatrixWorld();
      ray.setFromCamera(mouse,camera);
    }
    return doors.find(door=>{
      if(Math.hypot(p.x-door.x,p.z-door.z)>(floor||cave?2.8:3.65)) return false;
      if(!pointer) return true;
      const y=surface(door.x,door.z), width=caveAt(door.target.z)?2.0:1.62;
      box.min.set(door.x-width,y-.35,door.z-2.9);
      box.max.set(door.x+width,y+3.7,door.z+1.6);
      return ray.ray.intersectsBox(box);
    });
  }
  function enterDoor(door:Door){
    if(door.locked){encounters.feedback(door.detail??'Door sealed');return;}
    dismissHorse();
    const p=body.position, target=door.target;
    p.set(target.x,surface(target.x,target.z),target.z);
    body.rotation.y=door.entering?Math.PI:0;
    focus.set(p.x,p.y+.75,p.z);camera.position.copy(focus).addScaledVector(offset,distance);camera.lookAt(focus);
    encounters.transition();
    const cave=caveAt(target.z);
    if(cave) encounters.prepareCave(cave);
    encounters.waystoneEffect(p,cave?.kind==='warlord'?0xffb169:0xa298ff);
    keys.clear();blocking=false;
    onPosition({x:p.x,z:p.z,yaw:body.rotation.y});
    encounters.feedback(door.message);
  }
  function resize(){
    const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
    renderer.setSize(width,height,false);
    camera.aspect=width/height; camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  window.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.altKey||e.metaKey||travel) return;
    if(e.code==='KeyM'||e.code==='Tab'||e.code==='KeyP'||e.code===shadowKeys.panel||(e.code==='Escape'&&uiOpen())){
      e.preventDefault();
      keys.clear();
      blocking=false;
      if(!e.repeat){
        if(e.code==='Tab') onInventory();
        else if(e.code==='KeyP') onStatus();
        else if(e.code===shadowKeys.panel) onShadows();
        else onMapKey(e.code==='Escape');
      }
      return;
    }
    if(!uiOpen()&&!e.repeat){
      if(e.code===shadowKeys.extract){e.preventDefault();encounters.extractShadow();}
      if(e.code===shadowKeys.command){e.preventDefault();encounters.shadowCommand();}
      if(e.code==='KeyH'){e.preventDefault();handleHorse();}
      if(e.code==='KeyQ'&&!blocking){
        e.preventDefault();
        if(mounted) encounters.feedback('Dismount to use your weapon.');
        else encounters.cast(knight.playAttack);
      }
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
      const door=nearbyDoor();
      if(door){enterDoor(door);return;}
      const wasInside=inDen(p.z);
      const stone=save.health?nearStone():undefined;
      if(save.health&&(atGate||atExit)){
        dismissHorse();
        const point=atGate?den.entry:{x:den.gate.x,z:den.gate.z+3.9};
        p.set(point.x,surface(point.x,point.z),point.z);
        body.rotation.y=atGate?Math.PI:0;
        encounters.transition();
        keys.clear();blocking=false;
      } else if(stone){
        if(save.waystones.includes(stone.id)) encounters.feedback('Open the World Atlas with M to travel.');
        else {
          save.waystones.push(stone.id);
          encounters.waystoneEffect();
          encounters.feedback(stone.name+' activated · Fast travel unlocked');
        }
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
    if(!e.isPrimary||uiOpen()||travel) return;
    if(e.button===0){
      const door=nearbyDoor(e);
      if(door){enterDoor(door);return;}
    }
    if(mounted) return;
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
      frameDelta=uiOpen()&&!travel?0:dt;
      if(travel){
        travel.remaining-=dt;
        if(!travel.arrived&&travel.remaining<=.43){
          travel.arrived=true;
          const next=travel.target;
          body.position.set(next.x,surface(next.x,next.z),next.z);
          body.rotation.y=next.yaw;
          focus.set(next.x,body.position.y+.75,next.z);
          onPosition(next);
          encounters.transition();
          encounters.waystoneEffect();
        }
        body.visible=travel.remaining>.64||travel.remaining<.35;
        if(travel.remaining<=0){travel=undefined;body.visible=true;}
      }
      shakePhase+=frameDelta;
      if(!save.health&&mounted) dismissHorse();
      if(uiOpen()||!save.health||travel) {keys.clear(); blocking=false;}
      const x=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));
      const z=Number(keys.has('KeyS'))-Number(keys.has('KeyW'));
      const length=encounters.dashing?0:Math.hypot(x,z);
      const sprinting=keys.has('ShiftLeft')||keys.has('ShiftRight');
      const speed=(mounted?(sprinting?17.8:10.8):blocking?3:sprinting?12:6)*moveSpeed(effectiveStats(save))*encounters.movementFactor;
      const previousYaw=body.rotation.y;
      let heading=previousYaw;
      if(length&&mounted){
        const delta=Math.atan2(x,z)-heading;
        const next=heading+Math.atan2(Math.sin(delta),Math.cos(delta))*(1-Math.exp(-10*dt));
        if(horseClear(body.position.x,body.position.z,next)) heading=next;
      }
      const p=body.position;
      const beforeX=p.x,beforeZ=p.z;
      if(length){
        const dx=(mounted?Math.sin(heading):x/length)*speed*dt,dz=(mounted?Math.cos(heading):z/length)*speed*dt;
        if(mounted){
          const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.34));
          for(let i=0;i<steps;i++){
            if(!horseClear(p.x+dx/steps,p.z+dz/steps,heading)) break;
            p.x+=dx/steps;p.z+=dz/steps;
          }
        }else{
          if(canWalk(p.x+dx,p.z)) p.x+=dx;
          if(canWalk(p.x,p.z+dz)) p.z+=dz;
        }
      }
      const travelled=Math.hypot(p.x-beforeX,p.z-beforeZ);
      if(mounted){
        body.rotation.y=heading;
        horse.root.position.set(p.x,surface(p.x,p.z),p.z);horse.root.rotation.y=heading;
      }
      if(summoning>0){
        summoning=Math.max(0,summoning-frameDelta);
        horse.root.scale.setScalar(.61+.39*T.MathUtils.smoothstep(1-summoning/.42,0,1));
      }
      if(horse.root.visible) horse.update(frameDelta,mounted?travelled/Math.max(dt,.001):0,sprinting,(heading-previousYaw)/Math.max(.01,dt)*.28);
      knight.update(frameDelta,{
        speed:dt>0?travelled/dt:0,
        sprinting:sprinting&&!blocking,
        blocking,
        facing:length&&!mounted?Math.atan2(x,z):undefined,
        saddleBob:mounted?horse.saddleBob:undefined,
      });
      p.y=T.MathUtils.lerp(p.y,surface(p.x,p.z),1-Math.exp(-22*dt));
      if(!uiOpen()&&!travel) {
        encounters.update(dt,blocking);
        if(mounted){
          if(!horseClear(p.x,p.z,heading)){p.x=horse.root.position.x;p.z=horse.root.position.z;}
          horse.root.position.set(p.x,surface(p.x,p.z),p.z);
        }
        const view=encounters.ui();
        if(save.health&&Math.hypot(p.x-den.gate.x,p.z-den.gate.z)<3.4)
          view.prompt='E · Enter Hollow Fang Den · Rank E · Suggested level 5';
        if(save.health&&Math.hypot(p.x-den.exit.x,p.z-den.exit.z)<2.8)
          view.prompt='E · Return to Blackwater Wilds';
        const door=nearbyDoor();
        if(door) view.prompt=door.locked?'Door sealed · '+door.detail:'E or click · '+door.label;
        const stone=save.health?nearStone():undefined;
        if(stone) view.prompt=save.waystones.includes(stone.id)?'M · Travel from '+stone.name:'E · Activate '+stone.name;
        const seconds=Math.ceil(encounters.abilityRemaining);
        if(view.prompt!==prompt||view.notification!==notification||seconds!==abilitySeconds||bossHealth!==encounters.bossHealth||shadowAvailable!==view.shadowAvailable){
          prompt=view.prompt; notification=view.notification; abilitySeconds=seconds; bossHealth=encounters.bossHealth;shadowAvailable=view.shadowAvailable;
          onCombat(notification,prompt,abilitySeconds,bossHealth,shadowAvailable);
        }
      }
      destination.set(p.x,p.y+(mounted?1.57:.75),p.z);
      focus.lerp(destination,1-Math.exp(-7*dt));
      distance=T.MathUtils.lerp(distance,zoom,1-Math.exp(-9*dt));
      camera.position.copy(focus).addScaledVector(offset,distance);
      camera.position.x+=Math.sin(shakePhase*76)*encounters.shake*.105;
      camera.position.y+=Math.cos(shakePhase*67)*encounters.shake*.075;
      camera.lookAt(focus);
      lastReport+=dt;
      if(lastReport>=.09&&(p.x!==reportedX||p.z!==reportedZ||Math.abs(body.rotation.y-reportedYaw)>.025)){
        lastReport=0; reportedX=p.x; reportedZ=p.z; reportedYaw=body.rotation.y; onPosition({x:p.x,z:p.z,yaw:reportedYaw});
      }
    },
    render(time){
      caves.update(time,body.position);
      tower.update(time,body.position,save.defeated);
      water.value=time;
      grass.update(time,encounters.dashing,encounters.grassInfluences);
      stones.update(time,body.position,save.waystones);
      animateCamp(time,body.position);
      animateRitual(time,body.position);
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
    toggleShadow:encounters.toggleShadow,summonAllShadows:encounters.summonAllShadows,
    dismissAllShadows:encounters.dismissAllShadows,renameShadow:encounters.renameShadow,
    shadowCommand:encounters.shadowCommand,encounterMarkers:encounters.encounterMarkers,
    travelTo(id:string){
      if(travel||!save.health) return 'Travel is unavailable right now.';
      if(towerFloorAt(body.position.z)||caveAt(body.position.z)) return 'Use the dungeon exit before fast travel.';
      if(inDen(body.position.z)&&body.position.z<330)
        return 'Waystone travel is unavailable in the Fang Guardian arena.';
      if(encounters.inCombat) return 'Leave combat before using a Waystone.';
      const stone=waystones.find(entry=>entry.id===id);
      if(!stone||!save.waystones.includes(id)) return 'Activate this Waystone in the wilderness first.';
      const target={x:stone.x,z:stone.z+2.55,yaw:stone.yaw};
      if(Math.hypot(body.position.x-target.x,body.position.z-target.z)<3) return 'You are already at this Waystone.';
      if(!canWalk(target.x,target.z)||!encounters.arrivalClear(target.x,target.z)) return 'The destination is obstructed or threatened.';
      keys.clear();blocking=false;
      dismissHorse();
      encounters.transition();
      encounters.waystoneEffect();
      travel={target,remaining:.88,arrived:false};
      return '';
    },
    equip,
    equipArmor(slot:ArmorSlot,id:ArmorId|null){
      if(id&&(!save.armorItems.includes(id)||armorPiece(id).slot!==slot)) return;
      const next={...save.equippedArmor};
      if(id) next[slot]=id;else delete next[slot];
      save.equippedArmor=next;
      if(save.health>0) save.health=Math.min(save.health,maxHunterHealth(save));
      knight.equipArmor(next);
      onSaveChange();
    },
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
    loop.stop(); controller.abort(); observer.disconnect(); encounters.dispose();stones.dispose();grass.dispose();tower.dispose();caves.dispose();horse.dispose();knight.disposeArmor();
    const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
    scene.traverse(object=>{
      if(object instanceof T.InstancedMesh) object.dispose();
      if(object instanceof T.DirectionalLight) object.shadow.dispose();
      if(object instanceof T.Mesh||object instanceof T.Points||object instanceof T.Line){
        geometries.add(object.geometry);
        for(const material of Array.isArray(object.material)?object.material:[object.material]) materials.add(material);
      }
    });
    geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose());
    renderer.dispose();
    },
  };
}
