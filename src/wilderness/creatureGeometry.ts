import * as T from 'three';

// Elliptical sections along Z. Each ring defines half-width, bottom and top.
export function loft(rings:readonly (readonly [number,number,number,number])[], sides=12){
  const points:number[]=[];
  for(const [z,w,bottom,top] of rings) for(let i=0;i<sides;i++){
    const a=i/sides*Math.PI*2;
    points.push(w*Math.cos(a),(top+bottom)/2+(top-bottom)/2*Math.sin(a),z);
  }
  const indices:number[]=[];
  for(let r=0;r<rings.length-1;r++) for(let i=0;i<sides;i++){
    const a=r*sides+i,b=r*sides+(i+1)%sides;
    indices.push(a,b,a+sides,b,b+sides,a+sides);
  }
  const end=(rings.length-1)*sides;
  for(let i=1;i<sides-1;i++) indices.push(0,i+1,i,end,end+i,end+i+1);
  const source=new T.BufferGeometry();
  source.setAttribute('position',new T.Float32BufferAttribute(points,3));
  source.setIndex(indices);
  const geometry=source.toNonIndexed();
  source.dispose();geometry.computeVertexNormals();
  return geometry;
}

export function shapedPlate(points:readonly (readonly [number,number])[], depth:number, bevel=.023){
  const path=new T.Shape();
  points.forEach(([x,y],i)=>i?path.lineTo(x,y):path.moveTo(x,y));
  path.closePath();
  return new T.ExtrudeGeometry(path,{depth,bevelEnabled:bevel>0,bevelSegments:1,bevelThickness:bevel,bevelSize:bevel});
}

export type CreaturePose={time:number;gait:number;phase:number;windup:number;recovery:number;hit:number;leap:number;dead:number;frozen:boolean};
export type CreatureRig={root:T.Group; animate:(pose:CreaturePose)=>void};
export function meshPart(parent:T.Object3D,geometry:T.BufferGeometry,material:T.Material,x=0,y=0,z=0){
  const mesh=new T.Mesh(geometry,material);
  mesh.position.set(x,y,z);
  mesh.castShadow=true;
  parent.add(mesh);
  return mesh;
}
export function joint(parent:T.Object3D,x=0,y=0,z=0){
  const node=new T.Group();
  node.position.set(x,y,z);parent.add(node);return node;
}
