import * as T from 'three';
import { joint, loft, meshPart, rigidBatcher, shapedPlate, type CreatureRig } from './creatureGeometry.ts';

export function elementalBossModels(){
  const resources:(T.Material|T.BufferGeometry)[]=[];
  const own=<R extends T.Material|T.BufferGeometry>(value:R)=>{resources.push(value);return value;};
  const batch=rigidBatcher();
  const basalt=own(new T.MeshStandardMaterial({color:0x33303a,roughness:.91,flatShading:true}));
  const chips=own(new T.MeshStandardMaterial({color:0x51414a,roughness:.96,flatShading:true}));
  const fire=own(new T.MeshStandardMaterial({color:0xff8e49,emissive:0xc74e23,emissiveIntensity:1.32,roughness:.56}));
  const scale=own(new T.MeshStandardMaterial({color:0x3d343d,roughness:.85,metalness:.15,flatShading:true}));
  const belly=own(new T.MeshStandardMaterial({color:0x68484a,roughness:.92,flatShading:true}));
  const horn=own(new T.MeshStandardMaterial({color:0x96806d,roughness:.82,flatShading:true}));
  const membrane=own(new T.MeshStandardMaterial({color:0x55303d,roughness:.96,side:T.DoubleSide,flatShading:true}));
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

  const dragonHide=own(loft([[-1.19,.17,-.30,.22],[-.95,.42,-.46,.35],[-.62,.48,-.48,.45],[-.16,.63,-.56,.59],
    [.32,.62,-.48,.68],[.73,.48,-.41,.59],[1.09,.33,-.24,.33],[1.27,.24,-.14,.22]],17));
  const dragonNeck=own(loft([[-.18,.30,-.28,.30],[.08,.34,-.35,.40],[.39,.30,-.27,.43],[.78,.24,-.15,.37],[1.12,.19,-.04,.31],[1.32,.15,.02,.27]],13));
  const dragonHead=own(loft([[-.39,.17,-.14,.27],[-.21,.33,-.18,.34],[.095,.37,-.26,.36],[.32,.32,-.22,.25],
    [.57,.26,-.18,.17],[.78,.21,-.16,.11],[.94,.14,-.11,.10]],15));
  const dragonChin=own(loft([[-.12,.16,-.08,.075],[.10,.31,-.125,.07],[.39,.269,-.123,.038],[.69,.211,-.089,.024],[.89,.125,-.043,.022]],11));
  const hornGeo=vertical([[0,.107,-.106,.105],[.18,.086,-.10,.075],[.43,.052,-.11,.038],[.63,.028,-.126,-.045],[.77,.003,-.141,-.137]],7);
  const thighGeo=vertical([[-.44,.19,-.17,.22],[-.34,.24,-.25,.29],[.05,.33,-.28,.34],[.23,.27,-.21,.25]],9);
  const pawGeo=own(loft([[-.18,.16,-.10,.15],[0,.28,-.12,.19],[.32,.27,-.10,.13],[.51,.17,-.08,.042]],10));
  const eyeGeo=own(new T.IcosahedronGeometry(.084,1));
  const brow=own(shapedPlate([[-.14,-.033],[-.085,.065],[.068,.087],[.167,.018],[.087,-.019]],.027,.013));
  const tailGeos=Array.from({length:6},(_,i)=>{
    const w=.24-i*.029, length=.67-i*.043;
    return own(loft([[-length,w*.59,-w*.76,w*.69],[-length*.47,w*.89,-w*.96,w],[.01,w,-w,w]],10));
  });
  const armBone=own(loft([[-.04,.072,-.064,.079],[.24,.086,-.078,.086],[1.45,.040,-.039,.044],[1.85,.024,-.032,.037]],7));
  const wingEdge=own(loft([[-.03,.054,-.051,.051],[.21,.061,-.064,.063],[1.03,.028,-.031,.028],[1.54,.012,-.012,.011]],6));
  function wingSheet(outer:boolean){
    const verts=outer?[0,0,0,2.10,.03,-.31,1.96,-.11,-1.20,1.51,-.14,-.86,1.13,-.21,-1.39,.72,-.18,-.99,.29,-.21,-1.38,0,0,-.44]:
      [0,0,0,1.58,.10,.41,1.71,-.05,-.47,1.24,-.18,-.97,.89,-.15,-.67,.62,-.23,-1.15,.27,-.16,-.80,0,-.10,-.79];
    const g=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(verts,3));
    g.setIndex([0,1,2,0,2,3,0,3,4,0,4,5,0,5,6,0,6,7]);g.computeVertexNormals();return own(g);
  }
  const mainWing=wingSheet(false), outerWing=wingSheet(true);
  function beam(parent:T.Group,geometry:T.BufferGeometry,from:T.Vector3,to:T.Vector3,length:number,width=1){
    const mesh=meshPart(parent,geometry,scale,from.x,from.y,from.z);
    const direction=to.clone().sub(from);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),direction.clone().normalize());
    mesh.scale.set(width,width,direction.length()/length);return mesh;
  }

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

  function makeDragon():CreatureRig{
    const root=new T.Group(), body=joint(root,0,1.23,-.18),neck=joint(body,0,.39,.76), head=joint(neck,0,.21,1.15);
    meshPart(body,dragonHide,scale);
    meshPart(body,dragonHide,belly,0,-.16,.04).scale.set(.68,.72,.92);
    meshPart(neck,dragonNeck,scale).rotation.x=-.21;
    meshPart(neck,dragonNeck,belly,0,-.15,.02).scale.set(.61,.59,.96);
    meshPart(head,dragonHead,scale);
    const jaw=joint(head,0,-.217,.018);meshPart(jaw,dragonChin,belly);
    for(const side of [-1,1]){
      meshPart(head,eyeGeo,fire,side*.296,.106,.29).scale.set(.57,.49,.68);
      const over=meshPart(head,brow,scale,side*.302,.152,.256);over.rotation.y=side*.85;
      const antler=meshPart(head,hornGeo,horn,side*.217,.229,-.191);
      antler.rotation.set(-.57,0,-side*.36);
      meshPart(head,prism,scale,side*.205,.01,.751).scale.set(.13,.093,.16);
      for(let i=0;i<5;i++){
        const tooth=meshPart(head,hornGeo,horn,side*(.21-i*.009),-.15,.26+i*.113);
        tooth.rotation.z=Math.PI;tooth.scale.set(.55,.17+(i%3)*.045,.55);
      }
    }
    for(let i=0;i<7;i++){
      const ridge=meshPart(body,hornGeo,scale,0,.37+(i%2)*.10,-1.05+i*.32);
      ridge.rotation.x=-.71;ridge.scale.set(.71,.41+(i%3)*.11,.73);
    }
    const tail:T.Group[]=[];
    for(let i=0;i<tailGeos.length;i++){
      const segment=joint(tail.at(-1)??body,0,i===0?-.03:0,i===0?-1.03:-(.67-(i-1)*.043));
      meshPart(segment,tailGeos[i],scale);
      if(i>2) meshPart(segment,hornGeo,horn,0,.095,-.16).scale.setScalar(.29-i*.014);
      tail.push(segment);
    }
    const wings=[-1,1].map(side=>{
      const hinge=joint(body,side*.43,.45,.36), elbow=joint(hinge,1.55,.076,.081);
      hinge.scale.x=side;
      meshPart(hinge,mainWing,membrane);
      meshPart(elbow,outerWing,membrane);
      beam(hinge,armBone,new T.Vector3(0,0,0),new T.Vector3(1.70,.10,.36),1.85,1.35);
      for(const [x,z] of [[1.72,-.48],[1.23,-.98],[.63,-1.15]]) beam(hinge,wingEdge,
        new T.Vector3(.16,0,.015),new T.Vector3(x,-.12,z),1.54,.94);
      for(const [x,z] of [[2.10,-.31],[1.93,-1.19],[1.12,-1.36],[.30,-1.38]]) beam(elbow,wingEdge,
        new T.Vector3(),new T.Vector3(x,-.12,z),1.54,.87);
      return {hinge,elbow,side};
    });
    const legs=[[-1,.55],[1,.55],[-1,-.76],[1,-.76]].map(([side,z],i)=>{
      const upper=joint(body,side*(i<2?.40:.416),-.18,z), knee=joint(upper,0,-.47,.043);
      meshPart(upper,thighGeo,scale,0,0,0).scale.setScalar(i<2?.86:1.02);
      meshPart(knee,shinGeo,scale,0,-.075,0).scale.set(.75,.83,.82);
      meshPart(knee,pawGeo,belly,0,-.43,.08).scale.set(.76,.78,.86);
      for(let j=0;j<3;j++){
        const nail=meshPart(knee,hornGeo,horn,(j-1)*.123,-.473,.426);
        nail.rotation.x=Math.PI/2;nail.scale.set(.44,.29,.46);
      }
      return {upper,knee};
    });
    batch.bake(root);
    return {root,animate(p){
      const t=p.frozen?0:p.time, casting=p.windup, snap=p.recovery, flight=p.leap, fall=T.MathUtils.smoothstep(p.dead,0,1);
      body.position.y=1.23+.035*Math.sin(t*2.4)+p.gait*.045*Math.cos(p.phase*2)-fall*.91;
      body.rotation.set(.10*casting-.23*snap-.18*flight,Math.sin(p.phase)*p.gait*.06,fall*.78+p.hit*.12);
      neck.rotation.set(-.38*casting+.28*snap-.10*flight,(p.turn??0)*.36,0);
      head.rotation.set(-.23*casting+.19*snap,p.hit*.11,0);
      jaw.rotation.x=.05+.63*casting+.31*snap+.18*flight;
      for(const [i,segment] of tail.entries()){
        segment.rotation.x=.06+Math.sin(t*1.92-i*.63)*(.06+.07*p.gait)+flight*.13-fall*.09;
        segment.rotation.y=Math.sin(t*2.2-i*.73)*(.12+.10*p.gait)+(p.turn??0)*.25+(i<3?snap*.29:0);
      }
      for(const {hinge,elbow,side} of wings){
        const flap=Math.sin(t*(flight>.1?7.9:3.2));
        hinge.rotation.set(-.13,side*(.44-.53*flight- casting*.27),
          side*(-.69+flight*(.84+flap*.66)+casting*.22+fall*.48));
        elbow.rotation.set(.13+flight*.17,side*(.54-.55*flight),side*(-.38-flight*flap*.49));
      }
      legs.forEach(({upper,knee},i)=>{
        const step=Math.sin(p.phase+(i%2)*Math.PI+(i>1?.49:0));
        upper.rotation.x=step*p.gait*.50-flight*.59+fall*.43;
        knee.rotation.x=-Math.max(0,-step)*p.gait*.51+flight*.76;
      });
    }};
  }
  return {makeGolem,makeDragon,dispose(){batch.dispose();resources.forEach(resource=>resource.dispose());}};
}
