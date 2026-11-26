import { dragonHollow } from './dragonHollow.ts';
import * as T from 'three';
import { fracturedRock, weatherStone } from './rockDetail.ts';
import { bossCaves, caveAt, caveExit, caveLootLabel, caveWalkable } from './bossCaves.ts';
import { height, randomSequence } from './layout.ts';
import { loft, meshPart, rigidBatcher, shapedPlate } from './creatureGeometry.ts';

export function caveScenery(scene:T.Scene,obstacles:{x:number;z:number;r:number}[]){
  const slab=fracturedRock(396,'pillar').scale(1,.84,1);
  const stone=new T.MeshStandardMaterial({color:0x5f5b61,roughness:.94,flatShading:true});
  const bog=new T.MeshStandardMaterial({color:0x3c6356,roughness:.84,metalness:.14});
  const mushroom=new T.SphereGeometry(1,8,4,0,Math.PI*2,0,Math.PI/2);
  const basalt=new T.MeshStandardMaterial({color:0x43414f,roughness:.95});
  const frozen=new T.MeshStandardMaterial({color:0x647d91,metalness:.29,roughness:.39});
  const voidMaterial=new T.MeshBasicMaterial({color:0x080714});
  const amber=new T.MeshBasicMaterial({color:0xffa86d,toneMapped:false});
  const blue=new T.MeshBasicMaterial({color:0x8edafa,toneMapped:false});
  const crystal=new T.MeshStandardMaterial({color:0x669bdb,emissive:0x33639b,emissiveIntensity:.68,metalness:.27,roughness:.42});
  const timber=new T.MeshStandardMaterial({color:0x44352e,roughness:.98});
  const tile=new T.BoxGeometry(1,1,1);
  const crystalForm=loft([[0,.095,-.11,.11],[.25,.24,-.22,.24],[.81,.20,-.15,.14],[1.32,.04,-.039,.035],[1.47,.002,-.003,.003]],6).rotateX(-Math.PI/2);
  const arch=shapedPlate([[-2.0,0],[2.0,0],[1.94,1.7],[1.48,2.75],[.77,3.35],[-.8,3.42],[-1.67,2.59],[-2.0,1.67]],.12,.035);
  const rune=shapedPlate([[0,.37],[-.10,.10],[-.31,.039],[-.08,-.065],[-.015,-.35],[.062,-.035],[.29,.064],[.074,.13]],.015,.008);
  const ring=new T.RingGeometry(.92,1.02,32).rotateX(-Math.PI/2);
  const bone=new T.MeshStandardMaterial({color:0xc0b196,roughness:.88});
  const brass=new T.MeshStandardMaterial({color:0xbd9655,metalness:.53,roughness:.52});
  const rockGlow=new T.MeshStandardMaterial({color:0x352636,emissive:0x5b2818,emissiveIntensity:.23,roughness:.78});
  for(const material of [stone,basalt,rockGlow,bog,frozen]) weatherStone(material,material===bog?.86:material===stone?.38:.14);
  const pillar=loft([[-.08,.63,-.61,.62],[.36,.62,-.61,.62],[.48,.47,-.47,.48],[3.15,.45,-.47,.45],[3.32,.66,-.61,.62],[3.67,.67,-.62,.63]],8).rotateX(-Math.PI/2);
  const bones=loft([[-.48,.11,-.10,.13],[-.33,.09,-.081,.085],[-.20,.046,-.055,.051],[.27,.047,-.051,.052],[.43,.12,-.09,.12],[.54,.093,-.08,.094]],7);
  const sword=shapedPlate([[-.055,0],[.065,0],[.071,.57],[.021,.75],[-.081,.55]],.044,.015);
  const sarcophagus=loft([[-1.04,.30,-.09,.20],[-.84,.43,-.12,.34],[.63,.45,-.14,.31],[.89,.32,-.08,.18]],8);
  const coin=new T.CylinderGeometry(.197,.21,.044,8);
  const floorSeal=new T.RingGeometry(.97,1,50).rotateX(-Math.PI/2);
  const mistGeo=new T.PlaneGeometry(2,2).rotateX(-Math.PI/2);
  const mistMat=new T.ShaderMaterial({
    transparent:true,depthWrite:false,uniforms:{time:{value:0}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float time;varying vec2 vUv;void main(){
      vec2 q=vUv*2.-1.;float edge=max(1.-length(q),0.);
      float veil=.60+.22*sin(q.x*11.+q.y*9.+time*1.2)+.17*cos(q.x*18.-time*1.6);
      gl_FragColor=vec4(.31,.53,.72,edge*veil*.54);
      #include <colorspace_fragment>
    }`,
  });
  const lavaMat=new T.ShaderMaterial({transparent:true,uniforms:{time:{value:0}},vertexShader:`
    varying vec2 tex;void main(){tex=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
  `,fragmentShader:`
    uniform float time; varying vec2 tex;
    void main(){
      vec2 p=(tex*2.-1.); if(length(p)>1.) discard;
      float wave=sin(p.x*8.+sin(p.y*13.-time)*1.46-time*1.26);
      float cracks=1.-smoothstep(.041,.32,abs(wave));
      gl_FragColor=vec4(mix(vec3(.13,.025,.016),vec3(1.,.32,.05),.19+.80*cracks),1.);
      #include <colorspace_fragment>
    }`
  });
  const labelTextures:T.CanvasTexture[]=[], labelMaterials:T.SpriteMaterial[]=[];
  const dust=new T.OctahedronGeometry(.08);
  const stamp=new T.Object3D(), tint=new T.Color(), random=randomSequence(1023), batch=rigidBatcher();
  const arenaProps:{x:number;z:number;r:number}[]=[];
  const views=bossCaves.map(cave=>{
    const ice=cave.kind==='frostGuardian',crypt=cave.kind==='skeletonKing',arcane=cave.kind==='darkArchmage'||cave.kind==='cursedWarlord';
    const troll=cave.kind==='trollKing', venom=cave.kind==='venomQueen';
    const volcanic=cave.kind==='infernalGolem'||cave.kind==='ancientDragon',dragon=cave.kind==='ancientDragon';
    const light=ice?blue:cave.kind==='warlord'?amber:new T.MeshBasicMaterial({color:cave.color,toneMapped:false});
    const ground=venom?bog:ice?frozen:crypt||troll?stone:volcanic?rockGlow:basalt;
    let sign:T.Sprite|undefined;
    const floats:T.Mesh[]=[], entryMotes=new T.InstancedMesh(dust,light,12);
    entryMotes.instanceMatrix.setUsage(T.DynamicDrawUsage);entryMotes.frustumCulled=false;
    const entry=new T.Group(), arena=new T.Group();
    const at=height(cave.x,cave.z);
    entry.position.set(cave.x,at,cave.z-1.35);
    for(const [x,y,z,w,h,d] of [[-3.04,1.14,-.87,2.19,2.37,2.78],[3.04,1.28,-1.02,2.18,2.68,2.43],
      [-1.72,2.90,-1.12,1.92,1.47,2.54],[.26,3.45,-1.90,2.94,1.54,2.84],[2.16,3,-1.55,1.68,1.53,2.35],
      [0,2.27,-3.96,4.27,2.93,2.76],[-3.94,.52,-1.37,1.31,1.41,1.74],[4.02,.42,-1.19,1.39,1.32,1.71]]){
      const rock=meshPart(entry,slab,ground,x,y,z);rock.scale.set(w,h,d);rock.rotation.set(x*.19,z*.37,-x*.28);
    }
    meshPart(entry,arch,voidMaterial,0,.014,-1.48);
    for(const side of [-1,1]){
      const marker=meshPart(entry,slab,stone,side*2.53,.57,1.36);
      marker.scale.set(.48,1.04,.38);marker.rotation.z=side*.09;
      meshPart(entry,rune,light,side*2.53,.83,1.68).scale.setScalar(.66);
      obstacles.push({x:cave.x+side*2.53,z:cave.z+.01,r:.47});
    }
    meshPart(entry,rune,light,0,3.38,.24);
    meshPart(entry,ring,light,0,.039,1.47).scale.setScalar(1.42);
    obstacles.push({x:cave.x,z:cave.z-4.25,r:2.45},
      {x:cave.x-3.1,z:cave.z-2.2,r:1.63},{x:cave.x+3.1,z:cave.z-2.2,r:1.63});
    if(typeof document!=='undefined'){
      const label=document.createElement('canvas');label.width=640;label.height=132;const ctx=label.getContext('2d');
      if(ctx){
        ctx.fillStyle='#100e1c';ctx.fillRect(17,12,606,108);
        ctx.strokeStyle='#d6b980';ctx.lineWidth=3;ctx.strokeRect(17,12,606,108);
        ctx.textAlign='center';ctx.fillStyle='#fff0d2';ctx.font='bold 37px serif';ctx.fillText(cave.boss,320,56);
        ctx.fillStyle='#d6c6b5';ctx.font='24px sans-serif';ctx.fillText('Lv '+cave.recommended+' recommended · Rank '+cave.rank+' · '+caveLootLabel(cave)+' loot',320,93);
        const texture=new T.CanvasTexture(label);texture.colorSpace=T.SRGBColorSpace;labelTextures.push(texture);
        const material=new T.SpriteMaterial({map:texture,depthWrite:false,transparent:true});labelMaterials.push(material);
        const sprite=new T.Sprite(material);
        sprite.position.set(0,5.29,1.36);sprite.scale.set(9.3,1.91,1);entry.add(sprite);sign=sprite;
      }
    }
    for(const side of [-1,1]){
      if(ice||arcane||volcanic){
        for(let i=0;i<4;i++){
          const gem=meshPart(entry,crystalForm,ice||arcane?crystal:light,side*(2.92+i*.38),.10,.62+(i%2)*.50);
          gem.scale.set(.64,.66+i*.36,.62);gem.rotation.z=side*(.19+i*.11);
        }
      }else{
        const crest=meshPart(entry,crypt?sarcophagus:pillar,crypt?stone:timber,side*3.8,.02,.38);
        crest.scale.set(.48,crypt?.8:.63,.66);
        for(let i=0;i<3;i++) meshPart(entry,bones,bone,side*(2.92+i*.26),.07,1.10+i*.21).rotation.y=i*.79;
      }
    }
    batch.bake(entry);entry.add(entryMotes);scene.add(entry);

    const grid=[] as [number,number][];
    for(let x=-Math.ceil(cave.width/2)*2;x<=cave.width;x+=2) for(let z=-Math.ceil(cave.depth/2)*2;z<=cave.depth;z+=2)
      if(caveWalkable(x,cave.arena+z)) grid.push([x,z]);
    const tiles=new T.InstancedMesh(tile,ground,grid.length);
    grid.forEach(([x,z],i)=>{
      stamp.position.set(x,-.19,cave.arena+z);stamp.scale.set(2.04,.36,2.04);stamp.rotation.set(0,0,0);
      stamp.updateMatrix();tiles.setMatrixAt(i,stamp.matrix);
      tint.setHSL(venom?.43+random()*.08:ice?.55+random()*.065:volcanic?.02+random()*.04:crypt?.14+random()*.02:.69+random()*.043,ice||volcanic?.24:.10,.48+random()*.20);
      tiles.setColorAt(i,tint);
    });
    tiles.receiveShadow=true;tiles.computeBoundingSphere();arena.add(tiles);
    for(let i=0;i<(dragon?0:52);i++){
      const angle=i*Math.PI*2/52,r=1+(i%3)*.014;
      const x=Math.sin(angle)*cave.width*r,z=cave.arena+Math.cos(angle)*cave.depth*r;
      const rock=meshPart(arena,slab,ground,x,.79+random()*.8,z);
      rock.scale.set(1.26+random()*1.28,3.1+random()*2.9,1.52+random()*1.19);
      rock.rotation.set(random()*.32,angle,i*.392);
      if(i%3===0){
        if(ice){
          for(let j=0;j<4;j++){
            const mesh=meshPart(arena,crystalForm,crystal,x*.86+(j-1.5)*.28,.04,cave.arena+(z-cave.arena)*.86);
            mesh.rotation.set(j*.31,angle,-.47+j*.26);mesh.scale.set(.90+j*.17,1+j*.49,1);
          }
        }else if(crypt||arcane||dragon){
          const col=meshPart(arena,pillar,stone,x*.88,.03,cave.arena+(z-cave.arena)*.88);
          col.rotation.set(i%4===0?.18:0,angle,i%5===0?.21:0);
          col.scale.y=.72+(i%3)*.27;
          if(i%2===0) meshPart(arena,rune,light,col.position.x,2.1,col.position.z+.43);
        }else{
          const banner=meshPart(arena,tile,timber,x*.94,1.01,cave.arena+(z-cave.arena)*.94);
          banner.scale.set(.51,1.91,.37);banner.rotation.y=angle;
          const pole=meshPart(arena,crystalForm,light,banner.position.x,1.96,banner.position.z);
          pole.scale.set(.45,.64,.45);
        }
      }
    }
    for(const r of dragon?[]:ice?[3.62,6.42,10.1]:[4.2,9.9]){
      meshPart(arena,ring,light,0,.044,cave.arena-1).scale.setScalar(r);
    }
    for(const side of [-1,1]){
      for(let i=0;i<7;i++){
        const x=side*(cave.width*.67+(i%2)*1.45),z=cave.arena-10+i*3.20;
        if(venom){
          for(let n=0;n<5;n++){
            const xx=x+Math.cos(n*2.4)*1.83,zz=z+Math.sin(n*2.4)*1.25,h=.24+random()*.64;
            meshPart(arena,pillar,timber,xx,.01,zz).scale.set(.12,h*.28,.12);
            meshPart(arena,mushroom,light,xx,h,zz).scale.set(h*.7,h*.38,h*.62);
          }
        }else if(crypt){
          arenaProps.push({x,z,r:.83});
          meshPart(arena,sarcophagus,stone,x,.35,z).rotation.y=.41*side;
          meshPart(arena,rune,brass,x,.64,z).rotation.x=-Math.PI/2;
          for(const offset of [-.57,.64]){
            const candle=meshPart(arena,coin,bone,x+offset,.15,z+.87);
            candle.scale.set(.26,6.5,.26);
            meshPart(arena,crystalForm,amber,x+offset,.31,z+.87).scale.setScalar(.19);
          }
        }else if(arcane){
          arenaProps.push({x,z,r:.61});
          const pedestal=meshPart(arena,pillar,stone,x,.01,z);pedestal.scale.y=.30;
          const gem=meshPart(arena,crystalForm,crystal,x,1.57,z);gem.scale.setScalar(1.1+(i%3)*.25);
          floats.push(gem);
          meshPart(arena,floorSeal,light,x,.029,z).scale.setScalar(1.34);
        }else if(cave.kind==='warlord'||troll){
          for(let k=0;k<4;k++){
            const fragment=meshPart(arena,bones,bone,x+(k%2)*.73,.076,z+k*.26);
            fragment.rotation.y=i+k*2.399;
          }
          if(troll){
            meshPart(arena,slab,stone,x,.76,z).scale.set(.65,1.21,.8);
            meshPart(arena,crystalForm,light,x,.33,z+.15).scale.setScalar(.48);
          }else if(cave.kind==='warlord'){
            arenaProps.push({x,z:z-.62,r:.83});
            meshPart(arena,sword,brass,x+.52,.28,z+.28).rotation.set(.8,i,-.34);
            for(let k=0;k<4;k++){
              const stake=meshPart(arena,pillar,timber,x+(k-1.6)*.49,.014,z-.62);
              stake.rotation.set(.34,0,k*.037);stake.scale.set(.25,.42+(k%2)*.11,.29);
            }
          }
        }
      }
      if(volcanic&&!dragon){
        const liquid=meshPart(arena,mistGeo,lavaMat,side*cave.width*.79,.023,cave.arena+3.7);
        liquid.scale.set(cave.width*.18,1,cave.depth*.48);liquid.castShadow=false;
      }
      if(ice||venom){
        const haze=meshPart(arena,mistGeo,mistMat,side*7.9,.27,cave.arena+1.9);
        haze.scale.set(8.2,1,8.6);haze.castShadow=false;
      }
    }
    if(crypt||arcane){
      for(const r of [2.85,5.84,11.25]) meshPart(arena,floorSeal,light,0,.038,cave.arena-1).scale.setScalar(r);
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6;
        const glyph=meshPart(arena,rune,light,Math.cos(a)*5.86,.062,cave.arena-1+Math.sin(a)*5.86);
        glyph.rotation.set(-Math.PI/2,0,a);glyph.scale.setScalar(1.42);
      }
    }
    const exit=caveExit(cave);
    meshPart(arena,arch,stone,0,0,exit.z+1.39).scale.set(.74,.80,1);
    meshPart(arena,arch,voidMaterial,0,.026,exit.z+1.34).scale.set(.66,.75,1);
    meshPart(arena,rune,light,0,1.41,exit.z+1.24);
    const motes=new T.InstancedMesh(dust,light,26);
    motes.instanceMatrix.setUsage(T.DynamicDrawUsage);motes.frustumCulled=false;
    arena.remove(...floats);batch.bake(arena);arena.add(motes,...floats);arena.visible=false;scene.add(arena);
    const hollow=dragon?dragonHollow(cave.arena,cave.width,cave.depth):undefined;
    if(hollow) scene.add(hollow.root);
    return {cave,entry,arena,motes,entryMotes,floats,sign,hollow};
  });
  const roomLight=new T.PointLight(0x9ad6ff,36,35,2);
  roomLight.visible=false;scene.add(roomLight);
  return {
    blocked:(x:number,z:number)=>arenaProps.some(prop=>Math.abs(prop.z-z)<1.3&&Math.hypot(x-prop.x,z-prop.z)<prop.r),
    update(time:number,p:T.Vector3){
      const inside=caveAt(p.z);
      mistMat.uniforms.time.value=lavaMat.uniforms.time.value=time;
      roomLight.visible=!!inside;
      if(inside){
        roomLight.color.setHex(inside.color);
        roomLight.intensity=37+Math.sin(time*2.3)*3.0+Math.cos(time*4.05)*1.4;
        roomLight.position.set(0,6,inside.arena+3);
      }
      for(const {cave,entry,arena,motes,entryMotes,floats,sign,hollow} of views){
        const proximity=Math.hypot(p.x-cave.x,p.z-cave.z);
        entry.visible=!inside&&proximity<98;
        if(sign) sign.visible=proximity<32;
        arena.visible=inside===cave;hollow?.update(time,arena.visible);
        if(entry.visible){
          entryMotes.visible=Math.hypot(p.x-cave.x,p.z-cave.z)<36;
          if(entryMotes.visible) for(let i=0;i<entryMotes.count;i++){
            const life=(i*.183+time*.38)%1,a=i*2.399+time*.82;
            stamp.position.set(Math.sin(a)*2.15,.24+life*3.28,1.38+Math.cos(a)*1.05);
            stamp.rotation.set(a,life,i);stamp.scale.setScalar(Math.sin(life*Math.PI)*.66);
            stamp.updateMatrix();entryMotes.setMatrixAt(i,stamp.matrix);
          }
          if(entryMotes.visible) entryMotes.instanceMatrix.needsUpdate=true;
        }
        if(!arena.visible) continue;
        for(const [i,gem] of floats.entries()){gem.position.y=1.61+.32*Math.sin(time*1.61+i*.93);gem.rotation.y=time*.55+i;}
        motes.visible=!hollow;
        if(hollow) continue;
        for(let i=0;i<motes.count;i++){
          const phase=(time*.28+i*.379)%1,angle=i*2.399+time*.22;
          const radius=2+i%11;
          stamp.position.set(Math.sin(angle)*radius,.13+phase*3.6,cave.arena+Math.cos(angle)*radius);
          stamp.rotation.set(angle,phase*5,i);stamp.scale.setScalar(Math.sin(phase*Math.PI)*.85);
          stamp.updateMatrix();motes.setMatrixAt(i,stamp.matrix);
        }
        motes.instanceMatrix.needsUpdate=true;
      }
    },
    dispose(){views.forEach(view=>view.hollow?.dispose());batch.dispose();labelTextures.forEach(texture=>texture.dispose());labelMaterials.forEach(material=>material.dispose());},
  };
}
