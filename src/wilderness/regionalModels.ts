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
  const batch=rigidBatcher();
  function form(parent:T.Object3D,geo:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,w:number,h:number,d:number){
    const mesh=meshPart(parent,geo,m,x,y,z);mesh.scale.set(w,h,d);return mesh;
  }
  return {
    make(kind:RegionalKind){
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
      for(const resource of [rock,shard,box,tusk,blade,cape,trollSkin,stone,iron,brass,leather,bone,cloth,azure,violet,yellow]) resource.dispose();
    },
  };
}
