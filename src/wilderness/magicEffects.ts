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
  const bolts=Array.from({length:12},()=>{
    const geometry=new T.BufferGeometry();
    const vertices=new T.BufferAttribute(new Float32Array(21),3);
    vertices.setUsage(T.DynamicDrawUsage);
    geometry.setAttribute('position',vertices);
    const material=new T.LineBasicMaterial({color:0xd6eaff,transparent:true,depthWrite:false});
    const line=new T.Line(geometry,material);
    line.frustumCulled=false;
    line.visible=false;
    group.add(line);
    return {line,vertices,life:0};
  });
  let cursor=0, boltCursor=0;
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
    const bolt=bolts[boltCursor++%bolts.length];
    bolt.life=.27;
    bolt.line.visible=true;
    for(let i=0;i<7;i++){
      const t=i/6, jitter=Math.sin(i*2.5)*.45*Math.sin(t*Math.PI);
      const x=from.x+dx*t+dz/length*jitter,z=from.z+dz*t-dx/length*jitter;
      bolt.vertices.setXYZ(i,x,surface(x,z)+.55+Math.sin(t*Math.PI)*1.08+jitter,z);
    }
    bolt.vertices.needsUpdate=true;
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
      for(const bolt of bolts){
        if(bolt.life<=0) continue;
        bolt.life=Math.max(0,bolt.life-dt);
        bolt.line.visible=bolt.life>0;
        bolt.line.material.opacity=bolt.life/.27;
      }
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
      for(const {line} of bolts){line.geometry.dispose();line.material.dispose();}
      for(const geometry of [spark,ring,dome,arc]) geometry.dispose();
    },
  };
}
