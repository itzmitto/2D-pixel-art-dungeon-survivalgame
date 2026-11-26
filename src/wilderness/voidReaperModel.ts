import * as T from 'three';
import { loft, meshPart, shapedPlate } from './creatureGeometry.ts';

export function voidReaperModel(){
  const right=new T.Group(), left=new T.Group();
  const steel=new T.MeshStandardMaterial({color:0x161522,metalness:.77,roughness:.35,flatShading:true});
  const edge=new T.MeshStandardMaterial({color:0x9ca1bb,metalness:.86,roughness:.25});
  const inlay=new T.MeshStandardMaterial({color:0xd493ff,emissive:0x8c32d7,emissiveIntensity:1.75});
  const grip=new T.MeshStandardMaterial({color:0x2b202f,roughness:.96});
  const profile=[[-.15,1.55],[.26,1.75],[.75,1.81],[1.24,1.73],[1.69,1.5],[2.04,1.11],[2.25,.62],
    [1.98,.86],[1.62,1.05],[1.31,1.14],[1.22,1.02],[.99,1.21],[.65,1.28],[.48,1.18],[.29,1.3],[.03,1.31]] as const;
  const blade=shapedPlate(profile,.075,.035).translate(0,0,-.037);
  const spine=shapedPlate([[.13,1.58],[.74,1.76],[1.22,1.68],[1.67,1.45],[2.04,1.08],[2.24,.63],
    [1.9,.86],[1.52,1.14],[1.13,1.36],[.61,1.5]],.041,.017);
  const shaft=loft([[-1.18,.065,-.05,.05],[-.87,.044,-.047,.047],[-.28,.062,-.045,.045],[.31,.053,-.05,.05],
    [1.17,.076,-.06,.06],[1.61,.095,-.076,.076],[1.81,.052,-.046,.046]],9).rotateX(-Math.PI/2);
  meshPart(right,shaft,steel);
  meshPart(right,blade,steel);
  meshPart(right,spine,edge,0,0,.026);
  meshPart(right,spine,edge,0,0,-.067);
  const ferrule=new T.CylinderGeometry(.082,.074,.067,9);
  for(const y of [-1.11,-.76,-.43,.38,.99,1.29,1.52,1.69]) meshPart(right,ferrule,y>1?edge:grip,0,y);
  const wrap=new T.TorusGeometry(.061,.013,4,9).rotateX(Math.PI/2);
  for(let i=0;i<13;i++) meshPart(right,wrap,i%4===0?edge:grip,0,-.36+i*.056).rotation.z=.13;
  const rune=shapedPlate([[-.11,-.01],[-.06,.055],[.009,.026],[.087,.10],[.052,.014],[.12,-.059],[.024,-.027],[-.033,-.105],[-.025,-.016]],.01,0);
  for(const side of [-1,1]) for(let i=0;i<9;i++){
    const x=.15+i*.18,y=1.39+.13*Math.sin(i*.48)-Math.max(0,i-4)*.058;
    const mark=meshPart(right,rune,inlay,x,y,side*.090);
    mark.rotation.set(0,side<0?Math.PI:0,-.2-i*.12);
    mark.scale.setScalar(.77-i*.045);mark.castShadow=false;
  }
  const ghost=new T.MeshBasicMaterial({color:0xb15cff,transparent:true,opacity:.2,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide});
  const veil=meshPart(right,blade,ghost,.04,-.024,.099);veil.castShadow=false;
  const smoke=new T.MeshBasicMaterial({color:0x5b258b,transparent:true,opacity:.27,depthWrite:false});
  const moteGeo=new T.OctahedronGeometry(.041);
  const motes=Array.from({length:12},(_,i)=>{
    const m=meshPart(right,moteGeo,i%3?inlay:smoke);m.castShadow=false;return m;
  });
  return {right,left,update(time:number){
    inlay.emissiveIntensity=1.35+.61*Math.sin(time*4.6);
    ghost.opacity=.15+.085*Math.sin(time*3.4);
    veil.position.z=.082+.032*Math.sin(time*4);
    for(const [i,mote] of motes.entries()){
      const p=(time*(.48+i%3*.09)+i*.173)%1;
      mote.position.set(.08+2.19*p,1.48-.74*p**3+.18*Math.sin(p*11+i),.16*Math.sin(time*3+i*2.4));
      mote.rotation.set(time,i+p*4,p*6);
      mote.scale.setScalar(Math.sin(Math.PI*p)*(i%3?1:2.2));
    }
  }};
}
