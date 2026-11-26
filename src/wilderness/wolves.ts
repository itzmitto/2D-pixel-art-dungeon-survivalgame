import * as T from 'three';
import { loft, joint, meshPart, rigidBatcher, type CreatureRig } from './creatureGeometry.ts';
import { randomSequence } from './layout.ts';

type Ring=readonly [z:number,width:number,bottom:number,top:number];
type Morph='wild'|'dire'|'elite'|'guardian';
type Coat={base:number;ridge:number;belly:number;tips:number;mane:number;iris:number};
const coats:Record<Morph,Coat>={
  wild:{base:0x645e59,ridge:0x3a3a45,belly:0xa29783,tips:0x89827d,mane:0x534c49,iris:0xf0b274},
  dire:{base:0x514440,ridge:0x281f26,belly:0x847263,tips:0xa78b70,mane:0x382e31,iris:0xff9f52},
  elite:{base:0x45383e,ridge:0x261e29,belly:0x806669,tips:0xaf7969,mane:0x402e38,iris:0xff735c},
  guardian:{base:0x4e5063,ridge:0x292a43,belly:0xa4a2ad,tips:0xc5c2ce,mane:0x66667f,iris:0x90ffff},
};
const bodyShape:Ring[]=[
  [-1.15,.08,1.07,1.36],[-1.04,.23,.94,1.46],[-.87,.32,.82,1.55],[-.68,.31,.76,1.55],
  [-.44,.273,.84,1.53],[-.21,.277,.78,1.57],[.05,.323,.64,1.64],[.30,.391,.58,1.77],
  [.54,.397,.61,1.82],[.73,.335,.70,1.77],[.91,.256,.83,1.65],[1.02,.13,1.01,1.48],
];
const direBody:Ring[]=bodyShape.map(([z,w,b,t])=>[z,w*(z>.03?1.14:1.02),b-(z>0?.065:.02),t+(z>0?.14:.035)]);
const guardianBody:Ring[]=bodyShape.map(([z,w,b,t])=>[z,w*(z>.03?1.26:1.065),b-(z>0?.10:.035),t+(z>0?.23:.055)]);
const maneShape:Ring[]=[
  [-.26,.16,.94,1.61],[-.04,.31,.79,1.81],[.18,.398,.74,1.97],[.42,.446,.70,2.04],
  [.64,.42,.73,2.04],[.84,.352,.79,1.93],[1.04,.292,.91,1.82],[1.21,.205,1.09,1.69],
];
const skullShape:Ring[]=[
  [-.25,.128,-.16,.25],[-.14,.221,-.205,.315],[.01,.256,-.219,.343],[.18,.243,-.187,.304],
  [.32,.206,-.151,.216],[.43,.153,-.13,.126],[.57,.125,-.105,.098],[.73,.108,-.093,.059],[.83,.081,-.065,.045],
];

function ringPoint(rings:readonly Ring[],z:number,a:number){
  let index=1;
  while(index<rings.length-1&&rings[index][0]<z) index++;
  const lo=rings[index-1], hi=rings[index], t=T.MathUtils.clamp((z-lo[0])/(hi[0]-lo[0]),0,1);
  const w=T.MathUtils.lerp(lo[1],hi[1],t), bottom=T.MathUtils.lerp(lo[2],hi[2],t), top=T.MathUtils.lerp(lo[3],hi[3],t);
  return new T.Vector3(Math.cos(a)*w,(top+bottom)/2+(top-bottom)/2*Math.sin(a),z);
}

function peltGeometry(rings:readonly Ring[],sides:number,palette:Coat,face=false){
  const geometry=loft(rings,sides), vertices=geometry.attributes.position;
  const base=new T.Color(palette.base), keel=new T.Color(palette.ridge), pale=new T.Color(palette.belly), color=new T.Color();
  const shades=new Float32Array(vertices.count*3);
  for(let i=0;i<vertices.count;i++){
    const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i);
    const top=face?T.MathUtils.smoothstep(y,.015,.23):T.MathUtils.smoothstep(y,1.23,1.71);
    const under=face?1-T.MathUtils.smoothstep(y,-.16,-.03):1-T.MathUtils.smoothstep(y,.75,1.06);
    const grain=Math.sin(x*23+z*16)*Math.cos(y*22-z*13);
    color.copy(base).lerp(keel,top*.72).lerp(pale,under*.76).multiplyScalar(1+grain*.14);
    color.toArray(shades,i*3);
  }
  return geometry.setAttribute('color',new T.BufferAttribute(shades,3));
}

