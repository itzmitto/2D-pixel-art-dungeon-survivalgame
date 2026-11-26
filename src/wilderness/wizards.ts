import * as T from 'three';
import { joint, loft, meshPart, rigidBatcher, shapedPlate, type CreatureRig } from './creatureGeometry.ts';

export function wizardModels(){
  const resources:(T.Material|T.BufferGeometry)[]=[];
  const own=<R extends T.Material|T.BufferGeometry>(value:R)=>{resources.push(value);return value;};
  const cloth=new T.MeshStandardMaterial({color:0x28243a,roughness:.95,side:T.DoubleSide});
  const brocade=cloth.clone();brocade.color.setHex(0x43324d);
  const eliteCloth=cloth.clone();eliteCloth.color.setHex(0x2c2349);
  const skin=cloth.clone();skin.color.setHex(0x766166);
  const recess=new T.MeshBasicMaterial({color:0x14121d});
  const metal=new T.MeshStandardMaterial({color:0x8b809b,metalness:.56,roughness:.43});
  const brass=metal.clone();brass.color.setHex(0xab8865);
  const wood=cloth.clone();wood.color.setHex(0x3f292a);
  const light=new T.MeshStandardMaterial({color:0xb696f1,emissive:0x9048ff,emissiveIntensity:1.1,roughness:.42});
  const veil=new T.MeshBasicMaterial({color:0x946fff,transparent:true,opacity:.24,wireframe:true,depthWrite:false});
  resources.push(cloth,brocade,eliteCloth,skin,recess,metal,brass,wood,light,veil);
  const vertical=(rings:Parameters<typeof loft>[0],sides=14)=>own(loft(rings,sides).rotateX(-Math.PI/2));
  const plate=(points:Parameters<typeof shapedPlate>[0],depth=.038)=>own(shapedPlate(points,depth,.012));
  const tunic=vertical([[0,.28,-.15,.16],[.18,.26,-.16,.15],[.40,.33,-.18,.20],[.63,.37,-.16,.16],[.73,.211,-.121,.128]],17);
  const hood=vertical([[-.22,.144,-.139,.146],[-.10,.234,-.217,.206],[.07,.247,-.273,.221],[.22,.202,-.243,.186],[.37,.10,-.149,.106],[.45,.02,-.029,.024]],18);
  const face=vertical([[-.186,.08,-.103,.101],[-.112,.133,-.113,.141],[.10,.149,-.129,.141],[.216,.112,-.096,.102]],15);
  const sleeve=vertical([[-.36,.121,-.116,.128],[-.24,.151,-.134,.131],[-.095,.161,-.144,.143],[.087,.147,-.143,.15]],14);
  const cuff=vertical([[-.18,.066,-.074,.079],[-.094,.109,-.096,.102],[.05,.125,-.114,.108]],12);
  const sash=vertical([[0,.267,-.169,.17],[.046,.281,-.18,.187],[.107,.265,-.171,.18]],16);
  const panel=plate([[-.13,.028],[.14,.029],[.155,-.22],[.218,-.56],[.23,-.89],[.033,-1.0],[-.195,-.94],[-.205,-.63],[-.14,-.26]],.026);
  const hem=plate([[-.20,-.84],[.21,-.84],[.229,-.886],[.033,-.98],[-.19,-.92]],.015);
  const scarf=plate([[-.39,.054],[-.20,.122],[.12,.11],[.35,.053],[.36,-.165],[.055,-.26],[-.126,-.183],[-.39,-.109]],.027);
  const blade=plate([[-.029,-.10],[-.08,.01],[-.032,.084],[.065,.111],[.08,.002],[.019,-.035]],.014);
  const mantle=plate([[-.17,-.05],[-.09,.11],[.05,.17],[.15,.10],[.13,-.13],[.028,-.22],[-.12,-.16]],.056);
  const staff=vertical([[-.64,.037,-.042,.042],[-.43,.055,-.043,.047],[.09,.047,-.05,.056],[.72,.054,-.057,.055],[1.16,.091,-.082,.075],[1.23,.046,-.041,.044]],10);
  const crystal=own(new T.OctahedronGeometry(.174));
  const runeRing=own(new T.TorusGeometry(.23,.015,5,19,Math.PI*1.66));
  const button=own(new T.IcosahedronGeometry(.034,0));
  const orb=own(new T.SphereGeometry(1,14,9));
  const foot=own(loft([[-.13,.056,-.068,.058],[-.040,.083,-.068,.097],[.13,.082,-.068,.055],[.20,.048,-.06,.029]],9));
  const batch=rigidBatcher();
  return {
    make(elite:boolean,archmage=false):CreatureRig&{barrier:T.Mesh}{
      const robes=elite?eliteCloth:cloth;
      const root=new T.Group(), pelvis=joint(root,0,1.14),torso=joint(pelvis);
      meshPart(torso,tunic,robes);
      meshPart(torso,sash,wood,0,.073);meshPart(torso,button,brass,0,.127,.206);
      meshPart(torso,scarf,brocade,0,.560,.133);
      meshPart(torso,blade,light,0,.48,.191).scale.setScalar(elite?1:.69);
      const skirt=Array.from({length:9},(_,i)=>{
        const a=i*2*Math.PI/9, p=joint(pelvis,Math.sin(a)*.243,.11,Math.cos(a)*.161);
        p.rotation.y=a;
        meshPart(p,panel,i%3===0?brocade:robes);
        meshPart(p,hem,elite?brass:brocade,0,0,.032);
        if(i%3===0) meshPart(p,blade,light,0,-.69,.037).scale.setScalar(.53);
        return p;
      });
      const head=joint(torso,0,.86,.013);
      meshPart(head,hood,robes,0,0,-.123);
      meshPart(head,face,recess,0,0,.082);
      meshPart(head,face,skin,0,-.070,.134).scale.set(.68,.71,.52);
      const lip=meshPart(head,scarf,brocade,0,-.11,.219);lip.scale.set(.40,.54,.60);
      for(const side of [-1,1]){
        meshPart(head,blade,light,side*.058,.016,.215).scale.set(.41,.128,.28);
        const fold=meshPart(head,mantle,robes,side*.138,.05,.139);
        fold.rotation.z=-side*.37;fold.scale.set(.57,1.09,.72);
        if(elite) meshPart(head,blade,brass,side*.177,.152,.134).scale.set(.74,1.59,1);
      }
      const relics:T.Mesh[]=[];
      let floating:T.Group|undefined;
      const hands=[-1,1].map(side=>{
        const upper=joint(torso,side*.342,.55),fore=joint(upper,0,-.31),hand=joint(fore,0,-.22);
        meshPart(upper,sleeve,robes);meshPart(fore,sleeve,brocade).scale.set(.80,.67,.80);
        meshPart(fore,cuff,wood,0,-.143).scale.set(.77,.54,.74);
        meshPart(hand,button,skin,0,-.033,0).scale.set(1.7,1.22,1.62);
        meshPart(upper,mantle,elite?brass:metal,side*.024,.042,.111).scale.set(.62,.61,.55);
        if(side===1){
          const weapon=archmage?joint(root,.72,1.08,.35):joint(hand,0,0,.071);
          if(archmage){floating=weapon;weapon.scale.setScalar(1.23);}
          meshPart(weapon,staff,wood);
          for(const y of [-.46,.06,1.07]) meshPart(weapon,sash,metal,0,y).scale.set(.27,.87,.36);
          meshPart(weapon,crystal,light,0,1.40).scale.set(.85,1.65,.85);
          for(const sign of [-1,1]) meshPart(weapon,runeRing,elite?brass:metal,0,1.38,0).rotation.set(sign*.66,sign*.44,sign*1.14);
        }
        return {upper,fore};
      });
      if(archmage){
        for(const side of [-1,1]){
          const plate=meshPart(torso,mantle,brass,side*.31,.59,.14);
          plate.scale.set(1.22,1.24,1.06);plate.rotation.z=-side*.42;
          meshPart(head,mantle,brass,side*.183,.19,.042).scale.set(.48,1.15,.67);
        }
        for(let i=0;i<5;i++) relics.push(meshPart(root,crystal,light,0,1,0));
      }
      const shoes=[-1,1].map(side=>meshPart(pelvis,foot,wood,side*.115,-1.075));
      if(relics.length) root.remove(...relics);
      batch.bake(root);
      if(relics.length) root.add(...relics);
      const barrier=new T.Mesh(orb,veil);barrier.position.y=1.17;barrier.scale.set(.92,1.46,.92);
      barrier.visible=false;root.add(barrier);
      return {root,barrier,animate(p){
        const cast=p.windup, release=p.recovery, walk=p.gait, fall=T.MathUtils.smoothstep(p.dead,0,1), t=p.frozen?0:p.time;
        pelvis.position.y=1.14+.016*Math.sin(t*2.2)+Math.sin(p.phase*2)*walk*.039-fall*.80;
        pelvis.rotation.set(release*.18+p.hit*-.15,0,fall*1.39+p.hit*.15);
        torso.rotation.set(cast*-.18+walk*.085,Math.sin(p.phase)*walk*.085+cast*.24,Math.sin(t*1.7)*.013);
        head.rotation.set(.06*Math.sin(t*1.54)-cast*.16+release*.19,(p.turn??0)*.24,0);
        hands.forEach(({upper,fore},i)=>{
          upper.rotation.x=-.24+Math.sin(p.phase+i*Math.PI)*walk*.22-cast*(i===1?1.58:1.14)+release*.47;
          upper.rotation.z=(i===0?-1:1)*(.17+cast*.37+fall*.36);
          fore.rotation.x=-.31-cast*.52;
        });
        shoes.forEach((shoe,i)=>{shoe.position.z=Math.sin(p.phase+i*Math.PI)*walk*.25;});
        skirt.forEach((p,i)=>{
          p.rotation.x=-.14-.15*Math.sin(t*2.3+i*1.17)-walk*.29-cast*.22;
          p.rotation.z=.061*Math.sin(t*3.1+i*.43)+fall*.19;
        });
        if(floating){
          floating.position.set(.74+Math.sin(t*1.8)*.17,1.04+Math.sin(t*2.5)*.17+cast*.59,.37+cast*.29);
          floating.rotation.set(.10+cast*.19,t*.65,-.20+Math.sin(t*1.6)*.11);
        }
        relics.forEach((gem,i)=>{
          const a=t*1.65+i*1.257;
          gem.position.set(Math.sin(a)*.92,.90+i*.17+.23*Math.sin(a*1.7),Math.cos(a)*.79);
          gem.rotation.set(a*.61,a,.3);gem.scale.setScalar((.29+cast*.25)*(1-fall));
        });
        barrier.rotation.y=t*.65;
      }};
    },
    dispose(){batch.dispose();resources.forEach(resource=>resource.dispose());},
  };
}
