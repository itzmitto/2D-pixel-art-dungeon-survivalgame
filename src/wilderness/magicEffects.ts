import * as T from 'three';
import { surface } from './layout.ts';

export type Point={x:number;z:number};

export function createMagicEffects(group:T.Group) {
  const spark=new T.OctahedronGeometry(.23);
  const ring=new T.RingGeometry(.87,1,32).rotateX(-Math.PI/2);
  const dome=new T.SphereGeometry(1,20,12);
  const arc=new T.TorusGeometry(.80,.13,4,24,Math.PI*1.1).rotateX(Math.PI/2).rotateY(-.12);
  const pool=Array.from({length:64},()=>{
    const material=new T.MeshBasicMaterial({transparent:true,depthWrite:false,side:T.DoubleSide});
    const mesh=new T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>(spark,material);
    mesh.visible=false;
    group.add(mesh);
    return {mesh,life:0,max:1,size:1,grow:0,lift:0,dx:0,dz:0,opacity:1};
  });
  let cursor=0;
  function emit(point:Point,color:number,shape:'spark'|'ring'|'dome'|'arc',size:number,seconds:number,
    options:{lift?:number;grow?:number;y?:number;dx?:number;dz?:number;yaw?:number;opacity?:number}={}){
    const p=pool[cursor++%pool.length], mesh=p.mesh;
    p.life=p.max=seconds;p.size=size;p.grow=options.grow??0;p.lift=options.lift??0;
    p.dx=options.dx??0;p.dz=options.dz??0;p.opacity=options.opacity??.76;
    mesh.geometry={spark,ring,dome,arc}[shape];
    mesh.material.color.setHex(color);
    mesh.position.set(point.x,surface(point.x,point.z)+(options.y??.14),point.z);
    mesh.scale.setScalar(size);
    mesh.rotation.set(0,options.yaw??0,0);
    mesh.visible=true;
  }
  function scatter(point:Point,color:number,count:number,height=.4){
    for(let i=0;i<count;i++){
      const a=i*2.399+point.x;
      emit(point,color,'spark',.58+(i%4)*.21,.42+(i%3)*.15,{y:height,lift:1+i%3,dx:Math.cos(a)*3,dz:Math.sin(a)*3});
    }
  }
  function lightning(from:Point,to:Point){
    const dx=to.x-from.x,dz=to.z-from.z,length=Math.hypot(dx,dz)||1;
    for(let i=0;i<7;i++){
      const t=i/6, jitter=Math.sin(i*2.5)*.32*Math.sin(t*Math.PI);
      const point={x:from.x+dx*t+dz/length*jitter,z:from.z+dz*t-dx/length*jitter};
      emit(point,0xe7f4ff,'spark',Math.max(.65,length*.52),.22,{y:.46+Math.sin(t*Math.PI)*1.05,yaw:Math.atan2(dx,dz)});
      pool[(cursor-1)%pool.length].mesh.scale.z*=2.2;
    }
  }
  const barrier=new T.Mesh(dome,new T.MeshBasicMaterial({color:0x6196d5,transparent:true,opacity:.16,
    side:T.DoubleSide,depthWrite:false}));
  barrier.scale.set(1.52,1.42,1.52);barrier.visible=false;group.add(barrier);
  return {
    emit,scatter,lightning,
    barrier(player:T.Vector3,active:boolean){
      barrier.visible=active;
      if(active){barrier.position.copy(player);barrier.position.y+=1;}
    },
    update(dt:number){
      for(const p of pool){
        if(p.life<=0) continue;
        p.life=Math.max(0,p.life-dt);p.mesh.visible=p.life>0;
        p.mesh.position.x+=p.dx*dt;p.mesh.position.z+=p.dz*dt;p.mesh.position.y+=p.lift*dt;
        p.mesh.material.opacity=p.life/p.max*p.opacity;
        if(p.grow) p.mesh.scale.setScalar(p.size+(p.max-p.life)*p.grow);
      }
    },
    dispose(){
      for(const p of pool) p.mesh.material.dispose();
      barrier.material.dispose();
      for(const geometry of [spark,ring,dome,arc]) geometry.dispose();
    },
  };
}
