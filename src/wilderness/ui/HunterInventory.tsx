import { useState, type CSSProperties } from 'react';
import type { Exploration } from '../exploration';
import { instanceWeapon } from '../itemInstances';
import { attackSpeed, physical, elemental } from '../progression';
import { elementalIds, rarity, weapons, weaponDamage, type Rarity, type WeaponId } from '../weapons';
import { SystemPanel } from './SystemPanel';
import { Glyph } from './Glyph';
import { KnightPreview } from './KnightPreview';

const filters=['All','Weapons','Armor','Consumables','Materials','Accessories'] as const;
type Filter=typeof filters[number];
const pageSize=24;
type Entry={id:string;name:string;icon:string;category:Exclude<Filter,'All'>;tier:Rarity;count:number;description:string};
const slots=['Helmet','Chestplate','Gauntlets','Leg armor','Boots','Cape','Main hand','Off hand','Amulet','Ring'];
export const tint=(tier:Rarity)=>({'--rarity':rarity[tier].color} as CSSProperties);
export const healthNotation=(value:number)=>Number(value.toFixed(1));

function Equipment({hero}:{hero:Exploration}){
  const item=hero.items.find(entry=>entry.id===hero.selectedItem);
  const weapon=weapons[hero.equipped];
  return <>
    <div className="equipment-layout">
      <KnightPreview weapon={weapon.id} tier={item?.rarity??weapon.rarity}/>
      <div className="equipment-points">
        {slots.map((slot,index)=>{
          const active=index===6?weapon.name:index===7&&weapon.model.shield?'Water Shield':null;
          return <div key={slot} className={'equipment-point '+(active?'equipped':'')} style={tint(item?.rarity??'Common')}>
            <span className="equipment-icon">{active?<Glyph kind={index===7?'shield':weapon.id}/>:<i/>}</span>
            <span><small>{slot}</small><strong>{active??'Empty'}</strong></span>
          </div>;
        })}
      </div>
    </div>
    <p className="equipment-footnote">Armor rating <strong>{hero.armor}</strong> · Chest rewards improve this rating. Individual armor and accessories have no equipped items yet.</p>
  </>;
}

