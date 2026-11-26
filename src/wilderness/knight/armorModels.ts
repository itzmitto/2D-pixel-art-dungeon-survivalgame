import * as T from 'three';
import { armorPiece, armorSlots, type ArmorSet, type ArmorSlot, type EquippedArmor } from '../armor.ts';
import { joint, meshPart, shapedPlate } from '../creatureGeometry.ts';
import type { createKnightModel } from './model.ts';

export function armorModels(model:ReturnType<typeof createKnightModel>){
  const metal=new T.MeshStandardMaterial({metalness:.7,roughness:.43});
  const trim=new T.MeshStandardMaterial({metalness:.63,roughness:.36});
  const rune=new T.MeshStandardMaterial({color:0xaa83e6,emissive:0xac45ff,emissiveIntensity:.48});
  const colored:Record<ArmorSet,readonly [number,number,number]>={iron:[0x726c65,0xb39a76,0x543325],blacksteel:[0x293249,0x8ea6bd,0x25334a],abyssal:[0x222134,0xa78bbc,0x371744]};
  const materials=Object.fromEntries(Object.entries(colored).map(([key])=>[key,{
    plate:metal.clone(),edge:trim.clone(),
  }])) as Record<ArmorSet,{plate:T.MeshStandardMaterial;edge:T.MeshStandardMaterial}>;
  for(const set of Object.keys(colored) as ArmorSet[]){
    materials[set].plate.color.setHex(colored[set][0]);
    materials[set].edge.color.setHex(colored[set][1]);
  }
  const crest=shapedPlate([[0,.28],[-.16,.095],[-.11,-.16],[0,-.25],[.12,-.16],[.17,.095]],.034,.016);
  const filigree=shapedPlate([[0,.18],[-.05,.055],[-.093,.047],[-.04,-.028],[-.012,-.16],[.029,-.043],[.087,.005],[.045,.074]],.012,.005);
  const fang=shapedPlate([[-.049,-.13],[-.068,.022],[0,.22],[.083,.021],[.047,-.12]],.041,.012);
  const wing=shapedPlate([[-.04,-.13],[.109,-.065],[.178,.095],[.098,.237],[-.014,.136]],.055,.016);
  const rivet=new T.IcosahedronGeometry(.023);
  const chain=new T.TorusGeometry(.108,.010,4,14,Math.PI*1.04);
  const ring=new T.TorusGeometry(.042,.010,5,10);
  const groups=new Map<ArmorSlot,T.Group[]>();
  const cosmetics=new Map<ArmorSlot,T.Mesh[]>();
  function part(slot:ArmorSlot,parent:T.Group,geo:T.BufferGeometry,x:number,y:number,z:number,sx:number,sy:number,rotation=0){
    const node=joint(parent,x,y,z);node.rotation.z=rotation;
    const shell=meshPart(node,geo,materials.iron.plate);shell.scale.set(sx,sy,1);
    const edge=meshPart(node,geo,materials.iron.edge,0,.012,-.034);edge.scale.set(sx*1.12,sy*1.12,1);
    const gem=meshPart(node,filigree,rune,0,0,.055);gem.scale.set(sx*.7,sy*.61,.62);
    const sides=[-1,1].map(sign=>{
      const tip=meshPart(node,fang,materials.iron.edge,sign*sx*.13,sy*.084,-.025);
      tip.scale.set(sx*.44,sy*.54,.66);tip.rotation.z=-sign*.40;
      return tip;
    });
    groups.set(slot,[...(groups.get(slot)??[]),node]);
    cosmetics.set(slot,[...(cosmetics.get(slot)??[]),shell,edge,gem,...sides]);
    return node;
  }
  part('helmet',model.head,crest,0,.268,.163,.83,.64);
  part('chestplate',model.torso,crest,0,.28,.212,1.66,1.1);
  for(const side of [-1,1]){
    part('chestplate',model.arms[side===-1?0:1].shoulder,wing,side*.073,.081,.084,.82,.72,-side*.38);
    const arm=model.arms[side===-1?0:1];
    part('gauntlets',arm.fore,crest,0,-.17,.104,.59,.70);
    const leg=model.legs[side===-1?0:1];
    part('legs',leg.lower,crest,0,-.15,.102,.71,.84);
    part('boots',leg.foot,wing,0,-.025,.188,.67,.37,-side*.12);
  }
  const capeClasp=part('cape',model.torso,crest,0,.413,-.228,.47,.39);
  capeClasp.rotation.y=Math.PI;
  const amulet=part('amulet',model.torso,crest,0,.392,.27,.31,.34);
  meshPart(amulet,chain,trim,0,.087,.014).rotation.z=Math.PI;
  const finger=part('ring',model.arms[0].hand,crest,-.042,-.055,.055,.12,.13);
  meshPart(finger,ring,trim,-.019,0,.014).rotation.y=Math.PI/2;
  meshPart(finger,rivet,rune,0,0,.039).scale.setScalar(.58);
  metal.dispose();
  function equip(equipped:EquippedArmor){
    for(const slot of armorSlots){
      const id=equipped[slot], set=id?armorPiece(id).set:undefined;
      for(const node of groups.get(slot)??[]) node.visible=Boolean(set);
      if(!set) continue;
      const {edge,plate}=materials[set];
      (cosmetics.get(slot)??[]).forEach((mesh,i)=>{
        const layer=i%5;
        mesh.visible=layer<2||(layer===2?set==='abyssal':set!=='iron');
        if(layer!==2) mesh.material=layer===0?plate:edge;
      });
    }
    const capeSet=equipped.cape?armorPiece(equipped.cape).set:undefined;
    model.cape.material.color.setHex(capeSet?colored[capeSet][2]:0x591f28);
    model.cape.material.emissive.setHex(capeSet==='abyssal'?0x310857:0x000000);
    model.cape.material.emissiveIntensity=.37;
  }
  equip({});
  return {equip,update(time:number){rune.emissiveIntensity=.45+Math.sin(time*3.2)*.23;},
    dispose(){
      for(const {plate,edge} of Object.values(materials)){plate.dispose();edge.dispose();}
    },
  };
}
