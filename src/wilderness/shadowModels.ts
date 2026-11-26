import * as T from 'three';
import { meshPart, shapedPlate, type CreatureRig } from './creatureGeometry.ts';
import { shadowProfiles, type ShadowKind } from './shadowData.ts';

export function spectralModels(){
  const materials=new Map<ShadowKind,{form:T.MeshStandardMaterial;glow:T.MeshBasicMaterial}>();
  const owned: (()=>void)[]=[];
  const rune=shapedPlate([[0,.18],[-.20,.035],[-.075,.010],[-.018,-.19],[.045,-.057],[.175,-.018],[.072,.025]],.012,.007);
  const glint=shapedPlate([[-.056,-.012],[-.047,.012],[.054,.019],[.042,-.017]],.008,.003);
  return {
    decorate(rig:CreatureRig,kind:ShadowKind){
      let set=materials.get(kind);
      if(!set){
        const glow=new T.MeshBasicMaterial({color:shadowProfiles[kind].color,toneMapped:false});
        const form=new T.MeshStandardMaterial({color:0x090c19,roughness:.63,metalness:.23});
        const rim={value:new T.Color(shadowProfiles[kind].color)};
        form.onBeforeCompile=shader=>{
          shader.uniforms.shadowRim=rim;
          shader.fragmentShader='uniform vec3 shadowRim;\n'+shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
            float edge=pow(1.-max(dot(normalize(vViewPosition),normal),0.),3.2);
            totalEmissiveRadiance+=shadowRim*(.05+edge*.43);`);
        };
        set={form,glow};materials.set(kind,set);
      }
      const {form,glow}=set;
      rig.root.traverse(node=>{
        if(!(node instanceof T.Mesh)||Array.isArray(node.material)||node.material.transparent) return;
        const original=node.material;
        node.material=original instanceof T.MeshStandardMaterial&&original.emissiveIntensity>.42&&original.emissive.getHex()
          ||original instanceof T.MeshBasicMaterial&&original.color.getHex()>0x413850?glow:form;
      });
      const caster=kind==='wizard'||kind==='ritualElite'||kind==='frostGuardian';
      const brute=kind==='brute'||kind==='warlord'||kind==='assassin';
      const emblem=meshPart(rig.root,rune,glow,0,caster?1.62:1.48,brute?.20:.27);
      emblem.scale.set(caster?.77:.62,caster?1.12:.74,1);emblem.castShadow=false;
      if(kind==='skeleton'||kind==='sentinel'||kind==='frostGuardian') for(const side of [-1,1]){
        const eye=meshPart(rig.root,glint,glow,side*.078,kind==='skeleton'?2.21:2.23,.24);
        eye.rotation.z=side*.11;eye.castShadow=false;
      }
      return rig;
    },
    own(dispose:()=>void){owned.push(dispose);},
    dispose(){
      owned.forEach(dispose=>dispose());
      for(const {form,glow} of materials.values()){form.dispose();glow.dispose();}
      rune.dispose();glint.dispose();
    },
  };
}
