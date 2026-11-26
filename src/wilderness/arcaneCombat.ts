import type { createMagicEffects, Point } from './magicEffects.ts';

export function arcaneCombat<Enemy>(
  player:Point, fx:ReturnType<typeof createMagicEffects>,
  canWalk:(x:number,z:number)=>boolean, hit:(enemy:Enemy,guarded:boolean)=>void,
){
  const bolts:{owner:Enemy;x:number;z:number;dx:number;dz:number;life:number;trail:number;cold:boolean}[]=[];
  const domains:{owner:Enemy;point:Point;radius:number;time:number;tick:number;erupted:boolean;cold:boolean}[]=[];
  return {
    bolt(owner:Enemy,point:Point,elite:boolean,cold=false){
      if(bolts.length>=8) bolts.shift();
      const dx=player.x-point.x,dz=player.z-point.z,d=Math.hypot(dx,dz)||1;
      const speed=elite?19:14;
      bolts.push({owner,x:point.x,z:point.z,dx:dx/d*speed,dz:dz/d*speed,life:1.25,trail:0,cold});
      fx.scatter(point,cold?0xaeecff:0xb08bff,6,1.27);
    },
    domain(owner:Enemy,point:Point,elite:boolean,cold=false){
      if(domains.length>=6) domains.shift();
      const radius=cold?5.10:elite?4.65:3.65;
      domains.push({owner,point,radius,time:-.79,tick:0,erupted:false,cold});
      fx.emit(point,cold?0xe3faff:0xf3b8ff,'ring',radius,.84,{opacity:.98,y:.13});
      fx.emit(point,cold?0x68d9ff:0xb83cff,'ring',.58,.79,{grow:(radius-.58)/.79,opacity:.78,y:.18});
      fx.emit(point,cold?0x399ece:0x7238d5,'frost',radius,.80,{opacity:.29,y:.11});
    },
    update(dt:number,blocking:boolean){
      for(let i=bolts.length-1;i>=0;i--){
        const bolt=bolts[i];
        bolt.life-=dt;bolt.trail-=dt;
        const steps=Math.max(1,Math.ceil(Math.hypot(bolt.dx,bolt.dz)*dt/.27));
        for(let j=0;j<steps&&bolt.life>0;j++){
          bolt.x+=bolt.dx*dt/steps;bolt.z+=bolt.dz*dt/steps;
          if(!canWalk(bolt.x,bolt.z)){bolt.life=0;break;}
          if(Math.hypot(player.x-bolt.x,player.z-bolt.z)<.82){
            hit(bolt.owner,blocking);
            fx.scatter(bolt,bolt.cold?0x94ecff:0xa266ff,9,1);
            bolt.life=0;
          }
        }
        if(bolt.life<=0){bolts.splice(i,1);continue;}
        if(bolt.trail<=0){
          bolt.trail=.045;
          fx.emit(bolt,bolt.cold?0xc6f6ff:0xd2b6ff,'crystal',.81,.16,{y:1.06,aspect:.63});
          fx.emit(bolt,bolt.cold?0x58bcea:0x7831dd,'mist',.59,.25,{y:1,grow:.73,opacity:.52});
        }
      }
      for(let i=domains.length-1;i>=0;i--){
        const field=domains[i];
        field.time+=dt;
        if(field.time<0) continue;
        if(!field.erupted){
          field.erupted=true;
          fx.emit(field.point,field.cold?0x65d5ff:0x9f51fb,'frost',field.radius,2.3,{opacity:.76,y:.12});
          fx.emit(field.point,field.cold?0xd2f5ff:0xcf90ff,'ring',field.radius,.56,{y:.24});
          fx.emit(field.point,field.cold?0x8fddff:0xaa6cff,'ray',1.5,.37,{y:2,aspect:3.15});
          for(let j=0;j<6;j++){
            const a=j*Math.PI/3;
            fx.emit({x:field.point.x+Math.sin(a)*field.radius*.70,z:field.point.z+Math.cos(a)*field.radius*.70},
              0xa268ff,'mist',.98,1.55,{y:.4,lift:.33,opacity:.48});
          }
        }
        if(field.time>=field.tick){
          field.tick+=.74;
          if(Math.hypot(player.x-field.point.x,player.z-field.point.z)<field.radius*.89){
            hit(field.owner,false);
            fx.scatter(player,field.cold?0x9febff:0x9c54eb,4,.53);
          }
        }
        if(field.time>=2.23) domains.splice(i,1);
      }
    },
    clear(){bolts.length=domains.length=0;},
    get active(){return bolts.length>0||domains.length>0;},
  };
}
