import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loft, shapedPlate, joint, meshPart, rigidBatcher, type CreatureRig } from './creatureGeometry.ts';

export function skeletonModels(){
  const bone=new T.MeshStandardMaterial({color:0xc1b5a3,roughness:.89,flatShading:true});
  const rust=new T.MeshStandardMaterial({color:0x685044,roughness:.73,metalness:.33});
  const steel=new T.MeshStandardMaterial({color:0x8d8982,roughness:.49,metalness:.48});
  const hollow=new T.MeshStandardMaterial({color:0x181621,roughness:1});
  const skull=loft([[-.207,.074,-.11,.13],[-.14,.171,-.17,.234],[-.04,.194,-.17,.263],[.09,.174,-.178,.227],
    [.186,.14,-.12,.148],[.234,.111,-.11,.08]],16);
  const jaw=shapedPlate([[-.12,.04],[-.118,-.048],[-.068,-.09],[.066,-.09],[.118,-.041],[.12,.04],[.08,.013],[-.08,.014]],.11,.015);
  const socket=shapedPlate([[-.042,.014],[-.029,-.037],[.041,-.032],[.061,.009],[.030,.039]],.015,.010);
  const nose=shapedPlate([[-.03,-.03],[0,.046],[.033,-.029]],.01,.006);
  const tooth=new T.BoxGeometry(.022,.045,.031);
  const ribPieces=Array.from({length:6},(_,i)=>{
    const curve=new T.CatmullRomCurve3([
      new T.Vector3(-.037,0,-.13),new T.Vector3(-.198,0,-.076),new T.Vector3(-.252,-.03,.028),
      new T.Vector3(-.177,-.067,.159),new T.Vector3(-.040,-.09,.189),new T.Vector3(.040,-.09,.189),
      new T.Vector3(.177,-.067,.159),new T.Vector3(.252,-.03,.028),new T.Vector3(.198,0,-.076),new T.Vector3(.037,0,-.13),
    ]);
    const size=1-(i>2?(i-2)*.062:0);
    const tube=new T.TubeGeometry(curve,18-i, .019+(i%2)*.004,5,false);
    const result=tube.toNonIndexed();tube.dispose();
    return result.scale(size,1,size).translate(0,1.55-i*.085,0);
  });
  const ribs=mergeGeometries(ribPieces);
  ribPieces.forEach(part=>part.dispose());
  if(!ribs) throw Error('Could not assemble rib cage.');
  const vertebra=loft([[-.066,.023,-.02,.028],[-.038,.047,-.043,.047],[.04,.049,-.042,.045],[.068,.024,-.021,.019]],8);
  const shaft=loft([[-.034,.052,-.048,.047],[.052,.061,-.061,.059],[.144,.037,-.038,.042],[.32,.036,-.035,.034],
    [.39,.064,-.062,.068],[.43,.054,-.053,.051]],10).rotateX(Math.PI/2);
  const pelvis=shapedPlate([[-.23,.09],[-.207,-.06],[-.102,-.123],[0,-.045],[.102,-.123],[.207,-.06],[.23,.09],[.085,.015],[-.085,.015]],.116,.029);
  const armor=shapedPlate([[-.15,-.061],[-.173,.079],[-.087,.153],[.098,.137],[.16,.045],[.122,-.092]],.105,.028);
  const grooved=shapedPlate([[-.13,-.16],[-.129,.137],[-.085,.202],[.087,.196],[.13,.123],[.119,-.148]],.075,.019);
  const feet=loft([[-.064,.058,-.052,.039],[.02,.087,-.052,.06],[.151,.102,-.047,.024],[.197,.054,-.038,.01]],9);
  const blade=shapedPlate([[-.071,.04],[.067,.04],[.062,.66],[.037,.78],[-.018,.89],[-.065,.70]],.04,.015);
  const guard=shapedPlate([[-.18,-.03],[.17,-.034],[.12,.034],[-.13,.034]],.067,.016);
  const shield=shapedPlate([[-.19,.17],[.20,.17],[.192,-.12],[.09,-.242],[0,-.282],[-.094,-.232],[-.19,-.12]],.048,.027);
  const gold=new T.MeshStandardMaterial({color:0xb88c4f,metalness:.65,roughness:.53});
  const royalPlate=new T.MeshStandardMaterial({color:0x43424d,metalness:.63,roughness:.44});
  const grim=new T.MeshStandardMaterial({color:0x342436,roughness:.97,side:T.DoubleSide});
  const fire=new T.MeshStandardMaterial({color:0xc8ffde,emissive:0x55dfad,emissiveIntensity:.83});
  const crown=shapedPlate([[-.216,-.054],[-.234,.129],[-.171,.067],[-.129,.178],[-.066,.082],[0,.215],[.071,.077],[.142,.177],[.182,.062],[.226,.132],[.209,-.047]],.09,.014);
  const crest=shapedPlate([[-.27,.12],[-.257,.226],[-.10,.207],[0,.27],[.106,.206],[.25,.22],[.281,.085],[.208,-.099],[.09,-.18],[0,-.142],[-.095,-.18],[-.176,-.093]],.07,.02);
  const rag=shapedPlate([[-.052,.08],[.052,.08],[.071,-.36],[.10,-.94],[.048,-.78],[.012,-1.11],[-.033,-.96],[-.09,-1.02]],.013,.002);
  const rune=shapedPlate([[0,.17],[-.042,.041],[-.093,.018],[-.021,-.035],[0,-.155],[.032,-.043],[.081,.02],[.031,.057]],.008,0);
  const batcher=rigidBatcher();
  const resources=[bone,rust,steel,hollow,skull,jaw,socket,nose,tooth,ribs,vertebra,shaft,pelvis,armor,grooved,feet,blade,guard,shield,gold,royalPlate,grim,fire,crown,crest,rag,rune];
  return {
    make(king=false):CreatureRig{
      const root=new T.Group(), body=joint(root);
      meshPart(body,ribs,bone);
      for(let i=0;i<14;i++) meshPart(body,vertebra,bone,0,.97+i*.049,-.127+Math.sin(i*.3)*.025);
      meshPart(body,pelvis,bone,0,.94,-.065);
      const head=joint(body,0,1.86,.008);
      meshPart(head,skull,bone);
      for(const x of [-.082,.083]){
        meshPart(head,socket,hollow,x,.025,.205);
        if(king) meshPart(head,socket,fire,x,.024,.225).scale.set(.75,.38,.48);
      }
      const royalCloth:T.Group[]=[];
      if(king){
        meshPart(head,crown,gold,0,.251,.071);
        const back=meshPart(head,crown,gold,0,.236,-.072);back.rotation.y=Math.PI;
        meshPart(head,rune,fire,0,.291,.176).scale.setScalar(.41);
        meshPart(body,crest,royalPlate,0,1.44,.128).scale.set(1.0,1.04,.92);
        meshPart(body,rune,fire,0,1.47,.213).scale.setScalar(.76);
        meshPart(body,crest,gold,0,1.21,.128).scale.set(.60,.26,.74);
        for(let i=0;i<6;i++){
          const strip=joint(body,(i-2.5)*.098,1.56,-.161);
          meshPart(strip,rag,grim);royalCloth.push(strip);
        }
      }
      meshPart(head,nose,hollow,0,-.045,.233);
      const mandible=joint(head,0,-.10,.103);
      meshPart(mandible,jaw,bone);
      for(let i=-3;i<=3;i++) meshPart(mandible,tooth,bone,i*.027,.055,.103-Math.abs(i)*.007).scale.y=.53;
      const limbs=[-1,1].map(side=>{
        const thigh=joint(body,side*.128,.91,0), shin=joint(thigh,0,-.403);
        meshPart(thigh,shaft,bone);
        meshPart(shin,shaft,bone).scale.set(.87,.97,.86);
        meshPart(shin,feet,bone,0,-.442,.017);
        if(side===1) meshPart(shin,grooved,rust,0,-.227,.018);
        const shoulder=joint(body,side*.29,1.515,.001), elbow=joint(shoulder,0,-.36);
        meshPart(shoulder,shaft,bone).scale.y=.86;
        meshPart(shoulder,armor,king?royalPlate:rust,0,-.023,-.036).scale.setScalar(king?1.31:1);
        if(king){
          meshPart(shoulder,crest,royalPlate,side*.091,.075,.034).scale.set(.61,.58,.7);
          meshPart(shoulder,crown,gold,side*.093,.083,.102).scale.set(.51,.51,.51);
        }
        meshPart(elbow,shaft,bone).scale.set(.75,.83,.75);
        if(side===-1){
          meshPart(elbow,shield,rust,-.07,-.19,.088);
          meshPart(elbow,shield,steel,-.07,-.19,.124).scale.set(.67,.72,.58);
        } else {
          const weapon=joint(elbow,0,-.286,.04);
          weapon.rotation.x=-1.77;
          const cutting=meshPart(weapon,blade,king?royalPlate:steel);
          if(king){cutting.scale.set(1.53,1.70,1.32);meshPart(weapon,rune,fire,0,.62,.061).scale.set(.48,1.69,1);}
          meshPart(weapon,guard,king?gold:rust).scale.setScalar(king?1.49:1);
          meshPart(weapon,shaft,rust,0,.017,0).scale.set(.59,.34,.55);
        }
        return {thigh,shin,shoulder,elbow};
      });
      batcher.bake(root);
      return {root,animate(p){
        body.rotation.set(p.windup*-.12+p.recovery*.28,Math.sin(p.phase)*p.gait*.09,p.dead*1.45+p.hit*.23);
        body.position.y=-p.dead*.75+.042*p.gait*Math.abs(Math.sin(p.phase));
        head.rotation.y=p.hit*-.38+Math.sin(p.time*2)*.03;
        royalCloth.forEach((strip,i)=>{
          strip.rotation.x=-.23-.35*p.gait+.13*Math.sin(p.time*4+i*.58)-p.windup*.23;
          strip.rotation.z=.07*Math.sin(p.time*4.8+i*.71);
        });
        mandible.rotation.x=.08+p.windup*.23+p.recovery*.36;
        limbs.forEach(({thigh,shin,shoulder,elbow},i)=>{
          const cycle=p.phase+i*Math.PI;
          thigh.rotation.x=Math.sin(cycle)*.56*p.gait+p.dead*.37;
          shin.rotation.x=Math.max(0,Math.cos(cycle))*.56*p.gait;
          if(i===1){
            shoulder.rotation.x=-.21+Math.sin(cycle)*.19*p.gait-2.30*p.windup-.68*p.recovery;
            shoulder.rotation.y=-.33*p.windup+.58*p.recovery;
            elbow.rotation.x=-.33-.87*p.windup+.19*p.recovery;
          }else{
            shoulder.rotation.x=-.31+Math.sin(cycle)*.17*p.gait-.42*p.windup;
            elbow.rotation.x=-.76-.29*p.windup;
          }
        });
      }};
    },
    dispose(){batcher.dispose();resources.forEach(resource=>resource.dispose());},
  };
}
