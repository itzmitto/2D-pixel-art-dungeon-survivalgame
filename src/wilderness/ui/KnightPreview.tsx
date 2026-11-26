import type { EquippedArmor } from '../armor';
import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { createDarkKnight } from '../knight/animation';
import type { Rarity, WeaponId } from '../weapons';
import type { RelicId } from '../itemInstances';
import { reflectionLighting } from '../reflectionLighting';
import { Glyph } from './Glyph';

type Equipment={weapon:WeaponId;tier:Rarity;relic?:RelicId;armor:EquippedArmor};

export function KnightPreview({weapon,tier,relic,armor}:Equipment){
  const canvas=useRef<HTMLCanvasElement>(null);
  const equipment=useRef<Equipment>({weapon,tier,relic,armor});
  const [unavailable,setUnavailable]=useState(false);
  useEffect(()=>{equipment.current={weapon,tier,relic,armor};},[weapon,tier,relic,armor]);
  useEffect(()=>{
    if(!canvas.current) return;
    let renderer:T.WebGLRenderer;
    try { renderer=new T.WebGLRenderer({canvas:canvas.current,alpha:true,antialias:true}); }
    catch {setUnavailable(true);return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
    renderer.setSize(270,326,false);
    renderer.toneMapping=T.ACESFilmicToneMapping;
    const scene=new T.Scene();
    const environment=reflectionLighting(true);
    scene.environment=environment;scene.environmentIntensity=1.12;
    const camera=new T.PerspectiveCamera(34,270/326,.1,20);
    camera.position.set(2.6,2.0,4.3);
    camera.lookAt(.07,1.34,0);
    const knight=createDarkKnight();
    scene.add(knight.root,new T.HemisphereLight(0xd2deef,0x64546a,1.56));
    const rim=new T.DirectionalLight(0xa5d3ff,2.6);
    rim.position.set(-3,4,1);scene.add(rim);
    const front=new T.DirectionalLight(0xffdfb8,1.55);
    front.position.set(2,2,5);scene.add(front);
    let handle=0, previous=0, active:Equipment|undefined;
    function draw(now:number){
      const next=equipment.current;
      if(active!==next){
        active=next;
        camera.zoom=next.weapon==='scythe'?.75:next.weapon==='greatsword'?.89:1.09;
        camera.updateProjectionMatrix();
        knight.equipArmor(next.armor);
        knight.equip(next.weapon,next.tier,next.relic);
      }
      if(now-previous>24){
        knight.root.rotation.y=-.31+Math.sin(now*.00072)*.39;
        knight.update(previous?Math.min(.1,(now-previous)*.001):0,{speed:0,sprinting:false});
        renderer.render(scene,camera);
        previous=now;
      }
      handle=requestAnimationFrame(draw);
    }
    handle=requestAnimationFrame(draw);
    return ()=>{
      cancelAnimationFrame(handle);
      knight.disposeWeapon();knight.disposeArmor();
      const geometries=new Set<T.BufferGeometry>(), materials=new Set<T.Material>();
      scene.traverse(node=>{
        if(node instanceof T.InstancedMesh) node.dispose();
        if(node instanceof T.Mesh||node instanceof T.Line){
          geometries.add(node.geometry);
          for(const material of Array.isArray(node.material)?node.material:[node.material]) materials.add(material);
        }
      });
      geometries.forEach(g=>g.dispose());
      materials.forEach(m=>m.dispose());
      environment.dispose();renderer.dispose();
    };
  },[]);
  return <div className="knight-preview">
    {unavailable?<div className="preview-fallback" aria-label="3D preview unavailable"><Glyph kind={relic??weapon}/></div>:
      <canvas ref={canvas} width={270} height={326} aria-label="Dark Knight equipment preview"/>}
  </div>;
}
