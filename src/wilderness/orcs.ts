import * as T from 'three';
import { joint, loft, meshPart, rigidBatcher, shapedPlate, type CreatureRig } from './creatureGeometry.ts';

export function orcModels(){
  const resources:(T.Material|T.BufferGeometry)[]=[];
  const own=<TResource extends T.Material|T.BufferGeometry>(value:TResource)=>{resources.push(value);return value;};
  const metal=(color:number,metalness=0,roughness=.88)=>own(new T.MeshStandardMaterial({color,metalness,roughness}));
  const skin=metal(0x596342), darkSkin=metal(0x444c34), scars=metal(0x76554a), wound=metal(0x44302e);
  const leather=metal(0x51392c), strap=metal(0x31282b), cloth=metal(0x464133), wood=metal(0x68452e);
  const iron=metal(0x626970,.56,.53), trim=metal(0xa39b87,.59,.48), fang=metal(0xe0cba3,.04,.56);
  const eyes=own(new T.MeshStandardMaterial({color:0xffbc6c,emissive:0xc76127,emissiveIntensity:.56}));
  const makeLoft=(rings:Parameters<typeof loft>[0],sides=12)=>own(loft(rings,sides));
  const vertical=(rings:Parameters<typeof loft>[0],sides=12)=>makeLoft(rings,sides).rotateX(-Math.PI/2);
  const plate=(points:Parameters<typeof shapedPlate>[0],depth:number,bevel=.017)=>own(shapedPlate(points,depth,bevel));
  const chest=vertical([[-.14,.22,-.16,.12],[.02,.29,-.20,.18],[.25,.34,-.22,.22],[.48,.51,-.27,.26],
    [.65,.56,-.21,.26],[.77,.43,-.15,.19],[.92,.20,-.12,.11]],18);
  const muscle=vertical([[-.28,.089,-.076,.071],[-.17,.15,-.151,.086],[0,.22,-.154,.151],[.15,.209,-.109,.136],[.27,.10,-.08,.081]],14);
  const forearm=vertical([[-.37,.078,-.075,.066],[-.24,.091,-.094,.094],[-.08,.139,-.11,.113],[.03,.117,-.098,.095]],12);
  const knuckles=vertical([[-.15,.062,-.074,.076],[-.10,.109,-.091,.091],[.03,.083,-.068,.074],[.09,.061,-.066,.081]],10);
  const thigh=vertical([[-.42,.10,-.115,.111],[-.21,.15,-.15,.13],[.03,.19,-.15,.16],[.14,.139,-.115,.14]],13);
  const calf=vertical([[-.42,.069,-.070,.085],[-.28,.10,-.095,.091],[-.08,.128,-.118,.106],[.04,.083,-.076,.073]],12);
  const boot=makeLoft([[-.13,.081,-.078,.068],[-.05,.106,-.089,.12],[.10,.119,-.085,.087],[.235,.105,-.082,.036],[.28,.054,-.06,.027]],12);
  const head=vertical([[-.22,.122,-.18,.15],[-.115,.195,-.19,.178],[.015,.225,-.214,.20],[.135,.207,-.187,.20],
    [.235,.164,-.134,.153],[.29,.072,-.075,.076]],16);
  const jaw=makeLoft([[-.10,.134,-.085,.020],[.02,.192,-.12,.036],[.14,.154,-.115,.041],[.225,.092,-.073,.026]],14);
  const nose=makeLoft([[0,.075,-.043,.089],[.10,.070,-.023,.044],[.14,.038,-.025,.005]],9);
  const brow=makeLoft([[-.11,.038,-.021,.034],[-.03,.050,-.030,.042],[.10,.025,-.018,.024]],8).rotateY(Math.PI/2);
  const tusk=vertical([[0,.059,-.049,.047],[.083,.046,-.035,.039],[.166,.029,-.033,.025],
    [.246,.015,-.045,-.014],[.295,.003,-.053,-.046]],9);
  const ear=plate([[-.07,-.048],[-.076,.113],[.03,.281],[.131,.338],[.104,.14],[.043,.016]],.056);
  const earInner=plate([[-.044,.045],[-.042,.105],[.085,.27],[.055,.116]],.012,.008);
  const iris=makeLoft([[-.014,.035,-.016,.018],[.013,.043,-.02,.018],[.025,.027,-.012,.011]],10);
  const patch=plate([[-.22,.18],[-.095,.27],[.132,.24],[.234,.122],[.216,.010],[.139,.048],[.128,-.137],
    [-.129,-.201],[-.214,-.108],[-.189,.049]],.045);
  const strapGeo=plate([[-.065,-.45],[.065,-.45],[.077,.42],[.019,.48],[-.072,.43]],.024);
  const belt=vertical([[-.043,.298,-.188,.191],[.025,.326,-.205,.197],[.089,.300,-.19,.182]],14);
  const stud=own(new T.IcosahedronGeometry(.027,0));
  const buckle=plate([[-.080,-.059],[.068,-.065],[.090,.040],[.05,.07],[-.075,.055]],.027);
  const skirt=plate([[-.14,.20],[.16,.187],[.20,-.14],[.103,-.142],[.070,-.221],[-.157,-.16]],.040);
  const cut=plate([[0,0],[.054,.145],[.041,.159],[.022,.099]],.009,0);
  const blade=plate([[-.069,.12],[.069,.12],[.079,.52],[.022,.74],[-.04,.63],[-.080,.40]],.041,.022);
  const bevel=plate([[-.008,.17],[.041,.16],[.05,.50],[.022,.69]],.005,.003);
  const guard=plate([[-.14,.047],[-.08,.142],[0,.106],[.13,.141],[.08,.058]],.075);
  const grip=vertical([[-.20,.043,-.037,.041],[-.13,.052,-.042,.045],[.075,.049,-.040,.043],[.137,.057,-.047,.046]],8);
  const club=vertical([[-.29,.056,-.051,.063],[.02,.064,-.065,.065],[.31,.089,-.080,.079],[.62,.155,-.14,.16],
    [.92,.195,-.18,.17],[1.18,.168,-.17,.16],[1.34,.095,-.086,.080]],11);
  const collar=own(new T.CylinderGeometry(.173,.183,.092,10,1,true));
  const spike=vertical([[0,.055,-.05,.05],[.042,.048,-.044,.042],[.162,.002,-.005,.003]],6);
  const batch=rigidBatcher();

  return {
    make(brute:boolean,warlord=false):CreatureRig{
      const root=new T.Group(), hips=joint(root,0,.99), torso=joint(hips);
      meshPart(hips,belt,leather);meshPart(hips,buckle,trim,0,.019,.211);
      meshPart(hips,skirt,cloth,0,-.20,.157);
      for(const side of [-1,1]){
        meshPart(hips,skirt,leather,side*.226,-.16,.089).rotation.y=side*.67;
        meshPart(hips,stud,trim,side*.20,.022,.16);
      }
      meshPart(torso,chest,skin).scale.set(brute?1.09:.95,1,brute?1.13:.94);
      for(const side of [-1,1]){
        meshPart(torso,muscle,skin,side*.192,.474,.198).scale.set(.80,.54,.57);
        const harness=meshPart(torso,strapGeo,strap,side*.19,.40,.248);
        harness.rotation.z=side*.45;
        for(let i=0;i<3;i++) meshPart(torso,stud,trim,side*(.09+i*.051),.15+i*.158,.273);
      }
      if(brute){
        meshPart(torso,patch,iron,.13,.47,.29).rotation.z=-.23;
        meshPart(torso,cut,trim,.17,.39,.351).rotation.z=.55;
      }else{
        meshPart(torso,patch,leather,-.11,.43,.242).scale.set(.66,.75,.73);
        meshPart(torso,strapGeo,cloth,.02,.69,.225).rotation.z=1.56;
      }
      const skull=joint(torso,0,.99,.04);
      meshPart(skull,head,skin);
      meshPart(skull,jaw,darkSkin,0,-.149,.015);
      meshPart(skull,nose,darkSkin,0,-.050,.13);
      for(const side of [-1,1]){
        const eye=meshPart(skull,iris,eyes,side*.085,.032,.179);eye.rotation.z=side*.17;
        meshPart(skull,brow,darkSkin,side*.092,.075,.181).rotation.z=side*.21;
        const point=meshPart(skull,ear,skin,side*.201,.014,-.021);
        point.rotation.set(-.18,side*.52,-side*.68);point.scale.x=side;
        const inner=meshPart(skull,earInner,darkSkin,side*.227,.056,.025);
        inner.rotation.copy(point.rotation);inner.scale.x=side;
        const tuskMesh=meshPart(skull,tusk,fang,side*.122,-.188,.17);
        tuskMesh.rotation.z=-side*.26;
        if(warlord){
          tuskMesh.scale.set(1.35,1.64,1.21);
          const scar=meshPart(skull,cut,scars,side*.061,.047,.218);
          scar.rotation.z=side*.28;scar.scale.set(1.33,1.13,.72);
          meshPart(skull,patch,iron,side*.139,.245,.019).scale.set(.59,.79,1.12);
        }
        meshPart(skull,cut,side===1?scars:wound,side*.134,-.018,.202).rotation.z=side*.51;
      }
      if(warlord){
        meshPart(torso,patch,iron,-.03,.455,.283).scale.set(1.82,1.27,.92);
        for(const side of [-1,1]){
          const collar=meshPart(torso,spike,trim,side*.53,.69,.109);
          collar.rotation.z=-side*.63;collar.scale.set(1.4,2,1.28);
          meshPart(torso,cut,scars,side*.207,.307,.365).rotation.z=side*.57;
        }
      }
      const arms=[-1,1].map(side=>{
        const shoulder=joint(torso,side*(brute?.51:.47),.655,0);
        const elbow=joint(shoulder,0,-.328,.011), hand=joint(elbow,0,-.34,.012);
        meshPart(shoulder,muscle,skin,0,-.10,0).scale.set(brute?1.24:.91,1.11,1.06);
        meshPart(elbow,forearm,skin);meshPart(hand,knuckles,darkSkin);
        if(brute||side===-1){
          const pauldron=meshPart(shoulder,patch,brute?iron:leather,side*.075,.077,.04);
          pauldron.rotation.set(-.10,side*.28,-side*.46);
          pauldron.scale.set(brute?1.18:.8,brute?1:.73,.93);
          meshPart(shoulder,cut,trim,side*.06,.06,.116).rotation.z=side*.58;
        }
        meshPart(elbow,belt,strap,0,-.23).scale.set(.38,1.7,.50);
        meshPart(elbow,patch,iron,0,-.217,.086).scale.set(.48,.56,.46);
        const weapon=joint(hand,0,-.03,.07);
        if(brute){
          if(side===1){
            meshPart(weapon,club,wood);
            if(warlord) weapon.scale.set(1.53,1.39,1.43);
            for(const y of [.68,.89,1.10]) meshPart(weapon,collar,iron,0,y).rotation.z=.06;
            for(let i=0;i<8;i++){
              const a=i*2.399;
              const barb=meshPart(weapon,spike,iron,Math.cos(a)*.16,.65+i*.074,Math.sin(a)*.16);
              barb.rotation.set(Math.sin(a)*1.45,0,-Math.cos(a)*1.45);
            }
            for(let i=0;i<3;i++) meshPart(weapon,belt,leather,0,-.21+i*.104).scale.set(.24,.41,.31);
          }
        }else{
          meshPart(weapon,grip,leather);meshPart(weapon,guard,trim);
          meshPart(weapon,blade,iron);meshPart(weapon,bevel,trim,0,0,.037);
        }
        return {shoulder,elbow,weapon};
      });
      const legs=[-1,1].map(side=>{
        const upper=joint(hips,side*.201,-.064), shin=joint(upper,0,-.454,.025), foot=joint(shin,0,-.413);
        meshPart(upper,thigh,cloth);meshPart(shin,calf,leather);
        const greave=meshPart(shin,patch,brute?iron:leather,0,-.19,.092);
        greave.scale.set(.53,.98,.47);greave.rotation.y=side*.14;
        meshPart(foot,boot,strap,0,.01,.065);
        for(const y of [-.08,-.30]) meshPart(shin,belt,strap,0,y).scale.set(.43,.55,.59);
        return {upper,shin,foot};
      });
      batch.bake(root);
      return {root,animate(p){
        const breath=p.frozen?0:Math.sin(p.time*2.8)*.015, focus=p.alert??0, dash=p.leap;
        const strike=p.recovery**1.6, anticipation=p.windup*(1-strike), death=T.MathUtils.smoothstep(p.dead,0,1);
        const turn=p.turn??0, stride=p.gait*(1-anticipation*.76);
        hips.position.y=.99+breath+stride*.045*Math.cos(p.phase*2)-anticipation*(brute?.13:.18)-death*.69+dash*.13;
        hips.rotation.set(strike*(brute?.29:.2)+dash*.34,-turn*.14,turn*.13+death*1.47);
        torso.rotation.set(-anticipation*(brute?.32:-.32)+strike*.32+p.hit*-.26,
          (brute?-.24:.51)*anticipation-(brute?.16:.72)*strike, -.10*turn+p.hit*.17);
        skull.rotation.set(anticipation*.15-strike*.21+.13*dash,-torso.rotation.y*.54,-turn*.12);
        arms.forEach(({shoulder,elbow,weapon},i)=>{
          const side=i===0?-1:1, step=Math.sin(p.phase+i*Math.PI);
          const swing=step*stride*(brute?.47:.71);
          shoulder.rotation.set(swing-anticipation*(brute?(i===1?2.54:1.62):.84)
            +strike*(brute?(i===1?-.78:-.43):(i===1?-1.75:-.63))-dash*(i===1?.93:.16)+p.hit*.34,
          side*(focus*.21+anticipation*.37)-strike*side*.56,side*(.16+anticipation*.32+death*.45));
          elbow.rotation.x=-.20-focus*.20-anticipation*.71+strike*.26-dash*.37;
          weapon.rotation.x=brute?1.36+anticipation*2.10+strike*1.12:2.07+side*.35-strike*.78;
          weapon.rotation.z=side*.14;
        });
        legs.forEach(({upper,shin,foot},i)=>{
          const side=i===0?-1:1, phase=p.phase+i*Math.PI, step=Math.sin(phase), flex=Math.max(0,-Math.cos(phase));
          upper.rotation.x=step*stride*(brute?.46:.70)-anticipation*.34-dash*(i===0?.58:-.25)+death*.65;
          upper.rotation.z=side*(.095+death*.24)+turn*.17;
          shin.rotation.x=.09+flex*stride*.78+anticipation*.58+dash*.30+death*.43;
          foot.rotation.x=-(upper.rotation.x+shin.rotation.x)*.68;
        });
      }};
    },
    dispose(){batch.dispose();for(const resource of resources) resource.dispose();},
  };
}
