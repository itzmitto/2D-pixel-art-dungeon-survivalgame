import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { createDarkKnight } from '../knight/animation';
import type { WeaponId } from '../weapons';
import { Glyph } from './Glyph';

export function KnightPreview({weapon}:{weapon:WeaponId}){
  const canvas=useRef<HTMLCanvasElement>(null);
  const draw=useRef<((id:WeaponId)=>void)|null>(null);
  const [unavailable,setUnavailable]=useState(false);
  useEffect(()=>{
    if(!canvas.current) return;
    let renderer:T.WebGLRenderer;
    try { renderer=new T.WebGLRenderer({canvas:canvas.current,alpha:true,antialias:true}); }
    catch {setUnavailable(true);return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    renderer.setSize(230,300,false);
    renderer.toneMapping=T.ACESFilmicToneMapping;
    const scene=new T.Scene();
    const camera=new T.PerspectiveCamera(34,230/300,.1,20);
    camera.position.set(2.9,2.1,4.4);
    camera.lookAt(0,1.28,0);
    const knight=createDarkKnight();
    knight.root.rotation.y=-.30;
    scene.add(knight.root,new T.HemisphereLight(0xdcf0ff,0x3c4a63,2.8));
    const rim=new T.DirectionalLight(0x8ddaff,3.2);
    rim.position.set(-3,4,1);scene.add(rim);
    draw.current=id=>{
      knight.equip(id);
      knight.update(.016,{speed:0,sprinting:false});
      renderer.render(scene,camera);
    };
    return ()=>{
      draw.current=null;
      const geometries=new Set<T.BufferGeometry>(), materials=new Set<T.Material>();
      scene.traverse(node=>{
        if(node instanceof T.Mesh){
          geometries.add(node.geometry);
          for(const material of Array.isArray(node.material)?node.material:[node.material]) materials.add(material);
        }
      });
      geometries.forEach(g=>g.dispose());
      materials.forEach(m=>m.dispose());
      renderer.dispose();
    };
  },[]);
  useEffect(()=>{draw.current?.(weapon);},[weapon]);
  return <div className="knight-preview">
    {unavailable?<div className="preview-fallback" aria-label="3D preview unavailable"><Glyph kind="armor"/></div>:
      <canvas ref={canvas} width={230} height={300} aria-label="Dark Knight equipment preview"/>}
  </div>;
}
