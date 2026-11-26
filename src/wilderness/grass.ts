import * as T from 'three';
import { bank, clearing, extent, height, inForest, randomSequence, trailDistance } from './layout';
import { frontierAt, frontierCrossing, highlandRiver, highlands, marshes, marshWaterLevel, outdoorBounds, routeDistance } from './frontier';
import { obstacleGrid, type Obstacle } from './spatial';
import { orcCamp, waystones } from './worldSites';
import { aureliaReserved } from './aurelia';
import { bossCaves } from './bossCaves';
import { worldChests } from './treasure';
import { fieldNoise } from './surfaceDetail';
import { grassPresets, type GrassSettings } from './grassSettings';

const span=16, capacity=4096, cacheLimit=112;
const gridSize=span+1, edgeFade=12, boundsPadding=3.1;
const maxActors=6, maxSpells=3;
const smooth=T.MathUtils.smoothstep;

// Three ranges of one blade profile. Each drawn instance is one blade.
const bladeVertices=new Float32Array([
  -1,0,0, 1,0,0, -.84,.36,0, .84,.36,0, -.47,.70,0, .47,.70,0, 0,1,0,
]);
const bladeIndices=new Uint16Array([
  0,1,2, 1,3,2, 2,3,4, 3,5,4, 4,5,6,
  0,1,2, 1,3,2, 2,3,6,
  0,1,6,
]);
const lodRanges=[[0,15],[15,9],[24,3]] as const;

type Cell={key:number; x:number; z:number; bounds:T.Box3};
type Chunk={
  mesh:T.Mesh<T.InstancedBufferGeometry,T.ShaderMaterial>;
  bounds:T.Box3;
  total:number;
  shown:number;
  requested:number;
  lod:number;
  interactive:boolean;
  used:number;
};
export type GrassActor=(x:number,z:number,radius:number,force:number)=>void;
export type GrassSpell=(x:number,z:number,radius:number,force:number,element:number,strength:number)=>void;
type GrassInfluences=(actor:GrassActor,spell:GrassSpell)=>void;

