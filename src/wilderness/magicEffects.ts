import type { GrassSpell } from './grass.ts';
import * as T from 'three';
import { surface } from './layout.ts';
import type { Ability } from './weapons.ts';
import { surfaceNoise } from './surfaceDetail.ts';

export type Point={x:number;z:number};
type Shape='spark'|'ring'|'arc'|'frost'|'scorch'|'ray'|'mist'|'crystal'|'vortex'|'flame'|'smoke'|'tendril'|'droplet';
type Options={lift?:number;grow?:number;y?:number;dx?:number;dz?:number;yaw?:number;opacity?:number;aspect?:number;limit?:number;delay?:number;element?:Ability};

function crescent(flame=false){
  const positions:number[]=[], uv:number[]=[], indices:number[]=[];
  for(let i=0;i<=32;i++){
    const t=i/32,a=(t-.5)*2.78;
    const width=Math.sin(t*Math.PI)**.65;
    for(const edge of [0,1]){
      const r=1.15-width*(flame?.22:.43)*edge;
      const height=flame?edge*width*(.3+.08*Math.sin(t*35)+.042*Math.cos(t*92)):(t-.5)*.31+edge*.09;
      positions.push(Math.sin(a)*r,height,Math.cos(a)*r);
      uv.push(t,edge);
    }
    if(i>0){const j=i*2;indices.push(j-2,j-1,j,j,j-1,j+1);}
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function tendril(){
  const geometry=new T.PlaneGeometry(1,1,36,1);
  const uv=geometry.attributes.uv, pos=geometry.attributes.position;
  for(let i=0;i<pos.count;i++){
    const t=uv.getX(i),v=uv.getY(i),a=t*5.5,r=t*(.76+v*.19);
    pos.setXYZ(i,Math.cos(a)*r,.19*Math.sin(t*Math.PI)+v*.11,Math.sin(a)*r);
  }
  geometry.computeVertexNormals();
  return geometry;
}
const elementType:Record<Ability,number>={fire:1,ice:2,lightning:3,water:4,wind:5,darkness:6};
const tones:Record<Ability,readonly [number,number]> = {
  fire:[0xff561c,0xffcf77], lightning:[0x487dff,0xe5f8ff], ice:[0x58bdff,0xdafaff],
  water:[0x337adc,0x95faff], wind:[0x83cbaf,0xe4fff5],darkness:[0x8432dd,0xe4b6ff],
};

export function createMagicEffects(group:T.Group) {
  const disc=new T.PlaneGeometry(2,2).rotateX(-Math.PI/2);
  const dome=new T.SphereGeometry(1,24,14);
  const geometries={
    spark:new T.OctahedronGeometry(.23), crystal:new T.OctahedronGeometry(.23).scale(.65,2,.65),
    vortex:disc, ring:disc, frost:disc, scorch:disc, arc:crescent(),flame:crescent(true),
    tendril:tendril(), droplet:new T.IcosahedronGeometry(.15,0).scale(.54,1.6,.54),
    ray:new T.CylinderGeometry(.035,.31,1,12,1,true), mist:new T.PlaneGeometry(2,2), smoke:new T.PlaneGeometry(2,2),
  };
  const modes:Record<Shape,number>={spark:0,crystal:0,ring:1,arc:2,frost:3,scorch:4,ray:5,mist:6,vortex:8,flame:9,smoke:10,tendril:11,droplet:0};
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
    fragmentShader:surfaceNoise+`
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
          float lane=vUv.y+.027*sin(vUv.x*31.-age*10.);
          float edge=1.-smoothstep(.022,.12,abs(lane-.12));
          float film=(1.-smoothstep(.10,.64,lane))*.42;
          float echo=(1.-smoothstep(.018,.050,abs(lane-.47)))*.32;
          alpha=pow(max(0.,sin(vUv.x*3.14159)),.71)*(edge+film+echo);
          core=edge*.9;
        } else if(mode==3.){
          float hex=max(abs(p.x),dot(abs(p),vec2(.5,.866)));
          float face=grain(p*9.+grain(p*4.)*.72);
          float branch=abs(sin(a*3.+floor(r*11.)*.55))*r;
          float spokes=1.-smoothstep(.016,.052,branch);
          float split=1.-smoothstep(.023,.082,abs(sin(a*6.+r*39.+face*.64))*r);
          float runes=(1.-smoothstep(.013,.049,abs(hex-.64)))*pow(.5+.5*sin(a*26.),4.);
          float rim=1.-smoothstep(.015,.061,abs(hex-.82));
          float mask=1.-smoothstep(.69,.89,hex);
          alpha=(.11+face*.26+spokes*.34+split*.17)*mask+runes*.52+rim*.59;
          core=.24+spokes*.45+rim*.43;
        } else if(mode==4.){
          float carbon=grain(p*7.)*.6+grain(p*17.)*.4;
          float fissure=abs(sin(a*6.+carbon*2.3+r*2.0));
          float crack=1.-smoothstep(.037,.19,fissure);
          alpha=(1.-smoothstep(.16,.98,r+(carbon-.5)*.28))*(.19+carbon*.36+crack*.44);
          vec3 charColor=mix(vec3(.025,.013,.013),tint*.48,crack*(1.-age));
          gl_FragColor=vec4(charColor,alpha*strength);
          #include <colorspace_fragment>
          return;
        } else if(mode==5.){
          alpha=pow(max(0.,sin(vUv.y*3.14159)),1.4)*(.48+.52*sin(vUv.x*25.+clock*4.)*.5);
          core=.25;
        } else if(mode==6.){
          alpha=(1.-smoothstep(.08,1.,r))*(.56+.24*sin(p.x*8.+p.y*6.-clock*3.));
          core=.04;
        } else if(mode==7.){
          float rim=pow(1.-abs(dot(normalize(normalView),normalize(viewDirection))),4.);
          float wave=vUv.y*48.+sin(vUv.x*34.+clock*2.7)*1.6-clock*6.8;
          float stream=1.-smoothstep(.094,.48,abs(sin(wave)));
          float caustic=1.-smoothstep(.035,.23,abs(sin(wave*.37)*cos(vUv.x*56.-vUv.y*34.+clock*1.8)));
          float rimLight=.30+.70*pow(.5+.5*cos(vUv.x*25.+vUv.y*17.-clock*2.5),3.);
          alpha=(.017+.36*rim*rimLight+stream*(.025+.23*rim)+caustic*.055)*smoothstep(.04,.25,vUv.y);
          core=.18+stream*.37+.31*rim;
        } else if(mode==8.){
          float spiral=pow(.5+.5*sin(a*6.+r*20.-clock*5.5+2.*sin(r*9.-clock*2.)),8.);
          float glyph=pow(.5+.5*cos(a*18.),6.)*(1.-smoothstep(.02,.06,abs(r-.83)));
          float seal=(1.-smoothstep(.018,.044,abs(r-.94)));
          alpha=(.22+.82*spiral)*(1.-smoothstep(.75,1.,r))+.63*seal+.73*glyph;
          core=.24*spiral+.5*glyph+.24*seal;
          gl_FragColor=vec4(mix(vec3(.014,.004,.032),mix(tint,vec3(.8,.51,1.),core),max(spiral,glyph+seal)),clamp(alpha*strength,0.,1.));
          #include <colorspace_fragment>
          return;
        } else if(mode==9.){
          float travel=vUv.x, h=vUv.y;
          vec2 flow=vec2(travel*25.+h*2.,h*3.1-clock*7.);
          float turbulence=grain(flow)*.66+grain(flow*2.18+vec2(-clock*1.3,0.))*.34;
          float tongues=pow(max(0.,.55+.49*sin(travel*95.+turbulence*5.-clock*9.)),1.8);
          float flameMask=1.-smoothstep(.02,.22,h-(.21+.76*tongues)*(.71+turbulence*.3));
          float filament=1.-smoothstep(.15,.66,h+turbulence*.25);
          float whiteCore=pow(max(0.,1.-h),4.)*(.68+.32*tongues);
          alpha=pow(max(0.,sin(travel*3.14159)),.67)*flameMask*(.75+.25*filament);
          vec3 fireColor=mix(tint*.48,mix(vec3(1.,.56,.20),vec3(1.,.88,.63),whiteCore),filament*.79);
          gl_FragColor=vec4(fireColor,alpha*strength);
          #include <colorspace_fragment>
          return;
        } else if(mode==10.){
          vec2 advect=p*3.2+vec2(clock*.7,-clock*.48);
          float billow=grain(advect)*.62+grain(advect*2.3)*.38;
          alpha=pow(max(0.,1.-r),1.5)*smoothstep(.14,.86,billow);
          gl_FragColor=vec4(tint,alpha*strength);
          #include <colorspace_fragment>
          return;
        } else if(mode==11.){
          float edge=1.-smoothstep(.045,.48,abs(vUv.y-.53+.11*sin(vUv.x*45.-clock*8.)));
          float pulse=pow(.5+.5*sin(vUv.x*18.-clock*6.),1.5);
          alpha=edge*sin(vUv.x*3.14159)*(.28+pulse*.72);
          core=edge*pulse*.48;
        }
        gl_FragColor=vec4(mix(tint,vec3(1.),max(0.,core)*.72),clamp(alpha*strength,0.,1.));
        #include <colorspace_fragment>
      }`,
    transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,
    blending:T.AdditiveBlending,toneMapped:false,
  });
  const veilMaterial=glow.clone();
  veilMaterial.blending=T.NormalBlending;
  veilMaterial.uniforms.clock=glow.uniforms.clock;
  const spellLight=new T.PointLight(0xa2d6ff,0,12,2);
  group.add(spellLight);
  const pools=[48,52].map((capacity,index)=>Array.from({length:capacity},()=>{
    const mesh=new T.Mesh<T.BufferGeometry,T.ShaderMaterial>(geometries.spark,glow);
    mesh.visible=false;
    mesh.renderOrder=2+index;
    group.add(mesh);
    const effect={mesh,life:0,max:1,size:1,grow:0,lift:0,dx:0,dz:0,opacity:1,aspect:1,
      delay:0,limit:Infinity,mode:0,element:0,tint:new T.Color(),shape:'spark' as Shape};
    mesh.onBeforeRender=()=>{
      const m=mesh.material;
      m.uniforms.tint.value.copy(effect.tint);
      m.uniforms.mode.value=effect.mode;
      m.uniforms.age.value=1-effect.life/effect.max;
      m.uniforms.strength.value=effect.opacity*T.MathUtils.smoothstep(effect.life/effect.max,0,.8);
      m.uniformsNeedUpdate=true;
    };
    return effect;
  }));
  const particleMaterial=new T.ShaderMaterial({
    uniforms:{particleStyle:{value:0}},
    vertexShader:`
      attribute vec4 particleColor;
      varying vec4 vColor;
      varying vec3 vSurface,vView;
      void main(){
        vColor=particleColor;
        vec3 transformedNormal=mat3(instanceMatrix)*normal;
        vSurface=normalize(normalMatrix*transformedNormal);
        vec4 p=modelViewMatrix*instanceMatrix*vec4(position,1.);
        vView=-p.xyz;
        gl_Position=projectionMatrix*p;
      }`,
    fragmentShader:`
      uniform float particleStyle;
      varying vec4 vColor;
      varying vec3 vSurface,vView;
      void main(){
        vec3 n=normalize(vSurface);
        float facet=.24+.76*max(0.,dot(n,normalize(vec3(-.42,.59,.76))));
        float edge=pow(1.-abs(dot(n,normalize(vView))),3.);
        vec3 color=vColor.rgb;
        float opacity=vColor.a;
        if(particleStyle==1.){
          color*=.38+.74*facet;
          color=mix(color,vec3(.67,.86,1.),edge*.51);
          opacity*=.57+facet*.38;
        } else if(particleStyle==2.){
          color=mix(color*.46,vec3(.69,.87,1.),facet*.38+edge*.33);
          opacity*=.47+edge*.53;
        }
        gl_FragColor=vec4(color,opacity);
        #include <colorspace_fragment>
      }`,
    transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,
  });
  function particleBatch(geometry:T.BufferGeometry,style:number){
    const capacity=100;
    const colors=new T.InstancedBufferAttribute(new Float32Array(capacity*4),4).setUsage(T.DynamicDrawUsage);
    geometry.setAttribute('particleColor',colors);
    const mesh=new T.InstancedMesh(geometry,particleMaterial,capacity);
    mesh.count=0;mesh.frustumCulled=false;mesh.renderOrder=3;
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    mesh.onBeforeRender=()=>{
      particleMaterial.uniforms.particleStyle.value=style;
      particleMaterial.uniformsNeedUpdate=true;
    };
    group.add(mesh);
    return {mesh,colors};
  }
  const particles={spark:particleBatch(geometries.spark,0),crystal:particleBatch(geometries.crystal,1),droplet:particleBatch(geometries.droplet,2)};
  const particleBatches=Object.values(particles);
  const boltPath=Array.from({length:9},()=>new T.Vector3());
  const bolts=Array.from({length:16},()=>{
    const vertices=new T.BufferAttribute(new Float32Array(40*3),3).setUsage(T.DynamicDrawUsage);
    const colors=new Float32Array(40*3);
    for(let i=0;i<40;i++) colors.set(i<16?[.90,.97,1]:[.30,.48,.96],i*3);
    const geo=new T.BufferGeometry().setAttribute('position',vertices).setAttribute('color',new T.BufferAttribute(colors,3));
    const line=new T.LineSegments(geo,new T.LineBasicMaterial({color:0xc9e8ff,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
    line.frustumCulled=false;line.visible=false;group.add(line);
    return {line,vertices,life:0,max:1,x:0,y:0,z:0,tx:0,ty:0,tz:0,seed:0,ground:false};
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
  let boltCursor=0,time=0;
  function emit(point:Point,color:number,shape:Shape,size:number,seconds:number,options:Options={}){
    const batched=shape==='spark'||shape==='crystal'||shape==='droplet';
    const channel=batched&&seconds<1||shape==='mist'||shape==='smoke'?1:0;
    const pool=pools[channel];
    const p=pool.find(effect=>effect.life===0)??pool[cursors[channel]++%pool.length],mesh=p.mesh;
    p.life=p.max=seconds;p.size=size;p.grow=options.grow??0;p.lift=options.lift??0;
    p.dx=options.dx??0;p.dz=options.dz??0;p.opacity=options.opacity??.76;
    p.aspect=options.aspect??1;p.delay=options.delay??0;p.limit=options.limit??Infinity;p.tint.setHex(color);p.mode=modes[shape];p.shape=shape;
    p.element=options.element?elementType[options.element]:shape==='frost'?2:shape==='scorch'||shape==='flame'?1:shape==='vortex'?6:0;
    mesh.geometry=geometries[shape];
    mesh.material=shape==='vortex'||shape==='smoke'||shape==='scorch'?veilMaterial:glow;
    mesh.position.set(point.x,surface(point.x,point.z)+(options.y??.09),point.z);
    mesh.scale.set(size,size*p.aspect,size);
    mesh.rotation.set(shape==='mist'?-.83:shape==='smoke'?-.72:0,options.yaw??0,shape==='smoke'?.6*Math.sin(time*6):0);
    mesh.visible=p.delay===0&&!batched;
    if(shape==='ring'||shape==='scorch'||shape==='frost') alignGround(mesh,point);

  }
  function scatter(point:Point,color:number,count:number,height=.4,shape:'spark'|'crystal'|'droplet'='spark'){
    for(let i=0;i<count;i++){
      const a=i*2.399+point.x;
      emit(point,i%3===0?0xf2faff:color,shape,.32+(i%4)*.19,.26+(i%3)*.13,
        {y:height,lift:.8+i%3,dx:Math.cos(a)*(2+i%3),dz:Math.sin(a)*(2+i%3),yaw:a,aspect:1.3});
    }
  }
  function lightning(from:Point,to:Point,strike=false,small=false,ground=false,color?:number){
    const bolt=bolts[boltCursor++%bolts.length];
    bolt.line.material.color.setHex(color??0xc9e8ff);
    bolt.life=bolt.max=small?.12:.31;
    bolt.line.visible=true;
    bolt.x=from.x;bolt.z=from.z;bolt.y=surface(from.x,from.z)+(strike?10:ground?.19:small?1.65:.9);
    bolt.tx=to.x;bolt.tz=to.z;bolt.ty=surface(to.x,to.z)+(strike?.09:ground?.19:small?.68:.92);
    bolt.seed=boltCursor;bolt.ground=ground;
  }
  function slash(point:Point,element:Ability|null,yaw:number,size:number,power=false){
    const [color,core]=element?tones[element]:[0xd9cfb8,0xfff1cf];
    const elementOption=element??undefined;
    const speed=power?(element==='wind'?8:3):1.6;
    for(let i=0;i<(element==='wind'||power?3:2);i++){
      emit(point,i===1?core:color,element==='fire'?'flame':'arc',size*(1-i*.16),.27+i*.05,
        {y:(element==='fire'?.76:1.02)-i*.17,yaw:yaw+(i===2?.18:-i*.06),aspect:element==='fire'?1.45:.84,
          element:elementOption,grow:1.25,dx:Math.sin(yaw)*speed,dz:Math.cos(yaw)*speed,opacity:i===0?.89:.56});
    }
    const ahead={x:point.x+Math.sin(yaw)*size*.82,z:point.z+Math.cos(yaw)*size*.82};
    if(element==='fire'){
      scatter(ahead,color,5,.54);
      emit(ahead,0xdb3c15,'scorch',.79,1.48,{y:.05,opacity:.75});
    }
    if(element==='darkness'){
      emit(point,0x160a28,'arc',size*1.08,.39,{y:.90,yaw,aspect:1.1,opacity:.86});
      emit(point,0xbd66ff,'arc',size,.29,{y:1.13,yaw,aspect:1.15,grow:1.85});
      scatter(ahead,0x8e43dc,power?10:5,.82);
    }
    if(element==='wind') emit(ahead,0xbfb8a7,'mist',.58,.27,{y:.18,grow:1.45,opacity:.34});
    if(element==='lightning') lightning({x:point.x-Math.cos(yaw),z:point.z+Math.sin(yaw)},ahead,false,true);
  }
  function impact(point:Point,element:Ability|null,strong=false){
    const [color,core]=element?tones[element]:[0xd9a35a,0xffedbf];
    scatter(point,color,strong?9:5,.88,element==='ice'?'crystal':element==='water'?'droplet':'spark');
    emit(point,core,'spark',strong?1.9:1.18,.14,{y:.93,aspect:.65});
    if(strong||element==='water') emit(point,color,'ring',.51,.34,{grow:4,opacity:.65,element:element??undefined});
    if(element==='fire'&&strong){
      emit(point,color,'flame',1.18,.40,{y:.26,yaw:point.x,aspect:3.1,grow:1.4});
      emit(point,0x4b342e,'smoke',.80,.78,{y:.42,lift:1.4,grow:1.1,opacity:.53});
    }
  }
  function treasure(point:Point,color:number,tier:number){
    scatter(point,color,9+tier*2,.64);
    emit(point,color,'ring',.72,.85,{grow:2.5,opacity:.65});
    for(let i=0;i<3+tier;i++){
      const a=i*2.399,offset={x:point.x+Math.sin(a)*.40,z:point.z+Math.cos(a)*.28};
      emit(offset,color,'ray',.46+i*.053,1.18+i*.12,{y:1.12+i*.13,aspect:3.7,lift:.51,yaw:a,opacity:.65});
    }
  }
  function alignGround(mesh:T.Mesh,point:Point){
    const dx=(surface(point.x+.6,point.z)-surface(point.x-.6,point.z))/1.2;
    const dz=(surface(point.x,point.z+.6)-surface(point.x,point.z-.6))/1.2;
    mesh.rotation.set(Math.atan(-dz),0,Math.atan(dx));
  }
  return {
    emit,scatter,lightning,slash,impact,treasure,
    grassInfluences(spell:GrassSpell,player:Point){
      for(const effect of pools[0]){
        if(effect.life<=0||effect.delay>0||!effect.element) continue;
        const {x,z}=effect.mesh.position;
        if((x-player.x)**2+(z-player.z)**2>34**2) continue;
        const strength=effect.life/effect.max, radius=Math.min(8,effect.mesh.scale.x+(effect.element===5?2.1:1.0));
        const force=effect.element===5?1.6:effect.element===4?.68:effect.element===2?.14:.34;
        spell(x,z,radius,strength*force,effect.element,strength);
      }
    },
    barrier(player:T.Vector3,active:boolean){
      barrier.visible=active;
      if(active){barrier.position.copy(player);barrier.position.y+=.99;}
    },
    clear(){
      for(const pool of pools) for(const p of pool){p.life=0;p.mesh.visible=false;}
      for(const b of bolts){b.life=0;b.line.visible=false;}
      spellLight.intensity=0;
      for(const {mesh} of particleBatches) mesh.count=0;
      barrier.visible=false;
    },
    update(dt:number){
      time+=dt;glow.uniforms.clock.value=time;
      let strength=0;
      spellLight.intensity=0;
      for(const b of bolts){
        if(b.life<=0) continue;
        b.life=Math.max(0,b.life-dt);b.line.visible=b.life>0;
        const pulse=b.life/b.max*(.75+.25*Math.sin(time*109+b.seed));
        b.line.material.opacity=pulse;
        if(!b.ground&&pulse*1.5>strength){
          strength=pulse*1.5;
          spellLight.position.set(b.tx,b.ty+1.1,b.tz);
          spellLight.color.copy(b.line.material.color);spellLight.intensity=pulse*91;
        }
        for(let i=0;i<=8;i++){
          const t=i/8, envelope=Math.sin(t*Math.PI);
          const phase=i*13.4+b.seed+Math.floor(time*38)*2.1;
          const x=T.MathUtils.lerp(b.x,b.tx,t)+Math.sin(phase)*.63*envelope;
          const z=T.MathUtils.lerp(b.z,b.tz,t)+Math.cos(phase)*.63*envelope;
          const y=b.ground?surface(x,z)+.095+Math.abs(Math.sin(phase))*.125:
            T.MathUtils.lerp(b.y,b.ty,t)+Math.cos(phase*1.3)*.46*envelope;
          boltPath[i].set(x,y,z);
          if(i){
            const p=boltPath[i-1];
            b.vertices.setXYZ((i-1)*2,p.x,p.y,p.z);b.vertices.setXYZ((i-1)*2+1,x,y,z);
          }
        }
        for(let j=0;j<4;j++){
          const p=boltPath[j*2+1],q=boltPath[j*2+2],a=b.seed*2.398+j*2.7;
          const d=.31+Math.abs(Math.sin(a))*.74;
          const x=p.x+Math.sin(a)*d,z=p.z+Math.cos(a)*d;
          const y=b.ground?surface(x,z)+.19:q.y+Math.sin(a*2)*.64;
          const cx=(p.x+x)*.5+.17*Math.sin(a*3),cy=(p.y+y)*.5+.15,cz=(p.z+z)*.5;
          const ex=x+Math.cos(a)*d*.51,ez=z-Math.sin(a)*d*.51,k=16+j*6;
          b.vertices.setXYZ(k,p.x,p.y,p.z);
          b.vertices.setXYZ(k+1,cx,cy,cz);
          b.vertices.setXYZ(k+2,cx,cy,cz);
          b.vertices.setXYZ(k+3,x,y,z);
          b.vertices.setXYZ(k+4,x,y,z);
          b.vertices.setXYZ(k+5,ex,b.ground?surface(ex,ez)+.11:y-.28,ez);
        }
        b.vertices.needsUpdate=true;
      }
      for(const {mesh} of particleBatches) mesh.count=0;
      for(const pool of pools) for(const p of pool){
        if(p.life<=0) continue;
        if(p.delay>0){
          p.delay=Math.max(0,p.delay-dt);
          if(p.delay>0) continue;
        }
        p.life=Math.max(0,p.life-dt);
        const batched=p.shape==='spark'||p.shape==='crystal'||p.shape==='droplet';
        p.mesh.visible=!batched&&p.life>0;
        if(!p.life){
          if(p.shape==='crystal'&&p.max>2) scatter(p.mesh.position,0x92d4ef,3,.42,'crystal');
          continue;
        }
        p.mesh.position.x+=p.dx*dt;p.mesh.position.z+=p.dz*dt;p.mesh.position.y+=p.lift*dt;
        if(p.shape==='tendril') p.mesh.rotation.y+=dt*3.9;
        if(p.shape==='droplet') p.lift-=dt*9.6;
        if(p.element&&p.shape!=='scorch'){
          const light=p.life/p.max*p.opacity*(p.shape==='flame'?.9:p.shape==='vortex'?.8:p.shape==='frost'?.55:.42);
          if(light>strength){
            strength=light;spellLight.color.copy(p.tint);
            spellLight.position.copy(p.mesh.position);spellLight.position.y+=1.25;
            spellLight.intensity=light*45;
          }
        }
        const size=Math.min(p.limit,p.size+(p.max-p.life)*p.grow);
        const reveal=p.shape==='crystal'?T.MathUtils.smoothstep(p.max-p.life,0,Math.min(.38,p.max*.38)):1;
        p.mesh.scale.set(size,size*p.aspect*reveal,size);
        if(p.shape==='spark') p.mesh.rotation.z+=dt*4;
        if(p.shape==='spark'||p.shape==='crystal'||p.shape==='droplet'){
          const {mesh,colors}=particles[p.shape],index=mesh.count++;
          p.mesh.updateMatrix();
          mesh.setMatrixAt(index,p.mesh.matrix);
          colors.setXYZW(index,p.tint.r*.78+.22,p.tint.g*.78+.22,p.tint.b*.78+.22,
            p.opacity*T.MathUtils.smoothstep(p.life/p.max,0,.8));
        }
      }
      for(const {mesh,colors} of particleBatches) if(mesh.count){
        mesh.instanceMatrix.needsUpdate=true;
        colors.needsUpdate=true;
      }
    },
    dispose(){
      glow.dispose();veilMaterial.dispose();spellLight.removeFromParent();dome.dispose();particleMaterial.dispose();
      for(const {mesh} of particleBatches) mesh.dispose();
      for(const {line} of bolts){line.geometry.dispose();line.material.dispose();}
      for(const geometry of new Set(Object.values(geometries))) geometry.dispose();

    },
  };
}
