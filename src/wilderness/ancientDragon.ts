import * as T from 'three';
import { joint, loft, meshPart, rigidBatcher, type CreaturePose } from './creatureGeometry.ts';

type Profile=Parameters<typeof loft>[0];
type Vec=readonly [number,number,number];

export function dragonModels(){
  const resources:(T.Material|T.BufferGeometry)[]=[];
  const own=<R extends T.Material|T.BufferGeometry>(v:R)=>{resources.push(v);return v;};
  const mesh=(profile:Profile,sides=16)=>own(loft(profile,sides));
  const bodyProfile=[[-1.84,.24,-.24,.20],[-1.45,.52,-.46,.4],[-.94,.72,-.56,.67],[-.28,.76,-.67,.81],
    [.38,.87,-.68,.84],[.83,.80,-.52,.74],[1.22,.59,-.36,.46],[1.5,.39,-.28,.34]] as const;
  const neckProfile=[[-.24,.40,-.34,.37],[.03,.46,-.39,.43],[.46,.40,-.39,.38],[.82,.33,-.33,.30],[1.2,.28,-.30,.28]] as const;
  const throatProfile=[[-.16,.31,-.31,.25],[.1,.31,-.29,.27],[.43,.27,-.28,.25],[.85,.23,-.26,.24]] as const;
  const skullProfile=[[-.46,.24,-.24,.23],[-.25,.44,-.36,.45],[.08,.47,-.29,.48],[.35,.386,-.26,.34],
    [.66,.30,-.235,.26],[.94,.255,-.21,.13],[1.19,.20,-.17,.12],[1.30,.14,-.098,.08]] as const;
  const jawProfile=[[-.19,.21,-.05,.12],[.10,.37,-.16,.048],[.32,.335,-.15,.05],[.68,.287,-.126,.043],[1.08,.215,-.091,.034],[1.28,.166,-.05,.025]] as const;
  const tailProfile=(i:number)=>{const w=.355*Math.pow(.779,i),l=tailLength(i);
    return [[-l,w*.80,-w*.70,w*.64],[-l*.53,w*.92,-w*.85,w*.87],[.11,w*1.08,-w*.91,w]] as const;};
  const tailLength=(i:number)=>.89-i*.047;
  const tailGeo=Array.from({length:9},(_,i)=>mesh(tailProfile(i),12));
  const body=mesh(bodyProfile,24), neck=mesh(neckProfile,18), throat=mesh(throatProfile,18), skull=mesh(skullProfile,22), chin=mesh(jawProfile,18);
  const thigh=mesh([[-.12,.24,-.29,.24],[.16,.37,-.37,.37],[.51,.32,-.31,.32],[.86,.20,-.19,.20],[1.04,.147,-.16,.15]],15);
  const shin=mesh([[-.11,.135,-.16,.15],[.13,.19,-.22,.18],[.44,.12,-.14,.13],[.74,.09,-.10,.10]],12);
  const paw=mesh([[-.20,.12,-.10,.11],[.03,.20,-.113,.18],[.31,.27,-.113,.135],[.52,.24,-.09,.07]],13);
  const eye=own(new T.IcosahedronGeometry(1,1));
  const plate=own(new T.BufferGeometry());
  plate.setAttribute('position',new T.Float32BufferAttribute([0,.19,.55,-.42,0,.26,-.48,0,-.24,0,.045,-.56,.48,0,-.24,.42,0,.26,0,.12,.13],3));
  plate.setIndex([0,1,6,1,2,6,2,3,6,3,4,6,4,5,6,5,0,6,0,5,4,0,4,3,0,3,2,0,2,1]);plate.computeVertexNormals();
  function taper(points:readonly Vec[],start:number,end:number,steps:number,sides:number){
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    const frames=curve.computeFrenetFrames(steps,false), v:number[]=[], idx:number[]=[];
    for(let i=0;i<=steps;i++){
      const t=i/steps,p=curve.getPointAt(t), r=start*(1-t)**1.17+end*t;
      for(let j=0;j<sides;j++){
        const a=j*Math.PI*2/sides;
        v.push(...p.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r).toArray());
        if(i>0){
          const x=(i-1)*sides+j,y=(i-1)*sides+(j+1)%sides;
          idx.push(x,y,x+sides,y,y+sides,x+sides);
        }
      }
    }
    const geo=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(v,3));
    geo.setIndex(idx);geo.computeVertexNormals();
    return own(geo);
  }
  const horn=taper([[0,0,0],[.125,.36,-.23],[.38,.69,-.49],[.67,.96,-.57],[.82,1.26,-.47],[.81,1.47,-.34]],.18,.002,19,10);
  const tooth=taper([[0,0,0],[0,-.098,.011],[0,-.20,-.045],[0,-.25,-.09]],.064,.001,6,7);
  const claw=taper([[0,0,0],[0,-.047,.13],[0,-.14,.23],[0,-.20,.23]],.081,.001,8,8);
  const spine=taper([[0,0,0],[0,.21,-.08],[.017,.49,-.21],[.031,.61,-.40]],.139,.001,8,8);
  const scar=taper([[0,0,0],[.021,-.078,.11],[.015,-.11,.25],[.019,-.23,.35],[.01,-.31,.49]],.014,.005,10,5);
  const chestTile=mesh([[-.20,.40,-.029,.03],[-.09,.53,-.043,.065],[.07,.58,-.05,.058],[.25,.43,-.026,.038]],10);
  const stamp=new T.Object3D(), normal=new T.Vector3(), up=new T.Vector3(0,1,0);
  const tint=new T.Color();
  const batch=rigidBatcher();
  const wingSpan=3.18;
  const fingers=[[.55,.04,.03],[1.42,.16,-.35],[2.42,.16,-.84],[3.24,.085,-1.20],[2.99,-.045,-2.06],
    [2.37,-.10,-2.68],[1.39,-.18,-2.86],[.53,-.22,-2.66],[-.16,-.19,-2.26]] as const;
  const wingInner=[[0,.03,0],[1.19,.04,.14],[2.31,.075,.18],[wingSpan,.09,0],[wingSpan-.13,-.16,-2.06],[1.82,-.24,-2.02],[.55,-.21,-1.96],[-.12,-.12,-1.60]] as const;
  function sail(edge:readonly Vec[],detail:number){
    const radial=detail===1?3:12, span=detail===1?2:6;
    const position:number[]=[],uv:number[]=[],indices:number[]=[];
    for(let fan=0;fan<edge.length-1;fan++){
      const a=edge[fan],b=edge[fan+1], offset=position.length/3;
      for(let i=0;i<=radial;i++) for(let j=0;j<=span;j++){
        const r=i/radial,t=j/span, gather=Math.sin(t*Math.PI), scallop=1-.12*r**4*gather;
        const x=T.MathUtils.lerp(a[0],b[0],t),y=T.MathUtils.lerp(a[1],b[1],t),z=T.MathUtils.lerp(a[2],b[2],t);
        position.push(x*r*scallop,y*r+.25*Math.sin(r*Math.PI)*gather+.035*Math.sin(t*8*Math.PI)*r,-.026*Math.sin(fan+r*6)+z*r*scallop);
        uv.push((fan+t)/(edge.length-1),r);
        if(i&&j){
          const n=offset+i*(span+1)+j;
          indices.push(n-span-2,n-1,n,n-span-2,n,n-span-1);
        }
      }
    }
    const g=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(position,3)).setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    g.setIndex(indices);g.computeVertexNormals();return own(g);
  }
  const wingGeo=[wingInner,fingers].map(edge=>[sail(edge,2),sail(edge,1)]);
  const wingSpars=[wingInner,fingers].map((edge,section)=>edge.map(([x,y,z],i)=>
    taper([[0,0,0],[x*.29,y*.25+.05,z*.30],[x*.66,y*.76+.035,z*.68],[x,y,z]],
      section===0&&i===3?.18:i===3?.115:.052,.007,13,7)));
  const smokeGeo=own(new T.PlaneGeometry(1,1));
  const smokeMat=own(new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,
    uniforms:{clock:{value:0}},vertexShader:`varying vec2 v;void main(){v=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 v;uniform float clock;void main(){float r=length(v);float n=.55+.45*sin(v.x*12.+v.y*10.+clock*2.+sin(v.y*9.));
      gl_FragColor=vec4(.035,.075,.14,(1.-smoothstep(.05,1.,r))*n*.52);}`}));
  function palette(spectral:boolean){
    const hide=own(new T.MeshStandardMaterial({color:spectral?0x111524:0x342b31,roughness:.87,metalness:.14,flatShading:true}));
    const armor=own(new T.MeshStandardMaterial({color:spectral?0x28303e:0x55454a,roughness:.80,metalness:.23,flatShading:true}));
    const scales=own(new T.MeshStandardMaterial({color:spectral?0x283647:0x51424c,roughness:.70,metalness:.25,flatShading:true}));
    const bone=own(new T.MeshStandardMaterial({color:spectral?0x101e29:0x9c8571,roughness:.61,flatShading:true}));
    const keratin=own(new T.MeshStandardMaterial({color:spectral?0x202d44:0x4e4145,roughness:.71,metalness:.21}));
    const eyeGlow=own(new T.MeshStandardMaterial({color:spectral?0x9af6ff:0xffdf94,emissive:spectral?0x43daff:0xff7426,emissiveIntensity:2.4}));
    const cracks=own(new T.MeshStandardMaterial({color:spectral?0x2d8bbc:0x732d23,emissive:spectral?0x1975bd:0xff3f14,emissiveIntensity:spectral?1.8:.31}));
    const pupil=own(new T.MeshBasicMaterial({color:0x0d0a15}));
    const membrane=own(new T.MeshStandardMaterial({color:spectral?0x1a4569:0x5e2634,roughness:.89,side:T.DoubleSide,
      transparent:spectral,opacity:spectral?.78:1,depthWrite:true,emissive:spectral?0x072747:0x210611,emissiveIntensity:.57}));
    if(spectral) for(const material of [hide,scales,armor,keratin]){
      material.customProgramCacheKey=()=> 'vonkje-dragon-spectral-rim';
      material.onBeforeCompile=shader=>{
        shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
          float spectralEdge=pow(1.-abs(dot(normalize(vViewPosition),normal)),3.4);
          totalEmissiveRadiance+=vec3(.016,.13,.38)*(.11+spectralEdge*.56);`);
      };
    }
    const heat={value:spectral?1:0};
    membrane.customProgramCacheKey=()=> 'vonkje-dragon-membrane';
    membrane.onBeforeCompile=shader=>{
      shader.uniforms.molten=heat;
      shader.vertexShader='varying vec2 membraneUV;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nmembraneUV=uv;');
      shader.fragmentShader='varying vec2 membraneUV;uniform float molten;\n'+shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        float vein=pow(.5+.5*cos(membraneUV.x*168.+sin(membraneUV.y*21.)*.96),16.);
        float fibers=.6+.4*sin(membraneUV.y*84.+membraneUV.x*33.);
        diffuseColor.rgb*=.51+fibers*.3+vein*.23;
        totalEmissiveRadiance+=emissive*(vein*.7+molten*.44); `);
    };
    return {hide,armor,scales,bone,keratin,eyeGlow,cracks,pupil,membrane,heat};
  }
  const palettes=[palette(false),palette(true)];
  function levelScales(part:T.Group,profile:Profile,rows:number,around:number,material:T.Material,size:number){
    const shell=new T.InstancedMesh(plate,material,rows*around);
    let n=0;
    for(let row=0;row<rows;row++){
      const u=(row+.60)/rows*(profile.length-1),i=Math.floor(u),t=u-i;
      const [az,aw,ab,at]=profile[i], [bz,bw,bb,bt]=profile[i+1];
      const w=T.MathUtils.lerp(aw,bw,t),b=T.MathUtils.lerp(ab,bb,t),h=T.MathUtils.lerp(at,bt,t);
      const z=T.MathUtils.lerp(az,bz,t);
      for(let j=0;j<around;j++){
        const a=(j+.50*(row%2))/around*2*Math.PI;
        if(Math.sin(a)<-.44) continue;
        normal.set(Math.cos(a),Math.sin(a),.11).normalize();
        stamp.position.set(w*Math.cos(a), (h+b)*.5+(h-b)*.5*Math.sin(a),z);
        stamp.quaternion.setFromUnitVectors(up,normal);
        stamp.rotateY(.10*Math.sin(j*2.4+row));
        const r=size*(.79+.28*Math.sin(row*1.23+j*.81)**2);
        stamp.scale.set(r,r*.53,r*1.38);stamp.updateMatrix();
        shell.setMatrixAt(n,stamp.matrix);
        shell.setColorAt(n++,tint.setScalar(.56+.44*Math.sin(row*1.91+j*2.31)**2));
      }
    }
    shell.count=n;shell.castShadow=false;shell.receiveShadow=true;shell.computeBoundingSphere();part.add(shell);
    return shell;
  }

  function makeDragon(spectral=false){
    const m=palettes[Number(spectral)], root=new T.Group();
    const chest=joint(root,0,1.73,-.39), neckBase=joint(chest,0,.34,1.14), neckTop=joint(neckBase,0,0,1.03);
    const head=joint(neckTop,0,.06,.72), jaw=joint(head,0,-.246,.06);
    const landmarkScales=[
      levelScales(chest,bodyProfile,22,30,m.scales,.15),
      levelScales(neckBase,neckProfile,11,22,m.scales,.13),
      levelScales(neckTop,throatProfile,9,19,m.scales,.112),
      levelScales(head,skullProfile,13,24,m.scales,.082),
    ];
    meshPart(chest,body,m.hide);
    meshPart(neckBase,neck,m.hide);meshPart(neckTop,throat,m.hide);meshPart(head,skull,m.hide);
    meshPart(jaw,chin,m.armor);
    for(let i=0;i<12;i++){
      const part=i<6?chest:i<9?neckBase:neckTop;
      const z=i<6?-.59+i*.27:i<9?(i-6)*.32:(i-9)*.30;
      const armor=meshPart(part,chestTile,m.armor,0,i<6?-.59:-.31,z);
      armor.scale.set(i<6?1.14:.60,1.22,1);
      armor.rotation.x=i<6?.19:.11;
    }
    const cracks:T.Mesh[]=[];
    for(let i=0;i<13;i++){
      const z=-1.56+i*.231;
      const spike=meshPart(chest,spine,m.keratin,0,.37+.45*Math.sin(i/15*Math.PI),z);
      spike.scale.setScalar(.54+(i%5)*.09);
    }
    for(const [part,count,base] of [[neckBase,5,.40],[neckTop,3,.25],[head,2,.44]] as const)
      for(let i=0;i<count;i++) meshPart(part,spine,m.bone,0,base-i*.014,.13+i*.21).scale.setScalar(.39-i*.037);
    for(const side of [-1,1]){
      const h=meshPart(head,horn,m.bone,side*.28,.29,-.26);
      h.scale.x=side;
      const brow=meshPart(head,plate,m.armor,side*.408,.19,.30);
      brow.scale.set(.51,.69,.75);brow.rotation.set(.17,0,-side*1.12);
      const e=meshPart(head,eye,m.eyeGlow,side*.433,.117,.335);
      e.scale.set(.047,.077,.129);e.rotation.y=side*.27;
      const iris=meshPart(head,eye,m.pupil,side*.469,.123,.368);
      iris.scale.set(.018,.056,.021);iris.castShadow=false;
      for(let i=0;i<10;i++){
        const blend=i/9,z=.22+blend*.98,x=side*(.30-.12*blend);
        const upper=meshPart(head,tooth,m.bone,x,-.16+blend*.028,z);
        upper.scale.setScalar((i===1?1.2:.91)-blend*.38);
        const lower=meshPart(jaw,tooth,m.bone,x*.93,.048,z-.03);
        lower.rotation.z=Math.PI;lower.scale.setScalar((i===3?.81:.66)-blend*.23);
      }
      for(let i=0;i<3;i++){
        const spur=meshPart(head,spine,m.keratin,side*(.32+i*.032),-.034+i*.072,-.22-i*.087);
        spur.rotation.z=-side*1.15;spur.scale.setScalar(.77-i*.10);
      }
      for(let i=0;i<4;i++){
        const burn=meshPart(chest,scar,m.cracks,side*(.58+i*.052),.22-i*.16,.16+i*.19);
        burn.rotation.x=-.47;burn.scale.set(.85,1.24,1.48);cracks.push(burn);
      }
      const scarLine=meshPart(head,scar,side>0?m.cracks:m.keratin,side*.47,.20,.07);
      scarLine.rotation.y=-side*.27;scarLine.scale.set(1,1.34,1.08);cracks.push(scarLine);
      for(let i=0;i<4;i++){
        const l=meshPart(neckBase,scar,m.cracks,side*(.35-i*.032),.10-i*.081,.24+i*.14);
        l.rotation.x=-.54;cracks.push(l);
      }
    }
    const tail:T.Group[]=[];
    for(let i=0;i<tailGeo.length;i++){
      const a=joint(tail.at(-1)??chest,0,i?0:-.10,i?-tailLength(i-1):-1.48);
      meshPart(a,tailGeo[i],m.hide);
      const size=.16*Math.pow(.89,i);
      landmarkScales.push(levelScales(a,tailProfile(i),4,12,m.scales,size));
      meshPart(a,spine,m.keratin,0,.335*Math.pow(.79,i),-.14).scale.setScalar(.75*Math.pow(.87,i));
      tail.push(a);
    }
    const wings=[-1,1].map(side=>{
      const hinge=joint(chest,side*.62,.53,.53), wrist=joint(hinge,wingSpan,.09,0);
      hinge.scale.x=side;
      const sails=[hinge,wrist].map((part,i)=>meshPart(part,wingGeo[i][0],m.membrane));
      for(const [i,part] of [hinge,wrist].entries()) for(const spar of wingSpars[i]) meshPart(part,spar,m.keratin);
      const wingClaw=meshPart(wrist,claw,m.bone,.09,.071,.01);wingClaw.rotation.y=-.79;wingClaw.scale.setScalar(1.77);
      return {hinge,wrist,side,sails};
    });
    const limbs=[[-1,.76],[1,.76],[-1,-1.08],[1,-1.08]].map(([side,z],i)=>{
      const hind=i>1,upper=joint(chest,side*(hind?.53:.61),-.24,z), knee=joint(upper,0,-.77,hind?-.16:.09),
        ankle=joint(knee,0,-.66,.11);
      const upperMesh=meshPart(upper,thigh,m.hide);upperMesh.rotation.x=Math.PI/2;upperMesh.scale.setScalar(hind?1.12:.94);
      const shinMesh=meshPart(knee,shin,m.armor);shinMesh.rotation.x=Math.PI/2;
      meshPart(ankle,paw,m.hide);
      for(let j=0;j<4;j++){
        const tip=meshPart(ankle,claw,m.bone,(j-1.5)*.133,-.065,.437+.035*Math.sin(j));
        tip.rotation.y=(j-1.5)*.14;
        if(spectral){
          const glow=meshPart(ankle,claw,m.cracks,tip.position.x,-.060,.425);
          glow.rotation.y=tip.rotation.y;glow.scale.set(.62,.62,.88);
        }
      }
      return {upper,knee,ankle,hind};
    });
    const wisps=spectral?Array.from({length:7},()=>{
      const m=meshPart(chest,smokeGeo,smokeMat);m.castShadow=false;return m;
    }):[];
    batch.bake(root);
    return {root,animate(p:CreaturePose){
      const t=p.time, flight=p.leap, prep=p.windup, strike=p.recovery, stage=p.stage??1;
      const down=T.MathUtils.smoothstep(p.dead,0,1);
      const air=p.flight??0, dive=p.technique==='dive', landing=p.technique==='land';
      const breath=p.technique==='breath'||p.technique==='inferno'||p.technique==='shadowBreath'||p.technique==='shadowFireball';
      const clawing=p.technique==='claw'||p.technique==='fury';
      const stomp=p.technique==='stomp'||p.technique==='rings'||p.technique==='wingShock';
      const sweep=p.technique==='tail';
      const roar=p.technique==='roar'||p.technique==='air'||p.technique==='meteor';
      const detail=(p.distance??0)<(spectral?13:26);
      const beat=Math.sin(t*(stage===3?8.9:7.1));
      chest.scale.set(1+.024*Math.sin(t*2.1),1+.025*Math.sin(t*2.1),1);
      chest.position.y=1.73+.058*Math.sin(t*2.1)+.088*p.gait*Math.cos(p.phase*2)-down*1.29;
      chest.rotation.x=-.16*flight+(dive?.46:0)*flight-(stomp?.27:.11)*prep+.21*strike+.12*p.hit;
      chest.rotation.z=down*.93+p.hit*.13+(clawing?.34*strike:0)+(landing?.15*strike:0);
      chest.rotation.y=sweep?(prep*.41-strike*.58):0;
      neckBase.rotation.set(-.38*prep+(breath?.26:.14)*strike-.11*flight+.066*Math.sin(t*1.54),p.turn??0,0);
      neckBase.rotation.y*=.30;
      neckTop.rotation.set((breath||roar?-.45:-.21)*prep+.36*strike,.08*Math.sin(t*1.17)+(p.turn??0)*.18+p.hit*.24,0);
      head.rotation.set(-.28*prep+(breath?.23:.33)*strike,.08*Math.sin(t*1.32)-p.hit*.19,.053*Math.sin(t*1.51));
      jaw.rotation.x=.05+(breath||roar?.96:.49)*prep+(breath?.77:.34)*strike+.18*flight+down*.21;
      for(const [i,part] of tail.entries()){
        part.rotation.x=.023+Math.sin(t*2.12-i*.54)*(.055+.07*p.gait)+flight*.09-down*.11;
        part.rotation.y=Math.sin(t*1.95-i*.62)*(.086+.066*p.gait)+(p.turn??0)*.155+
          (sweep?(.49*prep-1.23*strike)*Math.sin((i+2)/11*Math.PI):0);
      }
      for(const {hinge,wrist,side,sails} of wings){
        const spread=Math.max(flight,roar?prep*.78:0,stomp?prep*.45:0,landing?strike*.78:0);
        const flap=flight*(beat*.59)+(landing?-strike*.30:0);
        hinge.rotation.set(-.12-.19*flight,side*(.85-.94*spread),side*(-.50+spread*.67+flap-down*.19));
        wrist.rotation.set(-.22+spread*.36,side*(.70-.74*spread),side*(.34-.51*spread-flap*.81));
        sails.forEach((sail,i)=>{sail.geometry=wingGeo[i][detail?0:1];});
      }
      limbs.forEach(({upper,knee,ankle,hind},i)=>{
        const phase=p.phase+(i%2)*Math.PI+(hind?.88:0), step=Math.sin(phase);
        const rake=clawing&&i%2===0?-.73*prep-.69*strike:0;
        upper.rotation.set(step*p.gait*.51-flight*.56+down*.51+rake-(stomp&&!hind?.59*prep:0),0,(i%2?1:-1)*(.14+.44*flight));
        knee.rotation.x=-Math.max(0,-step)*p.gait*.61+flight*.92+.12*prep;
        ankle.rotation.x=-step*p.gait*.26-flight*.48+(landing||stomp?.39*strike:0);
      });
      m.heat.value=stage===3?1:spectral?.7:0;
      m.cracks.emissiveIntensity=spectral?1.4+Math.sin(t*5)*.49:stage===3?1.73+Math.sin(t*8)*.56:stage===2?.61:.27;
      landmarkScales.forEach(scale=>{scale.visible=detail;});
      cracks.forEach((crack,i)=>{crack.visible=i%2===0||detail;});
      smokeMat.uniforms.clock.value=t;
      wisps.forEach((w,i)=>{
        const a=(i*.39+t*.42)%1;
        w.position.set(Math.sin(i*2.39+t*.8)*(.45+a),.12+a*.83,Math.cos(i*2.39+t*.74)*1.09);
        w.rotation.set(.28+i*.36,t*.8+i,.18+i);
        w.scale.setScalar((.69+a*.80)*Math.sin(Math.PI*a));
        w.visible=detail&&down<.7&&air<.85;
      });
    }};
  }

  return {makeDragon,dispose(){batch.dispose();resources.forEach(resource=>resource.dispose());}};
}
