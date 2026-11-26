import * as T from 'three';
import { surface } from './layout.ts';
import type { Ability } from './weapons.ts';

export type Point={x:number;z:number};
type Shape='spark'|'ring'|'arc'|'frost'|'scorch'|'ray'|'mist'|'crystal';
type Options={lift?:number;grow?:number;y?:number;dx?:number;dz?:number;yaw?:number;opacity?:number;aspect?:number};

function crescent(){
  const positions:number[]=[], uv:number[]=[], indices:number[]=[];
  for(let i=0;i<=32;i++){
    const t=i/32,a=(t-.5)*2.78;
    const width=Math.sin(t*Math.PI)**.65;
    for(const edge of [0,1]){
      const r=1.15-width*.43*edge;
      positions.push(Math.sin(a)*r,(t-.5)*.50+edge*.1,Math.cos(a)*r);
      uv.push(t,edge);
    }
    if(i>0){const j=i*2;indices.push(j-2,j-1,j,j,j-1,j+1);}
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geo.setIndex(indices);
  return geo;
}

const tones:Record<Ability,readonly [number,number]> = {
  fire:[0xff561c,0xffcf77], lightning:[0x487dff,0xe5f8ff], ice:[0x58bdff,0xdafaff],
  water:[0x337adc,0x95faff], wind:[0x83cbaf,0xe4fff5],
};

export function createMagicEffects(group:T.Group) {
  const disc=new T.PlaneGeometry(2,2).rotateX(-Math.PI/2);
  const dome=new T.SphereGeometry(1,24,14);
  const geometries={
    spark:new T.OctahedronGeometry(.23), crystal:new T.OctahedronGeometry(.23).scale(.65,2,.65),
    ring:disc, frost:disc, scorch:disc, arc:crescent(),
    ray:new T.CylinderGeometry(.035,.31,1,12,1,true), mist:new T.PlaneGeometry(2,2),
  };
  const modes:Record<Shape,number>={spark:0,crystal:0,ring:1,arc:2,frost:3,scorch:4,ray:5,mist:6};
  const glow=new T.ShaderMaterial({
    uniforms:{tint:{value:new T.Color()},strength:{value:1},age:{value:0},mode:{value:0},clock:{value:0}},
    vertexShader:`
      varying vec2 vUv;
      varying vec3 normalView;
      varying vec3 viewDirection;
      void main(){
        vUv=uv;
        vec4 p=modelViewMatrix*vec4(position,1.);
        normalView=normalize(normalMatrix*normal);
        viewDirection=-p.xyz;
        gl_Position=projectionMatrix*p;
      }`,
    fragmentShader:`
      uniform vec3 tint;
      uniform float strength, age, mode, clock;
      varying vec2 vUv;
      varying vec3 normalView;
      varying vec3 viewDirection;
      void main(){
        vec2 p=vUv*2.-1.;
        float r=length(p), a=atan(p.y,p.x+.00001);
        float alpha=1., core=.30;
        if(mode==1.){
          alpha=(1.-smoothstep(.015,.13,abs(r-.88))) + .35*(1.-smoothstep(.01,.035,abs(r-.68)));
          core=1.-smoothstep(.01,.051,abs(r-.88));
          alpha*=.8+.2*sin(a*17.+clock*10.);
        } else if(mode==2.){
          float lane=vUv.y+.13*sin(vUv.x*38.-age*12.);
          alpha=pow(max(0.,sin(vUv.x*3.14159)),.72)*(1.-smoothstep(.12,1.,lane));
          core=1.-smoothstep(.02,.23,abs(lane-.20));
        } else if(mode==3.){
          float facets=abs(sin(a*9.+r*19.)*cos(a*5.-r*21.));
          float veins=1.-smoothstep(.012,.095,facets);
          alpha=(.19+veins*.30)*(1.-smoothstep(.80,1.,r));
          alpha+=.58*(1.-smoothstep(.014,.059,abs(r-.92)));
          core=veins*.7;
        } else if(mode==4.){
          float fissure=abs(sin(a*7.+sin(r*19.)*.72));
          alpha=(1.-smoothstep(.18,1.,r))*(.38+.62*(1.-smoothstep(.04,.23,fissure)));
          core=.14*(1.-age);
        } else if(mode==5.){
          alpha=pow(max(0.,sin(vUv.y*3.14159)),1.4)*(.48+.52*sin(vUv.x*25.+clock*4.)*.5);
          core=.25;
        } else if(mode==6.){
          alpha=(1.-smoothstep(.08,1.,r))*(.56+.24*sin(p.x*8.+p.y*6.-clock*3.));
          core=.04;
        } else if(mode==7.){
          float rim=pow(1.-abs(dot(normalize(normalView),normalize(viewDirection))),4.);
          float stream=1.-smoothstep(.025,.32,abs(sin(vUv.y*39.+sin(vUv.x*25.+clock*2.)*.82-clock*5.)));
          alpha=.024+.42*rim+stream*(.05+.23*rim);
          alpha*=smoothstep(0.,.13,vUv.y);
          core=stream*.57+.20*rim;
        }
        gl_FragColor=vec4(mix(tint,vec3(1.),max(0.,core)*.72),clamp(alpha*strength,0.,1.));
        #include <colorspace_fragment>
      }`,
    transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,
    blending:T.AdditiveBlending,toneMapped:false,
  });
  const pools=[48,52].map((capacity,index)=>Array.from({length:capacity},()=>{
    const mesh=new T.Mesh<T.BufferGeometry,T.ShaderMaterial>(geometries.spark,glow);
    mesh.visible=false;
    mesh.renderOrder=2+index;
    group.add(mesh);
    const effect={mesh,life:0,max:1,size:1,grow:0,lift:0,dx:0,dz:0,opacity:1,aspect:1,
      mode:0,tint:new T.Color(),shape:'spark' as Shape};
    mesh.onBeforeRender=()=>{
      glow.uniforms.tint.value.copy(effect.tint);
      glow.uniforms.mode.value=effect.mode;
      glow.uniforms.age.value=1-effect.life/effect.max;
      glow.uniforms.strength.value=effect.opacity*T.MathUtils.smoothstep(effect.life/effect.max,0,.8);
      glow.uniformsNeedUpdate=true;
    };
    return effect;
  }));
  const scorchMaterial=new T.MeshBasicMaterial({color:0x21100d,transparent:true,depthWrite:false});
  const scorchMarks=Array.from({length:7},()=>{
    const mesh=new T.Mesh(new T.CircleGeometry(1,18).rotateX(-Math.PI/2),scorchMaterial.clone());
    group.add(mesh);mesh.visible=false;
    return {mesh,life:0};
  });
  const bolts=Array.from({length:10},()=>{
    const vertices=new T.BufferAttribute(new Float32Array(27),3).setUsage(T.DynamicDrawUsage);
    const geo=new T.BufferGeometry().setAttribute('position',vertices);
    const line=new T.Line(geo,new T.LineBasicMaterial({color:0xc9e8ff,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
    line.frustumCulled=false;line.visible=false;group.add(line);
    return {line,vertices,life:0,max:1,x:0,y:0,z:0,tx:0,ty:0,tz:0,seed:0};
  });
  const barrier=new T.Mesh(dome,glow);
  const waterTint=new T.Color(tones.water[0]);
  barrier.scale.set(1.63,1.58,1.63);barrier.visible=false;barrier.renderOrder=3;group.add(barrier);
  barrier.onBeforeRender=()=>{
    glow.uniforms.tint.value.copy(waterTint);
    glow.uniforms.strength.value=.72;
    glow.uniforms.mode.value=7;
    glow.uniformsNeedUpdate=true;
  };
  const cursors=[0,0];
  let boltCursor=0,scorchCursor=0,time=0;
  function emit(point:Point,color:number,shape:Shape,size:number,seconds:number,options:Options={}){
    const channel=shape==='spark'||shape==='crystal'||shape==='mist'?1:0;
    const pool=pools[channel];
    const p=pool.find(effect=>effect.life===0)??pool[cursors[channel]++%pool.length],mesh=p.mesh;
    p.life=p.max=seconds;p.size=size;p.grow=options.grow??0;p.lift=options.lift??0;
    p.dx=options.dx??0;p.dz=options.dz??0;p.opacity=options.opacity??.76;
    p.aspect=options.aspect??1;p.tint.setHex(color);p.mode=modes[shape];p.shape=shape;
    mesh.geometry=geometries[shape];
    mesh.position.set(point.x,surface(point.x,point.z)+(options.y??.09),point.z);
    mesh.scale.set(size,size*p.aspect,size);
    mesh.rotation.set(shape==='mist'?-.83:0,options.yaw??0,0);
    mesh.visible=true;
  }
  function scatter(point:Point,color:number,count:number,height=.4,shape:'spark'|'crystal'='spark'){
    for(let i=0;i<count;i++){
      const a=i*2.399+point.x;
      emit(point,i%3===0?0xf2faff:color,shape,.32+(i%4)*.19,.26+(i%3)*.13,
        {y:height,lift:.8+i%3,dx:Math.cos(a)*(2+i%3),dz:Math.sin(a)*(2+i%3),yaw:a,aspect:1.3});
    }
  }
  function lightning(from:Point,to:Point,strike=false,small=false){
    const bolt=bolts[boltCursor++%bolts.length];
    bolt.life=bolt.max=small?.12:.31;
    bolt.line.visible=true;
    bolt.x=from.x;bolt.z=from.z;bolt.y=surface(from.x,from.z)+(strike?10:small?1.65:.9);
    bolt.tx=to.x;bolt.tz=to.z;bolt.ty=surface(to.x,to.z)+(strike?.09:small?.68:.92);
    bolt.seed=boltCursor;
  }
  function slash(point:Point,element:Ability|null,yaw:number,size:number,power=false){
    const [color,core]=element?tones[element]:[0xd9cfb8,0xfff1cf];
    const speed=power?(element==='wind'?8:3):1.6;
    for(let i=0;i<(element==='wind'||power?3:2);i++){
      emit(point,i===1?core:color,'arc',size*(1-i*.16),.27+i*.05,
        {y:(element==='fire'?.76:1.02)-i*.17,yaw:yaw+(i===2?.18:-i*.06),aspect:element==='fire'?1.45:.84,
          grow:1.25,dx:Math.sin(yaw)*speed,dz:Math.cos(yaw)*speed,opacity:i===0?.89:.56});
    }
    if(element==='lightning') lightning({x:point.x-Math.cos(yaw),z:point.z+Math.sin(yaw)},
      {x:point.x+Math.sin(yaw)*size,z:point.z+Math.cos(yaw)*size},false,true);
  }
  function impact(point:Point,element:Ability|null,strong=false){
    const [color,core]=element?tones[element]:[0xd9a35a,0xffedbf];
    scatter(point,color,strong?9:5,.88,element==='ice'?'crystal':'spark');
    emit(point,core,'spark',strong?1.9:1.18,.14,{y:.93,aspect:.65});
    if(strong||element==='water') emit(point,color,'ring',.51,.34,{grow:4,opacity:.65});
  }
  function treasure(point:Point,color:number,tier:number){
    scatter(point,color,9+tier*2,.64);
    emit(point,color,'ring',.72,.85,{grow:2.5,opacity:.65});
    for(let i=0;i<3+tier;i++){
      const a=i*2.399,offset={x:point.x+Math.sin(a)*.40,z:point.z+Math.cos(a)*.28};
      emit(offset,color,'ray',.46+i*.053,1.18+i*.12,{y:1.12+i*.13,aspect:3.7,lift:.51,yaw:a,opacity:.65});
    }
  }
  return {
    emit,scatter,lightning,slash,impact,treasure,
    scorch(point:Point){
      const mark=scorchMarks[scorchCursor++%scorchMarks.length];
      mark.life=1.42;mark.mesh.visible=true;
      mark.mesh.position.set(point.x,surface(point.x,point.z)+.036,point.z);
      mark.mesh.scale.set(1.42,1,.86);
      emit(point,0xea4214,'scorch',1.40,.73,{y:.045,opacity:.69});
    },
    barrier(player:T.Vector3,active:boolean){
      barrier.visible=active;
      if(active){barrier.position.copy(player);barrier.position.y+=.99;}
    },
    clear(){
      for(const pool of pools) for(const p of pool){p.life=0;p.mesh.visible=false;}
      for(const b of bolts){b.life=0;b.line.visible=false;}
      for(const mark of scorchMarks){mark.life=0;mark.mesh.visible=false;}
      barrier.visible=false;
    },
    update(dt:number){
      time+=dt;glow.uniforms.clock.value=time;
      for(const mark of scorchMarks){
        if(mark.life<=0) continue;
        mark.life=Math.max(0,mark.life-dt);
        mark.mesh.visible=mark.life>0;
        mark.mesh.material.opacity=Math.min(.72,mark.life);
      }
      for(const b of bolts){
        if(b.life<=0) continue;
        b.life=Math.max(0,b.life-dt);b.line.visible=b.life>0;
        b.line.material.opacity=b.life/b.max*(.70+.30*Math.sin(time*115+b.seed));
        for(let i=0;i<=8;i++){
          const t=i/8, envelope=Math.sin(t*Math.PI);
          const phase=i*13.4+b.seed+Math.floor(time*36)*2.1;
          b.vertices.setXYZ(i,T.MathUtils.lerp(b.x,b.tx,t)+Math.sin(phase)*.58*envelope,
            T.MathUtils.lerp(b.y,b.ty,t)+Math.cos(phase*1.3)*.44*envelope,
            T.MathUtils.lerp(b.z,b.tz,t)+Math.cos(phase)*.58*envelope);
        }
        b.vertices.needsUpdate=true;
      }
      for(const pool of pools) for(const p of pool){
        if(p.life<=0) continue;
        p.life=Math.max(0,p.life-dt);p.mesh.visible=p.life>0;
        p.mesh.position.x+=p.dx*dt;p.mesh.position.z+=p.dz*dt;p.mesh.position.y+=p.lift*dt;
        const size=p.size+(p.max-p.life)*p.grow;
        const reveal=p.shape==='crystal'?T.MathUtils.smoothstep(p.max-p.life,0,.38):1;
        p.mesh.scale.set(size,size*p.aspect*reveal,size);
        if(p.shape==='spark') p.mesh.rotation.z+=dt*4;
      }
    },
    dispose(){
      glow.dispose();dome.dispose();
      for(const {line} of bolts){line.geometry.dispose();line.material.dispose();}
      for(const geometry of new Set(Object.values(geometries))) geometry.dispose();
      for(const {mesh} of scorchMarks){mesh.geometry.dispose();mesh.material.dispose();}
      scorchMaterial.dispose();
    },
  };
}
