import * as T from 'three';
import { loft,shapedPlate,joint,meshPart,type CreatureRig } from './creatureGeometry.ts';

export function goblinModels(){
  const skin=new T.MeshStandardMaterial({color:0x798267,roughness:.92,flatShading:true});
  const cheek=new T.MeshStandardMaterial({color:0x56614a,roughness:.91});
  const hide=new T.MeshStandardMaterial({color:0x694e36,roughness:.92,flatShading:true});
  const cloth=new T.MeshStandardMaterial({color:0x51403a,roughness:1});
  const metal=new T.MeshStandardMaterial({color:0x869095,roughness:.54,metalness:.46});
  const amber=new T.MeshBasicMaterial({color:0xd9bb78});
  const torso=loft([[-.16,.09,.64,1.18],[-.09,.23,.59,1.24],[.05,.25,.64,1.26],[.19,.19,.69,1.20],[.23,.11,.72,1.12]],14);
  const head=loft([[-.16,.069,-.14,.153],[-.10,.18,-.18,.225],[.052,.19,-.173,.21],[.16,.134,-.116,.129],[.216,.1,-.1,.071]],14);
  const ear=shapedPlate([[-.035,-.07],[-.073,.05],[.335,.119],[.238,-.017],[.091,-.10]],.063,.019);
  const lip=loft([[.05,.08,-.08,.045],[.12,.141,-.094,.07],[.222,.11,-.063,.026],[.27,.058,-.042,.012]],10);
  const brow=shapedPlate([[-.07,-.03],[-.08,.025],[.081,.055],[.086,-.007]],.041,.016);
  const iris=new T.IcosahedronGeometry(.035,0);
  const forearm=loft([[0,.084,-.083,.072],[.10,.089,-.092,.095],[.21,.063,-.063,.072],[.31,.078,-.059,.069]],11).rotateX(Math.PI/2);
  const thigh=loft([[0,.095,-.11,.11],[.11,.108,-.095,.11],[.215,.075,-.065,.066],[.32,.069,-.065,.066]],11).rotateX(Math.PI/2);
  const foot=loft([[-.064,.05,-.049,.043],[.04,.089,-.052,.055],[.17,.074,-.046,.02],[.207,.039,-.039,.003]],10);
  const blade=shapedPlate([[-.055,0],[.051,0],[.099,.178],[.082,.30],[.009,.47],[-.045,.31]],.037,.016);
  const guard=shapedPlate([[-.107,-.018],[.112,-.023],[.103,.031],[-.101,.039]],.057,.013);
  const waist=shapedPlate([[-.18,.09],[.17,.105],[.202,-.10],[.06,-.199],[-.139,-.17]],.054,.025);
  const plates=shapedPlate([[-.09,-.043],[-.09,.055],[.014,.113],[.109,.034],[.092,-.067]],.040,.018);
  const resources=[skin,cheek,hide,cloth,metal,amber,torso,head,ear,lip,brow,iris,forearm,thigh,foot,blade,guard,waist,plates];
  return {
    make():CreatureRig{
      const root=new T.Group(), core=joint(root);
      meshPart(core,torso,hide);
      meshPart(core,waist,cloth,0,.69,.128);
      for(let i=0;i<3;i++) meshPart(core,plates,hide,-.14+i*.131,.75+i%2*.047,.186);
      meshPart(core,plates,metal,0,.746,.234).scale.set(.35,.39,.68);
      const skull=joint(core,0,1.27,.12);
      meshPart(skull,head,skin);
      meshPart(skull,lip,cheek,0,-.091,-.004);
      for(const side of [-1,1]){
        const point=meshPart(skull,ear,skin,side*.129,.013,-.034);
        if(side<0) point.rotation.y=Math.PI;
        meshPart(skull,iris,amber,side*.100,.023,.169);
        meshPart(skull,brow,cheek,side*.093,.065,.143).rotation.z=side*.22;
      }
      const limbs=[-1,1].map(side=>{
        const hip=joint(core,side*.127,.66,0), knee=joint(hip,0,-.299);
        meshPart(hip,thigh,cloth);meshPart(knee,forearm,skin).scale.set(.8,.87,.83);
        meshPart(knee,foot,hide,0,-.294,.026);
        const arm=joint(core,side*.228,1.19,.011), elbow=joint(arm,0,-.26);
        meshPart(arm,forearm,skin).scale.y=.83;
        meshPart(arm,plates,hide,0,-.026,.055).rotation.z=side*.19;
        meshPart(elbow,forearm,skin).scale.set(.78,.86,.82);
        if(side===1){
          const socket=joint(elbow,0,-.239,.04);
          socket.rotation.x=-1.56;
          meshPart(socket,blade,metal);meshPart(socket,guard,hide);
        }
        return {hip,knee,arm,elbow};
      });
      return {root,animate(p){
        core.rotation.set(.145+p.gait*.22-p.windup*.16+p.recovery*.21,Math.sin(p.phase)*p.gait*.11,p.dead*1.43+p.hit*.26);
        core.position.y=-p.dead*.49+.041*p.gait*Math.abs(Math.sin(p.phase))-.05*p.windup;
        skull.rotation.x=-.13+p.hit*.32;
        skull.rotation.y=Math.sin(p.time*2)*.057;
        limbs.forEach(({hip,knee,arm,elbow},i)=>{
          const cycle=p.phase+i*Math.PI;
          hip.rotation.x=Math.sin(cycle)*.68*p.gait+p.dead*.37;
          knee.rotation.x=Math.max(0,Math.cos(cycle))*.67*p.gait;
          arm.rotation.x=-Math.sin(cycle)*.42*p.gait-(i===1?1.7*p.windup+1.22*p.recovery:.13);
          arm.rotation.z=(i===1?1:-1)*(.19+.39*p.windup);
          elbow.rotation.x=-.46-.49*p.windup;
        });
      }};
    },
    dispose(){resources.forEach(resource=>resource.dispose());},
  };
}
