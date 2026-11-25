import * as T from 'three';
import { loft, shapedPlate, joint, meshPart, type CreatureRig } from './creatureGeometry.ts';

export function wolfModels(){
  const pelt=(color:number)=>new T.MeshStandardMaterial({color,roughness:.93,flatShading:true});
  const gray=pelt(0x545450), neckGray=pelt(0x777065), underside=pelt(0x948b7a);
  const dark=pelt(0x362f32), maneBrown=pelt(0x695349), pale=pelt(0xb6a594);
  const nose=pelt(0x242126), mouth=pelt(0x4f302c), eye=new T.MeshBasicMaterial({color:0xddad73});
  const torso=loft([[-1.01,.13,1.02,1.29],[-.78,.29,.79,1.37],[-.48,.30,.75,1.38],[-.14,.26,.72,1.40],
    [.22,.35,.63,1.52],[.51,.34,.69,1.63],[.74,.23,.82,1.61],[.87,.12,1.02,1.50]],16);
  const throat=loft([[.36,.20,.65,1.02],[.63,.25,.68,1.34],[.87,.22,.94,1.53],[1,.13,1.10,1.43]],14);
  const shoulder=loft([[.14,.20,.91,1.43],[.37,.37,.83,1.61],[.56,.39,.86,1.71],[.78,.30,.97,1.66],[.98,.16,1.06,1.52]],14);
  const head=loft([[-.18,.14,-.15,.26],[-.02,.25,-.23,.33],[.24,.24,-.20,.29],[.40,.16,-.15,.17],[.65,.126,-.116,.096],[.75,.09,-.073,.067]],14);
  const chin=loft([[.02,.124,-.055,.068],[.22,.134,-.084,.056],[.48,.114,-.069,.023],[.66,.075,-.028,.017]],12);
  const snout=loft([[.66,.115,-.043,.07],[.751,.109,-.047,.078],[.79,.069,-.028,.048]],12);
  const brow=shapedPlate([[-.07,0],[-.035,.061],[.061,.064],[.095,.017],[.03,-.018]],.038,.01);
  const ear=shapedPlate([[-.113,0],[-.083,.29],[-.017,.49],[.088,.25],[.09,.01]],.098,.02);
  const inEar=shapedPlate([[-.067,.045],[-.014,.37],[.05,.08]],.013,.007);
  const iris=new T.IcosahedronGeometry(.039);
  const tooth=new T.ConeGeometry(.029,.125,5).rotateZ(Math.PI);
  const upper=loft([[-.04,.112,-.106,.109],[.12,.13,-.124,.13],[.29,.096,-.089,.088],[.43,.070,-.067,.064]],12).rotateX(Math.PI/2);
  const lower=loft([[0,.069,-.076,.072],[.14,.074,-.065,.063],[.29,.057,-.052,.052],[.38,.044,-.044,.045]],12).rotateX(Math.PI/2);
  const paw=loft([[-.13,.057,-.075,.076],[.034,.103,-.078,.097],[.17,.094,-.073,.048],[.205,.058,-.065,.011]],12);
  const claw=new T.ConeGeometry(.024,.12,5).rotateX(Math.PI/2);
  const tail=loft([[-.76,.025,-.058,.016],[-.57,.079,-.078,.075],[-.35,.104,-.08,.088],[-.11,.1,-.067,.088],[0,.087,-.06,.075]],12);
  const tailTip=loft([[-.43,.01,-.025,.008],[-.31,.041,-.051,.024],[-.13,.068,-.056,.043],[0,.06,-.052,.048]],10);
  const furTine=shapedPlate([[-.13,-.08],[-.06,.13],[.19,.10],[.04,-.21]],.11,.023);
  const all=[gray,neckGray,underside,dark,maneBrown,pale,nose,mouth,eye,torso,throat,shoulder,head,chin,snout,brow,ear,inEar,iris,tooth,upper,lower,paw,claw,tail,tailTip,furTine];
  return {
    make(kind='wild'):CreatureRig{
      const dire=kind!=='wild', boss=kind==='guardian';
      const skin=dire?dark:gray, mane=dire?maneBrown:neckGray;
      const root=new T.Group(), frame=joint(root);
      meshPart(frame,torso,skin);
      meshPart(frame,throat,dire?mane:underside);
      meshPart(frame,shoulder,mane).scale.set(dire?1.17:.95,dire?1.05:.98,1);
      for(const side of [-1,1]) for(let i=0;i<3+(dire?2:0);i++){
        const tuft=meshPart(frame,furTine,mane,side*(.17+.043*(i%2)),1.55-i*.072,.53+i*.09);
        tuft.rotation.set(-.37,side*.19,side*(.44+i*.11));
      }
      const skull=joint(frame,0,1.40,.78);
      if(dire) skull.scale.set(1.12,1.10,1.07);
      meshPart(skull,head,skin);
      meshPart(skull,snout,nose);
      const jaw=joint(skull,0,-.15,.066);
      meshPart(jaw,chin,dire?mane:underside);
      meshPart(jaw,chin,mouth,0,.035,.01).scale.set(.84,.40,.96);
      for(const side of [-1,1]){
        const pin=joint(skull,side*.151,.233,.02);pin.rotation.z=-side*.23;
        meshPart(pin,ear,skin);meshPart(pin,inEar,dire?mane:underside,0,0,.104);
        meshPart(skull,brow,mane,side*.164,.105,.291).rotation.y=side*.67;
        meshPart(skull,iris,eye,side*.173,.083,.407).scale.set(.83,.82,1.17);
        meshPart(skull,tooth,pale,side*.103,-.157,.55).scale.setScalar(dire?1.27:.77);
        meshPart(jaw,tooth,pale,side*.080,.052,.50).rotation.z=Math.PI;
      }
      if(boss) for(let i=0;i<3;i++) meshPart(skull,furTine,underside,(i-1)*.11,.28,.04).rotation.x=-.64;
      const legs=[[-1,.485,.97],[1,.485,.97],[-1,-.67,.98],[1,-.67,.98]].map(([side,z,y],i)=>{
        const top=joint(frame,side*(i<2?.232:.199),y,z);
        const knee=joint(top,0,-.425,i<2?-.06:.092);
        const foot=joint(knee,0,-.415,i<2?.047:-.088);
        meshPart(top,upper,skin).scale.x=i<2?1:1.13;
        meshPart(knee,lower,mane);
        meshPart(foot,paw,skin,0,-.046,.04).scale.setScalar(dire?1.1:1);
        for(const x of [-.06,0,.06]){
          const nail=meshPart(foot,claw,dire?pale:nose,x,-.068,.201);
          if(dire) nail.scale.set(1.08,1.43,1.09);
        }
        return {top,knee,foot};
      });
      const brush=joint(frame,0,1.31,-.90), tip=joint(brush,0,0,-.64);
      meshPart(brush,tail,skin);meshPart(tip,tailTip,mane);
      return {root,animate(p){
        const t=p.time, run=p.gait, gait=p.phase;
        frame.rotation.z=p.dead*1.39+p.hit*.23;
        frame.rotation.x=-p.leap*.28+p.recovery*.12+p.windup*.12;
        frame.position.y=-p.dead*.80+.018*Math.sin(t*2.4)+run*.046*Math.sin(gait*2)+p.leap*.65-p.windup*.09;
        skull.rotation.x=p.windup*.35-p.recovery*.57-p.leap*.24+.035*Math.sin(t*2.3);
        skull.rotation.z=p.hit*.24;
        jaw.rotation.x=.05+p.windup*.4+p.recovery*.39+p.leap*.52+p.dead*.13;
        brush.rotation.x=-.37+run*.32;
        brush.rotation.y=Math.sin(t*3.2+gait*.4)*(.12+run*.22)*(1-p.dead);
        tip.rotation.y=-brush.rotation.y*.61;
        legs.forEach(({top,knee,foot},i)=>{
          const walk=[0,Math.PI,.67*Math.PI,1.67*Math.PI][i];
          const trot=[0,Math.PI,Math.PI,0][i];
          const cycle=gait+T.MathUtils.lerp(walk,trot,Math.min(1,run*1.6));
          const swing=Math.sin(cycle), lift=Math.max(0,Math.cos(cycle));
          top.rotation.x=swing*(.31+.27*run)*run-p.leap*(i<2?.77:-.50)+p.dead*(i%2?.28:-.35);
          knee.rotation.x=(i<2?-1:1)*(.10+lift*.61*run+p.leap*.61);
          foot.rotation.x=-(top.rotation.x+knee.rotation.x)*(.70-lift*.31);
        });
      }};
    },
    dispose(){all.forEach(resource=>resource.dispose());},
  };
}