// Overlapping tapered locks follow the skin surface in rows.
function fur(rings:readonly Ring[],rows:number,lanes:number,length:number,lift:number,palette:Coat,seed:number,minAngle:number,maxAngle:number){
  const positions:number[]=[],colors:number[]=[];
  const random=randomSequence(seed), dark=new T.Color(palette.mane), light=new T.Color(palette.tips);
  const color=new T.Color(), edgeA=new T.Vector3(),edgeB=new T.Vector3();
  const start=rings[0][0],end=rings.at(-1)![0];
  for(let row=0;row<rows;row++) for(let lane=0;lane<lanes;lane++){
    const a=T.MathUtils.lerp(minAngle,maxAngle,(lane+.19+random()*.52)/lanes);
    const z=T.MathUtils.lerp(start,end,(row+.30+random()*.42)/rows);
    const blade=length*(.65+random()*.65), width=(maxAngle-minAngle)/lanes*(.44+random()*.20);
    const height=lift*(.69+random()*.62), tint=random()*.33;
    const exterior=new T.Vector3(Math.cos(a),Math.sin(a),0);
    function node(back:number,offset:number,rise:number){
      return ringPoint(rings,z-back*blade,a+width*offset).addScaledVector(exterior,rise*height);
    }
    const left=node(.12,-1,.03), right=node(.12,1,.03), root=node(-.18,0,.04), ridge=node(.22,0,.78);
    const fold=node(.65,-.11,1.03), leftFold=node(.55,-.64,.36), rightFold=node(.54,.62,.42);
    const tip=node(1.12,.21,1.11);
    const points=[root,left,right,ridge,leftFold,rightFold,fold,tip];
    const faces=[[0,1,3],[0,3,2],[1,4,3],[3,4,6],[3,6,5],[2,3,5],[4,7,6],[6,7,5]];
    for(const [i,j,k] of faces){
      const sign=edgeA.subVectors(points[j],points[i]).cross(edgeB.subVectors(points[k],points[i])).dot(exterior);
      for(const v of sign>0?[i,j,k]:[i,k,j]){
        const p=points[v];positions.push(p.x,p.y,p.z);
        color.copy(dark).lerp(light,tint+(v===7?.46:v===6?.27:v===3?.20:0));
        colors.push(color.r,color.g,color.b);
      }
    }
  }
  const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(positions,3))
    .setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  return geometry;
}

function pathRidge(points:readonly (readonly [number,number,number])[],width:number){
  const path=new T.CatmullRomCurve3(points.map(([x,y,z])=>new T.Vector3(x,y,z)));
  return new T.TubeGeometry(path,Math.max(5,points.length*2),width,4,false);
}

