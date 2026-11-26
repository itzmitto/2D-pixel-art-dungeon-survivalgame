import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import type { Exploration } from '../exploration';
import { attackSpeed, elemental, physical } from '../progression';
import { rarity, weaponDamage, type Rarity, type Weapon } from '../weapons';
import { Glyph } from './Glyph';

export function weaponStats(weapon:Weapon,stats:Exploration['stats']){
  return [
    ['Damage',weaponDamage({...weapon,damage:weapon.damage*(weapon.id==='staff'?elemental(stats):physical(stats))})],
    ['Attack interval',(weapon.cooldown/attackSpeed(stats)).toFixed(2)+' s'],
    ['Range',weapon.range],
    ...(weapon.id==='scythe'?[['Soul Harvest','5% of actual damage, capped']]:[]),
    ...(weapon.ability?[[weapon.abilityName,weapon.abilityCooldown+' s']]:[]),
  ] as const;
}

type ItemInfo={name:string;icon:string;tier:Rarity;description:string;stats?:readonly (readonly (string|number)[])[]};

export function ItemButton({item,children,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{item?:ItemInfo}){
  const [hover,setHover]=useState(false),[focused,setFocused]=useState(false);
  const [anchor,setAnchor]=useState<DOMRect>();
  const ref=useRef<HTMLButtonElement>(null);
  const id=useId();
  const visible=Boolean(item&&anchor&&!props.disabled&&(hover||focused));
  useEffect(()=>{
    if(!visible) return;
    const refresh=()=>{if(ref.current) setAnchor(ref.current.getBoundingClientRect());};
    window.addEventListener('resize',refresh);
    window.addEventListener('scroll',refresh,true);
    return ()=>{
      window.removeEventListener('resize',refresh);
      window.removeEventListener('scroll',refresh,true);
    };
  },[visible]);
  return <>
    <button {...props} ref={ref} aria-describedby={visible?id:undefined}
      onPointerEnter={event=>{if(event.pointerType!=='touch'){setAnchor(event.currentTarget.getBoundingClientRect());setHover(true);}}}
      onPointerLeave={()=>setHover(false)}
      onFocus={event=>{if(event.currentTarget.matches(':focus-visible')){setAnchor(event.currentTarget.getBoundingClientRect());setFocused(true);}}}
      onBlur={()=>setFocused(false)}>{children}</button>
    {visible&&item&&anchor&&createPortal(
      <div className="system-tooltip" id={id} role="tooltip" data-rarity={item.tier}
        style={{borderColor:rarity[item.tier].color,left:Math.min(Math.max(12,anchor.left),Math.max(12,innerWidth-284)),
          ...(anchor.top>innerHeight*.54?{bottom:innerHeight-anchor.top+9}:{top:anchor.bottom+9})}}>
        <div className="tooltip-heading" style={{color:rarity[item.tier].color}}>
          <Glyph kind={item.icon}/><div><small>{item.tier}</small><strong>{item.name}</strong></div>
        </div>
        <p>{item.description}</p>
        {item.stats&&<dl>{item.stats.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
      </div>,document.body)}
  </>;
}
