import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function wolfModels() {
  const fur = new T.MeshStandardMaterial({color:'#434b50',roughness:.9,flatShading:true});
  const scruff = new T.MeshStandardMaterial({color:'#727673',roughness:.95,flatShading:true});
  const nose = new T.MeshStandardMaterial({color:'#292629',roughness:.8});
  const light = new T.MeshBasicMaterial({color:'#b69362'});
  const bobble = (x:number,y:number,z:number,sx:number,sy:number,sz:number,tilt=0) =>
    new T.IcosahedronGeometry(1,1).scale(sx,sy,sz).rotateX(tilt).translate(x,y,z);
  const bake = (...parts:T.BufferGeometry[]) => {
    const result=mergeGeometries(parts);
    parts.forEach(g=>g.dispose());
    if(!result) throw Error('Could not assemble wolf geometry.');
    return result;
  };
  const body=bake(bobble(0,1.06,-.02,.35,.37,.79),bobble(0,1.21,.46,.39,.39,.42,-.25),
    bobble(0,1.02,-.62,.31,.27,.39),bobble(0,1.45,.76,.22,.24,.35,-.2),
    new T.ConeGeometry(.117,.47,5).rotateZ(.2).translate(.16,1.73,.72).toNonIndexed(),
    new T.ConeGeometry(.117,.47,5).rotateZ(-.2).translate(-.16,1.73,.72).toNonIndexed());
  const muzzle=bake(bobble(0,1.37,1.03,.145,.135,.255),bobble(0,1.03,.61,.22,.36,.22));
  const snout=bobble(0,1.38,1.257,.124,.084,.07);
  const eye=bobble(0,0,0,.037,.029,.033);
  const leg=bake(bobble(0,-.17,0,.107,.30,.122),bobble(0,-.46,-.045,.073,.24,.078),
    bobble(0,-.64,.025,.094,.075,.15));
  const tail=bake(bobble(0,-.10,-.27,.112,.13,.39,-.36),bobble(0,-.24,-.54,.078,.09,.25,-.47));
  const resources=[body,muzzle,snout,eye,leg,tail,fur,scruff,nose,light];
  return {
    make() {
      const root = new T.Group();
      const mesh=(geo:T.BufferGeometry,mat:T.Material,x=0,y=0,z=0)=>{
        const part=new T.Mesh(geo,mat);
        part.position.set(x,y,z);
        part.castShadow=true;
        root.add(part);
        return part;
      };
      mesh(body,fur); mesh(muzzle,scruff); mesh(snout,nose);
      mesh(eye,light,.157,1.48,1.01); mesh(eye,light,-.157,1.48,1.01);
      const legs=[[-.215,.49],[.215,.49],[-.21,-.60],[.21,-.60]].map(([x,z])=>mesh(leg,x<0?fur:scruff,x,.72,z));
      const brush=mesh(tail,fur,0,1.17,-.82);
      return {root,legs,brush};
    },
    dispose(){resources.forEach(resource=>resource.dispose());},
  };
}
