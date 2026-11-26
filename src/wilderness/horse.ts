import * as T from 'three';
import { joint, loft, meshPart, rigidBatcher, shapedPlate } from './creatureGeometry.ts';

export function warhorse(){
  const root=new T.Group(), body=joint(root), neck=joint(body,0,1.72,.65), head=joint(neck,0,.69,.26);
  const batch=rigidBatcher();
  const coat=new T.MeshStandardMaterial({color:0x382e32,roughness:.87});
  const sheen=new T.MeshStandardMaterial({color:0x4c3735,roughness:.82});
  const mane=new T.MeshStandardMaterial({color:0x211d28,roughness:.97});
  const hoof=new T.MeshStandardMaterial({color:0x272630,roughness:.7});
  const leather=new T.MeshStandardMaterial({color:0x523324,roughness:.94});
  const blanket=new T.MeshStandardMaterial({color:0x572b35,roughness:1,side:T.DoubleSide});
  const metal=new T.MeshStandardMaterial({color:0x9e8c6d,roughness:.37,metalness:.63});
  const eye=new T.MeshStandardMaterial({color:0x382121,emissive:0x401510,emissiveIntensity:.64});
  const yLoft=(rings:Parameters<typeof loft>[0],sides=14)=>loft(rings,sides).rotateX(-Math.PI/2);
  const chest=loft([[-1.27,.14,1.28,1.64],[-1.09,.37,1.16,1.86],[-.76,.46,1.03,1.93],[-.41,.43,.99,1.89],
    [-.06,.45,.94,1.91],[.28,.48,.90,1.96],[.57,.47,.93,2.01],[.84,.31,1.06,1.88],[1,.16,1.24,1.65]],22);
  meshPart(body,chest,coat);
  const sideMuscle=loft([[-.42,.10,-.21,.17],[-.23,.19,-.33,.29],[.04,.22,-.40,.31],[.27,.17,-.32,.25],[.44,.06,-.17,.13]],14);
  for(const side of [-1,1]) for(const z of [-.84,.62]){
    const haunch=meshPart(body,sideMuscle,sheen,side*.295,1.46,z);
    haunch.rotation.y=side*(z>0?.37:-.37);
  }
  const neckForm=yLoft([[-.49,.21,-.28,.28],[-.21,.34,-.35,.31],[.05,.27,-.33,.26],[.31,.19,-.25,.19],[.61,.16,-.23,.14],[.76,.13,-.15,.13]],18);
  meshPart(neck,neckForm,coat).rotation.x=.32;
  const skull=loft([[-.27,.122,-.18,.23],[-.11,.163,-.205,.275],[.09,.18,-.205,.229],[.27,.129,-.216,.159],
    [.51,.113,-.243,.081],[.65,.123,-.238,.052],[.73,.084,-.188,.028]],16);
  const muzzle=loft([[.48,.098,-.220,.041],[.62,.128,-.243,.051],[.73,.101,-.207,.048],[.78,.063,-.156,.021]],14);
  meshPart(head,skull,coat).rotation.x=.32;
  meshPart(head,muzzle,sheen).rotation.x=.30;
  meshPart(head,loft([[-.19,.13,-.14,.07],[.02,.153,-.21,.055],[.32,.119,-.185,.051],[.56,.089,-.136,.036]],12),coat,0,-.119,.025).rotation.x=.47;
  const ear=shapedPlate([[-.065,0],[-.059,.16],[.018,.298],[.072,.18],[.065,0]],.047,.010);
  const pupil=new T.IcosahedronGeometry(.045,1), stud=new T.IcosahedronGeometry(.034,0);
  const cheekstrap=shapedPlate([[-.031,-.30],[.029,-.29],[.033,.29],[-.026,.32]],.016,.007);
  const bridle=new T.TorusGeometry(.079,.014,5,12);
  const ears=[-1,1].map(side=>{
    const pin=joint(head,side*.12,.209,-.09);
    meshPart(pin,ear,coat);
    meshPart(head,pupil,eye,side*.149,.038,.177).scale.set(.68,.83,1.22);
    meshPart(head,stud,mane,side*.088,-.244,.65).scale.set(.59,.79,1.38);
    const strap=meshPart(head,cheekstrap,leather,side*.139,-.044,.23);
    strap.rotation.set(.28,side*Math.PI/2,side*.14);
    meshPart(head,bridle,metal,side*.142,-.234,.37).rotation.y=side*Math.PI/2;
    return pin;
  });
  const saddle=loft([[-.66,.19,-.028,.109],[-.45,.33,-.115,.171],[-.18,.31,-.18,.096],[.12,.30,-.17,.109],[.35,.24,-.096,.185],[.47,.12,-.048,.07]],16);
  meshPart(body,saddle,leather,0,1.93,-.14);
  const skirt=shapedPlate([[-.45,.24],[-.31,.33],[.27,.31],[.45,.17],[.38,-.23],[-.38,-.26],[-.51,-.06]],.023,.011);
  const ironStep=shapedPlate([[-.17,0],[-.12,.163],[.005,.238],[.132,.152],[.171,0],[.106,-.041],[-.109,-.041]],.045,.014);
  for(const side of [-1,1]){
    meshPart(body,skirt,blanket,side*.407,1.63,-.21).rotation.y=side*Math.PI/2;
    const girth=meshPart(body,cheekstrap,leather,side*.448,1.56,-.13);girth.rotation.y=side*Math.PI/2;girth.scale.y=1.85;
    const stirrup=meshPart(body,ironStep,metal,side*.527,1.15,-.07);stirrup.rotation.y=side*Math.PI/2;stirrup.scale.setScalar(.68);
    for(let i=0;i<4;i++) meshPart(body,stud,metal,side*.435,1.45,-.51+i*.16);
  }
  const locks=[] as T.Group[];
  const lock=yLoft([[0,.033,-.044,.052],[.16,.082,-.059,.054],[.33,.062,-.042,.025],[.53,.003,-.005,.007]],8);
  for(let i=0;i<12;i++){
    const tuck=joint(neck,(i%2===0?1:-1)*(.12+(i%3)*.031),.07+(i%6)*.105,-.183-(i%4)*.038);
    meshPart(tuck,lock,mane).scale.setScalar(1+(i%3)*.10);
    locks.push(tuck);
  }
  const tail=joint(body,0,1.735,-1.22), tip=joint(tail,0,-.38,-.42);
  const tailFall=loft([[-.64,.049,-.43,-.28],[-.48,.139,-.40,-.19],[-.25,.114,-.26,-.054],[-.06,.078,-.111,.031],[0,.070,-.068,.061]],12);
  const tailEnd=loft([[-.41,.012,-.56,-.51],[-.34,.068,-.47,-.32],[-.22,.12,-.32,-.12],[-.05,.091,-.14,.019],[0,.067,-.08,.051]],12);
  meshPart(tail,tailFall,mane);meshPart(tip,tailEnd,mane);
  const fore=yLoft([[-.65,.09,-.085,.087],[-.49,.115,-.108,.10],[-.27,.156,-.172,.163],[.04,.179,-.179,.152],[.15,.131,-.133,.13]]);
  const rear=yLoft([[-.66,.098,-.10,.103],[-.49,.168,-.209,.143],[-.22,.210,-.187,.184],[.04,.189,-.177,.169],[.16,.118,-.124,.14]]);
  const shin=yLoft([[-.68,.064,-.061,.065],[-.52,.075,-.075,.075],[-.25,.088,-.100,.078],[.018,.11,-.103,.102]],11);
  const feet=loft([[-.14,.077,-.156,.043],[-.06,.112,-.168,.078],[.09,.118,-.167,.081],[.166,.092,-.155,-.023]],12);
  const legs=[-1,1,-1,1].map((side,i)=>{
    const front=i<2, z=front?.682:-.855;
    const hip=joint(body,side*.319,1.44,z), knee=joint(hip,0,-.655), foot=joint(knee,0,-.655);
    meshPart(hip,front?fore:rear,coat);meshPart(knee,shin,sheen);meshPart(foot,feet,hoof);
    return {hip,knee,foot,front,side};
  });
  batch.bake(root);
  const reinsGeometry=new T.BufferGeometry();
  const reinsPositions=new T.BufferAttribute(new Float32Array(8*2*3),3).setUsage(T.DynamicDrawUsage);
  reinsGeometry.setAttribute('position',reinsPositions);
  const reins=new T.LineSegments(reinsGeometry,new T.LineBasicMaterial({color:0x9b7459}));
  reins.frustumCulled=false;root.add(reins);
  const bit=new T.Vector3();
  let phase=0,time=0,gait=0,turn=0,bob=0;
  function update(dt:number,speed:number,gallop:boolean,turnRate:number){
    time+=dt;gait=T.MathUtils.damp(gait,speed>1?(gallop?1:speed>6?.63:.32):0,8,dt);
    turn=T.MathUtils.damp(turn,T.MathUtils.clamp(turnRate,-1,1),8,dt);
    phase+=speed*dt*2*Math.PI/(1.30+gait*2.65);
    const breath=Math.sin(time*2.1)*.016;
    bob=breath+Math.cos(phase*2)*gait*.066;
    const pitch=Math.sin(phase)*gait*gait*.094;
    body.position.y=bob;body.rotation.set(pitch,0,-turn*.13);
    neck.rotation.set(.031*Math.sin(time*1.7)-gait*.14*Math.cos(phase),turn*.23,.021*Math.sin(time*1.52));
    head.rotation.set(.05*Math.sin(time*2.1)+.04*gait*Math.sin(phase),turn*.22,0);
    tail.rotation.set(-.10-gait*.42,Math.sin(time*2.5)*(.22+.13*gait)+turn*.3,0);
    tip.rotation.set(.16*Math.sin(time*2.8),-tail.rotation.y*.64,0);
    ears.forEach((pin,i)=>pin.rotation.set(-.12+.16*Math.sin(time*1.8+i)**7,(i===0?-1:1)*(.16+turn*.18),0));
    locks.forEach((lock,i)=>lock.rotation.set(-2.32-.12*gait,0,(i%2?1:-1)*(.23+.14*Math.sin(time*4+i*.38))));
    const walk=[0,.5,.75,.25],trot=[0,.5,.5,0],canter=[.07,.24,.62,.75];
    const blend=T.MathUtils.smoothstep(gait,.4,.67), bound=T.MathUtils.smoothstep(gait,.68,1);
    for(const [i,{hip,knee,foot,front,side}] of legs.entries()){
      const offset=T.MathUtils.lerp(T.MathUtils.lerp(walk[i],trot[i],blend),canter[i],bound);
      const step=phase/(Math.PI*2)+offset, t=step-Math.floor(step), stance=.68-.23*gait;
      const swing=t>stance?(t-stance)/(1-stance):0;
      const fore=(swing>0?-Math.cos(swing*Math.PI):1-2*t/stance)*gait*.64*(1+turn*side*.30);
      const lift=Math.sin(swing*Math.PI)*gait*.52;
      const down=1.28+bob+hip.position.z*pitch-lift;
      const a=.655,b=.655,d=Math.min(a+b-.008,Math.hypot(down,fore));
      const fold=(front?-1:1)*Math.acos(T.MathUtils.clamp((d*d-a*a-b*b)/(2*a*b),-1,1));
      hip.rotation.x=Math.atan2(-fore,down)-Math.atan2(b*Math.sin(fold),a+b*Math.cos(fold));
      knee.rotation.x=fold;foot.rotation.x=-(hip.rotation.x+knee.rotation.x+pitch)*(1-swing*.36);
    }
    head.updateWorldMatrix(true,false);
    for(const [index,side] of [-1,1].entries()){
      bit.set(side*.155,-.237,.39);head.localToWorld(bit);root.worldToLocal(bit);
      let x=bit.x,y=bit.y,z=bit.z;
      for(let k=1;k<=4;k++){
        const s=k/4, px=T.MathUtils.lerp(bit.x,side*.315,s),py=T.MathUtils.lerp(bit.y,2.17+bob,s)-Math.sin(s*Math.PI)*.135;
        const pz=T.MathUtils.lerp(bit.z,.087,s);
        const j=index*8+(k-1)*2;
        reinsPositions.setXYZ(j,x,y,z);reinsPositions.setXYZ(j+1,px,py,pz);
        x=px;y=py;z=pz;
      }
    }
    reinsPositions.needsUpdate=true;
  }
  update(0,0,false,0);root.visible=false;
  return {root,update,get saddleBob(){return bob;},dispose(){batch.dispose();}};
}
