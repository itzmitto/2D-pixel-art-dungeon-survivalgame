import * as T from 'three';
import { joint, meshPart, rigidBatcher, shapedPlate } from './creatureGeometry.ts';
import type { RegionalKind } from './huntData.ts';

export function regionalModels(){
  const rock=new T.DodecahedronGeometry(1);
  const shard=new T.OctahedronGeometry(1);
  const box=new T.BoxGeometry();
  const tusk=new T.ConeGeometry(1,1,5);
  const blade=shapedPlate([[-.13,0],[.13,0],[.18,.95],[.085,1.34],[0,1.45],[-.14,1.21]],.09,.018).translate(0,0,-.045);
  const cape=shapedPlate([[-.45,0],[.45,0],[.51,-1.02],[.31,-.93],[.14,-1.12],[-.33,-1.04],[-.5,-.87]],.027,0);
  const mat=(color:number,metalness=0)=>new T.MeshStandardMaterial({color,metalness,roughness:.76,flatShading:true});
  const trollSkin=mat(0x71806c), stone=mat(0x576275), iron=mat(0x4b5263,.66), brass=mat(0x997652,.57);
  const leather=mat(0x3c3331), bone=mat(0xc0b798), cloth=mat(0x211e2b);
  const azure=new T.MeshStandardMaterial({color:0x75caff,emissive:0x33aaff,emissiveIntensity:1.65});
  const violet=new T.MeshStandardMaterial({color:0xb998f1,emissive:0x7131d5,emissiveIntensity:1.2});
  const yellow=new T.MeshStandardMaterial({color:0xd0e792,emissive:0xb0c849,emissiveIntensity:.87});
  const amphibian=mat(0x34534d), shell=mat(0x293841,.28), toxic=new T.MeshStandardMaterial({color:0x8ae8a3,emissive:0x42af70,emissiveIntensity:1.53});
  const batch=rigidBatcher();
  function form(parent:T.Object3D,geo:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,w:number,h:number,d:number){
    const mesh=meshPart(parent,geo,m,x,y,z);mesh.scale.set(w,h,d);return mesh;
  }
  function swimmer(queen:boolean){
    const root=new T.Group(), body=joint(root,0,queen?.82:.67);
    form(body,rock,amphibian,0,0,-.36,queen?.64:.40,.38,queen?1.21:.79);
    form(body,rock,shell,0,.27,-.43,queen?.67:.40,.32,.87);
    const tail=joint(body,0,-.11,-.92);
    form(tail,rock,amphibian,0,0,-.43,.23,.18,.59);
    form(tail,tusk,toxic,0,.03,-.96,.12,.39,.12).rotation.x=-1.37;
    const head=joint(body,0,.03,.61);
    form(head,rock,shell,0,.07,.16,.37,.27,.43);
    const jaw=joint(head,0,-.15,.13);
    form(jaw,rock,amphibian,0,-.01,.2,.29,.12,.42);
    const limbs:{side:number;row:number;shoulder:T.Group;wrist:T.Group}[]=[];
    for(const side of [-1,1]){
      for(let eye=0;eye<(queen?3:1);eye++)
        form(head,shard,toxic,side*(.20+eye*.042),.156+eye*.02,.43-eye*.12,.061,.042,.045);
      for(let fang=0;fang<3;fang++)
        form(jaw,tusk,bone,side*(.14+fang*.047),.048,.43-fang*.10,.031,.15,.031);
      for(let row=0;row<(queen?3:2);row++){
        const shoulder=joint(body,side*.34,0,.4-row*.55);
        const wrist=joint(shoulder,side*.48,-.23,.11);
        form(shoulder,rock,amphibian,side*.24,-.09,.042,.38,.12,.15).rotation.z=-side*.32;
        form(wrist,rock,shell,side*.12,-.17,.06,.16,.28,.12).rotation.z=side*.35;
        for(let claw=0;claw<3;claw++)
          form(wrist,tusk,bone,side*(.14+claw*.062),-.35,.13+claw*.035,.05,.26,.051).rotation.x=1.83;
        limbs.push({side,row,shoulder,wrist});
      }
      if(queen) for(let i=0;i<4;i++){
        form(body,shard,toxic,side*(.23+.06*i),.35,-.19-i*.21,.18,.26,.16).rotation.z=-side*.41;
      }
    }
    batch.bake(root);
    return {root,animate({phase,gait,windup,recovery,hit,leap,dead,alert,technique}:import('./creatureGeometry.ts').CreaturePose){
      const spit=technique==='spit'||technique==='miasma';
      body.position.y=(queen?.82:.65)+(Math.abs(Math.sin(phase))*gait*.13)-windup*(spit?-.22:.22)+leap*.37-dead*.38;
      body.rotation.z=dead*1.05+Math.cos(phase)*gait*.083+hit*.15;
      body.rotation.x=spit?-windup*.28:windup*.34-recovery*.49;
      head.rotation.x=spit?-windup*.38:recovery*.24;
      jaw.rotation.x=windup*(spit?.75:.32)+recovery*.23;
      tail.rotation.y=Math.sin(phase*.6)*(.23+gait*.35)+windup*.19;
      for(const {side,row,shoulder,wrist} of limbs){
        const stride=Math.sin(phase+row*2.1+side*1.57)*gait;
        shoulder.rotation.y=stride*.41+side*(row===0?windup*.49:-.13);
        shoulder.rotation.z=side*(stride*.21+windup*(row===0?-.32:.14));
        wrist.rotation.x=-stride*.54+windup*.54-recovery*.64;
      }
      if(!alert&&!queen) body.position.y-=.14;
    }};
  }
  return {
    make(kind:RegionalKind){
      if(kind==='swampStalker'||kind==='venomQueen') return swimmer(kind==='venomQueen');
      const troll=kind==='mountainTroll'||kind==='trollKing', titan=kind==='ancientTitan';
      const knight=kind==='cursedKnight'||kind==='cursedWarlord', golem=!troll&&!knight;
      const glow=troll?yellow:knight?violet:azure, material=troll?trollSkin:knight?iron:stone;
      const root=new T.Group(), hips=joint(root,0,.91), chest=joint(hips,0,.38);
      const wide=troll||golem?.63:.43;
      form(hips,rock,troll?leather:material,0,0,0,wide*.75,.33,.29);
      form(chest,rock,material,0,.33,0,wide,.61,.35);
      form(chest,box,titan?brass:leather,0,-.14,0,wide*1.31,.14,.53);
      const head=joint(chest,0,.89,troll?.16:0);
      form(head,knight?box:rock,material,0,0,0,.26,.31,.27);
      form(head,rock,troll?stone:material,0,-.12,.15,.227,.145,.18);
      for(const side of [-1,1]){
        form(head,box,glow,side*.10,.047,.242,.127,.038,.033).rotation.z=side*.15;
        if(troll) form(head,tusk,bone,side*.17,-.095,.278,.06,.18,.06).rotation.z=side*.15;
        if(kind==='trollKing'||titan) form(head,tusk,brass,side*.18,.29,0,.094,.32,.10).rotation.z=side*-.28;
      }
      if(golem) form(chest,shard,glow,0,.34,.335,.22,.29,.11);
      if(knight||titan){
        form(chest,cape,cloth,0,.67,-.25,1,1.19,1).rotation.x=.23;
        for(const side of [-1,1]) for(let stripe=0;stripe<3;stripe++){
          form(chest,box,stripe===1?glow:brass,side*(.18+stripe*.078),.47-stripe*.16,.302,.15,.032,.027).rotation.z=side*.53;
        }
      }
      const limbs=[-1,1].map(side=>{
        const leg=joint(hips,side*wide*.57,-.06), knee=joint(leg,0,-.42);
        form(leg,rock,material,0,-.20,0,.196,.31,.184);
        form(knee,rock,material,0,-.19,0,.15,.28,.156);
        form(knee,box,knight?iron:material,0,-.39,.083,.29,.18,.43);
        const arm=joint(chest,side*(wide+.025),.59), elbow=joint(arm,0,-.43);
        form(arm,rock,titan?brass:material,0,-.02,0,wide*.46,.245,.30);
        form(arm,rock,material,0,-.245,0,.175,.29,.18);
        form(elbow,rock,material,0,-.20,0,.171,.29,.185);
        form(elbow,rock,material,0,-.42,0,.16,.17,.17);
        if(golem) form(elbow,box,glow,0,-.16,.172,.11,.051,.04);
        if(side===1&&(troll||knight||titan)){
          const grip=joint(elbow,0,-.40,.14);grip.rotation.x=-1.25;
          if(troll){
            form(grip,box,leather,0,.32,0,.115,1.01,.115);
            form(grip,rock,stone,0,.88,0,.29,.46,.25);
            form(grip,box,brass,0,.68,0,.42,.10,.43);
          }else{
            form(grip,blade,titan?stone:iron,0,.12,0,titan?1.65:1,titan?1.32:1,1);
            form(grip,box,brass,0,.11,0,.49,.10,.17);
            form(grip,box,glow,0,.62,.064,.034,.86,.035);
          }
        }
        if(side===-1&&knight) form(elbow,shard,iron,-.07,-.13,.19,.33,.51,.115);
        return {side,leg,knee,arm,elbow};
      });
      batch.bake(root);
      return {root,animate({phase,gait,windup,recovery,hit,leap,dead,technique}:import('./creatureGeometry.ts').CreaturePose){
        const overhead=technique==='slam'||technique==='quakes';
        const cast=technique==='rune'||technique==='curse';
        const guard=technique==='counter';
        hips.position.y=.91+Math.abs(Math.sin(phase))*gait*.075+leap*.19;
        hips.rotation.z=-dead*1.42+hit*.11;
        chest.rotation.x=(troll?.18:0)-windup*.18+recovery*(overhead?.55:.24)+leap*.25;
        chest.rotation.y=Math.sin(phase)*gait*.11+windup*(overhead?.12:.44)-recovery*.62;
        for(const {side,leg,knee,arm,elbow} of limbs){
          const stride=Math.sin(phase)*gait*side;
          leg.rotation.x=stride*.49-leap*.33;
          knee.rotation.x=Math.max(0,-stride)*.54+leap*.42;
          arm.rotation.x=-stride*.35-(side===1||overhead||cast?windup*(overhead?2.65:cast?1.72:1.2):0)+recovery*.56;
          arm.rotation.z=side*(.14+windup*(cast?.83:.29));
          elbow.rotation.x=-.23-windup*(guard&&side===-1?1.95:.54);
        }
      }};
    },
    dispose(){
      batch.dispose();
      for(const resource of [rock,shard,box,tusk,blade,cape,trollSkin,stone,iron,brass,leather,bone,cloth,azure,violet,yellow,amphibian,shell,toxic]) resource.dispose();
    },
  };
}
