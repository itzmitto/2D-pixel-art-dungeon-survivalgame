import { memo } from 'react';
import type { Exploration } from '../exploration';
import { instanceWeapon, legacyItem } from '../itemInstances';
import { maxHunterHealth, rank, xpNeeded } from '../progression';
import type { regionLabel } from '../regions';
import { weapons, type WeaponId } from '../weapons';
import { Glyph } from './Glyph';
import { ItemButton, weaponStats } from './ItemTooltip';
import { healthNotation, tint } from './HunterInventory';

export const HunterHUD=memo(function HunterHUD({hero,region}:{hero:Exploration;region:ReturnType<typeof regionLabel>}){
  const health=maxHunterHealth(hero), xp=xpNeeded(hero.level);
  return <aside className="hunter-hud" aria-label="Hunter vitals">
    <div className="hud-rank"><small>Rank</small><strong>{rank(hero.level)}</strong></div>
    <div className="hud-vitals">
      <div><strong>Level {hero.level}</strong><span>{region}</span></div>
      <label>HP {healthNotation(hero.health)}/{health}<progress className="system-meter health" value={hero.health} max={health}/></label>
      <label>XP {hero.xp}/{xp}<progress className="system-meter" value={hero.xp} max={xp}/></label>
      <div><span>Armor {hero.armor}</span><span className="hud-potion" title="R · Health Potion"><Glyph kind="potion"/> × {hero.potions}</span></div>
    </div>
  </aside>;
});

export const HunterHotbar=memo(function HunterHotbar({hero,locked,cooldown,equip}:{hero:Exploration;locked:boolean;cooldown:number;equip:(type:WeaponId,id:string)=>void}){
  const weapon=instanceWeapon(hero.items.find(item=>item.id===hero.selectedItem)??legacyItem(hero.equipped));
  return <>
    <div className="system-ability" style={tint(weapon.rarity)}>
      <div className="ability-icon"><Glyph kind={weapon.element==='Steel'?weapon.id:weapon.element}/></div>
      <div><strong>{weapon.name}</strong><small>{weapon.element} {weapon.ability?'· '+weapon.abilityName:''}</small></div>
      {weapon.ability&&<span><kbd>Q</kbd> {cooldown?cooldown+' s':'Ready'}</span>}
    </div>
    <div className="system-hotbar" aria-label="Nine-slot weapon hotbar">
      {Array.from({length:9},(_,i)=>{
        const item=hero.items.find(entry=>entry.id===hero.slotItems[i]);
        const model=item&&instanceWeapon(item);
        return <ItemButton key={i} disabled={!item||locked} data-rarity={item?.rarity}
          item={model&&{name:model.name,icon:model.id,tier:model.rarity,description:model.description,stats:weaponStats(model,hero.stats)}} aria-pressed={!!item&&item.id===hero.selectedItem}
          aria-label={item?item.rarity+' '+weapons[item.type].name:'Empty slot '+(i+1)}
          style={item?tint(item.rarity):undefined}
          onClick={()=>item&&equip(item.type,item.id)}><kbd>{i+1}</kbd>{item&&<Glyph kind={item.type}/>}</ItemButton>;
      })}
    </div>
  </>;
});
