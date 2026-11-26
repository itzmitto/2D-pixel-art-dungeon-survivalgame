import { weaponDamage, type Weapon } from './weapons.ts';
import { protection, statusTuning, type statuses } from './statusEffects.ts';
import type { createMagicEffects, Point } from './magicEffects.ts';

export const abilityTuning={
  fire:{speed:12,length:15,radius:1.6,damage:.68},
  lightning:{radius:4.8,chainRange:4.6,targets:3,damage:1.15},
  ice:{radius:5.4,duration:4,interval:.8,damage:.52},
  water:{radius:4.4,absorb:6,force:15,damage:.25},
  wind:{length:7.8,speed:31,radius:1.33,damage:1.1},
  darkness:{radius:6.1,duration:2.55,interval:.48,pull:3.75,tickDamage:.22,finishDamage:1.55},
  bolt:{speed:22,radius:.65},
} as const;

type Target={point:Point; alive:()=>boolean; effects:ReturnType<typeof statuses>; pull?:(x:number,z:number)=>void; hit:(amount:number,element?:Weapon['ability'],heavy?:boolean)=>void};
type Travel={kind:'bolt'|'fire'|'wind'; point:Point; x:number; z:number; remaining:number; speed:number;
  radius:number; damage:number; color:number; hit:Set<Target>; trail:number};
