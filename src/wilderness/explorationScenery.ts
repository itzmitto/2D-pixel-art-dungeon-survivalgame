import * as T from 'three';
import { fracturedRock, weatherStone } from './rockDetail.ts';
import { explorationSites } from './worldSites.ts';
import { surface } from './layout.ts';
import { joint, loft, meshPart, rigidBatcher, shapedPlate } from './creatureGeometry.ts';
import type { Obstacle } from './spatial.ts';

export function buildExplorationScenery(scene:T.Scene,obstacles:Obstacle[]){
  const root=new T.Group(), batch=rigidBatcher();
  const stone=new T.MeshStandardMaterial({color:0x60605c,roughness:.91,flatShading:true});
  weatherStone(stone,.47);
  const slate=new T.MeshStandardMaterial({color:0x474853,roughness:.93});
  const moss=new T.MeshStandardMaterial({color:0x596545,roughness:.98,flatShading:true});
  const wood=new T.MeshStandardMaterial({color:0x4b3428,roughness:1});
  const hide=new T.MeshStandardMaterial({color:0x6f5444,roughness:.95,side:T.DoubleSide});
  const iron=new T.MeshStandardMaterial({color:0x80776b,metalness:.64,roughness:.49});
  const cap=new T.MeshStandardMaterial({color:0x4b6771,emissive:0x426b89,emissiveIntensity:.73,roughness:.58});
  const crystal=new T.MeshStandardMaterial({color:0x665889,emissive:0x6845bf,emissiveIntensity:.66,metalness:.29,roughness:.43});
  const flame=new T.MeshBasicMaterial({color:0xff944c,toneMapped:false});
  const lights:T.Mesh[]=[];
  const block=new T.BoxGeometry(1,1,1), shard=fracturedRock(525);
  const wheel=new T.TorusGeometry(.75,.077,6,13);
  const vertical=(sections:Parameters<typeof loft>[0],sides=10)=>loft(sections,sides).rotateX(-Math.PI/2);
  const statue=vertical([[0,.25,-.13,.14],[.18,.28,-.145,.14],[.71,.21,-.14,.13],[1.13,.49,-.26,.20],
    [1.48,.48,-.27,.21],[1.67,.24,-.19,.16],[1.83,.15,-.11,.14],[2.05,.12,-.10,.10]],13);
  const statueSword=shapedPlate([[-.08,0],[.08,0],[.14,1.21],[.19,1.37],[-.19,1.37],[-.14,1.21]],.054,.019);
  const tomb=shapedPlate([[-.245,0],[.245,0],[.23,.89],[.139,1.01],[-.135,1.03],[-.245,.91]],.10,.026);
  const crystalGeo=vertical([[0,.08,-.07,.09],[.28,.21,-.18,.18],[.69,.17,-.14,.15],[.95,.06,-.04,.042],[1.22,.002,-.002,.003]],6);
  const mushroom=vertical([[0,.18,-.16,.17],[.075,.27,-.23,.25],[.14,.25,-.22,.23],[.22,.12,-.12,.13],[.25,.015,-.012,.014]],11);
  const stem=vertical([[0,.028,-.028,.029],[.12,.034,-.034,.034],[.26,.026,-.027,.027]],7);
  const tent=shapedPlate([[-1.25,0],[0,1.42],[1.16,0]],.08,.004);
  function box(parent:T.Group,material:T.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number){
    const item=meshPart(parent,block,material,x,y,z);item.scale.set(sx,sy,sz);return item;
  }
  function blockWalk(x:number,z:number,r:number){
    obstacles.push({x,z,r});
  }
  for(const site of explorationSites){
    const holder=joint(root,site.x,surface(site.x,site.z),site.z);
    const at=(x:number,z:number)=>joint(holder,x,surface(site.x+x,site.z+z)-holder.position.y,z);
    switch(site.style){
      case 'statues':
        for(const side of [-1,1]){
          const plinth=at(side*1.38,.08);
          plinth.rotation.y=side*.41;
          box(plinth,slate,0,.14,0,1.13,.28,.96);
          box(plinth,stone,0,.32,0,.87,.20,.77);
          meshPart(plinth,statue,stone,0,.41).rotation.z=side*.10;
          meshPart(plinth,statueSword,slate,.27,.72,.18).rotation.z=side*.27;
          blockWalk(site.x+side*1.38,site.z+.08,.55);
        }
        break;
      case 'wagon': {
        const frame=at(0,0);frame.rotation.set(.18,.37,-.16);
        box(frame,wood,0,.75,0,1.72,.21,2.68);
        for(const side of [-1,1]){
          box(frame,wood,side*.77,1,0,.11,.53,2.52).rotation.z=side*.22;
          const rolling=meshPart(frame,wheel,iron,side*.88,.62,.41);rolling.rotation.y=Math.PI/2;
          for(let j=0;j<5;j++) box(frame,wood,side*.88,.62,.41,.082,1.23,.083).rotation.x=j*Math.PI/5;
          box(frame,wood,side*.63,.52,2,.13,.13,1.86).rotation.y=side*.11;
        }
        box(frame,wood,-.22,1.07,-.72,.52,.55,.63).rotation.y=.33;
        blockWalk(site.x,site.z,1.09);
        break;
      }
      case 'ruin':
        for(const [x,z,angle] of [[-1.8,-1.4,.03],[.1,-1.4,.07],[-1.8,.36,1.56]]){
          const wall=at(x,z);wall.rotation.y=angle;
          for(let row=0;row<3;row++) for(let col=0;col<3-(row===2?1:0);col++)
            box(wall,row===2?moss:stone,(col-1)*.62+(row%2)*.14,.23+row*.41,0,.60,.40,.52).rotation.z=(row+col)*.018;
          blockWalk(site.x+x,site.z+z,.65);
        }
        break;
      case 'graves':
        for(let i=0;i<7;i++){
          const x=(i%3-1)*1.22,z=Math.floor(i/3)*1.41-.93;
          const grave=at(x,z);grave.rotation.y=(i-3)*.26;
          meshPart(grave,tomb,i%3?stone:slate,0,0,-.29).rotation.z=(i%4-1)*.12;
          box(grave,moss,0,.055,.16,.58,.11,.99);
          if(i===2) box(grave,iron,0,.52,-.23,.027,.44,.042);
          blockWalk(site.x+x,site.z+z-.29,.27);
        }
        break;
      case 'rack':
        for(const side of [-1,1]) box(holder,wood,side*1.0,.63,0,.16,1.39,.19).rotation.z=side*.1;
        box(holder,wood,0,1.05,0,2.33,.15,.19);
        for(let i=0;i<5;i++){
          const shaft=box(holder,wood,(i-2)*.39,.69,.16,.059,1.44,.072);
          shaft.rotation.z=(i-2)*.21;
          const head=meshPart(holder,statueSword,iron,(i-2)*.39+.13,.98,.21);
          head.scale.set(.44,.34,.55);head.rotation.z=shaft.rotation.z;
        }
        blockWalk(site.x,site.z,.67);
        break;
      case 'camp': {
        for(const side of [-1,1]){
          const a=at(-1.22,side*.9);
          meshPart(a,tent,hide,0,.01,0).rotation.y=side>0?.18:Math.PI+.18;
          box(a,wood,0,1.35,0,.08,.08,.37);
          blockWalk(site.x-1.22,site.z+side*.9,.46);
        }
        for(let i=0;i<6;i++){
          const angle=i*Math.PI/3, rock=meshPart(holder,shard,stone,Math.sin(angle)*.61,.12,Math.cos(angle)*.61);
          rock.scale.set(.25,.20,.22);
        }
        for(const angle of [0,1.3,2.7]) box(holder,wood,0,.15,0,1.0,.14,.14).rotation.y=angle;
        if(site.id==='rime-forecamp'){
          const ember=meshPart(holder,crystalGeo,flame,0,.20);ember.scale.set(.36,.54,.36);lights.push(ember);
        }
        break;
      }
      case 'mushrooms':
        for(let i=0;i<18;i++){
          const angle=i*2.399,r=.23+(i%8)*.31,node=at(Math.sin(angle)*r,Math.cos(angle)*r);
          const size=.35+(i%5)*.16;
          node.scale.setScalar(size);node.rotation.z=.13*Math.cos(i);
          meshPart(node,stem,moss);meshPart(node,mushroom,cap,0,.22);
        }
        break;
      case 'crystals':
        for(let i=0;i<9;i++){
          const angle=i*2.399,r=.31+(i%5)*.31,node=at(Math.sin(angle)*r,Math.cos(angle)*r);
          const gem=meshPart(node,crystalGeo,crystal);
          gem.scale.set(.46+(i%3)*.24,.41+(i%5)*.2,.49);gem.rotation.set(.1*i,angle,Math.cos(angle)*.25);
          const foot=meshPart(node,shard,slate,0,.09);foot.scale.set(.34,.23,.31);
        }
        blockWalk(site.x,site.z,.51);
        break;
    }
    for(let i=0;i<6;i++){
      const a=i*2.399, x=Math.sin(a)*(1.85+i*.18),z=Math.cos(a)*(1.48+i*.13), node=at(x,z);
      meshPart(node,shard,i%3===0?moss:stone,0,.095).scale.set(.19+(i%4)*.06,.19,.24);
    }
  }
  batch.bake(root);scene.add(root);
  return {update(time:number){
    cap.emissiveIntensity=.57+.23*Math.sin(time*1.9);
    crystal.emissiveIntensity=.60+.23*Math.cos(time*2.3);
    for(const item of lights) item.scale.y=.49+.16*Math.sin(time*7.4);
  },dispose(){batch.dispose();}};
}
