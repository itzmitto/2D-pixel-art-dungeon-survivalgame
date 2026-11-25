import { weaponDamage, type Weapon } from './weapons.ts';
import { protection, statusTuning, type statuses } from './statusEffects.ts';
import type { createMagicEffects, Point } from './magicEffects.ts';

export const abilityTuning={
  fire:{speed:12,length:15,radius:1.6,damage:.68},
  lightning:{radius:4.8,chainRange:4.6,targets:3,damage:1.15},
  ice:{radius:5.4,duration:4,interval:.8,damage:.52},
  water:{radius:4.4,absorb:6,force:15,damage:.25},
  wind:{length:7.8,speed:31,radius:1.33,damage:1.1},
  bolt:{speed:22,radius:.65},
} as const;

type Target={point:Point; alive:()=>boolean; effects:ReturnType<typeof statuses>; hit:(amount:number)=>void};
type Travel={kind:'bolt'|'fire'|'wind'; point:Point; x:number; z:number; remaining:number; speed:number;
  radius:number; damage:number; color:number; hit:Set<Target>; trail:number};
type Field={point:Point;remaining:number;tick:number;damage:number;seen:Set<Target>};
export function abilityCombat(
  player:Point, targets:readonly Target[], walkable:(x:number,z:number)=>boolean,
  clear:(x:number,z:number,tx:number,tz:number)=>boolean, fx:ReturnType<typeof createMagicEffects>,
) {
  const travel:Travel[]=[];
  const shield=protection();
  let field:Field|undefined;
  const nearby=(point:Point,radius:number)=>targets.filter(t=>t.alive()&&
    Math.hypot(t.point.x-point.x,t.point.z-point.z)<=radius&&clear(point.x,point.z,t.point.x,t.point.z));
  function moving(kind:Travel['kind'],yaw:number,length:number,speed:number,radius:number,damage:number,color:number){
    travel.push({kind,point:{x:player.x,z:player.z},x:Math.sin(yaw),z:Math.cos(yaw),remaining:length,
      speed,radius,damage,color,hit:new Set(),trail:0});
  }
  return {
    shield,
    get dashing(){return travel.some(t=>t.kind==='wind');},
    reset(){travel.length=0;field=undefined;shield.activate(0,0);},
    bolt(weapon:Weapon,yaw:number){
      const bolt=abilityTuning.bolt;
      moving('bolt',yaw,weapon.range,bolt.speed,bolt.radius,weaponDamage(weapon),weapon.color);
    },
    cast(weapon:Weapon,yaw:number){
      const point={x:player.x,z:player.z}, damage=weaponDamage(weapon);
      switch(weapon.ability){
        case 'fire': {
          const a=abilityTuning.fire;
          moving('fire',yaw,a.length,a.speed,a.radius,damage*a.damage,weapon.color);
          break;
        }
        case 'lightning': {
          const a=abilityTuning.lightning;
          fx.emit(point,weapon.color,'ring',1,.45,{grow:9});
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
            hit.hit(damage*a.damage*(1-i*.19));
            used.add(hit);origin=hit.point;
          }
          break;
        }
        case 'ice': {
          const a=abilityTuning.ice;
          field={point,remaining:a.duration,tick:0,damage:damage*a.damage,seen:new Set()};
          fx.emit(point,weapon.color,'ring',a.radius,a.duration,{opacity:.35});
          for(let i=0;i<12;i++){
            const angle=i*Math.PI/6;
            const edge={x:point.x+Math.sin(angle)*4.6,z:point.z+Math.cos(angle)*4.6};
            if(walkable(edge.x,edge.z)) fx.emit(edge,weapon.color,'spark',1.8,a.duration,{y:.22});
          }
          break;
        }
        case 'water': {
          const a=abilityTuning.water;
          shield.activate(statusTuning.protection,a.absorb);
          fx.emit(point,weapon.color,'ring',.8,.7,{grow:6,y:.29});
          fx.scatter(point,weapon.color,10);
          for(const target of nearby(point,a.radius)){
            const x=target.point.x-point.x,z=target.point.z-point.z,length=Math.hypot(x,z)||1;
            target.effects.knockback(x/length*a.force,z/length*a.force);
            target.hit(damage*a.damage);
          }
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
      if(field){
        const active=Math.min(field.remaining,dt);
        field.remaining-=active;field.tick-=active;
        while(field.tick<=0){
          for(const target of nearby(field.point,abilityTuning.ice.radius)){
            if(!field.seen.has(target)){
              target.effects.freeze();
              field.seen.add(target);
            } else target.effects.slow();
            target.hit(field.damage);
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
            target.hit(spell.damage);
            fx.scatter(target.point,spell.color,4);
            if(spell.kind==='bolt'){spell.remaining=0;break;}
          }
          spell.remaining-=step;left-=step;
          if(spell.remaining<=0) break;
        }
        spell.trail-=dt;
        if(spell.trail<=0){
          spell.trail=.055;
          const yaw=Math.atan2(spell.x,spell.z);
          fx.emit(spell.point,spell.color,spell.kind==='bolt'?'spark':'arc',
            spell.kind==='fire'?1.8:spell.kind==='wind'?1.4:.93,.22,{y:.62,yaw});
          if(spell.kind==='fire') fx.scatter(spell.point,spell.color,3);
        }
        if(spell.remaining<=0) travel.splice(i,1);
      }
    },
  };
}
