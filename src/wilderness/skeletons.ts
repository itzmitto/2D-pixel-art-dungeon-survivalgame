import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function skeletonModels(){
  const bone=new T.MeshStandardMaterial({color:0xb0a898,roughness:.9});
  const metal=new T.MeshStandardMaterial({color:0x53575e,roughness:.52,metalness:.47});
  const recess=new T.MeshStandardMaterial({color:0x141319});
  const box=new T.BoxGeometry();
  const skull=new T.IcosahedronGeometry(.24,1).scale(.88,1.11,.87);
  const cylinder=(top:number,bottom:number,length:number)=>new T.CylinderGeometry(top,bottom,length,6);
  const ribPieces=Array.from({length:4},(_,i)=>new T.TorusGeometry(.30-i*.018,.029,4,9,Math.PI*1.80)
    .rotateX(Math.PI/2).scale(1,.78,.73).translate(0,1.47-i*.11,0).toNonIndexed());
  const ribs=mergeGeometries(ribPieces);
  ribPieces.forEach(piece=>piece.dispose());
  if(!ribs) throw Error('Skeleton rib geometry is incompatible.');
  const spine=cylinder(.074,.084,.79);
  const limb=cylinder(.051,.070,.48);
  const sword=new T.OctahedronGeometry(.22).scale(.35,2.8,.18);
  return {
    make(){
      const root=new T.Group();
      function part(parent:T.Group,geometry:T.BufferGeometry,material:T.Material,x:number,y:number,z:number){
        const mesh=new T.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
      }
      part(root,ribs,bone,0,0,0);
      part(root,spine,bone,0,1.19,-.11);
      part(root,skull,bone,0,1.88,0);
      part(root,box,bone,0,1.72,.14).scale.set(.22,.09,.14);
      for(const x of [-.085,.085]){
        part(root,box,recess,x,1.91,.18).scale.set(.092,.067,.038);
        part(root,box,metal,x*3.6,1.48,0).scale.set(.23,.15,.29);
      }
      part(root,box,metal,0,.91,0).scale.set(.39,.15,.25);
      const legs=[-.135,.135].map(x=>{
        const pivot=new T.Group();pivot.position.set(x,.85,0);root.add(pivot);
        part(pivot,limb,bone,0,-.22,0);
        part(pivot,limb,bone,0,-.58,-.024).scale.y=.72;
        part(pivot,box,metal,0,-.79,.09).scale.set(.135,.12,.29);
        return pivot;
      });
      const brush=new T.Group();brush.position.set(.34,1.44,.06);root.add(brush);
      part(brush,limb,bone,0,-.22,0);
      part(brush,limb,bone,0,-.50,.10).rotation.x=-.37;
      part(brush,sword,metal,0,-.52,.49).rotation.x=Math.PI/2;
      part(brush,box,metal,0,-.52,.24).scale.set(.31,.065,.062);
      part(root,limb,bone,-.34,1.21,.014);
      return {root,legs,brush};
    },
    dispose(){
      for(const resource of [bone,metal,recess,box,skull,ribs,spine,limb,sword]) resource.dispose();
    },
  };
}
