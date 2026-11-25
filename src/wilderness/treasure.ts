import * as T from 'three';
import { surface } from './layout.ts';
import { rarity, type Rarity, type WeaponId } from './weapons.ts';

export type Chest={id:string;x:number;z:number;rarity:Rarity;weapon:WeaponId;gold:number;armor:number;boss?:string};
export const worldChests:Chest[]=[
  {id:'ember-cache',x:-52,z:3,rarity:'Common',weapon:'shield',gold:8,armor:1},
  {id:'raven-cache',x:-189,z:62,rarity:'Uncommon',weapon:'axe',gold:14,armor:2},
  {id:'ruin-cache',x:111,z:-90,rarity:'Rare',weapon:'staff',gold:22,armor:3},
  {id:'greyfen-cache',x:169,z:-160,rarity:'Epic',weapon:'greatsword',gold:32,armor:4},
];
export function chestModels(group:T.Group,chests:readonly Chest[],opened:readonly string[]){
  const box=new T.BoxGeometry(), beam=new T.CylinderGeometry(.035,.1,1.4,6,1,true);
  const wood=new T.MeshStandardMaterial({color:'#4d3425',roughness:.86});
  const dark=new T.MeshStandardMaterial({color:'#100e0e'});
  const holders=chests.map(chest=>{
    const root=new T.Group(), lid=new T.Group();
    root.position.set(chest.x,surface(chest.x,chest.z),chest.z);
    const trim=new T.MeshStandardMaterial({color:rarity[chest.rarity].color,roughness:.48,metalness:.45});
    function block(parent:T.Group,mat:T.Material,x:number,y:number,z:number,w:number,h:number,d:number){
      const mesh=new T.Mesh(box,mat);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);
    }
    block(root,wood,0,.29,0,1.52,.54,1);
    block(root,dark,0,.57,0,1.26,.05,.76);
    for(const x of [-.57,.57]) block(root,trim,x,.29,0,.12,.56,1.03);
    lid.position.set(0,.56,-.50);
    block(lid,wood,0,.14,.5,1.54,.26,1.02);
    block(lid,wood,0,.30,.5,1.47,.13,.70);
    for(const x of [-.57,.57]) block(lid,trim,x,.16,.5,.12,.32,1.04);
    block(lid,trim,0,.045,1.02,.19,.21,.05);
    root.add(lid);
    const shine=new T.Mesh(beam,new T.MeshBasicMaterial({color:rarity[chest.rarity].color,transparent:true,opacity:.37,depthWrite:false}));
    shine.position.y=1.35;root.add(shine);group.add(root);
    const isOpen=opened.includes(chest.id);
    lid.rotation.x=isOpen?-1.35:0;
    return {chest,root,lid,shine,isOpen,trim};
  });
  return {
    update(dt:number,bosses:readonly string[],openedIds:readonly string[]){
      for(const holder of holders){
        holder.root.visible=!holder.chest.boss||bosses.includes(holder.chest.boss);
        holder.isOpen=openedIds.includes(holder.chest.id);
        holder.lid.rotation.x=T.MathUtils.lerp(holder.lid.rotation.x,holder.isOpen?-1.35:0,1-Math.exp(-8*dt));
        holder.shine.visible=holder.root.visible&&!holder.isOpen;
      }
    },
    dispose(){
      box.dispose();beam.dispose();wood.dispose();dark.dispose();
      for(const holder of holders){holder.trim.dispose();holder.shine.material.dispose();}
    },
  };
}
