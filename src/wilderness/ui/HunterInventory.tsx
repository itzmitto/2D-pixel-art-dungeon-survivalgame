import { armorLabels, armorPiece, armorSlots, armorStats, type ArmorId, type ArmorSlot } from '../armor';
import { effectiveStats } from '../progression';
import { useState, type CSSProperties } from 'react';
import type { Exploration } from '../exploration';
import { instanceWeapon } from '../itemInstances';
import { elementalIds, rarity, weapons, type Rarity, type WeaponId } from '../weapons';
import { SystemPanel } from './SystemPanel';
import { Glyph, categoryIcon } from './Glyph';
import { ItemButton, weaponStats } from './ItemTooltip';
import { KnightPreview } from './KnightPreview';

const filters=['All','Weapons','Armor','Consumables','Materials','Accessories'] as const;
type Filter=typeof filters[number];
const pageSize=24;
type Entry={id:string;name:string;icon:string;category:Exclude<Filter,'All'>;tier:Rarity;count:number;description:string};
const slots=['Main hand','Off hand','Armor rating'];
type EquipArmor=(slot:ArmorSlot,id:ArmorId|null)=>void;
export const tint=(tier:Rarity)=>({'--rarity':rarity[tier].color} as CSSProperties);
export const healthNotation=(value:number)=>Number(value.toFixed(1));

