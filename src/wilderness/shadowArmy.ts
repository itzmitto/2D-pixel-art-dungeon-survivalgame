import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { CreatureRig } from './creatureGeometry.ts';
import type { Exploration } from './exploration.ts';
import { surface } from './layout.ts';
import type { createMagicEffects, Point } from './magicEffects.ts';
import { cleanShadowName, grantShadowXp, shadowCapacity, shadowName, shadowStats, shadowTuning, shadowProfiles, shadowRank,
  shadowStrength, shadowCommands, type ShadowCommand, type ShadowGrade, type ShadowKind, type ShadowSoldier } from './shadowData.ts';

type Hostile={id:string;hp:number;root:T.Group;hitFlash:number};
type Companion={
  record:ShadowSoldier;rig:CreatureRig;target?:Hostile;phase:number;gait:number;
  bite:number;windup:number;recovery:number;hurt:number;seek:number;rise:number;strikes:number;
};

export function shadowArmy<Enemy extends Hostile>(
  group:T.Group,player:T.Group,save:Exploration,
  rigFor:(kind:ShadowKind)=>CreatureRig,
  canWalk:(x:number,z:number)=>boolean,
  clear:(x:number,z:number,tx:number,tz:number)=>boolean,
  fx:ReturnType<typeof createMagicEffects>,
  notify:(text:string)=>void,
  changed:()=>void,
){
  const active=new Map<string,Companion>(), pool=new Map<ShadowKind,CreatureRig[]>(), participation=new Map<string,Set<string>>();
  const smokeGeometry=new T.PlaneGeometry(1.8,1.8);
  const smokeMaterial=new T.ShaderMaterial({
    uniforms:{clock:{value:0}},transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,
    vertexShader:`varying vec2 uvPoint;
      void main(){uvPoint=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float clock; varying vec2 uvPoint;
      void main(){
        vec2 p=uvPoint; p.x+=sin(p.y*7.+clock*2.2)*.12;
        float edge=max(0.,1.-length(p));
        float smoke=.61+.28*sin(p.y*21.+p.x*9.+clock*2.)+.11*cos(p.x*25.-clock);
        gl_FragColor=vec4(mix(vec3(.014,.011,.025),vec3(.041,.088,.18),pow(edge,.7)),.63*edge*smoke);
        #include <colorspace_fragment>
      }`,
  });
  const smoke=new T.InstancedMesh(smokeGeometry,smokeMaterial,64);
  smoke.count=0;smoke.renderOrder=4;smoke.frustumCulled=false;smoke.instanceMatrix.setUsage(T.DynamicDrawUsage);group.add(smoke);
  const moteGeometry=new T.OctahedronGeometry(.048);
  const moteMaterial=new T.MeshBasicMaterial({color:0x222545,toneMapped:false});
  const motes=new T.InstancedMesh(moteGeometry,moteMaterial,64);
  motes.count=0;motes.frustumCulled=false;motes.instanceMatrix.setUsage(T.DynamicDrawUsage);group.add(motes);
  const proxyMaterial=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false});
  function proxyGeometry(beast:boolean,caster=false){
    const body=new T.IcosahedronGeometry(1,0).scale(beast?.35:.36,beast?.43:.81,beast?.97:.27)
      .translate(0,beast?1.35:1.15,0);
    const head=new T.OctahedronGeometry(1).scale(.27,.32,beast?.44:.27).translate(0,beast?1.70:2.06,beast?1.0:.08);
    const parts:T.BufferGeometry[]=[body,head];
    for(const side of [-1,1]){
      for(const z of beast?[-.62,.61]:[.03])
        parts.push(new T.BoxGeometry(.16,beast?1.12:1.16,.18).translate(side*.26,.59,z));
      if(!beast) parts.push(new T.BoxGeometry(.17,.76,.21).rotateZ(side*.22).translate(side*.41,1.4,.01));
    }
    if(caster) parts.push(new T.BoxGeometry(.083,2.65,.08).translate(.51,1.47,.14));
    if(beast) parts.push(new T.OctahedronGeometry(.39).scale(.51,.67,1.7).translate(0,1.42,-1.16));
    const nonIndexed=parts.map(part=>part.index?part.toNonIndexed():part);
    const geometry=mergeGeometries(nonIndexed)!;
    new Set([...parts,...nonIndexed]).forEach(part=>part.dispose());
    return geometry;
  }
  const proxies=[proxyGeometry(true),proxyGeometry(false),proxyGeometry(false,true)].map(geometry=>{
    const mesh=new T.InstancedMesh(geometry,proxyMaterial,shadowTuning.limits.SSS);
    mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    group.add(mesh);return mesh;
  });
  const projectiles:{state:Companion;target:Hostile;point:Point;life:number;trail:number;radius:number}[]=[];
  const spatialKey=(x:number,z:number,size:number)=>Math.floor(x/size)*4096+Math.floor(z/size);
  const nearbyHostiles=new Map<number,Enemy[]>(), nearbyAllies=new Map<number,Companion[]>();
  let nextIndex=0;
  const tint=new T.Color(), warmRigLimit=18;
  const stamp=new T.Object3D();
  let time=0,lastPrune=0;
  function spot(index:number,radius=2.55+Math.sqrt(index)*.85){
    const p=player.position;
    for(let i=0;i<12;i++){
      const angle=i*2.399+index*2.399+player.rotation.y+Math.PI;
      const ring=Math.max(1.75,radius-i*.32);
      const x=p.x+Math.sin(angle)*ring,z=p.z+Math.cos(angle)*ring;
      if(canWalk(x,z)&&clear(p.x,p.z,x,z)) return {x,z};
    }
    return {x:p.x,z:p.z};
  }
  function setDown(state:Companion,point:Point,underground=false){
    const p=point;
    state.rig.root.position.set(p.x,surface(p.x,p.z)-(underground?.94:0),p.z);
    state.rig.root.rotation.y=player.rotation.y;
    state.target=undefined;state.windup=0;state.seek=0;
  }
  function raise(record:ShadowSoldier,point?:Point,visual=true){
    const kind=record.kind;
    const rig=pool.get(kind)?.pop()??rigFor(kind);
    rig.root.name=record.name;
    rig.root.scale.setScalar(kind==='guardian'?1.59:record.grade==='boss'?1.38:kind==='dire'||kind==='elite'?1.23:1);
    rig.root.visible=true;group.add(rig.root);
    const state:Companion={record,rig,phase:0,gait:0,bite:.2,windup:0,recovery:0,hurt:0,seek:0,rise:visual?.73:0,strikes:0};
    active.set(record.id,state);
    setDown(state,point??spot(active.size),visual);
    if(visual){
      fx.emit(rig.root.position,shadowProfiles[kind].color,'ring',.65,.75,{grow:2.68,opacity:.92});
      fx.emit(rig.root.position,0x3262d9,'ray',.61,.67,{y:1.12,aspect:3.5});
      fx.scatter(rig.root.position,0x78baff,8,.48);
    }
  }
  function dismiss(state:Companion){
    const {record,rig}=state;
    record.active=false;
    active.delete(record.id);
    group.remove(rig.root);
    const cached=pool.get(record.kind)??[];
    if(cached.length<8){cached.push(rig);pool.set(record.kind,cached);}
  }
  for(const record of save.shadows){
    if(record.active&&record.readyAt<=Date.now()&&active.size<shadowCapacity(save.level)) raise(record,undefined,false);
    else record.active=false;
  }
  function available(){
    const p=player.position, now=Date.now();
    return save.shadowEssences.find(essence=>essence.expiresAt>now&&!save.shadows.some(record=>record.id===essence.id||essence.grade==='boss'&&record.kind===essence.kind)&&Math.hypot(essence.x-p.x,essence.z-p.z)<3.5&&
      clear(p.x,p.z,essence.x,essence.z));
  }
  function summon(record:ShadowSoldier){
    if(record.active||record.readyAt>Date.now()||!save.health||active.size>=shadowCapacity(save.level)) return false;
    if(!record.health) record.health=shadowStats(record).health;
    record.active=true;raise(record,undefined,active.size<10);
    return true;
  }
  return {
    available,
    remember(id:string,kind:ShadowKind,grade:ShadowGrade,level:number,baseHealth:number,baseDamage:number,point:Point){
      if(save.shadows.some(record=>record.id===id||grade==='boss'&&record.kind===kind)||
        save.shadowEssences.some(essence=>essence.id===id)) return;
      save.shadowEssences=save.shadowEssences.filter(essence=>essence.expiresAt>Date.now()).slice(-95);
      save.shadowEssences.push({id,kind,grade,attempts:0,level,baseHealth,baseDamage,x:point.x,z:point.z,expiresAt:Date.now()+shadowTuning.essenceMs});
      fx.emit(point,0x478aff,'ring',.72,1.70,{grow:.19,opacity:.69});
    },
    extract(){
      if(!save.health) return;
      const essence=available();
      if(!essence) return;
      const hasSlot=active.size<shadowCapacity(save.level);
      essence.attempts++;
      if(Math.random()>=shadowTuning.extraction[essence.grade]){
        const remaining=shadowTuning.attempts[essence.grade]-essence.attempts;
        if(!remaining) save.shadowEssences=save.shadowEssences.filter(item=>item!==essence);
        fx.emit(essence,0x745ea9,'ring',.89,.43,{grow:1.45});
        notify('Shadow extraction failed · '+(remaining?remaining+' attempts remaining':'Essence dispersed'));
        return;
      }
      save.shadowEssences=save.shadowEssences.filter(item=>item!==essence);
      if(essence.grade==='boss') save.shadowEssences=save.shadowEssences.filter(item=>item.kind!==essence.kind);
      const record:ShadowSoldier={id:essence.id,kind:essence.kind,grade:essence.grade,name:shadowName(essence.kind),
        level:essence.level,originLevel:essence.level,xp:0,baseHealth:essence.baseHealth,baseDamage:essence.baseDamage,
        active:true,health:shadowStats(essence).health,readyAt:0};
      save.shadows=[...save.shadows,record];
      if(hasSlot) raise(record,essence);
      else{
        fx.emit(essence,shadowProfiles[record.kind].color,'ring',.86,.65,{grow:2.14});
        fx.scatter(essence,shadowProfiles[record.kind].color,7,.41);
      }
      notify('Shadow extracted · '+record.name+(hasSlot?'':' · Added to reserves'));
    },
    toggle(id:string){
      const state=active.get(id);
      if(state){dismiss(state);changed();return;}
      const record=save.shadows.find(shadow=>shadow.id===id);
      if(record&&summon(record)) changed();
    },
    rename(id:string,name:string){
      const record=save.shadows.find(item=>item.id===id);
      if(!record) return;
      record.name=cleanShadowName(name)||shadowName(record.kind);changed();
    },
    command(command?:ShadowCommand){
      save.shadowCommand=command??shadowCommands[(shadowCommands.indexOf(save.shadowCommand)+1)%shadowCommands.length];
      for(const state of active.values()){state.target=undefined;state.windup=0;state.seek=0;}
      projectiles.length=0;
      notify('Army command · '+save.shadowCommand);
    },
    dismissAll(){
      if(!active.size) return;
      for(const state of active.values()) dismiss(state);
      projectiles.length=0;changed();
    },
    summonAll(strongest=false){
      let added=0;
      const records=strongest?[...save.shadows].sort((a,b)=>shadowStrength(b)-shadowStrength(a)):save.shadows;
      if(strongest) for(const state of active.values()) dismiss(state);
      for(const record of records){
        if(active.size>=shadowCapacity(save.level)) break;
        if(summon(record)) added++;
      }
      if(added||strongest) changed();
    },
    transition(){
      projectiles.length=0;
      let i=0;
      for(const shadow of active.values()){
        shadow.rise=0;setDown(shadow,spot(i++));
      }
    },
    guardTarget(enemy:Hostile,reach:number){
      const point=enemy.root.position;
      let picked:Companion|undefined, nearest=reach;
      for(const state of active.values()){
        if(state.target!==enemy||state.rise>0) continue;
        const p=state.rig.root.position, distance=Math.hypot(p.x-point.x,p.z-point.z);
        if(distance<nearest&&clear(point.x,point.z,p.x,p.z)){picked=state;nearest=distance;}
      }
      return picked?.record.id;
    },
    hit(id:string,enemy:Hostile,amount:number,reach:number){
      const state=active.get(id);
      if(!state) return;
      const p=state.rig.root.position, q=enemy.root.position;
      if(Math.hypot(p.x-q.x,p.z-q.z)>reach||!clear(p.x,p.z,q.x,q.z)) return;
      state.record.health=Math.max(0,state.record.health-amount*(state.record.kind==='skeleton'?.76:1));
      state.hurt=.28;
      if(state.record.kind==='skeleton') fx.emit(p,0x89ceff,'arc',.59,.22,{y:.82,yaw:state.rig.root.rotation.y,opacity:.57});
      if(state.record.health<=0){
        state.record.readyAt=Date.now()+shadowTuning.recoveryMs;
        fx.emit(p,0x5373cc,'mist',1.1,.37,{y:.6,grow:1.2});
        dismiss(state);
        notify('Shadow recovering · '+state.record.name);
      }else changed();
    },
    guardPoint(id:string){return active.get(id)?.rig.root.position;},
    award(enemyId:string,xp:number){
      const participants=participation.get(enemyId);
      if(!participants) return;
      const promoted:string[]=[];
      for(const record of save.shadows) if(participants.has(record.id)){
        const before=shadowRank(record.level);
        grantShadowXp(record,Math.max(3,Math.round(xp*.63)));
        const rank=shadowRank(record.level);
        if(rank!==before) promoted.push(record.name+' → '+rank);
      }
      participation.delete(enemyId);
      return promoted;
    },
    forget(enemyId:string){participation.delete(enemyId);},
    update(dt:number,enemies:readonly Enemy[],strike:(enemy:Enemy,damage:number,frost?:boolean)=>void){
      time+=dt;
      if(time-lastPrune>2.5){
        lastPrune=time;
        const now=Date.now();
        save.shadowEssences=save.shadowEssences.filter(essence=>essence.expiresAt>now);
      }
      if(!active.size&&!projectiles.length) return;
      const leader=player.position, aggressive=save.shadowCommand==='Aggressive';
      const reach=aggressive?27:13.2, fighting=save.shadowCommand!=='Follow';
      function around(x:number,z:number,radius:number,visit:(enemy:Enemy)=>void){
        const x0=Math.floor((x-radius)/8),x1=Math.floor((x+radius)/8);
        const z0=Math.floor((z-radius)/8),z1=Math.floor((z+radius)/8);
        for(let xx=x0;xx<=x1;xx++) for(let zz=z0;zz<=z1;zz++)
          for(const enemy of nearbyHostiles.get(xx*4096+zz)??[]) if(enemy.hp>0) visit(enemy);
      }
      if(time>=nextIndex){
        nextIndex=time+.14;
        nearbyHostiles.clear();
        for(const enemy of enemies){
          const {x,z}=enemy.root.position;
          if(enemy.hp<=0||Math.hypot(x-leader.x,z-leader.z)>34) continue;
          const key=spatialKey(x,z,8), cell=nearbyHostiles.get(key);
          if(cell) cell.push(enemy);else nearbyHostiles.set(key,[enemy]);
        }
      }
      nearbyAllies.clear();
      for(const state of active.values()){
        const {x,z}=state.rig.root.position,key=spatialKey(x,z,2.5),cell=nearbyAllies.get(key);
        if(cell) cell.push(state);else nearbyAllies.set(key,[state]);
      }
      function deal(state:Companion,enemy:Enemy,damage:number,frost=false){
        if(enemy.hp<=0||!state.record.active) return;
        const participants=participation.get(enemy.id)??new Set<string>();
        participants.add(state.record.id);participation.set(enemy.id,participants);
        strike(enemy,damage,frost);
      }
      function burst(state:Companion,point:Point,radius:number,damage:number,exclude?:Hostile,frost=false){
        let victims=0;
        around(point.x,point.z,radius,enemy=>{
          const q=enemy.root.position;
          if(victims>=4||enemy===exclude||Math.hypot(q.x-point.x,q.z-point.z)>radius||!clear(point.x,point.z,q.x,q.z)) return;
          victims++;deal(state,enemy,damage,frost);
        });
      }
      for(let i=projectiles.length-1;i>=0;i--){
        const bolt=projectiles[i], q=bolt.target.root.position;
        bolt.life-=dt;bolt.trail-=dt;
        const dx=q.x-bolt.point.x,dz=q.z-bolt.point.z, gap=Math.hypot(dx,dz);
        const velocity=20, step=Math.min(gap,dt*velocity);
        const p=bolt.point, x=p.x+dx/(gap||1)*step,z=p.z+dz/(gap||1)*step;
        if(bolt.life<=0||!bolt.target.hp||!bolt.state.record.active||!canWalk(x,z)||!fighting){
          projectiles.splice(i,1);continue;
        }
        p.x=x;p.z=z;
        const frost=bolt.state.record.kind==='frostGuardian', color=shadowProfiles[bolt.state.record.kind].color;
        if(bolt.trail<=0){
          bolt.trail=.09;
          fx.emit(p,color,'crystal',.53,.19,{y:1.13,aspect:.85,opacity:.83});
        }
        if(gap<=step+.65){
          const damage=shadowStats(bolt.state.record).damage;
          deal(bolt.state,bolt.target as Enemy,damage,frost);
          if(bolt.radius){
            fx.emit(q,color,frost?'frost':'ring',bolt.radius,.57,{opacity:.65});
            burst(bolt.state,q,bolt.radius,damage*.48,bolt.target,frost);
          }
          projectiles.splice(i,1);
        }
      }
      let index=0, full=0;
      for(const state of active.values()){
        const {rig,record}=state,p=rig.root.position,n=index++, profile=shadowProfiles[record.kind];
        if(!save.health){rig.root.visible=false;continue;}
        state.rise=Math.max(0,state.rise-dt);
        state.seek-=dt;state.bite=Math.max(0,state.bite-dt);
        state.hurt=Math.max(0,state.hurt-dt);state.recovery=Math.max(0,state.recovery-dt);
        const distance=Math.hypot(p.x-leader.x,p.z-leader.z);
        if(distance>reach+11) setDown(state,spot(n));
        if(state.seek<=0&&!state.windup){
          state.seek=.32+(n%11)*.042;
          let best=reach;
          state.target=undefined;
          if(fighting) around(p.x,p.z,reach,enemy=>{
            const q=enemy.root.position,d=Math.hypot(q.x-p.x,q.z-p.z);
            if(d>=best||Math.hypot(q.x-leader.x,q.z-leader.z)>reach||
              (!aggressive&&enemy.hitFlash<=0&&Math.hypot(q.x-leader.x,q.z-leader.z)>8.3)||!clear(p.x,p.z,q.x,q.z)) return;
            state.target=enemy;best=d;
          });
        }
        const target=state.target;
        const ranged=profile.style==='spell'||profile.style==='frost'||profile.style==='dragon';
        const charge=profile.style==='dash'||profile.style==='charge';
        if(state.windup>0){
          state.windup=Math.max(0,state.windup-dt);
          if(!state.windup){
            state.bite=profile.cooldown;state.recovery=.31;
            if(fighting&&target&&target.hp>0&&Math.hypot(target.root.position.x-p.x,target.root.position.z-p.z)<profile.range+.45&&
              clear(p.x,p.z,target.root.position.x,target.root.position.z)){
              const q=target.root.position;
              let damage=shadowStats(record).damage;
              if(profile.style==='bite'){
                const pack=nearbyAllies.get(spatialKey(p.x,p.z,2.5))??[];
                if(pack.some(ally=>ally!==state&&ally.target===target&&shadowProfiles[ally.record.kind].style==='bite')) damage*=1.12;
              }
              state.strikes++;
              if(ranged){
                if(projectiles.length<18) projectiles.push({state,target,point:{x:p.x,z:p.z},trail:0,life:1.1,
                  radius:state.strikes%3===0?(profile.style==='dragon'?4.2:3.4):0});
              }else{
                const yaw=Math.atan2(q.x-p.x,q.z-p.z);
                if(charge){
                  const gap=Math.hypot(q.x-p.x,q.z-p.z),step=Math.max(0,gap-1.45);
                  const x=p.x+Math.sin(yaw)*step,z=p.z+Math.cos(yaw)*step;
                  if(canWalk(x,z)&&clear(p.x,p.z,x,z)){p.x=x;p.z=z;}
                }
                deal(state,target as Enemy,damage);
                if(profile.style==='slam'&&state.strikes%2===0){
                  fx.emit(p,profile.color,'ring',1.42,.46,{grow:5.1,opacity:.73});
                  burst(state,p,3.55,damage*.53,target);
                }else if(profile.style!=='bite') fx.emit(p,profile.color,'arc',1.16,.25,{yaw,y:.92,aspect:.72});
                if(n<28) fx.scatter(q,profile.color,3,.64);
              }
            }
          }
        }
        const angle=n*2.399+player.rotation.y+Math.PI, radius=2.45+Math.sqrt(n)*.86;
        const goal=target?.hp?target.root.position:{x:leader.x+Math.sin(angle)*radius,z:leader.z+Math.cos(angle)*radius};
        const dx=goal.x-p.x,dz=goal.z-p.z,gap=Math.hypot(dx,dz), yaw=Math.atan2(dx,dz);
        let speed=0;
        const desired=target?.hp?Math.max(1.42,profile.range-(ranged?1.5:.62)):.69;
        if(!state.rise&&target?.hp&&gap<profile.range&&!state.bite&&!state.windup&&clear(p.x,p.z,goal.x,goal.z)) state.windup=profile.windup;
        if(!state.rise&&!state.windup&&gap>desired){
          const step=Math.min(gap,(distance>11?11:target?.hp?6.7:5.5)*dt);
          for(const offset of [0,.61,-.61,1.20,-1.20]){
            const a=yaw+offset,x=p.x+Math.sin(a)*step,z=p.z+Math.cos(a)*step;
            if(!canWalk(x,z)||Math.hypot(x-leader.x,z-leader.z)<.78) continue;
            let crowded=false;
            const ix=Math.floor(x/2.5),iz=Math.floor(z/2.5);
            for(let xx=ix-1;xx<=ix+1&&!crowded;xx++) for(let zz=iz-1;zz<=iz+1&&!crowded;zz++){
              for(const other of nearbyAllies.get(xx*4096+zz)??[]){
                if(other===state) continue;
                const q=other.rig.root.position, separation=(record.grade==='boss'||other.record.grade==='boss')?1.31:1.01;
                const next=Math.hypot(x-q.x,z-q.z);
                if(next<separation&&Math.hypot(p.x-q.x,p.z-q.z)>=next){crowded=true;break;}
              }
            }
            if(crowded) continue;
            p.x=x;p.z=z;speed=step/Math.max(dt,.001);break;
          }
        }
        if(!target?.hp&&!state.rise&&distance<9&&record.health<shadowStats(record).health)
          record.health=Math.min(shadowStats(record).health,record.health+dt*.65);
        if(gap>.21){
          const delta=yaw-rig.root.rotation.y;
          rig.root.rotation.y+=Math.atan2(Math.sin(delta),Math.cos(delta))*(1-Math.exp(-10*dt));
        }
        p.y=surface(p.x,p.z)-.94*T.MathUtils.smoothstep(state.rise,0,.73);
        state.gait=T.MathUtils.damp(state.gait,Math.min(1,speed/7),12,dt);
        state.phase+=speed*dt*2.8;
        const detailed=state.rise>0||distance<17&&(record.grade==='boss'||full<warmRigLimit);
        rig.root.visible=detailed;
        if(detailed){
          full++;
          if(distance<8||n%2===Math.floor(time*30)%2||state.windup>0)
            rig.animate({time,phase:state.phase,gait:state.gait,windup:state.windup>0?.32+(1-state.windup/profile.windup)*.67:0,
              recovery:state.recovery/.31,hit:state.hurt/.28,leap:charge?state.recovery/.31*.76:profile.style==='dragon'&&state.windup>0?.59:0,dead:0,frozen:false,
              alert:target?.hp?1:0,distance});
        }
      }
    },
    render(){
      for(const mesh of proxies) mesh.count=0;
      smoke.count=motes.count=0;smokeMaterial.uniforms.clock.value=time;
      const emit=(p:Point,y:number,phase:number,scale:number)=>{
        if(smoke.count===64) return;
        const angle=phase*6.283;
        stamp.position.set(p.x+Math.cos(angle)*.94,y,p.z+Math.sin(angle)*.94);
        stamp.rotation.set(-.8,angle*.52,angle);
        stamp.scale.setScalar(scale);stamp.updateMatrix();smoke.setMatrixAt(smoke.count++,stamp.matrix);
        stamp.position.y+=phase*.54;stamp.scale.setScalar(scale*.7);stamp.updateMatrix();
        motes.setMatrixAt(motes.count++,stamp.matrix);
      };
      const p=player.position;
      for(const state of active.values()){
        const q=state.rig.root.position, kind=state.record.kind, profile=shadowProfiles[kind];
        if(save.health&&!state.rig.root.visible){
          const mesh=proxies[profile.category==='Beast'||kind==='guardian'||kind==='ancientDragon'?0:profile.category==='Caster'||kind==='frostGuardian'||kind==='darkArchmage'?2:1];
          stamp.position.copy(q);stamp.rotation.set(0,state.rig.root.rotation.y,0);stamp.scale.copy(state.rig.root.scale);stamp.updateMatrix();
          const i=mesh.count++;
          mesh.setMatrixAt(i,stamp.matrix);
          tint.setHex(profile.color).multiplyScalar(.21);mesh.setColorAt(i,tint);
        }
        if(!save.health||Math.hypot(p.x-q.x,p.z-q.z)>24) continue;
        for(let i=0;i<(state.rise>0?7:state.rig.root.visible?2:0);i++){
          const phase=(time*.52+i*.379+state.phase*.07)%1;
          emit(q,q.y+.3+phase*(state.rise>0?1.52:.86),phase,(state.rise>0?.83:.61)*Math.sin(phase*Math.PI));
        }
      }
      const now=Date.now();
      for(const essence of save.shadowEssences){
        if(essence.expiresAt<=now||Math.hypot(essence.x-p.x,essence.z-p.z)>19) continue;
        const phase=(time*.63+(essence.x+240)*.14)%1;
        emit(essence,surface(essence.x,essence.z)+.23+phase*.64,phase,.77*Math.sin(phase*Math.PI));
      }
      for(const mesh of proxies) if(mesh.count){
        mesh.instanceMatrix.needsUpdate=true;
        if(mesh.instanceColor) mesh.instanceColor.needsUpdate=true;
      }
      if(smoke.count) smoke.instanceMatrix.needsUpdate=true;
      if(motes.count) motes.instanceMatrix.needsUpdate=true;
    },
    dispose(){
      for(const mesh of proxies){mesh.geometry.dispose();mesh.dispose();}proxyMaterial.dispose();
      smoke.dispose();motes.dispose();smokeGeometry.dispose();moteGeometry.dispose();smokeMaterial.dispose();moteMaterial.dispose();
    },
  };
}
