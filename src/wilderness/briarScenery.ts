import * as T from 'three';
import { briarWatch, towerFloorAt, towerFloors, towerWalkable, floorRemaining } from './briarWatch.ts';
import { height, randomSequence } from './layout.ts';
import { loft, meshPart, rigidBatcher, shapedPlate } from './creatureGeometry.ts';

export function briarScenery(scene:T.Scene,obstacles:{x:number;z:number;r:number}[]){
  const exterior=new T.Group(), exteriorCenter={x:briarWatch.x,z:briarWatch.z-7};
  exterior.position.set(exteriorCenter.x,height(exteriorCenter.x,exteriorCenter.z),exteriorCenter.z);
  const rand=randomSequence(3256), stamp=new T.Object3D(), tint=new T.Color(), batch=rigidBatcher();
  const slate=new T.MeshStandardMaterial({color:0x626675,roughness:.94});
  const mortar=new T.MeshStandardMaterial({color:0x353745,roughness:.96});
  const wood=new T.MeshStandardMaterial({color:0x46332c,roughness:.94});
  const bronze=new T.MeshStandardMaterial({color:0xaa8a5e,metalness:.59,roughness:.50});
  const obsidian=new T.MeshStandardMaterial({color:0x211e2b,roughness:.54,metalness:.18});
  const vine=new T.MeshStandardMaterial({color:0x4a673b,roughness:1,side:T.DoubleSide});
  const tapestry=new T.MeshStandardMaterial({color:0x663742,roughness:.96,side:T.DoubleSide});
  const amber=new T.MeshBasicMaterial({color:0xffa552,toneMapped:false});
  const runic=new T.MeshBasicMaterial({color:0x9665d9,toneMapped:false,transparent:true,opacity:.69,depthWrite:false});
  const openedRune=new T.MeshBasicMaterial({color:0xb7eaff,toneMapped:false});
  const block=new T.BoxGeometry(), chip=new T.DodecahedronGeometry(1,0);
  const torch=loft([[0,.105,-.10,.10],[.29,.083,-.081,.083],[.44,.046,-.039,.042],[.59,.001,-.001,.001]],7).rotateX(-Math.PI/2);
  const hook=new T.TorusGeometry(.12,.027,5,10);
  const arch=shapedPlate([[-1.12,0],[1.12,0],[1.12,2.05],[.86,2.55],[.46,2.95],[0,3.32],[-.46,2.95],[-.86,2.55],[-1.12,2.05]],.14,.036);
  const leaf=shapedPlate([[0,0],[-.26,.24],[-.16,.62],[.09,.68],[.22,.30]],.015,.005);
  const sigil=shapedPlate([[0,.24],[-.11,.082],[-.21,.012],[-.08,-.021],[-.02,-.24],[.054,-.047],[.18,.021],[.076,.085]],.014,.009);
  const ring=new T.TorusGeometry(1,.044,5,29).rotateX(Math.PI/2);
  const windowColor=new T.MeshBasicMaterial({color:0x190f25});
  const brickEntries:{x:number;y:number;z:number;w:number;h:number;d:number;angle:number}[]=[];
  const bands=22, blocks=23;
  for(let row=0;row<bands;row++){
    const radius=5.74-(row>2?.17:0)+(row>18?.26:0);
    for(let col=0;col<blocks;col++){
      const angle=(col+(row%2)*.5)*Math.PI*2/blocks;
      const radial=Math.atan2(Math.sin(angle),Math.cos(angle));
      const open=Math.abs(radial)<(row<5?.199:row<7?.117:0);
      const win=row>=9&&row<=15&&[0,Math.PI/2,Math.PI,Math.PI*1.5].some(anchor=>
        Math.abs(Math.atan2(Math.sin(angle-anchor),Math.cos(angle-anchor)))<(row===15?.10:.156));
      if(open||win||row===21&&(col%4===1||col===12)) continue;
      brickEntries.push({x:Math.sin(angle)*radius,y:(row-.8)*.555+.04*rand(),z:Math.cos(angle)*radius,
        w:radius*.268+.05,h:.548,d:.74+rand()*.19,angle});
    }
  }
  const bricks=new T.InstancedMesh(block,slate,brickEntries.length);
  brickEntries.forEach(({x,y,z,w,h,d,angle},i)=>{
    stamp.position.set(x,y,z);stamp.rotation.set(0,angle,0);stamp.scale.set(w,h,d);stamp.updateMatrix();
    bricks.setMatrixAt(i,stamp.matrix);tint.setHSL(.64+rand()*.08,.12,.44+rand()*.22);bricks.setColorAt(i,tint);
  });
  bricks.castShadow=true;bricks.receiveShadow=true;bricks.computeBoundingSphere();exterior.add(bricks);
  const lip=new T.CylinderGeometry(5.49,5.55,.35,23);
  meshPart(exterior,lip,mortar,0,10.2);
  const backs=new T.CylinderGeometry(5.08,5.08,9.5,23,1,true);
  backs.rotateY(Math.PI/23);
  meshPart(exterior,backs,mortar,0,5.19);
  meshPart(exterior,arch,wood,0,-.11,5.59).scale.set(1.02,1.25,1);
  for(const x of [-.83,-.55,-.29,0,.29,.55,.83]){
    const beam=meshPart(exterior,block,mortar,x,1.16,5.839);
    beam.scale.set(.06,2.34-Math.abs(x)*.17,.082);
  }
  for(const y of [.51,1.44]){
    const cross=meshPart(exterior,block,bronze,0,y,5.9);cross.scale.set(1.88,.096,.073);
  }
  for(const x of [-.35,.35]) meshPart(exterior,hook,bronze,x,1.21,5.98);
  for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
    const holder=new T.Group();holder.rotation.y=angle;exterior.add(holder);
    meshPart(holder,arch,mortar,0,4.72,5.43).scale.set(.42,.68,1);
    meshPart(holder,arch,windowColor,0,4.78,5.52).scale.set(.29,.62,.69);
    meshPart(holder,block,slate,0,4.93,5.81).scale.set(1.01,.12,.26);
    meshPart(holder,block,bronze,0,5.38,5.64).scale.set(.043,1.01,.07);
    meshPart(holder,sigil,runic,0,6.31,5.64).scale.setScalar(.78);
  }
  const flames:T.Mesh[]=[];
  function addTorch(parent:T.Group,x:number,y:number,z:number){
    const holder=new T.Group();holder.position.set(x,y,z);parent.add(holder);
    meshPart(holder,block,bronze,0,-.15,0).scale.set(.20,.31,.16);
    const rest=meshPart(holder,block,wood,0,-.036,.13);rest.scale.set(.11,.43,.12);rest.rotation.x=-.32;
    const flame=meshPart(holder,torch,amber,0,.15,.22);flame.castShadow=false;
    flames.push(flame);
  }
  for(const x of [-1.76,1.76]) addTorch(exterior,x,1.34,5.82);
  const seal=meshPart(exterior,sigil,runic,0,3.49,5.83);seal.scale.setScalar(1.6);
  for(let stem=0;stem<6;stem++){
    const yaw=.54+stem*1.19;
    for(let row=0;row<15;row++){
      const a=yaw+Math.sin(row*.49+stem)*.16, r=6.05-.02*row;
      const frond=meshPart(exterior,leaf,vine,Math.sin(a)*r,.05+row*.39,Math.cos(a)*r);
      frond.rotation.set(.13,a,Math.sin(row*2.05)*.55);
      frond.scale.setScalar(.66+rand()*.62);
    }
  }
  const exteriorFire=flames.splice(0);
  batch.bake(exterior);scene.add(exterior);
  obstacles.push({x:exteriorCenter.x,z:exteriorCenter.z,r:5.42});

  function portal(root:T.Group,point:{x:number;z:number},exit=false){
    meshPart(root,arch,mortar,point.x,0,point.z).scale.set(.72,.78,.91);
    meshPart(root,arch,obsidian,point.x,.06,point.z+.17).scale.set(.58,.72,.73);
    const icon=meshPart(root,sigil,exit?openedRune:runic,point.x,1.53,point.z+.28);
    icon.scale.setScalar(1.15);
    return icon;
  }
  const floorViews=towerFloors.map(floor=>{
    const root=new T.Group(), places:{x:number;z:number}[]=[];
    for(let z=floor.z-16;z<=floor.z+16;z+=2) for(let x=-18;x<=18;x+=2)
      if(towerWalkable(x,z)) places.push({x,z});
    const tiles=new T.InstancedMesh(block,slate,places.length);
    const trims=new T.InstancedMesh(block,mortar,places.length*2);
    trims.count=0;
    const hue=.61+floor.number*.012;
    places.forEach(({x,z},i)=>{
      stamp.position.set(x,-.21,z);stamp.rotation.set(0,0,0);stamp.scale.set(1.99,.4,1.99);stamp.updateMatrix();
      tiles.setMatrixAt(i,stamp.matrix);
      tint.setHSL(hue,.11+floor.number*.012,.37+rand()*.21);tiles.setColorAt(i,tint);
      let boundary=false;
      for(const [dx,dz] of [[2,0],[-2,0],[0,2],[0,-2]]){
        if(towerWalkable(x+dx,z+dz)) continue;
        boundary=true;
        const px=x+dx*.53,pz=z+dz*.53;
        const pillar=meshPart(root,block,mortar,px,1.43,pz);
        pillar.rotation.y=dx?Math.PI/2:0;pillar.scale.set(2.02,2.89,.48);
        const rail=meshPart(root,block,slate,px,2.89,pz);
        rail.rotation.y=pillar.rotation.y;rail.scale.set(2.08,.27,.61);
      }
      if(boundary&&i%9===1){
        stamp.position.set(x,.026,z);stamp.scale.set(1.87,.05,1.88);stamp.updateMatrix();trims.setMatrixAt(trims.count++,stamp.matrix);
      }
    });
    tiles.receiveShadow=true;tiles.computeBoundingSphere();trims.computeBoundingSphere();root.add(tiles,trims);
    const exit=portal(root,{x:floor.exit.x,z:floor.exit.z+.76},true);
    exit.rotation.y=Math.PI;
    const stair=floor.number<5?portal(root,{x:floor.stairs.x,z:floor.stairs.z-1.29}):undefined;
    const ornaments=new T.Group();root.add(ornaments);
    for(let i=0;i<10;i++){
      const angle=i*2.399;
      const x=Math.sin(angle)*(floor.number===5?13:10.6),z=floor.z+Math.cos(angle)*10.7;
      if(!towerWalkable(x,z)) continue;
      if(floor.number===4){
        const stack=meshPart(ornaments,block,wood,x,.67,z);stack.scale.set(.83,1.34,.49);
        for(const y of [.32,.63,.94]) meshPart(ornaments,block,bronze,x,y,z+.237).scale.set(.68,.06,.064);
      }else if(floor.number===2||floor.number===3){
        meshPart(ornaments,arch,floor.number===2?bronze:tapestry,x,.63,z).scale.set(.27,.55,.20);
      }else{
        const debris=meshPart(ornaments,chip,slate,x,.12,z);debris.scale.set(.32,.22,.25);debris.rotation.set(i,.37*i,0);
      }
    }
    const altarRose=meshPart(root,ring,runic,0,.052,floor.z-.4);
    altarRose.scale.setScalar(floor.number===5?7.7:2.2+floor.number*.4);altarRose.castShadow=false;
    if(floor.number===5){
      meshPart(root,sigil,runic,0,.061,floor.z-1.9).rotation.x=-Math.PI/2;
      root.children.at(-1)!.scale.setScalar(7.5);
    }
    for(const [x,z] of [[-4,floor.z+8],[4,floor.z-8],[-6,floor.z-5],[6,floor.z+7]]) addTorch(root,x,1.27,z);
    const roomFire=flames.splice(0);
    batch.bake(root);root.visible=false;scene.add(root);
    return {floor,root,stair,altarRose,roomFire};
  });
  const lighting=[new T.PointLight(0xffbb79,19,14,2),new T.PointLight(0xa985ff,20,18,2)];
  scene.add(...lighting);
  function animateFire(fire:T.Mesh[],time:number){
    fire.forEach((flame,i)=>{
      flame.scale.set(.86,1+.21*Math.sin(time*7+i*2.399),.86);
      flame.rotation.z=.15*Math.sin(time*5+i);
    });
  }
  return {
    update(time:number,p:T.Vector3,defeated:readonly string[]){
      const current=towerFloorAt(p.z);
      exterior.visible=!current&&Math.hypot(p.x-briarWatch.x,p.z-briarWatch.z)<105;
      if(exterior.visible){animateFire(exteriorFire,time);seal.rotation.z=.13*Math.sin(time*1.8);}
      runic.opacity=.62+.14*Math.sin(time*2.9);
      for(const view of floorViews){
        view.root.visible=view.floor===current;
        if(!view.root.visible) continue;
        if(view.stair) view.stair.material=floorRemaining(view.floor,defeated)===0?openedRune:runic;
        animateFire(view.roomFire,time);
      }
      lighting.forEach((light,i)=>{
        light.visible=Boolean(current);
        if(current) light.position.set(i?4:-4,2.8,current.z+(i?-5:5));
      });
    },
    dispose(){batch.dispose();},
  };
}
