import * as T from 'three';
import type { createMagicEffects, Point } from './magicEffects.ts';
import { loft, meshPart } from './creatureGeometry.ts';
import { surface } from './layout.ts';

export const advancedKinds=['skeletonKing','darkArchmage','infernalGolem','ancientDragon'] as const;
export type AdvancedKind=typeof advancedKinds[number];
export const isAdvancedBoss=(kind:string):kind is AdvancedKind=>advancedKinds.some(boss=>kind===boss);
type Move='royal'|'prison'|'summon'|'death'|'barrage'|'explode'|'barrier'|'meteor'|
  'magma'|'firewave'|'burn'|'rush'|'breath'|'tail'|'claw'|'air'|'land';
type Actor={id:string;kind:string;hp:number;root:T.Group;heading:number;enraged?:boolean;ward:number;wardCool:number};
export type BossCast={move:Move;duration:number;yaw:number;marks:Point[]};
type Hazard<Enemy>={owner:Enemy;point:Point;radius:number;delay:number;life:number;interval:number;tick:number;strength:number;type:'meteor'|'blast'|'burn'};
type Volley<Enemy>={owner:Enemy;x:number;z:number;dx:number;dz:number;life:number;trail:number;strength:number};
const moves={
  skeletonKing:['royal','prison','death','summon'],
  darkArchmage:['barrage','explode','barrier','meteor'],
  infernalGolem:['magma','firewave','burn','rush'],
  ancientDragon:['breath','tail','claw','air'],
} as const;
const labels:Record<Move,string>={
  royal:'Royal Cleave',prison:'Bone Prison',summon:'Undead Summoning',death:'Death Wave',barrage:'Arcane Barrage',
  explode:'Shadow Explosion',barrier:'Arcane Barrier',meteor:'Meteor Strike',magma:'Magma Slam',firewave:'Fire Shockwave',
  burn:'Burning Ground',rush:'Heavy Charge',breath:'Fire Breath',tail:'Tail Sweep',claw:'Claw Strike',air:'Aerial Fire Attack',land:'Landing Shockwave',
};
const colors:Record<AdvancedKind,number>={skeletonKing:0x8ae9b1,darkArchmage:0xc085ff,infernalGolem:0xff8648,ancientDragon:0xffb35d};
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
  summon:(enemy:Enemy)=>void,show:(text:string)=>void,
){
  const volleys:Volley<Enemy>[]=[], areas:Hazard<Enemy>[]=[];
  const blockGeometry=loft([[0,.13,-.14,.143],[.26,.19,-.18,.19],[.46,.12,-.13,.13],[1.12,.09,-.08,.096],[1.49,.02,-.02,.019]],7).rotateX(-Math.PI/2);
  const blockMaterial=new T.MeshStandardMaterial({color:0x9eb6a0,roughness:.76,emissive:0x2b624a,emissiveIntensity:.46});
  const bones=Array.from({length:14},()=>{
    const mesh=meshPart(group,blockGeometry,blockMaterial);mesh.visible=false;
    return {mesh,life:0};
  });
  const waves:{owner:Enemy;point:Point;radius:number;front:number;strength:number}[]=[];
  const air=new Map<Enemy,{time:number;point:Point;fire:boolean}>();
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
      return flight?Math.sin(Math.PI*T.MathUtils.clamp(flight.time/2.3,0,1))*3.3:0;
    },
    start(enemy:Enemy,sequence:number):BossCast|undefined{
      if(!isAdvancedBoss(enemy.kind)||air.has(enemy)) return;
      const kind=enemy.kind,p=enemy.root.position,q=player.position,color=colors[kind];
      const yaw=Math.atan2(q.x-p.x,q.z-p.z),distance=gap(p,q);
      let move:Move=moves[kind][sequence%4];
      if(kind==='darkArchmage'&&move==='barrier'&&enemy.wardCool>0) move='meteor';
      if(kind==='skeletonKing'&&distance>7&&move==='royal') move='death';
      if(kind==='infernalGolem'&&distance>9&&move==='magma') move='rush';
      if(kind==='ancientDragon'&&distance>9&&(move==='tail'||move==='claw')) move=sequence%2?'air':'breath';
      const duration=(move==='meteor'||move==='air'?1.36:move==='death'||move==='magma'?1.19:1.01)*(enemy.enraged?.79:1);
      const marks:Point[]=[];
      const target={x:q.x,z:q.z};
      if(move==='meteor'||move==='air'){
        marks.push(target,along(target,yaw+.98,3.4),along(target,yaw-.98,3.4));
        for(const point of marks) if(walk(point.x,point.z)) mark(point,move==='air'?2.48:2.70,color,duration+(move==='air'?1.05:.49));
      }else if(move==='burn'||move==='explode'||move==='prison'){
        marks.push(target);
        mark(target,move==='prison'?3.38:4.35,color,duration);
      }else if(move==='magma'){
        marks.push(along(p,yaw,3));mark(marks[0],4.65,color,duration);
      }else if(move==='death'||move==='firewave'||move==='tail'||move==='barrier'||move==='summon'){
        mark(p,move==='barrier'?1.63:move==='summon'?3.1:move==='tail'?7.4:9.4,color,duration);
      }else{
        const distance=move==='breath'?16:move==='rush'?12:move==='barrage'?13:6;
        const width=move==='barrage'?.24:move==='breath'?.34:move==='rush'?.12:.56;
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
      switch(move){
        case 'royal':case 'claw':case 'tail': {
          const range=move==='tail'?7.4:move==='claw'?5.25:6;
          const facing=yaw;
          if(move==='tail') pulse(p,color,range);
          fx.emit(p,color,'arc',range*.68,.47,{yaw:facing,y:move==='tail'?.74:1.19,aspect:1.25,grow:2.1});
          if((move==='tail'?gap(p,q)<range:cone(p,q,facing,range,1.12))&&clear(p.x,p.z,q.x,q.z))
            damage(enemy,blocking,move==='tail',move==='claw'?.86:1);
          break;
        }
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
        case 'death':case 'firewave':case 'land': {
          const radius=move==='land'?8.7:9.4;
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
        case 'breath':
          barrage(enemy,yaw,[-.30,-.18,-.06,.06,.18,.30],.64,17);
          for(let i=1;i<=6;i++) fx.emit(along(p,yaw,i*1.85),color,'mist',1.8,.45,{grow:2.7,y:.91,opacity:.67});
          break;
        case 'air':
          air.set(enemy,{time:0,point:{...target},fire:false});
          for(const [i,point] of marks.entries()) if(walk(point.x,point.z)){
            const delay=1.04+i*.18;
            mark(point,2.48,color,delay);hazard(enemy,point,2.48,delay,'meteor',.8);
          }
          break;
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
      for(const [enemy,flight] of air){
        if(!enemy.hp){air.delete(enemy);continue;}
        const p=enemy.root.position;flight.time+=dt;
        const d=gap(flight.point,p);
        if(d>1&&flight.time<1.77){
          const step=Math.min(d,dt*6.2);
          const x=p.x+(flight.point.x-p.x)*step/d,z=p.z+(flight.point.z-p.z)*step/d;
          if(walk(x,z)){p.x=x;p.z=z;}
        }
        if(flight.time>=1.62&&!flight.fire){
          flight.fire=true;show('Boss technique · Landing Shockwave');
          mark(p,8.7,colors.ancientDragon,.70);
        }
        if(flight.time>=2.3){
          air.delete(enemy);this.resolve(enemy,{move:'land',duration:.7,yaw:enemy.heading,marks:[]});
        }
      }
      for(let i=waves.length-1;i>=0;i--){
        const wave=waves[i],previous=wave.front,d=gap(wave.point,player.position);
        wave.front+=wave.radius*dt/.55;
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
    clear(){areas.length=volleys.length=waves.length=0;air.clear();for(const bone of bones){bone.life=0;bone.mesh.visible=false;}},
    dispose(){blockGeometry.dispose();blockMaterial.dispose();},
  };
}