function Equipment({hero,equipArmor}:{hero:Exploration;equipArmor:EquipArmor}){
  const item=hero.items.find(entry=>entry.id===hero.selectedItem);
  const weapon=weapons[hero.equipped];
  const detail=instanceWeapon(item??{id:weapon.id,type:weapon.id,rarity:weapon.rarity});
  return <div className="equipment-layout">
      <KnightPreview weapon={weapon.id} tier={item?.rarity??weapon.rarity} armor={hero.equippedArmor}/>
      <div className="equipment-points">
        {slots.map((slot,index)=>{
          const label=index===0?weapon.name:index===1?(weapon.model.shield?'Water Shield':'Empty'):String(hero.armor);
          const icon=index===0?weapon.id:index===1?(weapon.model.shield?'shield':null):'armor';
          return <div key={slot} className="equipment-point equipped" style={tint(item?.rarity??'Common')}>
            <span className="equipment-icon">{icon&&<Glyph kind={icon}/>}</span>
            <span><small>{slot}</small><strong>{label}</strong></span>
          </div>;
        })}
        <div className="armor-equipment-grid">
          {armorSlots.map(slot=>{
            const equipped=hero.equippedArmor[slot], piece=equipped?armorPiece(equipped):undefined;
            const choices=hero.armorItems.filter(id=>armorPiece(id).slot===slot);
            return <label key={slot} className="equipment-point armor-equipment-point" style={piece?tint(piece.rarity):undefined}>
              <span className="equipment-icon">{piece&&<Glyph kind={piece.icon}/>}</span>
              <span><small>{armorLabels[slot]}</small>
                <select value={equipped??''} onChange={event=>equipArmor(slot,choices.find(id=>id===event.target.value)??null)}>
                  <option value="">Empty</option>{choices.map(id=><option key={id} value={id}>{armorPiece(id).name}</option>)}
                </select>
              </span>
            </label>;
          })}
        </div>
        <dl className="equipment-stats">{weaponStats(detail,effectiveStats(hero)).map(([label,value])=>
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </div>
    </div>;
}

export function HunterInventory({hero,close,equip,assign,redeem,canRedeem,equipArmor}:{
  equipArmor:EquipArmor;hero:Exploration;close:()=>void;equip:(type:WeaponId,id:string)=>void;
  assign:(slot:number,id:string|null)=>void;redeem:(id:WeaponId)=>void;canRedeem:boolean;
}){
  const [view,setView]=useState<'pack'|'kit'>('pack');
  const [filter,setFilter]=useState<Filter>('All');
  const [page,setPage]=useState(0);
  const [selection,select]=useState(hero.selectedItem);
  const items:Entry[]=[
    ...hero.items.map((item):Entry=>({id:item.id,name:weapons[item.type].name,icon:item.type,category:'Weapons',tier:item.rarity,count:1,description:weapons[item.type].description})),
    ...hero.armorItems.map((id):Entry=>{
      const piece=armorPiece(id);
      return {id,name:piece.name,icon:piece.icon,category:piece.slot==='amulet'||piece.slot==='ring'?'Accessories':'Armor',
        tier:piece.rarity,count:1,description:piece.description};
    }),
    ...(hero.armor>0?[{id:'@armor',name:'Armor rating',icon:'armor',category:'Armor' as const,tier:'Common' as const,count:1,description:'Defense rating increased by claiming treasure.'}]:[]),
    ...(hero.potions>0?[{id:'@potions',name:'Health Potion',icon:'potion',category:'Consumables' as const,tier:'Common' as const,count:hero.potions,description:'Restores up to 12 health. Press R while exploring.'}]:[]),
    ...[...Object.entries(hero.materials),['Wolf Fang',hero.fangs] as const].filter(([,count])=>count>0).map(([name,count]):Entry=>
      ({id:'@material:'+name,name,icon:name,category:'Materials',tier:'Common',count,
        description:name==='Wolf Fang'?'Can be exchanged for a missing weapon at Ember Clearing.':'Material recovered from a hunt.'})),
  ];
  const filtered=items.filter(item=>filter==='All'||item.category===filter);
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const currentPage=Math.min(page,pages-1);
  const visible=filtered.slice(currentPage*pageSize,(currentPage+1)*pageSize);
  const selected=visible.find(item=>item.id===selection)??visible[0];
  const armorId=hero.armorItems.find(id=>id===selected?.id);
  const instance=hero.items.find(item=>item.id===selected?.id);
  const detail=instance&&instanceWeapon(instance);
  const capacity=Math.max(pageSize,Math.ceil(items.length/pageSize)*pageSize);
  return <SystemPanel title={view==='kit'?'Equipment':'Inventory'} section="Hunter System" close={close} style="inventory-system">
    <div className="armory-toolbar">
      <div role="group" aria-label="Armory views"><button aria-pressed={view==='pack'} onClick={()=>setView('pack')}>Inventory</button>
        <button aria-pressed={view==='kit'} onClick={()=>setView('kit')}>Equipment</button></div>
      <span className="coin-label"><Glyph kind="coin"/>{hero.gold} gold</span>
    </div>
    {view==='kit'?<Equipment hero={hero} equipArmor={equipArmor}/>:<>
      <div className="armory-filters" role="group" aria-label="Inventory category">
        {filters.map(category=><button key={category} aria-pressed={category===filter}
          onClick={()=>{setFilter(category);setPage(0);}}><Glyph kind={categoryIcon[category]}/><span>{category}</span></button>)}
      </div>
      <div className="armory-content">
        <div><div className="armory-grid">
          {Array.from({length:pageSize},(_,index)=>{
            const item=visible[index];
            const armorItem=hero.armorItems.find(id=>id===item?.id);
            const weaponItem=item&&hero.items.find(entry=>entry.id===item.id);
            return item?<ItemButton key={item.id} className="item-slot" style={tint(item.tier)} data-rarity={item.tier}
              item={{...item,stats:weaponItem?weaponStats(instanceWeapon(weaponItem),effectiveStats(hero)):armorItem?armorStats(armorItem):undefined}}
              aria-label={item.tier+' '+item.name+(item.count>1?' × '+item.count:'')} aria-pressed={item.id===selected?.id}
              onClick={()=>select(item.id)}><Glyph kind={item.icon}/>{item.count>1&&<b>{item.count}</b>}
              {(item.id===hero.selectedItem||(armorItem&&Object.values(hero.equippedArmor).includes(armorItem)))&&<i aria-label="Equipped">◆</i>}</ItemButton>:
              <span key={'empty-'+index} className="item-slot empty" aria-hidden="true"/>;
          })}
        </div>
          <div className="armory-pagination"><small>{filter==='All'?items.length+' used · '+(capacity-items.length)+' free':filtered.length+' in category'}</small>
            {pages>1&&<span><button disabled={!currentPage} onClick={()=>setPage(currentPage-1)} aria-label="Previous page">‹</button> {currentPage+1}/{pages} <button disabled={currentPage+1>=pages} onClick={()=>setPage(currentPage+1)} aria-label="Next page">›</button></span>}</div>
        </div>
        <aside className="item-inspect" data-rarity={selected?.tier} style={selected?tint(selected.tier):undefined}>
          {selected?<><div className="inspect-icon"><Glyph kind={selected.icon}/></div>
            <small>{selected.tier} · {selected.category}</small><h3>{selected.name}</h3><p>{selected.description}</p>
            {selected.id==='@armor'&&<p>Current armor: {hero.armor}</p>}
            {armorId&&<>
              <dl>{armorStats(armorId).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
              <button onClick={()=>{
                const {slot}=armorPiece(armorId);
                equipArmor(slot,hero.equippedArmor[slot]===armorId?null:armorId);
              }}>{Object.values(hero.equippedArmor).includes(armorId)?'Unequip':'Equip'}</button>
            </>}
            {detail&&instance&&<>
              <dl>{weaponStats(detail,effectiveStats(hero)).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
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
