import * as T from 'three';
import type { CreatureRig } from './creatureGeometry.ts';
import type { Exploration } from './exploration.ts';
import { surface } from './layout.ts';
import type { createMagicEffects, Point } from './magicEffects.ts';
import { grantShadowXp, shadowCapacity, shadowName, shadowStats, shadowTuning, type ShadowKind, type ShadowSoldier } from './shadowData.ts';

type Hostile={id:string;hp:number;root:T.Group};
type Companion={
  record:ShadowSoldier;rig:CreatureRig;target?:Hostile;phase:number;gait:number;
  bite:number;windup:number;recovery:number;hurt:number;seek:number;rise:number;
};

export function shadowArmy(
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
  const stamp=new T.Object3D();
  let time=0,lastPrune=0;
  function spot(index:number,radius=2.6){
    const p=player.position;
    for(let i=0;i<12;i++){
      const angle=i*2.399+index*2.399+player.rotation.y+Math.PI;
      const x=p.x+Math.sin(angle)*radius,z=p.z+Math.cos(angle)*radius;
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
    rig.root.name=shadowName(kind);
    rig.root.scale.setScalar(kind==='dire'?1.28:.97);
    rig.root.visible=true;group.add(rig.root);
    const state:Companion={record,rig,phase:0,gait:0,bite:.2,windup:0,recovery:0,hurt:0,seek:0,rise:visual?.73:0};
    active.set(record.id,state);
    setDown(state,point??spot(active.size),visual);
    if(visual){
      fx.emit(rig.root.position,0x77bcff,'ring',.65,.75,{grow:2.68,opacity:.92});
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
    return save.shadowEssences.find(essence=>essence.expiresAt>now&&Math.hypot(essence.x-p.x,essence.z-p.z)<3.5&&
      clear(p.x,p.z,essence.x,essence.z));
  }
  function summon(record:ShadowSoldier){
    if(record.active||record.readyAt>Date.now()||!save.health||active.size>=shadowCapacity(save.level)) return false;
    if(!record.health) record.health=shadowStats(record).health;
    record.active=true;raise(record);
    return true;
  }
  return {
    available,
    remember(id:string,kind:ShadowKind,level:number,baseHealth:number,baseDamage:number,point:Point){
      save.shadowEssences=save.shadowEssences.filter(essence=>essence.expiresAt>Date.now()).slice(-95);
      save.shadowEssences.push({id,kind,level,baseHealth,baseDamage,x:point.x,z:point.z,expiresAt:Date.now()+shadowTuning.essenceMs});
      fx.emit(point,0x478aff,'ring',.72,1.70,{grow:.19,opacity:.69});
    },
    extract(){
      if(!save.health) return;
      const essence=available();
      if(!essence) return;
      if(active.size>=shadowCapacity(save.level)){notify('Shadow capacity reached · Dismiss a shadow with K');return;}
      if(save.shadows.some(record=>record.id===essence.id)) return;
      save.shadowEssences=save.shadowEssences.filter(item=>item.id!==essence.id);
      const record:ShadowSoldier={id:essence.id,kind:essence.kind,level:essence.level,xp:0,
        baseHealth:essence.baseHealth,baseDamage:essence.baseDamage,active:true,health:shadowStats(essence).health,readyAt:0};
      save.shadows=[...save.shadows,record];
      raise(record,essence);
      notify('Shadow extracted · '+shadowName(record.kind));
    },
    toggle(id:string){
      const state=active.get(id);
      if(state){dismiss(state);changed();return;}
      const record=save.shadows.find(shadow=>shadow.id===id);
      if(record&&summon(record)) changed();
    },
    summonAll(){
      let added=0;
      for(const record of save.shadows){
        if(active.size>=shadowCapacity(save.level)) break;
        if(summon(record)) added++;
      }
      if(added) changed();
    },
    transition(){
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
      state.record.health=Math.max(0,state.record.health-amount);
      state.hurt=.28;
      if(state.record.health<=0){
        state.record.readyAt=Date.now()+shadowTuning.recoveryMs;
        fx.emit(p,0x5373cc,'mist',1.1,.37,{y:.6,grow:1.2});
        dismiss(state);
        notify('Shadow recovering · '+shadowName(state.record.kind));
      }else changed();
    },
    guardPoint(id:string){return active.get(id)?.rig.root.position;},
    award(enemyId:string,xp:number){
      const participants=participation.get(enemyId);
      if(!participants) return;
      for(const record of save.shadows) if(participants.has(record.id)) grantShadowXp(record,Math.max(3,Math.round(xp*.63)));
      participation.delete(enemyId);
    },
    forget(enemyId:string){participation.delete(enemyId);},
    update(dt:number,enemies:readonly Hostile[],strike:(enemy:Hostile,damage:number)=>void){
      time+=dt;
      if(time-lastPrune>2.5){
        lastPrune=time;
        const now=Date.now();
        save.shadowEssences=save.shadowEssences.filter(essence=>essence.expiresAt>now);
      }
      let index=0;
      const leader=player.position;
      for(const state of active.values()){
        const {rig,record}=state,p=rig.root.position;
        const n=index++;
        if(!save.health){rig.root.visible=false;continue;}
        rig.root.visible=true;
        state.rise=Math.max(0,state.rise-dt);
        state.seek-=dt;state.bite=Math.max(0,state.bite-dt);
        state.hurt=Math.max(0,state.hurt-dt);state.recovery=Math.max(0,state.recovery-dt);
        const distance=Math.hypot(p.x-leader.x,p.z-leader.z);
        if(distance>31) setDown(state,spot(n));
        if(state.seek<=0){
          state.seek=.31+(n%7)*.035;
          let best=17;
          state.target=undefined;
          for(const enemy of enemies){
            const q=enemy.root.position;
            if(enemy.hp<=0||Math.hypot(q.x-leader.x,q.z-leader.z)>16.3) continue;
            const d=Math.hypot(q.x-p.x,q.z-p.z);
            if(d<best&&clear(p.x,p.z,q.x,q.z)){state.target=enemy;best=d;}
          }
        }
        const target=state.target;
        if(state.windup>0){
          state.windup=Math.max(0,state.windup-dt);
          if(!state.windup){
            state.bite=record.kind==='dire'?1.03:.91;state.recovery=.28;
            if(target&&target.hp>0&&Math.hypot(target.root.position.x-p.x,target.root.position.z-p.z)<2.32&&
              clear(p.x,p.z,target.root.position.x,target.root.position.z)){
              const participants=participation.get(target.id)??new Set<string>();
              participants.add(record.id);participation.set(target.id,participants);
              strike(target,shadowStats(record).damage);
              fx.scatter(target.root.position,0x4c92ef,3,.58);
            }
          }
        }
        const angle=n*2.399+player.rotation.y, radius=2.35+Math.floor(n/6)*.74;
        const goal=target?.hp?target.root.position:{x:leader.x+Math.sin(angle)*radius,z:leader.z+Math.cos(angle)*radius};
        const dx=goal.x-p.x,dz=goal.z-p.z,gap=Math.hypot(dx,dz);
        const yaw=Math.atan2(dx,dz);
        let speed=0;
        if(!state.rise&&target?.hp&&gap<1.94&&!state.bite&&!state.windup&&clear(p.x,p.z,goal.x,goal.z)) state.windup=.29;
        if(!state.rise&&!state.windup&&gap>(target?.hp?1.52:.62)){
          const step=Math.min(gap,(distance>10?11:target?.hp?6.7:5.5)*dt);
          for(const offset of [0,.54,-.54,1.08,-1.08]){
            const a=yaw+offset,x=p.x+Math.sin(a)*step,z=p.z+Math.cos(a)*step;
            if(!canWalk(x,z)||Math.hypot(x-leader.x,z-leader.z)<.78) continue;
            let crowded=false;
            for(const other of active.values()){
              if(other===state) continue;
              const q=other.rig.root.position;
              if(Math.hypot(x-q.x,z-q.z)<.93&&Math.hypot(p.x-q.x,p.z-q.z)>=Math.hypot(x-q.x,z-q.z)){crowded=true;break;}
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
        rig.animate({time,phase:state.phase,gait:state.gait,windup:state.windup>0?.45+(.29-state.windup)*1.6:0,
          recovery:state.recovery/.28,hit:state.hurt/.28,leap:0,dead:0,frozen:false,alert:target?.hp?1:0,distance});
      }
    },
    render(){
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
        const q=state.rig.root.position;
        if(!save.health||Math.hypot(p.x-q.x,p.z-q.z)>24) continue;
        for(let i=0;i<(state.rise>0?7:2);i++){
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
      if(smoke.count) smoke.instanceMatrix.needsUpdate=true;
      if(motes.count) motes.instanceMatrix.needsUpdate=true;
    },
    dispose(){
      smoke.dispose();motes.dispose();smokeGeometry.dispose();moteGeometry.dispose();smokeMaterial.dispose();moteMaterial.dispose();
    },
  };
}