export function HunterInventory({hero,close,equip,assign,redeem,canRedeem}:{
  hero:Exploration;close:()=>void;equip:(type:WeaponId,id:string)=>void;
  assign:(slot:number,id:string|null)=>void;redeem:(id:WeaponId)=>void;canRedeem:boolean;
}){
  const [view,setView]=useState<'pack'|'kit'>('pack');
  const [filter,setFilter]=useState<Filter>('All');
  const [page,setPage]=useState(0);
  const [selection,select]=useState(hero.selectedItem);
  const items:Entry[]=[
    ...hero.items.map((item):Entry=>({id:item.id,name:weapons[item.type].name,icon:item.type,category:'Weapons',tier:item.rarity,count:1,description:weapons[item.type].description})),
    ...(hero.armor>0?[{id:'@armor',name:'Armor rating',icon:'armor',category:'Armor' as const,tier:'Common' as const,count:1,description:'Protection granted by claimed treasure. This is a defense rating, not an armor piece.'}]:[]),
    ...(hero.potions>0?[{id:'@potions',name:'Health Potion',icon:'potion',category:'Consumables' as const,tier:'Common' as const,count:hero.potions,description:'Restores up to 12 health. Press R while exploring.'}]:[]),
    ...[...Object.entries(hero.materials),['Wolf Fang',hero.fangs] as const].filter(([,count])=>count>0).map(([name,count]):Entry=>
      ({id:'@material:'+name,name,icon:name.includes('Fang')?'fang':'material',category:'Materials',tier:'Common',count,
        description:name==='Wolf Fang'?'Can be exchanged for a missing weapon at Ember Clearing.':'Material recovered from a hunt.'})),
  ];
  const filtered=items.filter(item=>filter==='All'||item.category===filter);
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const currentPage=Math.min(page,pages-1);
  const visible=filtered.slice(currentPage*pageSize,(currentPage+1)*pageSize);
  const selected=filtered.find(item=>item.id===selection)??visible[0];
  const instance=hero.items.find(item=>item.id===selected?.id);
  const detail=instance&&instanceWeapon(instance);
  const capacity=Math.max(pageSize,Math.ceil(items.length/pageSize)*pageSize);
  return <SystemPanel title={view==='kit'?'Equipment':'Inventory'} section="Hunter System / Armory" close={close} style="inventory-system">
    <div className="armory-toolbar">
      <div role="group" aria-label="Armory views"><button aria-pressed={view==='pack'} onClick={()=>setView('pack')}>Inventory</button>
        <button aria-pressed={view==='kit'} onClick={()=>setView('kit')}>Equipment</button></div>
      <span className="coin-label"><Glyph kind="coin"/>{hero.gold} gold</span>
    </div>
    {view==='kit'?<Equipment hero={hero}/>:<>
      <div className="armory-filters" role="group" aria-label="Inventory category">
        {filters.map(category=><button key={category} aria-pressed={category===filter}
          onClick={()=>{setFilter(category);setPage(0);}}>{category}</button>)}
      </div>
      <div className="armory-content">
        <div><div className="armory-grid">
          {Array.from({length:pageSize},(_,index)=>{
            const item=visible[index];
            return item?<button key={item.id} className="item-slot" style={tint(item.tier)} title={item.tier+' '+item.name}
              aria-label={item.tier+' '+item.name+(item.count>1?' × '+item.count:'')} aria-pressed={item.id===selected?.id}
              onClick={()=>select(item.id)}><Glyph kind={item.icon}/>{item.count>1&&<b>{item.count}</b>}
              {item.id===hero.selectedItem&&<i aria-label="Equipped">◆</i>}</button>:
              <span key={'empty-'+index} className="item-slot empty" aria-hidden="true"/>;
          })}
        </div>
          <div className="armory-pagination"><small>{filter==='All'?items.length+' used · '+(capacity-items.length)+' free · Expands as needed':filtered.length+' in category'}</small>
            {pages>1&&<span><button disabled={!currentPage} onClick={()=>setPage(currentPage-1)} aria-label="Previous page">‹</button> {currentPage+1}/{pages} <button disabled={currentPage+1>=pages} onClick={()=>setPage(currentPage+1)} aria-label="Next page">›</button></span>}</div>
        </div>
        <aside className="item-inspect" style={selected?tint(selected.tier):undefined}>
          {selected?<><div className="inspect-icon"><Glyph kind={selected.icon}/></div>
            <small>{selected.tier} · {selected.category}</small><h3>{selected.name}</h3><p>{selected.description}</p>
            {selected.id==='@armor'&&<p>Current armor: {hero.armor}</p>}
            {detail&&instance&&<>
              <dl><div><dt>Damage</dt><dd>{weaponDamage({...detail,damage:detail.damage*(detail.id==='staff'?elemental(hero.stats):physical(hero.stats))})}</dd></div>
                <div><dt>Attack interval</dt><dd>{(detail.cooldown/attackSpeed(hero.stats)).toFixed(2)} s</dd></div>
                <div><dt>Range</dt><dd>{detail.range}</dd></div>
                {detail.ability&&<div><dt>{detail.abilityName}</dt><dd>{detail.abilityCooldown} s</dd></div>}</dl>
              <div className="inspect-actions"><button disabled={instance.id===hero.selectedItem} onClick={()=>equip(instance.type,instance.id)}>
                {instance.id===hero.selectedItem?'Equipped':'Equip'}</button>
                <label>Hotbar <select value={hero.slotItems.indexOf(instance.id)+1} onChange={event=>{
                  const slot=Number(event.target.value)-1;
                  if(slot>=0) assign(slot,instance.id);
                  else assign(hero.slotItems.indexOf(instance.id),null);
                }}><option value={0}>Unassigned</option>{hero.slotItems.map((_item,i)=><option key={i} value={i+1}>{i+1}</option>)}</select></label>
              </div>
            </>}
          </>:<p>No items in this category.</p>}
        </aside>
      </div>
      {canRedeem&&elementalIds.some(id=>!hero.arsenal.includes(id))&&<details className="armory-exchange">
        <summary>Ember Clearing exchange · 1 Wolf Fang per weapon</summary>
        {elementalIds.filter(id=>!hero.arsenal.includes(id)).map(id=><button key={id} onClick={()=>redeem(id)}>{weapons[id].name}</button>)}
      </details>}
    </>}
  </SystemPanel>;
}
