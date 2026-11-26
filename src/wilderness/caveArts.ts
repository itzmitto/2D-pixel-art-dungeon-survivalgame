import * as T from 'three';
import type { createMagicEffects, Point } from './magicEffects.ts';
import { loft, meshPart } from './creatureGeometry.ts';
import { dragonPhase } from './bossCaves.ts';
import { surface } from './layout.ts';

export const advancedKinds=['skeletonKing','darkArchmage','infernalGolem','ancientDragon'] as const;
export type AdvancedKind=typeof advancedKinds[number];
export const isAdvancedBoss=(kind:string):kind is AdvancedKind=>advancedKinds.some(boss=>kind===boss);
type Move='royal'|'prison'|'summon'|'death'|'barrage'|'explode'|'barrier'|'meteor'|
  'magma'|'firewave'|'burn'|'rush'|'breath'|'tail'|'claw'|'air'|'land'|'stomp'|'dive'|'inferno'|'rings'|'fury';
type Actor={id:string;kind:string;hp:number;spec:{health:number};root:T.Group;heading:number;enraged?:boolean;ward:number;wardCool:number};
export type BossCast={move:Move;duration:number;yaw:number;marks:Point[]};
type Hazard<Enemy>={owner:Enemy;point:Point;radius:number;delay:number;life:number;interval:number;tick:number;strength:number;type:'meteor'|'blast'|'burn'};
type Volley<Enemy>={owner:Enemy;x:number;z:number;dx:number;dz:number;life:number;trail:number;strength:number};
const moves={
  skeletonKing:['royal','prison','death','summon'],
  darkArchmage:['barrage','explode','barrier','meteor'],
  infernalGolem:['magma','firewave','burn','rush'],
  ancientDragon:[
    ['claw','tail','breath','stomp'],['air','dive','burn','land'],['inferno','rings','meteor','fury'],
  ],
} as const;
const labels:Record<Move,string>={
  royal:'Royal Cleave',prison:'Bone Prison',summon:'Undead Summoning',death:'Death Wave',barrage:'Arcane Barrage',
  explode:'Shadow Explosion',barrier:'Arcane Barrier',meteor:'Meteor Strike',magma:'Magma Slam',firewave:'Fire Shockwave',
  burn:'Burning Ground',rush:'Heavy Charge',breath:'Fire Breath',tail:'Tail Sweep',claw:'Claw Strike',air:'Aerial Fire Barrage',land:'Landing Shockwave',
  stomp:'Heavy Stomp',dive:'Diving Attack',inferno:'Infernal Breath',rings:'Expanding Fire Rings',fury:'Enraged Claw Attacks',
};
const colors:Record<AdvancedKind,number>={skeletonKing:0x8ae9b1,darkArchmage:0xc085ff,infernalGolem:0xff8648,ancientDragon:0xffb35d};
const colorForDragon=colors.ancientDragon;
const flightLength=(move:'air'|'land'|'dive')=>move==='dive'?1.67:move==='air'?1.54:1.19;
function along(origin:Point,yaw:number,distance:number){return {x:origin.x+Math.sin(yaw)*distance,z:origin.z+Math.cos(yaw)*distance};}
const gap=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
function cone(origin:Point,target:Point,yaw:number,range:number,width:number){
  const d=gap(origin,target);
  return d<range&&(Math.sin(yaw)*(target.x-origin.x)+Math.cos(yaw)*(target.z-origin.z))/Math.max(.001,d)>Math.cos(width);
}
export function caveArts<Enemy extends Actor>(
  group:T.Group,player:T.Group,fx:ReturnType<typeof createMagicEffects>,
  walk:(x:number,z:number)=>boolean,clear:(x:number,z:number,tx:number,tz:number)=>boolean,
  damage:(enemy:Enemy,blocking:boolean,force:boolean,strength:number)=>void,
  summon:(enemy:Enemy)=>void,show:(text:string)=>void, tremor:(strength:number)=>void=()=>{},
){
  const volleys:Volley<Enemy>[]=[], areas:Hazard<Enemy>[]=[];
  const blockGeometry=loft([[0,.13,-.14,.143],[.26,.19,-.18,.19],[.46,.12,-.13,.13],[1.12,.09,-.08,.096],[1.49,.02,-.02,.019]],7).rotateX(-Math.PI/2);
  const blockMaterial=new T.MeshStandardMaterial({color:0x9eb6a0,roughness:.76,emissive:0x2b624a,emissiveIntensity:.46});
  const bones=Array.from({length:14},()=>{
    const mesh=meshPart(group,blockGeometry,blockMaterial);mesh.visible=false;
    return {mesh,life:0};
  });
  const waves:{owner:Enemy;point:Point;radius:number;front:number;strength:number}[]=[];
  const air=new Map<Enemy,{time:number;point:Point;origin:Point;move:'air'|'dive'|'land'}>();
  const landings=new Map<Enemy,number>();
  const breaths:{owner:Enemy;origin:Point;yaw:number;range:number;angle:number;strength:number;life:number;tick:number;hit:boolean}[]=[];
  let blocking=false;
  function pulse(point:Point,color:number,radius:number){
    fx.emit(point,color,'ring',.89,.56,{grow:radius/.56,y:.15,opacity:.96});
    fx.emit(point,0xffe7c7,'ring',radius*.64,.32,{grow:radius*.55,y:.22,opacity:.59});
    fx.scatter(point,color,12,.80);
  }
  function mark(point:Point,radius:number,color:number,delay:number){
    fx.emit(point,color,'ring',radius/.88,delay,{y:.16,opacity:1});
    fx.emit(point,color,'ring',Math.max(.3,radius*.19),delay,{grow:radius*.82/delay,y:.24,opacity:.64});
  }
  function hazard(owner:Enemy,point:Point,radius:number,delay:number,type:Hazard<Enemy>['type'],strength:number){
    if(areas.length>=24) return;
    areas.push({owner,point,radius,delay,type,strength,life:type==='burn'?4.3:.07,interval:.92,tick:0});
  }
  function barrage(owner:Enemy,yaw:number,offsets:number[],strength:number,speed:number){
    for(const offset of offsets){
      if(volleys.length>=36) return;
      const p=along(owner.root.position,yaw+offset,.92);
      volleys.push({owner,x:p.x,z:p.z,dx:Math.sin(yaw+offset)*speed,dz:Math.cos(yaw+offset)*speed,
        life:1.45,trail:0,strength});
    }
  }
  return {
    blocks(x:number,z:number){
      return bones.some(bone=>bone.life>0&&Math.hypot(x-bone.mesh.position.x,z-bone.mesh.position.z)<.55);
    },
    flying(enemy:Enemy){return air.has(enemy);},
    altitude(enemy:Enemy){
      const flight=air.get(enemy);
      return flight?Math.sin(Math.PI*T.MathUtils.clamp(flight.time/flightLength(flight.move),0,1))*(flight.move==='land'?2:3.35):0;
    },
    dragonTechnique(enemy:Enemy){
      const flight=air.get(enemy);
      if(flight) return flight.move;
      if(landings.has(enemy)) return 'land';
      const breath=breaths.find(breath=>breath.owner===enemy);
      return breath?(breath.range===20?'inferno':'breath'):undefined;
    },
    breathing(enemy:Enemy){return breaths.some(breath=>breath.owner===enemy);},
    landed(enemy:Enemy){return (landings.get(enemy)??0)/.42;},
    wantsToClose(enemy:Enemy,sequence:number,distance:number){
      const move=moves.ancientDragon[dragonPhase(enemy.hp/enemy.spec.health)-1][sequence%4];
      return distance>9&&(move==='claw'||move==='tail'||move==='stomp'||move==='fury');
    },
    flightProgress(enemy:Enemy){const flight=air.get(enemy);return flight?flight.time/flightLength(flight.move):0;},
    start(enemy:Enemy,sequence:number):BossCast|undefined{
      if(!isAdvancedBoss(enemy.kind)||air.has(enemy)) return;
      const kind=enemy.kind,p=enemy.root.position,q=player.position,color=colors[kind];
      const yaw=Math.atan2(q.x-p.x,q.z-p.z),distance=gap(p,q);
      const phase=kind==='ancientDragon'?dragonPhase(enemy.hp/enemy.spec.health):1;
      let move:Move=kind==='ancientDragon'?moves.ancientDragon[phase-1][sequence%4]:moves[kind][sequence%4];
      if(kind==='darkArchmage'&&move==='barrier'&&enemy.wardCool>0) move='meteor';
      if(kind==='skeletonKing'&&distance>7&&move==='royal') move='death';
      if(kind==='infernalGolem'&&distance>9&&move==='magma') move='rush';
      if(kind==='ancientDragon'){
        if((move==='claw'||move==='tail'||move==='stomp'||move==='fury')&&distance>9.0) return;
        const duration=move==='inferno'?1.20:move==='claw'?.92:move==='fury'?.86:move==='rings'?1.23:1.13;
        const target={x:q.x,z:q.z};
        let marks:Point[]=[];
        if(move==='dive'){
          const landing=along(p,yaw,Math.min(11,distance));
          marks=walk(landing.x,landing.z)?[landing]:[{x:p.x,z:p.z}];
          mark(marks[0],4.5,color,duration+flightLength('dive'));
          for(let i=1;i<=6;i++){
            const point=along(p,yaw,Math.min(11,distance)*i/6);
            if(walk(point.x,point.z)) fx.emit(point,0xffce88,'ring',1.23,duration+flightLength('dive')*.6,{opacity:.57});
          }
        }else if(move==='air'||move==='meteor'){
          marks=[target,along(target,yaw+Math.PI*.62,4.5),along(target,yaw-Math.PI*.62,4.5)];
          if(move==='meteor') marks.push(along(target,yaw+Math.PI,6.4));
          marks=marks.filter(point=>walk(point.x,point.z));
          marks.forEach((point,i)=>mark(point,move==='air'?2.8:3.15,color,duration+.54+i*.23));
        }else if(move==='land'||move==='stomp'||move==='rings'||move==='tail'||move==='burn'){
          const radius=move==='land'?8.6:move==='stomp'?6.15:move==='tail'?8.1:move==='burn'?4.9:12.6;
          const point=move==='burn'?target:{x:p.x,z:p.z};
          marks=[point];
          mark(point,radius,color,duration+(move==='land'?flightLength('land'):0));
        }else{
          const breath=move==='breath'||move==='inferno', width=breath?(move==='inferno'?.49:.37):1.04;
          const reach=breath?(move==='inferno'?20:17):move==='fury'?7.1:6.6;
          for(const lane of [-width,-width*.51,0,width*.51,width]) for(let i=1;i<=4;i++){
            const point=along(p,yaw+lane,reach*i/4);
            if(walk(point.x,point.z)) fx.emit(point,color,'ring',breath?1.16:1.42,duration,{y:.13,opacity:.66});
          }
          fx.emit(p,0xffa45a,'arc',reach*.69,duration,{yaw,y:.22,aspect:.12,opacity:.51});
        }
        show('Boss technique · '+labels[move]);
        return {move,duration,yaw,marks};
      }
      const duration=(move==='meteor'?1.36:move==='death'||move==='magma'?1.19:1.01)*(enemy.enraged?.79:1);
      const marks:Point[]=[];
      const target={x:q.x,z:q.z};
      if(move==='meteor'){
        marks.push(target,along(target,yaw+.98,3.4),along(target,yaw-.98,3.4));
        for(const point of marks) if(walk(point.x,point.z)) mark(point,2.70,color,duration+.49);
      }else if(move==='burn'||move==='explode'||move==='prison'){
        marks.push(target);
        mark(target,move==='prison'?3.38:4.35,color,duration);
      }else if(move==='magma'){
        marks.push(along(p,yaw,3));mark(marks[0],4.65,color,duration);
      }else if(move==='death'||move==='firewave'||move==='barrier'||move==='summon'){
        mark(p,move==='barrier'?1.63:move==='summon'?3.1:9.4,color,duration);
      }else{
        const distance=move==='rush'?12:move==='barrage'?13:6;
        const width=move==='barrage'?.24:move==='rush'?.12:.56;
        for(const spread of [-width,0,width]) for(let i=1;i<=3;i++){
          const point=along(p,yaw+spread,distance*i/3);
          if(walk(point.x,point.z)) fx.emit(point,color,'ring',move==='rush'?.92:.76,duration,{y:.1,opacity:.60});
        }
      }
      show('Boss technique · '+labels[move]);
      return {move,duration,yaw,marks};
    },
    resolve(enemy:Enemy,cast:BossCast){
      if(!isAdvancedBoss(enemy.kind)) return;
      const {move,yaw,marks}=cast,p=enemy.root.position,q=player.position,color=colors[enemy.kind];
      const target=marks[0]??q;
      if(enemy.kind==='ancientDragon'){
        const origin={x:p.x,z:p.z};
        const wave=(point:Point,radius:number,strength:number,delay=0)=>{
          waves.push({owner:enemy,point:{...point},radius,front:-radius*delay/.67,strength});
          fx.emit(point,color,'ring',.39,.70,{grow:radius/.62,delay,y:.18,opacity:.94});
        };
        if(move==='air'||move==='dive'||move==='land'){
          air.set(enemy,{time:0,point:{...(move==='dive'?target:origin)},origin,move});
          if(move==='air') marks.forEach((point,i)=>hazard(enemy,point,2.8,.54+i*.23,'meteor',.73));
          return;
        }
        if(move==='breath'||move==='inferno'){
          const ultimate=move==='inferno';
          breaths.push({owner:enemy,origin,yaw,range:ultimate?20:17,angle:ultimate?.49:.37,
            strength:ultimate?1.18:.91,life:ultimate?1.15:.92,tick:0,hit:false});
          return;
        }
        if(move==='meteor'){
          marks.forEach((point,i)=>hazard(enemy,point,3.15,.54+i*.23,'meteor',1.02));
          return;
        }
        if(move==='burn'){hazard(enemy,target,4.9,0,'burn',.32);return;}
        if(move==='rings'){
          wave(origin,12.6,1.06);wave(origin,9.5,.89,.82);tremor(.46);return;
        }
        if(move==='stomp'||move==='tail'){
          const radius=move==='tail'?8.1:6.15;
          pulse(origin,color,radius);tremor(move==='stomp'?.71:.38);
          if(gap(origin,q)<radius&&clear(p.x,p.z,q.x,q.z)) damage(enemy,blocking,true,move==='tail'?.85:1.05);
          if(move==='tail') fx.emit(origin,color,'arc',radius*.79,.46,{yaw:yaw+1.42,y:.88,aspect:.42});
          return;
        }
        if(move==='claw'||move==='fury'){
          const radius=move==='fury'?7.1:6.6;
          fx.emit(p,color,'arc',radius*.74,.37,{yaw,y:1.15,aspect:1.74});
          if(move==='fury') fx.emit(p,0xffdcaa,'arc',radius*.72,.35,{yaw:yaw-.36,y:.84,aspect:.72,delay:.12});
          if(cone(p,q,yaw,radius,1.04)&&clear(p.x,p.z,q.x,q.z)) damage(enemy,blocking,false,move==='fury'?1.22:.87);
          return;
        }
      }
      switch(move){
        case 'royal':
          fx.emit(p,color,'arc',4.08,.47,{yaw,y:1.19,aspect:1.25,grow:2.1});
          if(cone(p,q,yaw,6,1.12)&&clear(p.x,p.z,q.x,q.z)) damage(enemy,blocking,false,1);
          break;
        case 'prison': {
          for(let i=0;i<8;i++){
            if(i===0||i===4) continue;
            const point=along(target,yaw+i*Math.PI/4,3.38);
            const bone=bones.find(mark=>mark.life<=0);
            if(!bone||!walk(point.x,point.z)||gap(p,point)<1.5||gap(q,point)<.8) continue;
            bone.life=4.2;bone.mesh.visible=true;
            bone.mesh.position.set(point.x,surface(point.x,point.z)-.71,point.z);
            bone.mesh.rotation.set(.11,yaw+i*.63,.14*Math.sin(i));
          }
          fx.scatter(target,color,13,.25);
          if(gap(q,target)<1.3) damage(enemy,blocking,true,.49);
          break;
        }
        case 'summon':summon(enemy);pulse(p,color,4.2);break;
        case 'death':case 'firewave': {
          const radius=9.4;
          pulse(p,color,radius);
          waves.push({owner:enemy,point:{x:p.x,z:p.z},radius,front:0,strength:move==='death'?.83:.91});
          break;
        }
        case 'barrage':barrage(enemy,yaw,enemy.enraged?[-.36,-.18,0,.18,.36]:[-.23,0,.23],.63,18);break;
        case 'barrier':enemy.ward=4.2;enemy.wardCool=12.5;pulse(p,color,2.85);break;
        case 'explode':pulse(target,color,4.35);hazard(enemy,target,4.35,0,'blast',.90);break;
        case 'meteor':
          for(const [i,point] of marks.entries()) if(walk(point.x,point.z)){
            const delay=.42+i*.20;
            mark(point,2.70,color,delay);hazard(enemy,point,2.70,delay,'meteor',.90);
          }
          break;
        case 'magma': {
          const point=marks[0]??along(p,yaw,3);
          pulse(point,color,4.65);
          hazard(enemy,point,4.65,0,'blast',1.02);
          break;
        }
        case 'burn':
          pulse(target,color,4.35);hazard(enemy,target,4.35,0,'burn',.29);break;
        case 'rush':break; // Movement and collision use the regular charged-attack path.
      }
    },
    update(dt:number,isBlocking:boolean){
      blocking=isBlocking;
      for(const bone of bones){
        if(bone.life<=0) continue;
        bone.life=Math.max(0,bone.life-dt);bone.mesh.visible=bone.life>0;
        const p=bone.mesh.position;
        p.y=surface(p.x,p.z)-Math.max(0,bone.life-3.8)*2.1-Math.max(0,.46-bone.life)*2.2;
      }
      for(const [enemy,remaining] of landings){
        if(remaining<=dt||!enemy.hp) landings.delete(enemy);else landings.set(enemy,remaining-dt);
      }
      for(const [enemy,flight] of air){
        if(!enemy.hp){air.delete(enemy);continue;}
        const p=enemy.root.position;flight.time+=dt;
        const length=flightLength(flight.move), progress=flight.time/length;
        if(flight.move==='dive'){
          const dive=T.MathUtils.smoothstep(progress,.32,.93);
          const x=T.MathUtils.lerp(flight.origin.x,flight.point.x,dive),z=T.MathUtils.lerp(flight.origin.z,flight.point.z,dive);
          if(walk(x,z)&&clear(p.x,p.z,x,z)){p.x=x;p.z=z;}
        }
        if(progress>=1){
          air.delete(enemy);landings.set(enemy,.42);
          const radius=flight.move==='land'?8.6:flight.move==='dive'?4.5:0;
          if(radius){
            pulse(p,colorForDragon,radius);tremor(.86);
            fx.emit(p,0xe5ad80,'mist',2.14,.51,{grow:6.1,y:.23});
            if(gap(p,player.position)<radius&&clear(p.x,p.z,player.position.x,player.position.z)) damage(enemy,blocking,true,1.10);
          }
        }
      }
      for(let i=breaths.length-1;i>=0;i--){
        const fire=breaths[i], {owner,origin,yaw,range,angle}=fire;
        fire.life-=dt;fire.tick-=dt;
        if(!owner.hp||fire.life<=0){breaths.splice(i,1);continue;}
        if(fire.tick>0) continue;
        fire.tick=.15;
        for(let lane=-1;lane<=1;lane++) for(let row=1;row<=4;row++){
          const direction=yaw+lane*angle*.72, point=along(origin,direction,range*row/4);
          if(!walk(point.x,point.z)) continue;
          fx.emit(point,row===1?0xffe39c:0xff5a27,'mist',1.54+row*.33,.32,{y:1.9-row*.27,grow:2.4,
            dx:Math.sin(direction)*3.3,dz:Math.cos(direction)*3.3,opacity:.83});
          if(lane===0) fx.emit(point,0xffa641,'arc',2.7,.23,{yaw:direction,y:1.66-row*.21,aspect:.54,opacity:.67});
        }
        const q=player.position;
        if(!fire.hit&&cone(origin,q,yaw,range,angle)&&clear(origin.x,origin.z,q.x,q.z)){
          fire.hit=true;damage(owner,blocking,false,fire.strength);
        }
      }
      for(let i=waves.length-1;i>=0;i--){
        const wave=waves[i],previous=wave.front,d=gap(wave.point,player.position);
        wave.front+=wave.radius*dt/(wave.owner.kind==='ancientDragon'?.67:.55);
        if(wave.front<0) continue;
        if(wave.owner.hp>0&&d<wave.front+.45&&d>=Math.max(0,previous-.56)&&clear(wave.point.x,wave.point.z,player.position.x,player.position.z)){
          damage(wave.owner,false,true,wave.strength);waves.splice(i,1);
        }else if(!wave.owner.hp||wave.front>wave.radius+.66) waves.splice(i,1);
      }
      const hitOwners=new Set<Enemy>();
      for(let i=volleys.length-1;i>=0;i--){
        const bolt=volleys[i],color=isAdvancedBoss(bolt.owner.kind)?colors[bolt.owner.kind]:0xa885ff;
        bolt.life-=dt;bolt.trail-=dt;
        const steps=Math.max(1,Math.ceil(Math.hypot(bolt.dx,bolt.dz)*dt/.32));
        for(let step=0;step<steps&&bolt.life>0;step++){
          bolt.x+=bolt.dx*dt/steps;bolt.z+=bolt.dz*dt/steps;
          if(!walk(bolt.x,bolt.z)||!bolt.owner.hp){bolt.life=0;break;}
          if(gap(bolt,player.position)<.77){
            if(!hitOwners.has(bolt.owner)){
              hitOwners.add(bolt.owner);damage(bolt.owner,blocking,false,bolt.strength);
              for(const volley of volleys) if(volley.owner===bolt.owner&&gap(volley,player.position)<3.0) volley.life=0;
              fx.scatter(bolt,color,8,1.08);
            }
            bolt.life=0;
          }
        }
        if(bolt.life<=0){volleys.splice(i,1);continue;}
        if(bolt.trail<=0){
          fx.emit(bolt,color,'crystal',.87,.18,{y:1.0,aspect:.62});
          fx.emit(bolt,color,'mist',.53,.22,{y:.94,grow:.64,opacity:.55});
          bolt.trail=.095;
        }
      }
      for(let i=areas.length-1;i>=0;i--){
        const field=areas[i],color=isAdvancedBoss(field.owner.kind)?colors[field.owner.kind]:0xff934e;
        if(!field.owner.hp){areas.splice(i,1);continue;}
        if(field.delay>0){field.delay-=dt;if(field.delay>0) continue;}
        if(field.tick===0){
          if(field.type==='meteor'){
            fx.emit(field.point,color,'ray',1.67,.48,{y:2.67,aspect:5.2});pulse(field.point,color,field.radius);
          }
          if(field.type==='burn') fx.emit(field.point,color,'scorch',field.radius,field.life,{opacity:.88,y:.07});
        }
        field.tick-=dt;
        if(field.tick<=0){
          field.tick=field.interval;
          if(gap(field.point,player.position)<field.radius&&!hitOwners.has(field.owner)){
            hitOwners.add(field.owner);damage(field.owner,false,true,field.strength);
          }
          if(field.type==='burn') fx.scatter(field.point,color,6,.32);
        }
        field.life-=dt;
        if(field.life<=0) areas.splice(i,1);
      }
    },
    clear(){areas.length=volleys.length=waves.length=breaths.length=0;air.clear();landings.clear();for(const bone of bones){bone.life=0;bone.mesh.visible=false;}},
    dispose(){blockGeometry.dispose();blockMaterial.dispose();},
  };
}