export function wolfModels(){
  const resources:(T.Material|T.BufferGeometry)[]=[];
  const own=<R extends T.Material|T.BufferGeometry>(resource:R)=>{resources.push(resource);return resource;};
  const hide=own(new T.MeshStandardMaterial({vertexColors:true,roughness:.94}));
  const matte=(color:number,roughness=.93)=>own(new T.MeshStandardMaterial({color,roughness}));
  const enamel=matte(0xe2cfac,.64), pads=matte(0x3d3439), nose=matte(0x241e23,.68), gums=matte(0x42272d);
  const pupil=own(new T.MeshBasicMaterial({color:0x23181d}));
  const marrow=matte(0x9f7485), oldScar=matte(0x412b37);
  const ether=own(new T.MeshStandardMaterial({color:0x485885,metalness:.38,roughness:.43,emissive:0x334987,emissiveIntensity:.48}));
  const runes=own(new T.MeshBasicMaterial({color:0x8adfff,toneMapped:false}));
  const noseGeo=own(loft([[.74,.093,-.053,.049],[.80,.101,-.051,.057],[.859,.061,-.031,.041]],14));
  const fang=own(loft([[-.017,.004,-.002,.004],[.026,.012,-.011,.012],[.103,.027,-.027,.028],[.14,.023,-.024,.022]],8).rotateX(-Math.PI/2));
  const smallTooth=own(loft([[-.012,.002,-.002,.003],[.047,.014,-.012,.014],[.095,.019,-.017,.019]],5).rotateX(-Math.PI/2));
  const iris=own(loft([[-.018,.034,-.016,.017],[0,.052,-.026,.026],[.022,.026,-.013,.013]],10));
  const pupilGeo=own(loft([[0,.008,-.017,.017],[.012,.012,-.021,.021]],8));
  const crown=own(loft([[-.07,.096,-.077,.066],[.03,.12,-.073,.095],[.25,.079,-.056,.066],[.45,.035,-.026,.034],[.59,.003,-.003,.006]],7).rotateX(-Math.PI/2));
  const batcher=rigidBatcher(true);

  function forms(kind:Morph){
    const palette=coats[kind],wild=kind==='wild',boss=kind==='guardian';
    const body=boss?guardianBody:wild?bodyShape:direBody;
    const cuff:Ring[]=[[-.25,.055,-.070,.055],[-.15,.12,-.115,.10],[-.04,.162,-.12,.14],[.09,.14,-.13,.13],[.22,.078,-.07,.068]];
    const jaw:Ring[]=[[-.065,.106,-.045,.051],[.04,.169,-.091,.06],[.25,.155,-.097,.047],[.49,.118,-.081,.030],[.72,.082,-.054,.022],[.79,.049,-.029,.014]];
    const neck:Ring[]=[
      [.54,.19,-.56,.10],[.71,.28,-.51,.18],[.89,.292,-.44,.32],[1.06,.26,-.29,.39],[1.23,.194,-.19,.33],[1.33,.135,-.10,.25],
    ];
    const upper=(front:boolean):Ring[]=>front
      ? [[-.06,.077,-.12,.09],[.06,.142,-.19,.12],[.19,.149,-.15,.15],[.33,.106,-.082,.115],[.46,.074,-.064,.080],[.55,.060,-.058,.068]]
      : [[-.065,.10,-.13,.077],[.08,.172,-.227,.103],[.19,.159,-.176,.160],[.33,.103,-.092,.105],[.43,.076,-.073,.072],[.49,.061,-.057,.063]];
    const shin=(front:boolean):Ring[]=>front
      ? [[-.025,.06,-.07,.066],[.12,.064,-.069,.079],[.29,.053,-.053,.06],[.43,.044,-.045,.057],[.56,.046,-.047,.052]]
      : [[-.025,.065,-.064,.07],[.15,.074,-.078,.086],[.30,.057,-.06,.056],[.43,.040,-.042,.054],[.55,.046,-.052,.050]];
    const tail:Ring[]=[
      [-.84,.107,-.195,.026],[-.67,.152,-.173,.123],[-.48,.164,-.115,.191],[-.27,.135,-.081,.190],[-.11,.105,-.070,.145],[.03,.081,-.077,.068],
    ];
    const brush:Ring[]=[[-.59,.009,-.23,-.19],[-.48,.05,-.205,-.087],[-.33,.091,-.167,.010],[-.17,.119,-.124,.095],[.05,.116,-.10,.114]];
    const ears:Ring[]=[[-.026,.110,-.068,.071],[.10,.130,-.065,.079],[.21,.095,-.060,.06],[.31,.062,-.042,.042],[.43,.021,-.024,.023],[.47,.003,-.004,.004]];
    // Vertical forms are lofted along their joint's long axis.
    const furLayer=(rings:readonly Ring[],rows:number,lanes:number,length:number,height:number,seed:number,from:number,to:number)=>
      own(fur(rings,rows,lanes,length,height,palette,seed,from,to));
    const hideForm=(rings:readonly Ring[],sides:number,face=false)=>own(peltGeometry(rings,sides,palette,face));
    const irisMaterial=own(new T.MeshStandardMaterial({
      color:palette.iris,emissive:palette.iris,emissiveIntensity:wild?.37:boss?1.05:.68,roughness:.39,
    }));
    function limb(rings:readonly Ring[],sides:number,color:number){
      const geometry=own(loft(rings,sides)), colorData=new Float32Array(geometry.attributes.position.count*3);
      const paint=new T.Color(color);
      for(let i=0;i<colorData.length;i+=3) paint.toArray(colorData,i);
      return geometry.setAttribute('color',new T.BufferAttribute(colorData,3));
    }
    const mane=wild?body:maneShape;
    const baseCoat=wild?furLayer(body,10,9,.24,.071,57,-.25,3.37):furLayer(body,boss?12:11,boss?12:10,.25,.083,57,-.34,3.46);
    return {
      body:hideForm(body,boss?24:20),
      baseCoat,
      mane:wild?null:furLayer(mane,boss?13:9,boss?14:11,boss?.43:.32,boss?.13:.097,133,-.95,4.1),
      maneBase:wild?null:hideForm(mane,21),
      neck:hideForm(neck,18,true),
      cheek:furLayer(skullShape.slice(0,5),boss?5:4,boss?9:7,.20,.065,103,-.99,4.13),
      skull:hideForm(skullShape,boss?20:16,true),jaw:hideForm(jaw,boss?16:12,true),
      gum:own(loft([[.14,.123,.009,.031],[.47,.100,.002,.023],[.73,.071,.003,.023]],10)),
      upperFront:limb(upper(true),boss?16:12,palette.base).rotateX(Math.PI/2),
      upperBack:limb(upper(false),boss?16:12,palette.base).rotateX(Math.PI/2),
      shinFront:limb(shin(true),boss?12:9,palette.mane).rotateX(Math.PI/2),
      shinBack:limb(shin(false),boss?12:9,palette.mane).rotateX(Math.PI/2),
      legFur:furLayer(cuff,boss?4:3,boss?8:5,.15,.041,183,-.2,4).rotateX(Math.PI/2),
      paw:limb([[-.14,.048,-.091,.066],[-.064,.088,-.115,.091],[.06,.119,-.113,.077],[.19,.116,-.109,.025],[.24,.077,-.081,.010]],boss?16:12,palette.base),
      toe:limb([[.13,.036,-.092,.023],[.20,.041,-.091,.002],[.253,.029,-.076,-.029]],boss?8:6,palette.mane),
      tail:hideForm(tail,16), tailCoat:furLayer(tail,boss?7:5,boss?8:6,.24,.067,807,-.2,5.7),
      brush:hideForm(brush,14), brushCoat:furLayer(brush,boss?6:4,boss?8:6,.21,.053,504,-.2,5.7),
      ear:hideForm(ears,12,true).rotateX(-Math.PI/2),
      earInset:own(loft([[.028,.069,-.012,.017],[.14,.087,-.016,.016],[.25,.051,-.009,.01],[.381,.015,-.004,.005]],10).rotateX(-Math.PI/2)),
      brow:own(loft([[-.081,.015,-.012,.014],[-.035,.047,-.016,.031],[.044,.042,-.015,.028],[.095,.014,-.003,.009]],10).rotateY(Math.PI/2)),
      socket:own(loft([[-.039,.058,-.030,.034],[.012,.073,-.037,.041],[.038,.04,-.02,.021]],10)),
      browColor:matte(palette.ridge), irisMaterial,
    };
  }
  const kinds=['wild','dire','elite','guardian'] as const;
  const geometries=Object.fromEntries(kinds.map(kind=>[kind,forms(kind)])) as Record<Morph,ReturnType<typeof forms>>;
  const scars=[-1,1].map(side=>({
    brow:own(pathRidge([[side*.155,.240,.251],[side*.196,.183,.310],[side*.198,.118,.354],[side*.213,.061,.320]],.017)),
    snout:own(pathRidge([[side*.147,.076,.529],[side*.114,.102,.566],[side*.105,.064,.65],[side*.103,.026,.710]],.012)),
    flank:own(pathRidge([[side*.307,1.45,.06],[side*.364,1.34,.22],[side*.402,1.21,.299],[side*.387,1.01,.24]],.023)),
    vein:own(pathRidge([[side*.205,1.87,.68],[side*.272,1.78,.82],[side*.329,1.64,.88],[side*.348,1.41,.81]],.012)),
  }));
  return {
    make(kind:Morph='wild'):CreatureRig{
      const g=geometries[kind],wild=kind==='wild', boss=kind==='guardian', strong=wild?1:boss?1.55:1.27;
      const root=new T.Group(),frame=joint(root);
      const coatDetail=joint(frame);
      meshPart(frame,g.body,hide);meshPart(coatDetail,g.baseCoat,hide);
      if(g.mane&&g.maneBase){meshPart(frame,g.maneBase,hide);meshPart(coatDetail,g.mane,hide);}
      const neck=joint(frame,0,1.31,.61);
      meshPart(neck,g.neck,hide,0,0,-.61).scale.setScalar(boss?1.17:1);
      const skull=joint(neck,0,.17,.39);
      skull.scale.set(boss?1.16:wild?1:1.095,boss?1.13:1.02,boss?1.15:1.04);
      meshPart(skull,g.skull,hide);meshPart(skull,g.cheek,hide);meshPart(skull,noseGeo,nose);
      const jaw=joint(skull,0,-.178,.045);
      meshPart(jaw,g.jaw,hide);meshPart(jaw,g.gum,gums);
      const pins=[-1,1].map(side=>{
        const pin=joint(skull,side*.162,.24,-.05);
        meshPart(pin,g.ear,hide);
        meshPart(pin,g.earInset,pads,0,.010,.065);
        const socket=joint(skull,side*.188,.105,.309);
        socket.rotation.y=side*.88;socket.rotation.z=-side*.24;
        meshPart(socket,g.socket,g.browColor);
        meshPart(socket,iris,g.irisMaterial,0,0,.026).scale.setScalar(wild?.79:boss?1.10:.93);
        meshPart(socket,pupilGeo,pupil,.011,.001,.049);
        meshPart(skull,g.brow,g.browColor,side*.181,.157,.306).rotation.y=side*.52;
        for(let i=0;i<5;i++){
          const z=.36+i*.071, x=side*(.140-i*.008);
          const toothShape=i===3?fang:smallTooth;
          meshPart(skull,toothShape,enamel,x,-.233,z).scale.setScalar((i===3?1:.71)*strong);
          const tooth=meshPart(jaw,toothShape,enamel,x*.82,.028,z-.04);
          tooth.rotation.z=Math.PI;tooth.scale.setScalar((i===3?.78:.64)*strong);
        }
        return pin;
      });
      if(boss||kind==='elite') for(const [index,mark] of scars.entries()){
        meshPart(skull,mark.brow,marrow);
        if(index===0) meshPart(skull,mark.snout,oldScar);
        meshPart(frame,mark.flank,oldScar,0,0,.10);
        if(boss){
          meshPart(frame,mark.vein,runes);
          const side=index===0?-1:1;
          for(let i=0;i<4;i++){
            const spike=meshPart(frame,crown,ether,side*(.21+i*.027),1.90-i*.091,.62-i*.246);
            spike.rotation.set(-.59-i*.083,side*.18,-side*(.31+i*.085));
            spike.scale.set(.78,.93-i*.13,.77);
          }
        }
      }
      if(boss){
        const crest=meshPart(skull,crown,ether,0,.29,.035);
        crest.rotation.x=-.49;crest.scale.setScalar(.67);
        for(const side of [-1,1]){
          const blade=meshPart(skull,crown,ether,side*.235,.10,-.11);
          blade.rotation.set(-.68,side*.22,-side*.72);blade.scale.setScalar(.76);
        }
      }
      const legs=[[-1,.51,1.17],[1,.51,1.17],[-1,-.75,1.14],[1,-.75,1.14]].map(([side,z,y],i)=>{
        const front=i<2, width=(front?.271:.244)*(boss?1.22:wild?1:1.1);
        const top=joint(frame,side*width,y,z), a=front?.55:.49, b=front?.56:.55;
        const knee=joint(top,0,-a), foot=joint(knee,0,-b);
        meshPart(top,front?g.upperFront:g.upperBack,hide).scale.x=boss?1.24:wild?1:1.12;
        meshPart(top,g.legFur,hide,0,-.13,0).scale.setScalar(boss?1.24:.96);
        meshPart(knee,front?g.shinFront:g.shinBack,hide);
        meshPart(foot,g.paw,hide);
        for(const x of [-.074,0,.074]){
          meshPart(foot,g.toe,hide,x,0,0);
          const claw=meshPart(foot,smallTooth,wild?pads:enamel,x,-.053,.245);
          claw.rotation.x=-1.35;claw.scale.setScalar(boss?.68:.53);
        }
        return {top,knee,foot,a,b,front,side,z,y};
      });
      const brush=joint(frame,0,1.40,-1.04),tip=joint(brush,0,-.078,-.72);
      meshPart(brush,g.tail,hide);meshPart(brush,g.tailCoat,hide);
      meshPart(tip,g.brush,hide);meshPart(tip,g.brushCoat,hide);
      batcher.bake(root);
      return {root,animate(p){
        const gait=p.gait, turn=p.turn??0, alert=p.alert??0;
        coatDetail.visible=(p.distance??0)<(boss?40:29);
        const time=p.frozen?0:p.time;
        const breathing=Math.sin(time*(1.9+alert*.8))*.016;
        const death=T.MathUtils.smoothstep(p.dead,0,.84), windup=p.windup*(1-p.recovery);
        const snap=p.recovery**1.75;
        const crouch=windup*(boss?.15:.21);
        const pitch=.075*windup-.145*snap-.22*p.leap+.22*p.hit;
        frame.rotation.set(pitch,0,-turn*.155+p.hit*.18+death*1.43);
        frame.position.set(death*.18,breathing+gait*.034*Math.sin(p.phase*2)+p.leap*(boss?.40:.67)-crouch-death*.64,
          -.16*windup+.19*strong*snap);
        neck.rotation.set(.24*windup-.38*snap-.20*p.leap,turn*.26,-p.hit*.16);
        skull.rotation.set(.052*Math.cos(time*2)+.13*windup-.25*snap+.26*p.hit,turn*.28,p.hit*.19);
        jaw.rotation.x=.035+alert*.045+windup*(.31+strong*.14)+p.leap*.44+death*.14-snap*.15;
        pins.forEach((pin,i)=>{
          const side=i===0?-1:1, twitch=Math.sin(time*1.29+i*1.7)**15;
          pin.rotation.set(-.15+windup*.67+death*.35+twitch*.11,side*(.16-alert*.23+.08*twitch),-side*(.13+.30*windup));
        });
        brush.rotation.set(-.31+gait*.48-alert*.20+windup*.34,Math.sin(time*2.14+p.phase*.27)*(.24-gait*.08)+turn*.32,death*.16);
        tip.rotation.set(-.13+Math.sin(time*2.2-.76)*.14,-brush.rotation.y*.57,0);

        const walk=[0,.5,.73,.23], trot=[0,.5,.5,0], bound=[0,.19,.52,.68];
        const weight=T.MathUtils.smoothstep(gait,.32,.73);
        const gallop=T.MathUtils.smoothstep(gait,.75,1);
        const cos=Math.cos(pitch),sin=Math.sin(pitch);
        for(let i=0;i<legs.length;i++){
          const {top,knee,foot,a,b,front,side,y,z}=legs[i];
          const phase=p.phase/(Math.PI*2)+T.MathUtils.lerp(T.MathUtils.lerp(walk[i],trot[i],weight),bound[i],gallop);
          const cycle=phase-Math.floor(phase), contact=.66-.19*gait;
          const swing=cycle>contact?(cycle-contact)/(1-contact):0;
          const reach=gait*(.45+.14*gait)*(1-windup*.9);
          const stride=reach*(swing>0?-Math.cos(swing*Math.PI):1-2*cycle/contact)*(1+side*turn*.28);
          const floor=.112+Math.sin(swing*Math.PI)*gait*(.20+gallop*.14);
          const fy=floor-frame.position.y, fz=z+stride-frame.position.z+.16*snap*(front?1:-1);
          const dy=fy*cos+fz*sin-y, dz=fz*cos-fy*sin-z;
          const distance=T.MathUtils.clamp(Math.hypot(dy,dz),.31,a+b-.008);
          const bend=(front?-1:1)*Math.acos(T.MathUtils.clamp((distance*distance-a*a-b*b)/(2*a*b),-1,1));
          const angle=Math.atan2(-dz,-dy)-Math.atan2(b*Math.sin(bend),a+b*Math.cos(bend));
          top.rotation.x=T.MathUtils.lerp(angle,-.76+(front?-.43:.50),p.leap)*(1-death)+(front?-.88:.62)*death;
          top.rotation.z=side*(.045+death*.52)+turn*.10;
          knee.rotation.x=T.MathUtils.lerp(bend,(front?-.83:1.12),Math.max(p.leap,death));
          foot.rotation.x=-(top.rotation.x+knee.rotation.x+pitch)*(1-p.leap*.54)*(1-death*.37);
        }
      }};
    },
    dispose(){batcher.dispose();resources.forEach(resource=>resource.dispose());},
  };
}
