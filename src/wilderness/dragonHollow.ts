import * as T from 'three';
import { fracturedRock, weatherStone } from './rockDetail.ts';
import { loft, meshPart, rigidBatcher, shapedPlate } from './creatureGeometry.ts';
import { randomSequence } from './layout.ts';

export function dragonHollow(center:number,width:number,depth:number){
  const root=new T.Group();
  root.position.z=center;
  const random=randomSequence(0x1765ace), stamp=new T.Object3D(), tint=new T.Color();
  const rock=fracturedRock(180,'slab');
  const blocks=new T.BoxGeometry();
  const pillar=loft([[0,.98,-.95,.95],[.33,1.02,-1.03,1.03],[.56,.73,-.74,.74],[3.02,.65,-.68,.68],
    [5.1,.57,-.60,.60],[5.35,.78,-.78,.78],[5.61,.89,-.89,.89],[5.88,.88,-.89,.89]],9).rotateX(-Math.PI/2);
  const floorPiece=new T.CylinderGeometry(.92,1.09,.27,8);
  const basalt=new T.MeshStandardMaterial({color:0x413038,roughness:.94,flatShading:true});
  const masonry=new T.MeshStandardMaterial({color:0x645253,roughness:.90,flatShading:true});
  weatherStone(basalt,.08);
  weatherStone(masonry,.08);
  const soot=new T.MeshStandardMaterial({color:0x3c2928,roughness:.98});
  const pyrite=new T.MeshStandardMaterial({color:0x9d522d,emissive:0x8d2b0a,emissiveIntensity:.83,roughness:.73});
  const gold=new T.MeshStandardMaterial({color:0xb88940,metalness:.72,roughness:.39});
  const bone=new T.MeshStandardMaterial({color:0xb29a82,roughness:.84,flatShading:true});
  const bulk=rigidBatcher();
  const slice=new T.CylinderGeometry(.126,.127,.031,8);
  const drakeSkull=loft([[-1.52,.31,-.18,.29],[-1.04,.72,-.33,.72],[-.41,.68,-.35,.76],
    [.06,.49,-.24,.45],[.77,.392,-.23,.24],[1.38,.29,-.21,.17]],12);
  const rib=new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(.52,1.10,.14),new T.Vector3(1.28,1.37,.18),
    new T.Vector3(1.93,.76,.33),new T.Vector3(2.07,.19,.42)]),15,.093,6,false);
  const helm=loft([[-.2,.11,-.15,.16],[-.05,.25,-.23,.29],[.27,.22,-.23,.19],[.34,.11,-.17,.04]],9);
  const effigy=shapedPlate([[-.46,.0],[-.43,.55],[-.68,.80],[-.45,1.14],[-.27,1.24],[.36,1.22],[.56,1.04],
    [.52,.87],[.34,.69],[.45,.30],[.40,0]],.31,.058);
  const fissure=shapedPlate([[-.04,-.58],[.06,-.18],[-.04,-.10],[.075,.15],[.06,.49],[.13,.42],[.08,.14],[.025,-.09],[.11,-.25],[.015,-.57]],.01,.007);
  function place(geo:T.BufferGeometry,mat:T.Material,x:number,y:number,z:number,sx=1,sy=1,sz=1,turn=0){
    const part=meshPart(root,geo,mat,x,y,z);part.scale.set(sx,sy,sz);part.rotation.y=turn;return part;
  }
  type Boulder={x:number;y:number;z:number;sx:number;sy:number;sz:number;yaw:number};
  const walls:Boulder[]=[], glowing:Boulder[]=[];
  for(let i=0;i<108;i++){
    const a=i*Math.PI*2/108, sin=Math.sin(a), cos=Math.cos(a);
    const reach=1.005+random()*.11, x=sin*width*reach,z=cos*depth*reach;
    const foreground=T.MathUtils.smoothstep(cos,.54,.89);
    const h=(3.6+4.9*random())*(1-foreground*.73);
    walls.push({x,y:h*.46,z,sx:2+random()*1.8,sy:h,sz:1.4+random()*2,yaw:a+.53});
    if(i%3!==0&&foreground<.83) walls.push({x:x*1.04,y:h*.86,z:z*1.05,sx:2.3+random(),sy:h*.75,sz:2.4,yaw:a-.61});
    if(i%4===0) glowing.push({x:x*.83,y:.30,z:z*.81,sx:.93+random(),sy:.36+random()*.67,sz:.54+random(),yaw:a});
  }
  function rockBatch(values:Boulder[],mat:T.Material){
    const group=new T.InstancedMesh(rock,mat,values.length);
    values.forEach(({x,y,z,sx,sy,sz,yaw},i)=>{
      stamp.position.set(x,y,z);stamp.scale.set(sx,sy,sz);stamp.rotation.set(.16*Math.sin(i),yaw,.17*Math.cos(i));stamp.updateMatrix();
      group.setMatrixAt(i,stamp.matrix);group.setColorAt(i,tint.setScalar(.55+.45*random()));
    });
    group.receiveShadow=true;group.castShadow=true;group.computeBoundingSphere();root.add(group);
  }
  for(const side of [-1,1]){
    for(let i=0;i<4;i++){
      const z=-17.5+i*10.7,x=side*(21.9+(i%2)*3.2);
      place(floorPiece,masonry,x,.12,z,1.28,1.62,1.28);
      const broken=i===1||i===3;
      const column=place(pillar,masonry,x,.22,z,1,broken?.56:1.28,1,i*.53);
      column.rotation.z=side*(broken?.19:.065);
      const crack=place(fissure,pyrite,x,broken?1.37:3.65,z+.73,1,.92,1);
      crack.rotation.z=side*.47;
    }
    const statueX=side*14.65, statueZ=-19.4;
    place(floorPiece,masonry,statueX,.15,statueZ,2.5,1.3,2.07,.23);
    place(effigy,masonry,statueX,1.11,statueZ,1.34,2.11,1.17,side*.49).rotation.z=side*.15;
    place(helm,masonry,statueX+side*.64,.34,statueZ+1.6,1.15,1.02,1.14,.77).rotation.x=.86;
    place(blocks,masonry,statueX-side*.38,.62,statueZ+.53,.33,1.12,.39,.22).rotation.z=side*.86;
    if(side===-1) for(let i=0;i<9;i++){
      const z=-4.3+i*.94,x=side*(22.3+.42*Math.sin(i*.32));
      const r=place(rib,bone,x,.13,z,.90+i*.01,1.62-i*.065,1.21);
      r.rotation.z=-.27;r.rotation.y=.36-i*.024;
      place(rock,bone,x-.29,.21,z,.35,.29,.38).rotation.y=i;
    }
  }
  place(drakeSkull,bone,-19.5,.29,-8.15,1.42,1.02,1.37,.81).rotation.z=.29;
  for(const [cx,cz] of [[-12.7,-21],[13.6,-19.8],[16.4,15.7],[-20.8,12.4],[-15.9,-17.1]]){
    place(rock,soot,cx,.12,cz,2.05,.45,1.54);
    for(let i=0;i<3;i++){
      const x=cx+(random()-.5)*3.8,z=cz+(random()-.5)*3;
      place(blocks,soot,x,.27,z,.76,.49,.52,random()*6.28);
      place(blocks,gold,x,.49,z,.78,.12,.56,random()*6.28);
    }
  }
  bulk.bake(root);
  rockBatch(walls,basalt);rockBatch(glowing,pyrite);
  const coins=new T.InstancedMesh(slice,gold,460);
  [[-12.7,-21],[13.6,-19.8],[16.4,15.7],[-20.8,12.4],[-15.9,-17.1]].forEach(([cx,cz],pile)=>{
    for(let i=0;i<92;i++){
      const a=i*2.399,r=random()**.68*3.3, size=.64+random()*.63;
      stamp.position.set(cx+r*Math.sin(a),.04+.68*(1-r/3.6)*random(),cz+r*Math.cos(a)*.68);
      stamp.rotation.set(random()*1.2,a,random()*.44);stamp.scale.setScalar(size);stamp.updateMatrix();
      coins.setMatrixAt(pile*92+i,stamp.matrix);coins.setColorAt(pile*92+i,tint.setScalar(.56+.44*random()));
    }
  });
  coins.computeBoundingSphere();coins.receiveShadow=true;root.add(coins);
  const flows:T.BufferGeometry[]=[];
  const clock={value:0};
  const lava=new T.ShaderMaterial({uniforms:{clock},side:T.DoubleSide,
    vertexShader:`varying vec2 pos;void main(){pos=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 pos;uniform float clock;void main(){
      float a=pos.x,b=pos.y;
      float w=sin(b*63.-clock*1.94+sin(a*12.+b*18.)*1.9);
      float cracks=pow(1.-abs(sin(17.*a+b*99.-clock*2.9+w)),13.);
      float edge=smoothstep(.02,.37,min(a,1.-a));
      vec3 stone=vec3(.087,.019,.014), heat=mix(vec3(.57,.061,.012),vec3(1.,.63,.15),cracks);
      gl_FragColor=vec4(mix(stone,heat,edge*(.59+.40*w*w)),1.);
      #include <colorspace_fragment>
    }`});
  for(const side of [-1,1]){
    const positions:number[]=[],uv:number[]=[],indices:number[]=[];
    for(let i=0;i<=78;i++){
      const t=i/78,z=-24+t*47,x=side*(17.6+Math.sin(z*.15+side)*2.1+Math.cos(z*.32)*.43),
        half=.62+.37*Math.sin(z*.19)**2;
      positions.push(x-half,.034,z,x+half,.036,z);uv.push(0,t,1,t);
      if(i){const j=i*2;indices.push(j-2,j,j-1,j-1,j,j+1);}
    }
    const bed=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(positions,3)).setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    bed.setIndex(indices);bed.computeVertexNormals();flows.push(bed);root.add(new T.Mesh(bed,lava));
  }
  const mistGeometry=new T.PlaneGeometry(11,30).rotateX(-Math.PI/2);
  const mist=new T.ShaderMaterial({uniforms:{clock},transparent:true,depthWrite:false,
    vertexShader:`varying vec2 p;void main(){p=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 p;uniform float clock;void main(){
      float edge=pow(max(0.,1.-dot(p,p)),1.45);
      float curl=.51+.28*sin(p.x*9.+sin(p.y*12.)+clock*.7)+.21*sin(p.y*13.+p.x*10.-clock*.5);
      gl_FragColor=vec4(.55,.27,.20,edge*curl*.30);
    }`});
  for(const side of [-1,1]) for(let i=0;i<3;i++){
    const m=new T.Mesh(mistGeometry,mist);m.position.set(side*(10.2+i*3.8),.22+i*.21,-8+i*8);m.rotation.y=side*.32;root.add(m);
  }
  const emberGeo=new T.OctahedronGeometry(.11);
  const emberMat=new T.MeshBasicMaterial({color:0xffa857,toneMapped:false,transparent:true,opacity:.85});
  const embers=new T.InstancedMesh(emberGeo,emberMat,72);
  embers.instanceMatrix.setUsage(T.DynamicDrawUsage);embers.frustumCulled=false;root.add(embers);
  const lights=[new T.PointLight(0xff4a20,0,34,2),new T.PointLight(0xf4813a,0,32,2)];
  lights.forEach((light,i)=>{light.position.set(i?14:-15,4,i?8:-12);root.add(light);});
  return {root,update(time:number,active:boolean){
    root.visible=active;
    if(!active) return;
    clock.value=time;
    lights.forEach((light,i)=>{light.intensity=84+17*Math.sin(time*(3.8+i*.7))+8*Math.sin(time*8.1+i);});
    for(let i=0;i<embers.count;i++){
      const angle=i*2.399,phase=(time*(.105+i%6*.013)+i*.379)%1, r=4+i%23;
      stamp.position.set(Math.cos(angle)*r+Math.sin(time*.51+i)*1.71,9.9*(1-phase)+.17,Math.sin(angle)*r*.79+Math.cos(time*.62+i)*1.36);
      stamp.rotation.set(i,time+i,phase*4);stamp.scale.setScalar(Math.sin(phase*Math.PI)*(.29+i%5*.12));
      stamp.updateMatrix();embers.setMatrixAt(i,stamp.matrix);
    }
    embers.instanceMatrix.needsUpdate=true;
  },dispose(){
    bulk.dispose();
    root.traverse(node=>{if(node instanceof T.InstancedMesh) node.dispose();});
    for(const resource of [rock,blocks,pillar,floorPiece,basalt,masonry,soot,pyrite,gold,bone,slice,drakeSkull,rib,helm,effigy,fissure,
      ...flows,lava,mistGeometry,mist,emberGeo,emberMat]) resource.dispose();
  }};
}