export function meadow(scene:T.Scene,camera:T.PerspectiveCamera,player:T.Vector3,obstacles:readonly Obstacle[],seed:number,settings:GrassSettings){
  const group=new T.Group();
  group.name='Grass chunks';
  scene.add(group);

  const reserved=obstacleGrid([
    ...obstacles,
    ...waystones.map(p=>({...p,r:2.15})),
    ...worldChests.map(p=>({...p,r:1.05})),
    ...bossCaves.map(p=>({...p,r:2.83})),
  ],8);
  const cache=new Map<number,Chunk>(), emptyCells=new Set<number>();
  const cells:Cell[]=[],active:Chunk[]=[],lastVisible:Chunk[]=[];
  const grid=new Float32Array(gridSize*gridSize*3);
  const scratch=new Float32Array(capacity*8);
  const projection=new T.Matrix4(), frustum=new T.Frustum();

  const clock={value:0}, center={value:new T.Vector2()}, drawDistance={value:0}, interactionDistance={value:0};
  const walker={value:new T.Vector4()};
  const bodies=Array.from({length:maxActors},()=>new T.Vector4());
  const spells=Array.from({length:maxSpells},()=>new T.Vector4());
  const aspects=Array.from({length:maxSpells},()=>new T.Vector2());
  const bodyScores=new Float32Array(maxActors), spellScores=new Float32Array(maxSpells);
  const bodyCount={value:0}, spellCount={value:0};
  let quality=settings.quality, overrides=settings.budgets, preset=grassPresets[quality];
  let originX=Infinity,originZ=Infinity,previousTime=0,sampleAt=0,hasInteraction=false,frame=0;

  function material(interactive:boolean){
    return new T.ShaderMaterial({
      side:T.DoubleSide,forceSinglePass:true,fog:true,blending:T.NoBlending,
      defines:interactive?{NEAR_GRASS:1}:{},
      uniforms:{
        ...T.UniformsUtils.clone(T.UniformsLib.fog),
        windTime:clock,fieldCenter:center,drawDistance,interactionDistance,walker,
        bodies:{value:bodies},spells:{value:spells},spellAspect:{value:aspects},bodyCount,spellCount,
      },
      vertexShader:`
        #include <fog_pars_vertex>
        attribute vec4 bladeRoot, bladeStyle;
        uniform float windTime, drawDistance;
        uniform vec2 fieldCenter;
        varying vec3 bladeColor;
        #ifdef NEAR_GRASS
          uniform float interactionDistance;
          uniform vec4 walker, bodies[${maxActors}], spells[${maxSpells}];
          uniform vec2 spellAspect[${maxSpells}];
          uniform int bodyCount, spellCount;
          vec2 pushBlades(vec2 at, vec4 source){
            vec2 delta=at-source.xy;
            float d2=dot(delta,delta);
            float inside=1.-d2*source.z;
            return inside>0.?delta*inversesqrt(max(.08,d2))*(inside*inside*source.w):vec2(0.);
          }
        #endif
        void main(){
          vec3 root=bladeRoot.xyz+modelMatrix[3].xyz;
          float t=position.y;
          float flex=t*t;
          float appearance=fract(bladeStyle.w);
          float biome=floor(bladeStyle.w);
          vec2 axis=bladeStyle.xy;
          vec2 field=root.xz-fieldCenter;
          float distance2=dot(field,field);
          float range=1.-smoothstep((drawDistance-${edgeFade}.0)*(drawDistance-${edgeFade}.0),
            drawDistance*drawDistance,distance2);
          float bladeHeight=bladeRoot.w*range;
          float wave=sin(dot(root.xz,vec2(.19,.126))-windTime*1.66+appearance*1.8);
          vec2 wind=vec2(.84,.53)*(.052+.101*wave);
          vec3 enchantment=vec3(0.);
          float charred=0.;
          #ifdef NEAR_GRASS
            float gust=sin(dot(root.xz,vec2(.063,.041))-windTime*.92);
            gust=max(0.,gust);gust*=gust*gust;
            float detail=1.-smoothstep(interactionDistance*.69,interactionDistance,distance2);
            wind+=(vec2(.17,.095)*gust+vec2(.035,-.031)*sin(windTime*3.5+appearance*12.5))*detail;
            if(detail>0.){
              wind+=pushBlades(root.xz,walker)*detail;
              for(int i=0;i<bodyCount;i++) wind+=pushBlades(root.xz,bodies[i])*detail;
              for(int i=0;i<spellCount;i++){
                vec4 spell=spells[i];
                vec2 delta=root.xz-spell.xy;
                float d2=dot(delta,delta);
                float influence=1.-d2*spell.z;
                if(influence<=0.) continue;
                float element=spellAspect[i].x;
                float power=influence*influence*spellAspect[i].y;
                float ripple=element>=4.? .71+.29*sin(d2*.53-windTime*11.):1.;
                wind+=delta*inversesqrt(max(.08,d2))*(influence*influence*spell.w*ripple*detail);
                if(element==1.){
                  charred=max(charred,power*.86);
                  enchantment+=vec3(.041,.010,.002)*power;
                } else if(element==2.) enchantment+=vec3(.14,.25,.33)*power;
                else if(element==3.) enchantment+=vec3(.23,.39,.70)*power;
                else if(element==4.) enchantment+=vec3(.027,.068,.079)*power*ripple;
                else if(element==6.) enchantment+=vec3(.069,.026,.114)*power;
              }
              charred*=detail;
              enchantment*=detail;
            }
            wind=clamp(wind,vec2(-.65),vec2(.65));
          #endif
          vec2 blade=normalize(vec2(-axis.y,axis.x));
          float across=position.x;
          float curl=bladeStyle.z;
          if(biome>2.5&&biome<4.5){
            // Narrow stems flare into a seed head or flower on the upper section.
            across*=mix(.18,1.36,step(.63,t));
            t=mix(t,.73*t+.27,step(.20,t));
            flex=t*t;
          }
          vec2 lean=blade*(curl*flex)+wind*flex;
          vec2 positionXZ=root.xz+axis*across*range+lean*bladeHeight;
          float elevated=root.y+(t-flex*(abs(wind.x)+abs(wind.y))*.18)*bladeHeight;
          vec4 mvPosition=viewMatrix*vec4(positionXZ.x,elevated,positionXZ.y,1.);

          vec3 green=mix(vec3(.041,.077,.025),vec3(.073,.123,.039),appearance);
          vec3 olive=vec3(.121,.131,.056);
          vec3 moss=vec3(.074,.113,.072);
          vec3 tint=mix(green,olive,smoothstep(.55,.98,appearance)*.80);
          if(biome==1.) tint=mix(tint,moss,.58);
          if(biome==2.) tint=mix(tint,vec3(.077,.124,.065),.54);
          if(biome==5.) tint=mix(tint,moss,.75);
          if(biome>2.5&&biome<4.5){
            vec3 crown=biome==3.?vec3(.22,.159,.076):
              mix(vec3(.26,.19,.34),vec3(.35,.31,.18),appearance);
            tint=mix(tint,crown,smoothstep(.69,.90,t));
          }
          float tip=t*(1.48-.48*t);
          float moon=abs(dot(blade,vec2(-.66,.75)));
          bladeColor=tint*(.48+tip*(.53+.29*moon));
          bladeColor=mix(bladeColor,vec3(.030,.020,.012)*(.64+tip*.42),charred);
          bladeColor+=enchantment*(.21+.79*tip);
          gl_Position=projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader:`
        varying vec3 bladeColor;
        #include <fog_pars_fragment>
        void main(){
          gl_FragColor=vec4(bladeColor,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
    });
  }
  const nearMaterial=material(true), farMaterial=material(false);

  function sampleDensity(x:number,z:number,y:number,patch:number,fine:number){
    if(!outdoorBounds(x,z)||aureliaReserved(x,z,1)||frontierCrossing(x,z)) return 0;
    const region=frontierAt(z);
    const trail=region?routeDistance(x,z,region.road):trailDistance(x,z);
    const roadside=smooth(trail+(fine-.5)*1.6,1.65,4.25);
    if(!roadside) return 0;
    if(region===marshes) return roadside*smooth(y,marshWaterLevel-.12,marshWaterLevel+.48)*(.52+patch*.47+fine*.19);
    if(region===highlands){
      return highlandRiver(x,z)?0:roadside*(1-smooth(y,14,36)*.92)*(.47+patch*.49+fine*.20);
    }
    const riverEdge=smooth(bank(x,z)+(fine-.5)*1.7,7.1,10.5);
    const trampling=Math.min(smooth(clearing(x,z),6.7,14),
      smooth(Math.hypot(x-orcCamp.x,z-orcCamp.z),9.5,14));
    return roadside*riverEdge*trampling*(inForest(x,z)?.82:1)*(.48+patch*.52+fine*.21);
  }

  function build(cell:Cell):Chunk|null{
    const random=randomSequence(seed^Math.imul(cell.x,105497)^Math.imul(cell.z,518357)^0x19a4ef3);
    const startX=cell.x*span,startZ=cell.z*span;
    for(let j=0;j<gridSize;j++) for(let i=0;i<gridSize;i++){
      const x=startX+i,z=startZ+j,y=height(x,z);
      const patch=fieldNoise(x*.109,z*.109),fine=fieldNoise(x*.37+42,z*.37-21);
      const offset=(j*gridSize+i)*3;
      grid[offset]=y;
      grid[offset+1]=sampleDensity(x,z,y,patch,fine);
      grid[offset+2]=smooth(patch+fine*.29,.38,.96);
    }

    let count=0,minY=Infinity,maxY=-Infinity;
    for(let i=0;i<capacity;i++){
      const x=random()*span,z=random()*span;
      const ix=x|0,iz=z|0,u=x-ix,v=z-iz,k=(iz*gridSize+ix)*3,row=gridSize*3;
      const b0=(1-u)*(1-v),b1=u*(1-v),b2=(1-u)*v,b3=u*v;
      const density=grid[k+1]*b0+grid[k+4]*b1+grid[k+row+1]*b2+grid[k+row+4]*b3;
      if(random()>density) continue;
      const worldX=startX+x,worldZ=startZ+z,region=frontierAt(worldZ);
      if(!outdoorBounds(worldX,worldZ)||aureliaReserved(worldX,worldZ,.5)||reserved(worldX,worldZ).some(o=>(o.x-worldX)**2+(o.z-worldZ)**2<o.r*o.r)) continue;
      const y=grid[k]*b0+grid[k+3]*b1+grid[k+row]*b2+grid[k+row+3]*b3-.05;
      const patch=grid[k+2]*b0+grid[k+5]*b1+grid[k+row+2]*b2+grid[k+row+5]*b3;
      const sedge=region===marshes;
      const variation=random(), angle=random()*Math.PI*2;
      let biome=sedge?2:region===highlands?1:0;
      let h=(.18+random()*.31+patch*.77)*(sedge?1.13:biome===1?.74:1);
      let width=(.023+random()*.035)*(1.16+patch*.37)*(sedge?.82:1);
      if(variation>.965&&patch>.47){
        biome=variation>.992&&!sedge?4:3;
        h*=1.13;
        width*=biome===4?1.03:.65;
      }else if(variation>.925&&patch>.47&&!sedge){
        biome=5;h*=.62;width*=1.86;
      }
      const n=count++*8;
      scratch[n]=x;scratch[n+1]=y;scratch[n+2]=z;scratch[n+3]=h;
      scratch[n+4]=Math.cos(angle)*width;scratch[n+5]=Math.sin(angle)*width;
      scratch[n+6]=.10+random()*.77;scratch[n+7]=biome+random()*.999;
      minY=Math.min(minY,y);maxY=Math.max(maxY,y+h);
    }
    if(!count) return null;

    const geometry=new T.InstancedBufferGeometry();
    geometry.setAttribute('position',new T.BufferAttribute(bladeVertices,3));
    geometry.setIndex(new T.BufferAttribute(bladeIndices,1));
    const data=new T.InstancedInterleavedBuffer(scratch.slice(0,count*8),8);
    geometry.setAttribute('bladeRoot',new T.InterleavedBufferAttribute(data,4,0));
    geometry.setAttribute('bladeStyle',new T.InterleavedBufferAttribute(data,4,4));
    geometry.instanceCount=0;
    // Includes the longest curved tip and maximum shader displacement.
    geometry.boundingBox=new T.Box3(new T.Vector3(-boundsPadding,minY-.03,-boundsPadding),
      new T.Vector3(span+boundsPadding,maxY+.03,span+boundsPadding));
    geometry.boundingSphere=geometry.boundingBox.getBoundingSphere(new T.Sphere());
    const mesh=new T.Mesh(geometry,farMaterial);
    mesh.position.set(startX,0,startZ);mesh.updateMatrix();
    mesh.matrixAutoUpdate=false;mesh.visible=false;
    group.add(mesh);
    return {mesh,bounds:geometry.boundingBox.clone().translate(mesh.position),total:count,shown:0,requested:0,lod:-1,interactive:false,used:frame};
  }

  function updateCells(x:number,z:number){
    cells.length=0;
    originX=x;originZ=z;
    const radius=Math.ceil(preset.distance/span)+1;
    for(let cz=z-radius;cz<=z+radius;cz++) for(let cx=x-radius;cx<=x+radius;cx++){
      const minX=cx*span,minZ=cz*span;
      if(minZ>=extent||minZ+span<=marshes.north||minX>=extent||minX+span<=-extent) continue;
      if(minZ+span<=-extent&&(minX>=109||minX+span<=-109)) continue;
      const maxY=minZ< -extent?64:27;
      const bounds=new T.Box3(new T.Vector3(minX-boundsPadding,-2,minZ-boundsPadding),
        new T.Vector3(minX+span+boundsPadding,maxY,minZ+span+boundsPadding));
      cells.push({key:cx*4096+cz,x:cx,z:cz,bounds});
    }
  }

  function evict(){
    if(cache.size<=cacheLimit) return;
    let oldest=Infinity, key:number|undefined;
    for(const [id,chunk] of cache){
      if(chunk.used===frame) continue;
      const age=chunk.used;
      if(age<oldest){oldest=age;key=id;}
    }
    if(key===undefined) return;
    const chunk=cache.get(key);
    if(chunk){chunk.mesh.removeFromParent();chunk.mesh.geometry.dispose();}
    cache.delete(key);
  }

  function hide(){
    for(const chunk of lastVisible) chunk.mesh.visible=false;
    lastVisible.length=0;
  }

  function horizontalDistance(bounds:T.Box3,x:number,z:number){
    const dx=Math.max(bounds.min.x-x,0,x-bounds.max.x), dz=Math.max(bounds.min.z-z,0,z-bounds.max.z);
    return dx*dx+dz*dz;
  }

  function collectActor(x:number,z:number,radius:number,force:number){
    const d2=(x-player.x)**2+(z-player.z)**2;
    if(d2>(preset.interaction+radius)**2||force<.09) return;
    const score=(1+force*radius)/(9+d2);
    let slot=0;
    for(let i=1;i<preset.actors;i++) if(bodyScores[i]<bodyScores[slot]) slot=i;
    if(score<=bodyScores[slot]) return;
    bodyScores[slot]=score;
    bodies[slot].set(x,z,1/(radius*radius),force);
  }

  function collectSpell(x:number,z:number,radius:number,force:number,element:number,strength:number){
    const d2=(x-player.x)**2+(z-player.z)**2;
    if(d2>(preset.interaction+radius)**2||strength<.05) return;
    const score=(1+strength*radius*(element===2||element===3?1.35:1))/(18+d2);
    let slot=0;
    for(let i=0;i<preset.spells;i++){
      if(spellScores[i]<spellScores[slot]) slot=i;
      if(spellScores[i]>0&&aspects[i].x===element&&(spells[i].x-x)**2+(spells[i].y-z)**2<2.25){
        slot=i;break;
      }
    }
    if(score<=spellScores[slot]) return;
    spellScores[slot]=score;
    spells[slot].set(x,z,1/(radius*radius),force);
    aspects[slot].set(element,strength);
  }

  function setSettings(next:GrassSettings){
    overrides=next.budgets;
    if(quality===next.quality) return;
    quality=next.quality;preset=grassPresets[quality];
    originX=Infinity;sampleAt=0;
    if(quality==='Off') hide();
  }

  return {
    setSettings,
    update(time:number,speed:number,mounted:boolean,dashing:boolean,influences:GrassInfluences){
      const dt=Math.min(.1,Math.max(0,time-previousTime));
      previousTime=time;frame++;
      hide();
      if(quality==='Off'||!outdoorBounds(player.x,player.z)) {hasInteraction=false;return;}

      const {x,z}=player;
      const cx=Math.floor(x/span),cz=Math.floor(z/span);
      if(cx!==originX||cz!==originZ) updateCells(cx,cz);
      camera.updateMatrixWorld();
      frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
      active.length=0;
      let needed:Cell|undefined, nearest=Infinity, requested=0;
      const reach=preset.distance**2;
      const interactiveReach=preset.interaction**2;
      let wantInteraction=false;
      for(const cell of cells){
        const chunk=cache.get(cell.key);
        if(!chunk&&emptyCells.has(cell.key)) continue;
        const bounds=chunk?.bounds??cell.bounds;
        const distanceToBounds=horizontalDistance(bounds,x,z);
        if(distanceToBounds>=reach||!frustum.intersectsBox(bounds)) continue;
        const distance=Math.hypot((cell.x+.5)*span-x,(cell.z+.5)*span-z);
        if(!chunk){
          if(distance<nearest){needed=cell;nearest=distance;}
          continue;
        }
        const density=preset.density*(1-.86*smooth(distance,span*.76,preset.distance));
        const count=Math.floor(chunk.total*density);
        if(!count) continue;
        const detail=distance+(chunk.lod===0?-1.5:0),middle=distance+(chunk.lod===2?1.5:0);
        const lod=preset.near>0&&detail<preset.near?0:middle<preset.mid?1:2;
        if(lod!==chunk.lod){
          chunk.lod=lod;
          const [firstIndex,indexCount]=lodRanges[lod];
          chunk.mesh.geometry.setDrawRange(firstIndex,indexCount);
        }
        const interactive=lod<2&&distanceToBounds<interactiveReach;
        if(interactive!==chunk.interactive){
          chunk.interactive=interactive;
          chunk.mesh.material=interactive?nearMaterial:farMaterial;
        }
        wantInteraction ||= interactive;
        chunk.used=frame;
        chunk.requested=count;active.push(chunk);requested+=count;
      }
      if(needed){
        // Spread new terrain queries and GPU uploads over successive frames.
        const chunk=build(needed);
        if(chunk){
          cache.set(needed.key,chunk);evict();
        }else emptyCells.add(needed.key);
      }

      const budget=overrides[quality]??preset.budget;
      const share=requested>budget?budget/requested:1;
      for(const chunk of active){
        const target=Math.floor(chunk.requested*share);
        chunk.shown=Math.min(target,chunk.shown+chunk.total*dt*4.5);
        chunk.mesh.geometry.instanceCount=Math.floor(chunk.shown);
        if(chunk.mesh.geometry.instanceCount>0){
          chunk.mesh.visible=true;
          lastVisible.push(chunk);
        }
      }
      clock.value=time;
      center.value.set(x,z);drawDistance.value=preset.distance;
      if(wantInteraction){
        interactionDistance.value=interactiveReach;
        const moving=Math.min(1.32,speed*.077)+(dashing?.72:0);
        const radius=(mounted?2.3:1.3)+moving*.70;
        walker.value.set(x,z,1/(radius*radius),T.MathUtils.damp(walker.value.w,moving*(mounted?.84:.71),16,dt));
        if(time>=sampleAt||!hasInteraction){
          sampleAt=time+1/25;
          bodyScores.fill(0);spellScores.fill(0);
          influences(collectActor,collectSpell);
          let b=0,s=0;
          for(let i=0;i<preset.actors;i++) if(bodyScores[i]>0) b++;
          for(let i=0;i<preset.spells;i++) if(spellScores[i]>0) s++;
          bodyCount.value=b;spellCount.value=s;
        }
      }
      hasInteraction=wantInteraction;
    },
    dispose(){
      for(const chunk of cache.values()) chunk.mesh.geometry.dispose();
      group.removeFromParent();group.clear();cache.clear();emptyCells.clear();
      nearMaterial.dispose();farMaterial.dispose();
    },
  };
}
