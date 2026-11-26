import { caveAt } from './bossCaves';
import { ShadowArmyPanel } from './ui/ShadowArmyPanel';
import { briarWatch, towerFloorAt, floorRemaining } from './briarWatch';
import { useCallback, useEffect, useRef, useState } from 'react';
import { den } from './denLayout';
import { monsters } from './huntData';
import { legacyItem } from './itemInstances';
import { clearing } from './layout';
import { newExploration, readExploration, reveal, saveKey, type Position } from './exploration';
import { CharacterStatus } from './CharacterStatus';
import { startWilderness } from './scene';
import { WorldMap } from './WorldMap';
import { regionLabel } from './regions';
import { elementalIds, type WeaponId } from './weapons';
import { HunterHUD, HunterHotbar } from './ui/HunterHUD';
import { HunterInventory } from './ui/HunterInventory';
import { noticesBetween, observe, SystemNotifications, type Notice } from './ui/SystemNotifications';
import './wilderness.css';
import './ui/system.css';

const weaponLab=import.meta.env.DEV && new URLSearchParams(window.location.search).get('weaponLab')==='1';

export default function Wilderness() {
  const canvas=useRef<HTMLCanvasElement>(null);
  const mapButton=useRef<HTMLButtonElement>(null);
  const open=useRef<'map'|'bag'|'status'|'shadows'|null>(null);
  const [panel,setPanel]=useState<'map'|'bag'|'status'|'shadows'|null>(null);
  const [hero,setHero]=useState(newExploration);
  const [message,setMessage]=useState({notification:'',prompt:'',cooldown:0,bossHealth:0,shadowAvailable:false});
  const controller=useRef<ReturnType<typeof startWilderness>|null>(null);
  const [notices,setNotices]=useState<Notice[]>([]);
  const [closing,setClosing]=useState(false);
  const closeTimer=useRef<number|null>(null);
  const [position,setPosition]=useState<Position>(newExploration().position);
  const [discovered,setDiscovered]=useState<number[]>([]);
  const [error,setError]=useState('');
  const [saveNotice,setSaveNotice]=useState('');

  const showPanel=(value:typeof panel)=>{
    if(closeTimer.current!==null) window.clearTimeout(closeTimer.current);
    closeTimer.current=null;
    if(!value&&open.current&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      setClosing(true);
      closeTimer.current=window.setTimeout(()=>{
        closeTimer.current=null;
        open.current=null;
        setPanel(null);
        setClosing(false);
        mapButton.current?.focus();
      },140);
      return;
    }
    setClosing(false);
    open.current=value;
    setPanel(value);
    if(!value) mapButton.current?.focus();
  };
  useEffect(()=>{
    if(!canvas.current) return;
    let save=newExploration(), writable=true, dirty=false;
    if(weaponLab){
      writable=false;
      save.arsenal.push(...elementalIds);
      save.items.push(...elementalIds.map(legacyItem));
      save.selectedItem='greatsword';
      save.hotbar=[...elementalIds,null,null,null,null];
      save.slotItems=[...elementalIds,null,null,null,null];
      save.equipped='greatsword';
    } else try {
      const raw=localStorage.getItem(saveKey);
      const restored=readExploration(raw);
      if(restored) save=restored;
      else if(raw!==null) {
        writable=false;
        setSaveNotice('This exploration save is incompatible. This visit will not replace it.');
      }
    } catch {
      writable=false;
      setSaveNotice('Browser storage is unavailable. Exploration will not be saved.');
    }
    const known=new Set(save.discovered);
    setDiscovered([...known]);
    setHero({...save});
    let observed=observe(save);
    let noticeTimer:number|undefined;
    const flush=()=>{
      if(!dirty||!writable) return;
      try {
        localStorage.setItem(saveKey,JSON.stringify({...save,discovered:[...known]}));
        dirty=false;
      } catch {
        writable=false;
        setSaveNotice('Exploration could not be saved to browser storage.');
      }
    };
    
    try {
      controller.current=startWilderness(canvas.current,save,next=>{
        save.position=next;
        const before=known.size;
        reveal(known,next);
        if(known.size!==before) setDiscovered([...known]);
        setPosition(next);
        dirty=true;
      },closeOnly=>showPanel(closeOnly||open.current==='map'?null:'map'),()=>open.current!==null,
      ()=>showPanel(open.current==='bag'?null:'bag'),
      ()=>showPanel(open.current==='status'?null:'status'),
      ()=>showPanel(open.current==='shadows'?null:'shadows'),
      (notification,prompt,cooldown,bossHealth,shadowAvailable)=>setMessage({notification,prompt,cooldown,bossHealth,shadowAvailable}),
      ()=>{
        dirty=true;
        setHero({...save});
        const next=noticesBetween(observed,save);
        observed=observe(save);
        if(next.length){
          setNotices(next);
          if(noticeTimer!==undefined) window.clearTimeout(noticeTimer);
          noticeTimer=window.setTimeout(()=>setNotices([]),4200);
        }
      });
    } catch(e) {
      setError(e instanceof Error?e.message:'The wilderness could not start.');
    }
    const timer=window.setInterval(flush,1500);
    window.addEventListener('pagehide',flush);
    return ()=>{
      controller.current?.dispose();
      controller.current=null;
      window.clearInterval(timer);
      if(noticeTimer!==undefined) window.clearTimeout(noticeTimer);
      if(closeTimer.current!==null) window.clearTimeout(closeTimer.current);
      window.removeEventListener('pagehide',flush);
    };
  },[]);

  const equip=useCallback((type:WeaponId,id:string)=>controller.current?.equip(type,id),[]);
  const floor=towerFloorAt(position.z);
  const cave=caveAt(position.z);
  const boss=cave?monsters[cave.kind]:floor?.number===5?monsters.sentinel:monsters.guardian;
  const announcement=/^(Elite encountered|Boss encounter|Boss phase II|Cave victory|Cave reward|Shadow extracted|Briar Watch · Floor) · (.+)$/.exec(message.notification);
  const visibleNotices=announcement
    ? [...notices,{kind:announcement[1].startsWith('Boss')?'boss':'dungeon',title:announcement[1],detail:announcement[2]} as Notice]
    : notices;
  const canRedeem=clearing(position.x,position.z)<9.5&&hero.fangs>0;
  return <main className="wild" data-overlay-closing={closing} aria-label="Vonkje">
    <canvas ref={canvas} aria-label="Blackwater Wilds"/>
    <HunterHUD hero={hero} region={regionLabel(position.z)}/>
    <SystemNotifications notices={visibleNotices}/>
    {floor&&<aside className="tower-hud">
      <strong>Floor {floor.number} / 5 · {floor.title}</strong>
      <span>{floorRemaining(floor,hero.defeated)} remaining</span>
    </aside>}
    {!!message.bossHealth&&<div className="guardian-health">
      <strong>{boss.name}{(cave||floor?.number===5)&&message.bossHealth<=boss.health*.5?' · Phase II':''}</strong>
      <progress className="system-meter health" aria-label={boss.name+' health'} value={message.bossHealth} max={boss.health}/>
    </div>}
    <nav className="system-nav"><button ref={mapButton} onClick={()=>showPanel(open.current==='map'?null:'map')} aria-expanded={panel==='map'}>Map · M</button>
      <button onClick={()=>showPanel(open.current==='bag'?null:'bag')} aria-expanded={panel==='bag'}>Inventory · Tab</button>
      <button onClick={()=>showPanel(open.current==='status'?null:'status')} aria-expanded={panel==='status'}>Status · P</button>
      <button onClick={()=>showPanel(open.current==='shadows'?null:'shadows')} aria-expanded={panel==='shadows'}>Shadows · K</button></nav>
    {error && <p className="wild-error" role="alert">{error}</p>}
    <footer>
      {clearing(position.x,position.z)<10 && <p>Ember Clearing · Campfire nearby</p>}
      {message.shadowAvailable&&<p className="shadow-available">SHADOW AVAILABLE · F — Extract Shadow</p>}
      {message.prompt && <p>{message.prompt}</p>}
      {message.notification && !announcement && <p role="status">{message.notification}</p>}
      {saveNotice && <p role="status">{saveNotice}</p>}
      {weaponLab && <p>Weapon Lab · Unsaved session</p>}
      <HunterHotbar hero={hero} locked={!!panel} cooldown={message.cooldown} equip={equip}/>
      <small>WASD Move · E Interact · Q Ability · R Potion · H Horse · M Atlas</small>
    </footer>
    {panel==='shadows'&&<ShadowArmyPanel hero={hero} close={()=>showPanel(null)}
      toggle={id=>controller.current?.toggleShadow(id)} summonAll={()=>controller.current?.summonAllShadows()}/>}
    {panel==='status' && <CharacterStatus hero={hero} close={()=>showPanel(null)} spend={stat=>controller.current?.allocate(stat)}/>}
    {panel==='map' && <WorldMap position={position} discovered={discovered}
      caveRuns={hero.caveRuns} opened={hero.opened} towerCleared={hero.completedDungeons.includes(briarWatch.id)} defeated={hero.defeated} waystonesActive={hero.waystones} seenChests={hero.seenChests} travel={id=>{
        const error=controller.current?.travelTo(id)??'Travel is unavailable.';
        if(!error) showPanel(null);
        return error;
      }} cleared={hero.completedDungeons.includes(den.id)} bossDefeated={hero.defeatedBosses.includes(den.boss)} close={()=>showPanel(null)}/>}
    {panel==='bag' && <HunterInventory hero={hero} close={()=>showPanel(null)} canRedeem={canRedeem}
      equip={equip}
      equipArmor={(slot,id)=>controller.current?.equipArmor(slot,id)}
      assign={(slot,id)=>controller.current?.assign(slot,id)}
      redeem={id=>controller.current?.redeem(id)}/>}
  </main>;
}