type Field={point:Point;remaining:number;tick:number;damage:number;seen:Set<Target>};
export function abilityCombat(
  player:Point, targets:readonly Target[], walkable:(x:number,z:number)=>boolean,
  clear:(x:number,z:number,tx:number,tz:number)=>boolean, fx:Pick<ReturnType<typeof createMagicEffects>,'emit'|'scatter'|'lightning'>, finishAbyss:()=>void=()=>{},
) {
  const travel:Travel[]=[];
  const shield=protection();
  let field:Field|undefined, abyss:(Field&{pulse:number})|undefined;
  const nearby=(point:Point,radius:number)=>targets.filter(t=>t.alive()&&
    Math.hypot(t.point.x-point.x,t.point.z-point.z)<=radius&&clear(point.x,point.z,t.point.x,t.point.z));
  function moving(kind:Travel['kind'],yaw:number,length:number,speed:number,radius:number,damage:number,color:number){
    travel.push({kind,point:{x:player.x,z:player.z},x:Math.sin(yaw),z:Math.cos(yaw),remaining:length,
      speed,radius,damage,color,hit:new Set(),trail:0});
  }
  return {
    shield,
    get dashing(){return travel.some(t=>t.kind==='wind');},
    reset(){travel.length=0;field=abyss=undefined;shield.activate(0,0);},
    bolt(weapon:Weapon,yaw:number){
      const bolt=abilityTuning.bolt;
      moving('bolt',yaw,weapon.range,bolt.speed,bolt.radius,weaponDamage(weapon),weapon.color);
    },
    cast(weapon:Weapon,yaw:number){
      const point={x:player.x,z:player.z}, damage=weaponDamage(weapon);
      switch(weapon.ability){
        case 'fire': {
          const a=abilityTuning.fire;
          fx.emit(point,0xff5123,'arc',2.2,.47,{yaw,y:.88,grow:2.1,aspect:1.55});
          fx.emit(point,0xffe3aa,'arc',1.75,.27,{yaw,y:.96,opacity:.82});
          moving('fire',yaw,a.length,a.speed,a.radius,damage*a.damage,weapon.color);
          break;
        }
        case 'lightning': {
          const a=abilityTuning.lightning;
          const strike={x:point.x+Math.sin(yaw)*1.2,z:point.z+Math.cos(yaw)*1.2};
          fx.lightning(strike,strike,true);
          fx.emit(strike,0xdaf7ff,'ray',.7,.19,{y:4.5,aspect:13,opacity:.75});
          fx.emit(strike,0x4269ff,'ring',.75,.55,{grow:9});
          fx.emit(strike,0xe3fcff,'ring',.45,.36,{grow:8,y:.14});
          for(let i=0;i<6;i++){
            const angle=i*Math.PI/3+yaw;
            const end={x:strike.x+Math.sin(angle)*3.5,z:strike.z+Math.cos(angle)*3.5};
            if(walkable(end.x,end.z)) fx.lightning(strike,end,false,true,true);
          }
          fx.scatter(point,weapon.color,9);
          let origin=point;
          const used=new Set<Target>();
          for(let i=0;i<a.targets;i++){
            const hit=nearby(origin,i===0?a.radius:a.chainRange).filter(t=>!used.has(t)).sort((left,right)=>
              Math.hypot(left.point.x-origin.x,left.point.z-origin.z)-Math.hypot(right.point.x-origin.x,right.point.z-origin.z))[0];
            if(!hit) break;
            fx.lightning(origin,hit.point);
            fx.scatter(hit.point,weapon.color,4);
            hit.effects.stun();
            hit.hit(damage*a.damage*(1-i*.19),'lightning',i===0);
            used.add(hit);origin=hit.point;
          }
          break;
        }
        case 'ice': {
          const a=abilityTuning.ice;
          field={point,remaining:a.duration,tick:0,damage:damage*a.damage,seen:new Set()};
          fx.emit(point,0x4eb4ff,'frost',.7,a.duration,{grow:9.4,opacity:.68,limit:a.radius});
          fx.emit(point,0xd3fbff,'ring',.6,.69,{grow:8,opacity:.75});
          fx.scatter(point,weapon.color,8,.45,'crystal');
          for(let i=0;i<12;i++){
            const angle=i*Math.PI/6;
            const edge={x:point.x+Math.sin(angle)*4.6,z:point.z+Math.cos(angle)*4.6};
            if(!walkable(edge.x,edge.z)) continue;
            fx.emit(edge,i%2?0x7ecbff:0xc5f6ff,'crystal',.9+(i%3)*.23,a.duration-.25,{y:.32,yaw:angle,aspect:2.4,delay:.25+i%3*.09});
            if(i%2===0) fx.emit(edge,0x80bdee,'mist',1.25,2.3,{y:.38,lift:.14,grow:.27,delay:.33,opacity:.27});
          }
          break;
        }
        case 'water': {
          const a=abilityTuning.water;
          shield.activate(statusTuning.protection,a.absorb);
          fx.emit(point,0x367ddf,'ring',.8,.78,{grow:6,y:.22});
          fx.emit(point,0xb2faff,'ring',.5,.7,{grow:5,y:.38,delay:.11,opacity:.70});
          fx.scatter(point,weapon.color,10);
          for(const target of nearby(point,a.radius)){
            const x=target.point.x-point.x,z=target.point.z-point.z,length=Math.hypot(x,z)||1;
            target.effects.knockback(x/length*a.force,z/length*a.force);
            target.hit(damage*a.damage,'water');
          }
          break;
        }
        case 'darkness': {
          const a=abilityTuning.darkness;
          abyss={point,remaining:a.duration,damage,tick:a.interval,seen:new Set(),pulse:0};
          fx.emit(point,0x822fec,'vortex',a.radius,a.duration,{y:.15,opacity:.96});
          fx.emit(point,0xce83ff,'ring',.45,.62,{grow:11,y:.21});
          fx.emit(point,0x9e48e1,'arc',3.65,.39,{yaw,y:1.05,grow:4.8});
          break;
        }
        case 'wind': {
          const a=abilityTuning.wind;
          moving('wind',yaw,a.length,a.speed,a.radius,damage*a.damage,weapon.color);
          break;
        }
      }
    },
    update(dt:number){
      shield.update(dt);
      if(abyss){
        const a=abilityTuning.darkness, {point,damage}=abyss;
        const active=Math.min(dt,abyss.remaining);
        const affected=nearby(point,a.radius);
        for(const target of affected){
          const dx=point.x-target.point.x,dz=point.z-target.point.z,d=Math.hypot(dx,dz);
          if(d>1.1){
            const step=Math.min(d-1.1,a.pull*active)/d;
            const x=target.point.x+dx*step,z=target.point.z+dz*step;
            if(walkable(x,z)&&clear(target.point.x,target.point.z,x,z)) target.pull?.(x,z);
          }
        }
        abyss.remaining-=active;abyss.tick-=active;abyss.pulse-=active;
        if(abyss.tick<=0){
          abyss.tick+=a.interval;
          for(const target of affected) target.hit(damage*a.tickDamage,'darkness');
        }
        if(abyss.pulse<=0){
          abyss.pulse=.16;
          const angle=abyss.remaining*7, edge={x:point.x+Math.sin(angle)*4.9,z:point.z+Math.cos(angle)*4.9};
          fx.emit(edge,0x9431e5,'mist',1.25,.61,{y:.47,lift:1.82,opacity:.55});
          fx.emit(point,0x7617c8,'arc',3.1,.36,{yaw:angle,y:.37,aspect:1.8,grow:3.5});
          if(walkable(edge.x,edge.z)) fx.lightning(edge,point,false,true,true,0xb357ff);
        }
        if(abyss.remaining<=0){
          for(const target of affected) target.hit(damage*a.finishDamage,'darkness',true);
          fx.scatter(point,0xb84bff,20,.6);
          fx.emit(point,0xe2adff,'ray',2.42,.54,{y:2.9,aspect:6.3});
          for(let i=0;i<3;i++) fx.emit(point,i===0?0xe5b6ff:0x782cdc,'ring',.58,.50+i*.14,{y:.15+i*.14,grow:12,delay:i*.065});
          finishAbyss();abyss=undefined;
        }
      }
      if(field){
        const active=Math.min(field.remaining,dt);
        field.remaining-=active;field.tick-=active;
        while(field.tick<=0){
          for(const target of nearby(field.point,abilityTuning.ice.radius)){
            if(!field.seen.has(target)){
              target.effects.freeze();
              field.seen.add(target);
            } else target.effects.slow();
            target.hit(field.damage,'ice');
          }
          field.tick+=abilityTuning.ice.interval;
        }
        if(field.remaining<=0) field=undefined;
      }
      for(let i=travel.length-1;i>=0;i--){
        const spell=travel[i], distance=Math.min(spell.remaining,dt*spell.speed);
        let left=distance;
        while(left>1e-5){
          const step=Math.min(.24,left), x=spell.point.x+spell.x*step,z=spell.point.z+spell.z*step;
          if(!walkable(x,z)){spell.remaining=0;break;}
          spell.point.x=x;spell.point.z=z;
          if(spell.kind==='wind'){player.x=x; player.z=z;}
          for(const target of nearby(spell.point,spell.radius)){
            if(spell.hit.has(target)) continue;
            spell.hit.add(target);
            if(spell.kind==='fire') target.effects.ignite();
            target.hit(spell.damage,spell.kind==='bolt'?'ice':spell.kind,spell.kind!=='bolt');
            if(spell.kind==='bolt'){spell.remaining=0;break;}
          }
          spell.remaining-=step;left-=step;
          if(spell.remaining<=0) break;
        }
        spell.trail-=dt;
        if(spell.trail<=0){
          spell.trail=spell.kind==='fire'?.085:.043;
          const yaw=Math.atan2(spell.x,spell.z);
          if(spell.kind==='fire'){
            fx.emit(spell.point,0xff551e,'arc',2.05,.29,{y:.73,yaw,aspect:1.75,grow:2.2});
            fx.emit(spell.point,0xffd083,'arc',1.54,.19,{y:.63,yaw,opacity:.7});
            fx.emit(spell.point,0xfa4317,'scorch',1.36,.76,{y:.05});
            fx.scatter(spell.point,spell.color,3);
          }else if(spell.kind==='wind'){
            fx.emit(spell.point,0xb1ffe4,'arc',1.67,.24,{y:1.03,yaw,aspect:.7,grow:1.65});
            fx.emit(spell.point,0xf0fff8,'arc',1.36,.19,{y:.84,yaw:yaw+.20,aspect:.46});
            fx.emit(spell.point,0xc5b9a1,'mist',.54,.39,{y:.20,dx:-spell.x*1.4,dz:-spell.z*1.4,grow:1.4,opacity:.42});
          }else{
            fx.emit(spell.point,0xccf8ff,'crystal',.94,.15,{y:1.05,yaw,aspect:.56});
            fx.emit(spell.point,0x75bfff,'mist',.40,.29,{y:1.04,grow:1.2,opacity:.40});
          }
        }
        if(spell.remaining<=0) travel.splice(i,1);
      }
    },
  };
}
