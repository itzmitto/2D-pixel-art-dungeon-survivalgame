import * as T from 'three';
import { loft, shapedPlate, rigidBatcher, meshPart } from './creatureGeometry.ts';
import { surface } from './layout.ts';
import { waystones } from './worldSites.ts';

export function waystoneModels(scene:T.Scene){
  const stone=new T.MeshStandardMaterial({color:0x5b6977,roughness:.88,flatShading:true});
  const slate=new T.MeshStandardMaterial({color:0x333d52,roughness:.93});
  const silver=new T.MeshStandardMaterial({color:0x8496a3,metalness:.49,roughness:.55});
  const dormant=new T.MeshBasicMaterial({color:0x244e64});
  const rune=new T.MeshBasicMaterial({color:0x81edff,toneMapped:false});
  const plinth=new T.CylinderGeometry(1.62,1.76,.23,12);
  const stairs=new T.CylinderGeometry(1.27,1.49,.20,12);
  const monolith=loft([[-.12,.52,-.36,.34],[.35,.53,-.37,.34],[1.21,.48,-.32,.30],[2.18,.35,-.28,.22],[2.48,.22,-.20,.16],[2.70,.05,-.054,.054]],7).rotateX(-Math.PI/2);
  const buttress=loft([[0,.24,-.28,.28],[.37,.21,-.24,.25],[.93,.10,-.14,.16],[1.27,.03,-.03,.035]],6).rotateX(-Math.PI/2);
  const diamond=shapedPlate([[0,.19],[.12,0],[0,-.19],[-.12,0]],.014,.008);
  const chisel=shapedPlate([[0,.15],[.037,.05],[.129,.018],[.06,-.027],[.018,-.16],[-.034,-.018],[-.095,.018],[-.035,.04]],.012,0);
  const ring=new T.TorusGeometry(1,.026,5,38).rotateX(Math.PI/2);
  const chip=new T.OctahedronGeometry(.065);
  const collars=new T.CylinderGeometry(1.07,1.07,.075,12);
  const disk=new T.RingGeometry(.97,1.06,40).rotateX(-Math.PI/2);
  const matrix=new T.Object3D(), batch=rigidBatcher();
  const models=waystones.map(site=>{
    const root=new T.Group();root.position.set(site.x,surface(site.x,site.z),site.z);
    meshPart(root,plinth,slate,0,.07);meshPart(root,stairs,stone,0,.24);meshPart(root,collars,silver,0,.36);
    meshPart(root,monolith,stone,0,.43).rotation.y=.08;
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3;
      const slab=meshPart(root,buttress,i%2?stone:slate,Math.sin(a)*.73,.36,Math.cos(a)*.73);
      slab.rotation.y=a;slab.rotation.x=.20;
    }
    const carvings=new T.Group();root.add(carvings);
    for(const face of [-1,1]){
      const row=new T.Group();row.rotation.y=face===-1?Math.PI:0;carvings.add(row);
      meshPart(row,diamond,slate,0,1.95,.351).scale.set(2.2,1.8,1);
      meshPart(row,diamond,dormant,0,1.95,.371);
      for(let i=0;i<3;i++) meshPart(row,chisel,dormant,0,.79+i*.36,.43-i*.024).rotation.z=i*.85;
    }
    const auraMaterial=new T.MeshBasicMaterial({color:0x67d7ff,transparent:true,opacity:.75,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false});
    const aura=new T.Group();
    const lower=meshPart(aura,disk,auraMaterial,0,.418);
    const halo=meshPart(aura,ring,auraMaterial,0,2.85);halo.scale.setScalar(.69);
    const orbit=meshPart(aura,ring,auraMaterial,0,1.24);orbit.scale.setScalar(.87);
    const motes=new T.InstancedMesh(chip,rune,15);
    motes.instanceMatrix.setUsage(T.DynamicDrawUsage);motes.frustumCulled=false;aura.add(motes);
    root.add(aura);batch.bake(root);
    scene.add(root);
    const glyphs:T.Mesh[]=[];
    carvings.traverse(child=>{if(child instanceof T.Mesh&&child.material===dormant) glyphs.push(child);});
    return {site,root,aura,halo,lower,orbit,motes,auraMaterial,glyphs};
  });
  return {
    update(time:number,player:T.Vector3,activated:readonly string[]){
      for(const model of models){
        const {site,root,aura,halo,lower,orbit,motes,auraMaterial,glyphs}=model;
        const near=Math.hypot(player.x-site.x,player.z-site.z);
        root.visible=near<99;
        if(!root.visible) continue;
        const active=activated.includes(site.id);
        for(const glyph of glyphs) glyph.material=active?rune:dormant;
        aura.visible=near<46;
        if(!aura.visible) continue;
        auraMaterial.opacity=(active?.72:.18)+Math.sin(time*2.8)*.09;
        halo.rotation.set(Math.sin(time*1.1)*.25,time*.86,.20);
        orbit.rotation.set(-.30,time*1.2,Math.sin(time)*.32);
        lower.scale.setScalar(1.04+Math.sin(time*2.8)*.075);
        motes.count=active?15:5;
        for(let i=0;i<motes.count;i++){
          const y=(time*.54+i*.229)%1,a=i*2.399+time*(active?1.88:.79);
          const radius=.43+(i%5)*.15;
          matrix.position.set(Math.cos(a)*radius,.44+y*2.8,Math.sin(a)*radius);
          matrix.rotation.set(a*.61,a,y);
          matrix.scale.setScalar(Math.sin(y*Math.PI)*(active?1.22:.58));
          matrix.updateMatrix();motes.setMatrixAt(i,matrix.matrix);
        }
        motes.instanceMatrix.needsUpdate=true;
      }
    },
    dispose(){batch.dispose();},
  };
}
