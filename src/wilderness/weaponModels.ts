import * as T from 'three';
import type { WeaponId } from './weapons';

export function weaponModel(id:Exclude<WeaponId,'longsword'>) {
  const right=new T.Group(), left=new T.Group();
  const steel=new T.MeshStandardMaterial({color:'#aeb8c3',metalness:.7,roughness:.34});
  const iron=new T.MeshStandardMaterial({color:'#42454c',metalness:.55,roughness:.55});
  const leather=new T.MeshStandardMaterial({color:'#322523',roughness:.94});
  const accent=new T.MeshStandardMaterial({color: {greatsword:0xa74722,axe:0x7aa4db,staff:0x8dd9ed,shield:0x39608a,katana:0x749e89}[id],
    metalness:.32,roughness:.46});
  function add(geometry:T.BufferGeometry,material:T.Material,x=0,y=0,z=0,parent=right) {
    const mesh=new T.Mesh(geometry,material);
    mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  function profile(points:readonly (readonly [number,number])[], depth:number, material:T.Material,parent=right,z=0) {
    const shape=new T.Shape();
    points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));
    shape.closePath();
    return add(new T.ExtrudeGeometry(shape,{steps:1,depth,bevelEnabled:true,bevelThickness:.018,bevelSize:.015,bevelSegments:1,curveSegments:1}),material,0,0,z-depth/2,parent);
  }
  function handle(length:number,radius:number) {
    add(new T.CylinderGeometry(radius*.91,radius,length,7),leather,0,length*.25-.08);
    for(let i=0;i<5;i++) add(new T.TorusGeometry(radius,.007,3,7),iron,0,(i-2)*length*.16+length*.25-.08).rotation.x=Math.PI/2;
    add(new T.IcosahedronGeometry(radius*1.48,0),iron,0,-length*.25-.09);
  }
  if(id==='staff'){
    add(new T.CylinderGeometry(.062,.047,1.7,7),leather,0,.27);
    for(const y of [-.56,.48,.96,1.12]) add(new T.CylinderGeometry(.095,.077,.12,7),iron,0,y);
    add(new T.OctahedronGeometry(.26),accent,0,1.39).scale.set(.75,1.55,.75);
    for(const direction of [-1,1]) profile([[direction*.05,.99],[direction*.22,1.22],[direction*.16,1.42],[direction*.09,1.23]],.065,steel);
  } else if(id==='axe'){
    add(new T.CylinderGeometry(.068,.051,1.46,7),leather,0,.37);
    for(const y of [-.33,.20,.68,1.05]) add(new T.CylinderGeometry(.089,.075,.14,7),iron,0,y);
    for(const side of [-1,1]){
      profile([[0,.86],[side*.23,.83],[side*.56,.60],[side*.67,.87],[side*.64,1.16],[side*.48,1.36],[side*.22,1.12],[0,1.09]],.11,steel);
      profile([[side*.20,1.05],[side*.43,1.13],[side*.34,.99],[side*.55,.95],[side*.27,.83],[side*.38,.97]],.01,accent,right,.071);
    }
  } else if(id==='katana'){
    handle(.39,.047);
    add(new T.CylinderGeometry(.14,.14,.047,12),iron,0,.195);
    profile([[-.049,.21],[.05,.21],[.085,.71],[.157,1.18],[.266,1.45],[.209,1.48],[.085,1.21],[.001,.74]],.043,steel);
    profile([[.021,.32],[.061,.72],[.136,1.19],[.228,1.41],[.121,1.17],[.045,.72]],.007,accent,right,.031);
  } else {
    const big=id==='greatsword', width=big?.157:.086, length=big?1.86:1.21;
    handle(big?.57:.28,big?.066:.047);
    profile([[-width,.27],[width,.27],[width*.87,length-.28],[0,length],[-width*.87,length-.28]],big?.085:.052,steel);
    const guard=big?.36:.239;
    profile([[-guard,.18],[-guard*.9,.31],[0,.24],[guard*.9,.31],[guard,.18],[0,.13]],.12,iron);
    for(const sign of [-1,1]) profile([[-width*.15,.34],[width*.18,.42],[0,length-.16],[width*.37,.56]],.008,accent,right,sign*(big?.048:.033));
    if(id==='shield'){
      profile([[-.36,.42],[.36,.42],[.37,-.09],[.25,-.44],[0,-.65],[-.25,-.44],[-.37,-.09]],.09,steel,left);
      profile([[-.31,.36],[.31,.36],[.32,-.07],[.21,-.40],[0,-.57],[-.21,-.40],[-.32,-.07]],.045,iron,left,.055);
      profile([[-.18,.24],[0,.34],[.18,.24],[.13,-.21],[0,-.44],[-.13,-.21]],.027,accent,left,.094);
      add(new T.IcosahedronGeometry(.10,0),steel,0,.02,.14,left).scale.z=.55;
    }
  }
  return {right,left};
}
