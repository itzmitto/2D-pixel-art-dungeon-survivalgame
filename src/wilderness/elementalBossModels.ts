import * as T from 'three';
import { joint, loft, meshPart, rigidBatcher, shapedPlate, type CreatureRig } from './creatureGeometry.ts';

export function elementalBossModels(){
  const resources:(T.Material|T.BufferGeometry)[]=[];
  const own=<R extends T.Material|T.BufferGeometry>(value:R)=>{resources.push(value);return value;};
  const batch=rigidBatcher();
  const basalt=own(new T.MeshStandardMaterial({color:0x33303a,roughness:.91,flatShading:true}));
  const chips=own(new T.MeshStandardMaterial({color:0x51414a,roughness:.96,flatShading:true}));
  const fire=own(new T.MeshStandardMaterial({color:0xff8e49,emissive:0xc74e23,emissiveIntensity:1.32,roughness:.56}));
  const vertical=(profiles:Parameters<typeof loft>[0],sides=10)=>own(loft(profiles,sides).rotateX(-Math.PI/2));
  const stone=own(new T.DodecahedronGeometry(1,0));
  const prism=own(new T.IcosahedronGeometry(1,0));
  const fissure=own(shapedPlate([[-.07,-.31],[-.015,-.11],[-.09,-.06],[.02,.15],[.078,.28],[.061,.10],[.015,-.045],[.09,-.068],[.005,-.31]],.012,0));
  const core=own(new T.OctahedronGeometry(.22));
  const torsoGeo=vertical([[-.19,.29,-.17,.26],[0,.41,-.31,.38],[.27,.58,-.39,.43],[.65,.61,-.39,.41],[.87,.50,-.29,.30],[.98,.25,-.19,.22]],8);
  const armGeo=vertical([[-.46,.15,-.16,.17],[-.31,.26,-.27,.29],[0,.35,-.31,.34],[.21,.27,-.24,.26],[.35,.10,-.12,.15]],7);
  const palmGeo=vertical([[-.31,.21,-.24,.22],[-.10,.31,-.25,.25],[.13,.27,-.23,.25],[.25,.14,-.13,.16]],8);
  const shinGeo=vertical([[-.53,.19,-.22,.21],[-.31,.27,-.30,.27],[-.08,.24,-.21,.21],[.10,.16,-.16,.16]],7);
  const heelGeo=own(loft([[-.28,.17,-.09,.14],[-.10,.24,-.12,.19],[.25,.31,-.10,.16],[.39,.21,-.08,.08]],7));

  function makeGolem():CreatureRig{
    const root=new T.Group(), body=joint(root,0,1.19), head=joint(body,0,1.22,.03);
    meshPart(body,torsoGeo,basalt);
    const plate=meshPart(body,stone,chips,0,.48,.19);plate.scale.set(.62,.54,.29);
    meshPart(body,core,fire,0,.51,.51).scale.set(.96,1.16,.54);
    const skull=meshPart(head,stone,basalt);skull.scale.set(.34,.35,.32);
    meshPart(head,prism,chips,0,.074,.052).scale.set(.31,.22,.38);
    for(const side of [-1,1]){
      meshPart(head,core,fire,side*.142,.005,.292).scale.set(.36,.15,.15);
      for(let i=0;i<3;i++){
        const line=meshPart(body,fissure,fire,side*(.18+i*.111),.61-i*.152,.422+(i%2)*.025);
        line.rotation.z=side*(.35+i*.41);line.scale.set(.73,.84,1);
      }
    }
    const arms=[-1,1].map(side=>{
      const shoulder=joint(body,side*.646,.75,0), elbow=joint(shoulder,0,-.48,.02), palm=joint(elbow,0,-.48,.027);
      meshPart(shoulder,armGeo,basalt,0,-.045);
      const boulder=meshPart(shoulder,stone,chips,side*.073,.132);
      boulder.scale.set(.41,.38,.39);boulder.rotation.set(.11,side*.54,-side*.19);
      meshPart(elbow,armGeo,chips,0,-.083).scale.set(.92,.81,.98);
      meshPart(elbow,fissure,fire,side*.071,-.13,.31).scale.set(.79,.93,.75);
      meshPart(palm,palmGeo,basalt);
      for(let i=0;i<3;i++) meshPart(palm,prism,chips,(i-1)*.17,-.21,.14).scale.set(.091,.18,.112);
      return {shoulder,elbow,palm};
    });
    const legs=[-1,1].map(side=>{
      const upper=joint(body,side*.284,-.081), knee=joint(upper,0,-.51,.032);
      meshPart(upper,armGeo,basalt,0,-.041).scale.set(.89,1.06,.92);
      meshPart(knee,shinGeo,chips,0,-.02);
      meshPart(knee,heelGeo,basalt,0,-.47,.11);
      meshPart(knee,fissure,fire,0,-.18,.256).scale.set(.79,.72,.76);
      return {upper,knee};
    });
    batch.bake(root);
    return {root,animate(p){
      const attack=p.windup, impact=p.recovery, fall=T.MathUtils.smoothstep(p.dead,0,1);
      body.position.y=1.19+.028*Math.cos(p.phase*2)*p.gait-.21*attack-.86*fall;
      body.rotation.set(-.30*attack+.51*impact+.32*p.leap,Math.sin(p.phase)*p.gait*.12,fall*1.40+p.hit*.18);
      head.rotation.set(-.37*attack+.29*impact,p.turn??0,0);
      for(const [i,{shoulder,elbow,palm}] of arms.entries()){
        const side=i===0?-1:1;
        shoulder.rotation.set(-.18-Math.sin(p.phase+i*Math.PI)*p.gait*.35-2.12*attack-.39*impact,side*.19,side*(.29+.23*attack));
        elbow.rotation.x=-.23-.63*attack+.20*impact;palm.rotation.x=.20*impact;
        const leg=legs[i], step=Math.sin(p.phase+i*Math.PI);
        leg.upper.rotation.x=step*p.gait*.51-.18*attack;
        leg.knee.rotation.x=-Math.max(0,-step)*p.gait*.35;
      }
    }};
  }

  return {makeGolem,dispose(){batch.dispose();resources.forEach(resource=>resource.dispose());}};
}
