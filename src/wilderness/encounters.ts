import { elementalBossModels } from './elementalBossModels.ts';
import { caveArts, isAdvancedBoss, type BossCast } from './caveArts.ts';
import { spectralModels } from './shadowModels.ts';
import { defaultShadowGrade } from './shadowData.ts';
import { shadowArmy } from './shadowArmy.ts';
import { caveAt, caveBossId, caveBossPoint, caveRewardArmor, caveRewardId, caveRewardTier, caveTreasurePoint, type BossCave } from './bossCaves.ts';
import { briarWatch, floorRemaining, towerFloorAt, towerFloors } from './briarWatch.ts';
import { hollowSentinel } from './sentinel.ts';
import { encounterCell, eliteName, roaming, roamingEncounter, roamingKind, type EncounterMember } from './roaming.ts';
import { waystones } from './worldSites.ts';
import { armorPiece, type ArmorId } from './armor.ts';
import { wizardModels } from './wizards.ts';
import { arcaneCombat } from './arcaneCombat.ts';
import { orcModels } from './orcs.ts';
import { orcCamp, ritualGrounds } from './worldSites.ts';
import { goblinModels } from './goblins.ts';
import { loft, shapedPlate, type CreatureRig } from './creatureGeometry.ts';
import { skeletonModels } from './skeletons.ts';
import { den, inDen } from './denLayout.ts';
import { enemyArmor, enemyXpReward, monsters, rarityOrder, rollDrop, type MonsterKind, type Drop } from './huntData.ts';
import { elementalRarity, instanceWeapon } from './itemInstances.ts';
import { chestBonus, chestModels, denChests, towerChests, worldChests, type Chest } from './treasure.ts';
import { attackSpeed, effectiveStats, earnXP, elemental, maxHunterHealth, mitigation, physical, lootBonus } from './progression.ts';
import * as T from 'three';
import { inArc, swingTimer, wolfLoot } from './combatRules.ts';
import type { Exploration } from './exploration.ts';
import { randomSequence, spawn, surface, trailDistance, landmarks, path, southPath } from './layout.ts';
import { wolfModels } from './wolves.ts';
import { abilityAnimationSeconds, elementalIds, weaponDamage, weapons, rarity, type Weapon, type WeaponId } from './weapons.ts';
import { createMagicEffects } from './magicEffects.ts';
import { abilityCombat } from './abilities.ts';
import { statuses, statusTuning } from './statusEffects.ts';

const territories = [
  { x:-66,z:-20 }, { x:-97,z:-68 }, { x:-162,z:67 }, { x:-170,z:-111 },
  { x:83,z:-67 }, { x:142,z:-117 }, { x:99,z:91 }, { x:173,z:-154 },
];
const safe = (x:number,z:number) => Math.hypot(x+45,z)<12 || Math.hypot(x-154,z-103)<11;
const nearDistance = 48;
const direTerritories=[{x:-163,z:57},{x:-167,z:63},{x:137,z:-124},{x:160,z:-151},{x:182,z:-157}];
const packTerritories=[{x:-79,z:-24},{x:-85,z:-27},{x:98,z:96}];
const notificationsSeconds = 3.5;

function numberTexture(value:number) {
  const canvas=document.createElement('canvas');
  canvas.width=128; canvas.height=64;
  const context=canvas.getContext('2d');
  if(!context) return null;
  context.font='900 39px system-ui';
  context.textAlign='center';
  context.textBaseline='middle';
  context.lineWidth=7;
  context.lineJoin='round';
  context.strokeStyle='#181322';
  context.fillStyle='#fff9ee';
  context.strokeText(String(value),64,33,116);
  context.fillText(String(value),64,33,116);
  const texture=new T.CanvasTexture(canvas);
  texture.colorSpace=T.SRGBColorSpace;
  return texture;
}

export function createEncounters(
  scene:T.Scene, camera:T.Camera, player:T.Group, save:Exploration,
  canWalk:(x:number,z:number)=>boolean, changed:()=>void,
) {
  const maxHealth=()=>maxHunterHealth(save);
  function tunedWeapon(weapon:Weapon,magic=false):Weapon {
    const item=save.items.find(item=>item.id===save.selectedItem&&item.type===weapon.id);
    if(item) weapon=instanceWeapon(item);
    const stats=effectiveStats(save);
    const speed=attackSpeed(stats);
    return {...weapon,damage:weapon.damage*(magic||weapon.id==='staff'?elemental(stats)*(item&&magic?elementalRarity(item):1):physical(stats)),
      attackDuration:weapon.attackDuration/speed, impactTime:weapon.impactTime/speed,cooldown:weapon.cooldown/speed};
  }
  const models=wolfModels(), skeletons=skeletonModels(), goblins=goblinModels(), orcs=orcModels(), wizards=wizardModels();
  const elementals=elementalBossModels();
  const sentinel=hollowSentinel(), frostGuardian=hollowSentinel(true);
  const group=new T.Group();
  scene.add(group);
  const rangeTimer=swingTimer();
  const oldDefeats=new Set(save.defeated), collected=new Set(save.collected);
  const rand=randomSequence(save.seed ^ 0xa3615);
  const fx=createMagicEffects(group);
  const echo=new T.Group(), echoMaterial=new T.MeshBasicMaterial({
    color:0x7bd9bc,transparent:true,opacity:.24,depthWrite:false,blending:T.AdditiveBlending,
  });
  const echoParts:{source:T.Mesh;mesh:T.Mesh}[]=[];
  const echoJoints=new Set<T.Object3D>();
  player.traverse(source=>{
    if(!(source instanceof T.Mesh)||!source.parent||!source.parent.name||
      source.parent.name.endsWith('socket')||echoJoints.has(source.parent)) return;
    echoJoints.add(source.parent);
    const mesh=new T.Mesh(source.geometry,echoMaterial);
    mesh.matrixAutoUpdate=false;
    echo.add(mesh);echoParts.push({source,mesh});
  });
  echo.visible=false;group.add(echo);
  let echoLife=0,shake=0,waterTime=0,combatUntil=0,slowUntil=0;
  const arcane=arcaneCombat<Enemy>(player.position,fx,canWalk,(enemy,guarded)=>{hitPlayer(enemy,guarded);});
  const knockback=new T.Vector2();
  function leaveEcho(){
    player.updateWorldMatrix(true,true);
    for(const {source,mesh} of echoParts){
      mesh.matrix.copy(source.matrixWorld);
      mesh.matrixWorldNeedsUpdate=true;
    }
    echoLife=.26;
  }
  function splash(){
    fx.scatter(player.position,0x89dfff,9,1.0);
    fx.emit(player.position,0x83e5ff,'ring',1.36,.42,{grow:3.3,y:.19});
    fx.emit(player.position,0xd1f9ff,'arc',1.08,.29,{y:.91,yaw:player.rotation.y,aspect:1.8});
  }
  const chests=[...worldChests,...denChests,...towerChests];
  const caveRewards=new Map<BossCave['id'],{chest:Chest;group:T.Group;view:ReturnType<typeof chestModels>}>();
  const chestViews=chestModels(group,chests,save.opened);
  const cooldowns=new Map<WeaponId,number>();
  let attackWeapon=weapons.longsword, queued:{weapon:Weapon;delay:number;yaw:number}|undefined;
  let time=0, notification='', noticeUntil=0;
  const notify=(message:string)=>{
    notification=message; noticeUntil=time+notificationsSeconds; changed();
  };
  const spectral=spectralModels();
  const arts=caveArts<Enemy>(group,player,fx,canWalk,clearLine,hitPlayer,summonUndead,notify);
  const shadows=shadowArmy<Enemy>(group,player,save,kind=>{
    if(kind==='wild'||kind==='dire'||kind==='elite'||kind==='guardian') return models.make(kind,true);
    if(kind==='sentinel'||kind==='frostGuardian'){
      const rig=hollowSentinel(kind==='frostGuardian');spectral.own(rig.dispose);
      return spectral.decorate(rig,kind);
    }
    const rig=kind==='skeleton'||kind==='skeletonKing'?skeletons.make(kind==='skeletonKing'):kind==='goblin'?goblins.make():
      kind==='wizard'||kind==='ritualElite'||kind==='darkArchmage'?wizards.make(kind!=='wizard',kind==='darkArchmage'):
      kind==='infernalGolem'?elementals.makeGolem():kind==='ancientDragon'?elementals.makeDragon():orcs.make(kind!=='assassin',kind==='warlord');
    return spectral.decorate(rig,kind);
  },canWalk,clearLine,fx,notify,changed);
  const barGeometry=new T.PlaneGeometry(1.2,.115);
  const backing=new T.MeshBasicMaterial({color:'#251919',depthWrite:false});
  const red=new T.MeshBasicMaterial({color:'#ba5447',depthWrite:false});
  const alert=new T.MeshBasicMaterial({color:'#de9c55',depthWrite:false});
  const lootGeometry=loft([[-.20,.07,-.14,.106],[-.13,.22,-.18,.153],[.09,.235,-.183,.179],[.203,.135,-.119,.119]],10);
  const drawstring=new T.TorusGeometry(.088,.016,5,9).rotateX(Math.PI/2);
  const lootFang=shapedPlate([[-.053,.095],[.082,.079],[.09,-.014],[-.064,-.16],[-.014,-.035]],.041,.011);
  const lootCoin=new T.CylinderGeometry(.09,.09,.024,9).rotateX(Math.PI/2);
  const bagTie=new T.MeshStandardMaterial({color:0xb1986c,roughness:.96});
  const boneLoot=new T.MeshStandardMaterial({color:0xd9c7a8,roughness:.83});
  const metalLoot=new T.MeshStandardMaterial({color:0xc9a044,roughness:.44,metalness:.61});
  const lootBeamGeometry=new T.CylinderGeometry(.028,.10,1.25,6,1,true);
  const lootMaterial=new T.MeshStandardMaterial({color:'#bd9868',emissive:'#916024',emissiveIntensity:.7,roughness:.36});
  type EnemySpec={ [K in keyof typeof monsters.wild]: typeof monsters.wild[K] extends number ? number :
    typeof monsters.wild[K] extends string ? string :
    typeof monsters.wild[K] extends readonly number[] ? readonly number[] : typeof monsters.wild[K] };
  type Enemy = CreatureRig & {
    affinity:T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>;
    target:SpellTarget; roaming:boolean; roamGroup?:string; elite:boolean; level:number; announced:boolean; title?:T.Sprite; patrol:boolean;
    wolfRig:boolean; turn:number; wizard:boolean; barrier?:T.Mesh; ward:number;
    spell?:'bolt'|'domain'|'shield'; wardCool:number; spellTarget?:{x:number;z:number}; slam?:{x:number;z:number}; sentinelMove?:'cleave'|'shock'|'shadow';bossCast?:BossCast;summonedBy?:string; shadowTarget?:string; enraged?:boolean;
    posePhase:number; gait:number; anticipation:number; collapse:number; impactAge:number; retreat:number; strikes:number;

    id:string; kind:MonsterKind; spec:EnemySpec; home:T.Vector3; hp:number; hpBar:T.Group; fill:T.Mesh;
    statuses:ReturnType<typeof statuses>; visualTick:number; lastVisual:ReturnType<typeof statuses>['visual']; cooldown:number; windup:number; heading:number; phase:number; hitFlash:number; charge:number; chargeWindup:boolean; chargeHit:boolean; beam:T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>; loot:T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
  };
  const affinityGeometry=new T.RingGeometry(.53,.69,19).rotateX(-Math.PI/2);
  const affinities={
    burning:new T.MeshBasicMaterial({color:0xe4894f,transparent:true,opacity:.55,depthWrite:false}),
    frozen:new T.MeshBasicMaterial({color:0xa4e9f7,transparent:true,opacity:.7,depthWrite:false}),
    stunned:new T.MeshBasicMaterial({color:0x9ac5ff,transparent:true,opacity:.65,depthWrite:false}),
    slowed:new T.MeshBasicMaterial({color:0x679bcf,transparent:true,opacity:.44,depthWrite:false}),
  };
  const eliteAura=new T.MeshBasicMaterial({color:0xd060ff,transparent:true,opacity:.62,depthWrite:false});
  const enemies:Enemy[]=[];
  type SpellTarget=Parameters<typeof abilityCombat>[1][number];
  const targets:SpellTarget[]=[];
  const rigPool=new Map<MonsterKind,(CreatureRig&{barrier?:T.Mesh})[]>();
  const spawnCooldown=new Map(Object.entries(save.returns).filter(([key,until])=>key.startsWith('roam-cell-')&&until>Date.now()));
  for(const key of Object.keys(save.returns)) if(key.startsWith('roam-cell-')&&!spawnCooldown.has(key)) delete save.returns[key];
  const pendingRoam=new Map(Object.entries(save.pending).filter(([id])=>roamingKind(id)));
  const frustum=new T.Frustum(), projection=new T.Matrix4(), sphere=new T.Sphere(new T.Vector3(),3.15);
  let spawnClock=0;
  const levelNotice=new T.SpriteMaterial({color:0xffffff,depthWrite:false,transparent:true});
  const labels=new Map<string,T.CanvasTexture>();
  function titleTexture(text:string){
    let texture=labels.get(text);
    if(texture) return texture;
    const label=document.createElement('canvas');label.width=384;label.height=48;
    const context=label.getContext('2d');
    if(!context) return null;
    context.font='bold 24px system-ui';context.textAlign='center';context.textBaseline='middle';
    context.strokeStyle='#22142a';context.lineWidth=5;context.strokeText(text,192,24,372);
    context.fillStyle='#f1baff';context.fillText(text,192,24,372);
    texture=new T.CanvasTexture(label);texture.colorSpace=T.SRGBColorSpace;labels.set(text,texture);
    return texture;
  }
  const spawns=[
    ...territories.map((center,i)=>({center,id:'wolf-'+i,kind:'wild' as const})),
    ...packTerritories.map((center,i)=>({center,id:'wolf-pack-'+i,kind:'wild' as const})),
    ...direTerritories.map((center,i)=>({center,id:'dire-'+i,kind:'dire' as const})),
    ...[{x:111,z:-92},{x:107,z:-103},{x:169,z:-159}].map((center,i)=>({center,id:'skeleton-'+i,kind:'skeleton' as const})),
    ...[{x:-187,z:64},{x:-178,z:70},{x:-193,z:72}].map((center,i)=>({center,id:'goblin-'+i,kind:'goblin' as const})),
    {center:{x:205,z:-182},id:'elite-gravefang',kind:'elite' as const},
    ...den.encounters.map(entry=>({center:entry,id:entry.id,kind:entry.kind})),
    ...orcCamp.guards.map(entry=>({center:entry,id:entry.id,kind:entry.kind})),
    ...ritualGrounds.guards.map(entry=>({center:entry,id:entry.id,kind:entry.kind})),
  ];
  for(const {center,id,kind} of spawns){
    const candidates=Array.from({length:30},()=>{
      const a=rand()*Math.PI*2,r=2+rand()*9;
      return {x:center.x+Math.cos(a)*r,z:center.z+Math.sin(a)*r};
    });
    const orc=kind==='brute'||kind==='assassin';
    const spot=id.startsWith('den-')||id.startsWith('ritual-')||orc ? (canWalk(center.x,center.z) ? center : undefined) : candidates.find(({x,z})=>!safe(x,z)&&canWalk(x,z)&&enemies.every(enemy=>Math.hypot(enemy.home.x-x,enemy.home.z-z)>4));
    if(!spot) continue;
    createEnemy(id,kind,spot);
  }
  for(const floor of towerFloors) for(const guard of floor.guards){
    createEnemy(guard.id,guard.kind,guard,guard.elite?{kind:guard.kind,level:10,elite:true}:undefined);
  }
  function createEnemy(id:string,kind:MonsterKind,spot:{x:number;z:number},member?:EncounterMember,roamGroup?:string){
    const orc=kind==='brute'||kind==='assassin'||kind==='warlord', wizard=kind==='wizard'||kind==='ritualElite'||kind==='frostGuardian'||kind==='darkArchmage';
    const base=monsters[kind], level=member?.level??base.level;
    const elite=Boolean(member?.elite)||kind==='elite'||kind==='ritualElite';
    const threat=member?1+Math.max(0,level-base.level)*.115:1;
    const spec:EnemySpec={...base,
      name:member?.elite?eliteName(kind,base.name):base.name,
      scale:base.scale*(member?.elite?1.19:1),
      health:Math.round(base.health*threat*(member?.elite?2.45:1)),
      damage:base.damage*threat*(member?.elite?1.34:1),
      xp:Math.round(base.xp*threat*(member?.elite?2.17:1)),
      gold:Math.round(base.gold*threat*(member?.elite?1.85:1)),
    };
    const actor:CreatureRig&{barrier?:T.Mesh}=kind==='sentinel'?sentinel:kind==='frostGuardian'?frostGuardian:rigPool.get(kind)?.pop()??(
      wizard?wizards.make(kind!=='wizard',kind==='darkArchmage'):kind==='skeleton'||kind==='skeletonKing'?skeletons.make(kind==='skeletonKing'):
      kind==='infernalGolem'?elementals.makeGolem():kind==='ancientDragon'?elementals.makeDragon():kind==='goblin'?goblins.make():
      orc?orcs.make(kind!=='assassin',kind==='warlord'):models.make(kind));
    if(actor.barrier) actor.barrier.visible=false;
    actor.root.visible=false;
    actor.root.scale.setScalar(spec.scale);
    const home=new T.Vector3(spot.x,surface(spot.x,spot.z),spot.z);
    actor.root.position.copy(home);
    actor.root.name=id;
    group.add(actor.root);
    const hpBar=new T.Group();
    const background=new T.Mesh(barGeometry,backing), fill=new T.Mesh(barGeometry,red);
    fill.position.z=.017;
    hpBar.add(background,fill);
    group.add(hpBar);
    const affinity=new T.Mesh(affinityGeometry,affinities.slowed);
    affinity.visible=false;
    group.add(affinity);
    const loot=new T.Mesh(lootGeometry,lootMaterial.clone());
    loot.position.copy(home);
    const tie=new T.Mesh(drawstring,bagTie);tie.position.y=.159;loot.add(tie);
    const token=new T.Mesh(kind==='wild'||kind==='dire'||kind==='guardian'||kind==='elite'?lootFang:lootCoin,
      kind==='wild'||kind==='dire'||kind==='guardian'||kind==='elite'?boneLoot:metalLoot);
    token.position.set(.018,.028,.205);token.rotation.z=-.28;loot.add(token);
    const previousDrop=save.pending[id];
    if(previousDrop&&canWalk(previousDrop.x,previousDrop.z)){
      loot.position.set(previousDrop.x,surface(previousDrop.x,previousDrop.z),previousDrop.z);
    }
    loot.visible=oldDefeats.has(id)&&!collected.has(id);
    group.add(loot);
    const beam=new T.Mesh(lootBeamGeometry,new T.MeshBasicMaterial({transparent:true,
      opacity:.36,depthWrite:false,side:T.DoubleSide}));
    beam.visible=false;group.add(beam);
    if(save.drops[id]) loot.material.color.set(rarity[save.drops[id].rarity].color);
    const enemy:Enemy={...actor,id,kind,spec,home,affinity,wizard,barrier:actor.barrier,
      roaming:Boolean(roamingKind(id)),roamGroup,elite,level,announced:false,patrol:!!member&&trailDistance(spot.x,spot.z)<5,
      target:{point:actor.root.position,alive:()=>enemy.hp>0,get effects(){return enemy.statuses;},
        hit:(damage,element,heavy)=>hitEnemy(enemy,damage,element,heavy)},ward:0,wardCool:0,wolfRig:kind!=='sentinel'&&!isAdvancedBoss(kind)&&!wizard&&!orc&&kind!=='skeleton'&&kind!=='goblin',turn:0,posePhase:enemies.length*.92,gait:0,anticipation:0,collapse:1,
      impactAge:3,retreat:0,strikes:0,hp:(oldDefeats.has(id)||save.defeatedBosses.includes(id))?0:spec.health,hpBar,fill,
      statuses:statuses(spec.resistance),visualTick:0,lastVisual:null,cooldown:0,windup:0,heading:rand()*6.28,phase:rand()*10,hitFlash:0,charge:0,chargeWindup:false,chargeHit:false,loot,beam};
    if(elite){
      const texture=titleTexture('ELITE · '+spec.name+' · Lv '+level);
      if(texture){
        const material=levelNotice.clone();material.map=texture;
        enemy.title=new T.Sprite(material);enemy.title.scale.set(4.05,.49,1);
        enemy.title.visible=false;group.add(enemy.title);
      }
    }
    targets.push(enemy.target);enemies.push(enemy);
    return enemy;
  }

  const sparkGeometry=new T.BufferGeometry();
  const sparkPositions=new Float32Array(36*3);
  sparkGeometry.setAttribute('position',new T.BufferAttribute(sparkPositions,3));
  const sparks=new T.Points(sparkGeometry,new T.PointsMaterial({color:'#eac398',size:.14,depthWrite:false}));
  sparks.frustumCulled=false;
  sparks.visible=false;
  group.add(sparks);
  const bursts=Array.from({length:36},()=>({p:new T.Vector3(),v:new T.Vector3(),life:0}));
  let sparkCursor=0;
  const numberTextures=new Map<number,T.CanvasTexture>();
  const numbers=Array.from({length:10},()=>{
    const sprite=new T.Sprite(new T.SpriteMaterial({transparent:true,depthWrite:false,toneMapped:false}));
    sprite.visible=false;
    sprite.renderOrder=5;
    group.add(sprite);
    return {sprite,age:1,base:0,strong:false};
  });
  let numberCursor=0;
  const magic=abilityCombat(player.position,targets,canWalk,clearLine,fx);
  function visibleAt(x:number,z:number){
    sphere.center.set(x,surface(x,z)+1.2,z);
    return frustum.intersectsSphere(sphere);
  }
  function removeRoamer(index:number){
    const enemy=enemies[index];
    if(enemy.loot.visible&&save.pending[enemy.id]) pendingRoam.set(enemy.id,save.pending[enemy.id]);
    group.remove(enemy.root,enemy.affinity,enemy.hpBar,enemy.loot,enemy.beam);
    if(enemy.title){group.remove(enemy.title);enemy.title.material.dispose();}
    enemy.loot.material.dispose();enemy.beam.material.dispose();
    const pool=rigPool.get(enemy.kind)??[];
    if(enemy.roaming&&pool.length<4){pool.push({root:enemy.root,animate:enemy.animate,barrier:enemy.barrier});rigPool.set(enemy.kind,pool);}
    shadows.forget(enemy.id);
    enemy.hp=0;
    targets.splice(targets.indexOf(enemy.target),1);
    enemies.splice(index,1);
  }
  function populate(){
    camera.updateMatrixWorld();
    frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    const p=player.position;
    for(let i=enemies.length-1;i>=0;i--){
      const enemy=enemies[i],spot=enemy.hp?enemy.root.position:enemy.loot.position;
      if(!enemy.roaming) continue;
      const distance=Math.hypot(spot.x-p.x,spot.z-p.z);
      if(!enemy.hp&&!enemy.loot.visible&&enemy.collapse>=1||distance>roaming.despawnDistance||
         distance>roaming.activeDistance+11&&!visibleAt(spot.x,spot.z)) removeRoamer(i);
    }
    if(inDen(p.z)||towerFloorAt(p.z)||caveAt(p.z)||!save.health) return;
    const now=Date.now();
    for(const [cell,until] of spawnCooldown) if(now>=until){
      spawnCooldown.delete(cell);delete save.returns[cell];
    }
    for(const [id,spot] of pendingRoam){
      const kind=roamingKind(id);
      if(kind&&Math.hypot(p.x-spot.x,p.z-spot.z)<roaming.activeDistance){
        createEnemy(id,kind,spot);pendingRoam.delete(id);
      }
    }
    const living=enemies.filter(enemy=>enemy.hp>0&&Math.hypot(enemy.home.x-p.x,enemy.home.z-p.z)<64);
    const total=enemies.filter(enemy=>enemy.roaming&&enemy.hp>0).length;
    const room=Math.min(roaming.nearbyLimit-living.length,roaming.totalLimit-total);
    if(room<1) return;
    const valid=(x:number,z:number)=>!safe(x,z)&&!visibleAt(x,z)&&canWalk(x,z)&&
      Math.hypot(x-p.x,z-p.z)>roaming.minSpawnDistance&&
      !waystones.some(site=>Math.hypot(x-site.x,z-site.z)<12)&&
      !landmarks.some(site=>Math.hypot(x-site.x,z-site.z)<(site.kind==='orcCamp'||site.kind==='ritual'?15:7))&&
      !spawnCooldown.has(encounterCell(x,z));
    for(let i=0;i<38;i++){
      const a=Math.random()*Math.PI*2,r=34+Math.random()*23;
      const site={x:p.x+Math.cos(a)*r,z:p.z+Math.sin(a)*r};
      if(!valid(site.x,site.z)||living.some(enemy=>Math.hypot(enemy.home.x-site.x,enemy.home.z-site.z)<13)) continue;
      const members=roamingEncounter(site.x,site.z,Math.random).slice(0,room);
      const placements=[] as {x:number;z:number}[];
      const roamGroup=now.toString(36)+'-'+Math.random().toString(36).slice(2);
      for(const member of members){
        let spot:{x:number;z:number}|undefined;
        for(let j=0;j<18;j++){
          const heading=Math.random()*Math.PI*2,radius=placements.length?2+Math.random()*7:0;
          const x=site.x+Math.cos(heading)*radius,z=site.z+Math.sin(heading)*radius;
          if(valid(x,z)&&placements.every(other=>Math.hypot(x-other.x,z-other.z)>2.42)){spot={x,z};break;}
        }
        if(!spot) continue;
        placements.push(spot);
        const id='roam-'+member.kind.toLowerCase()+'-'+Math.random().toString(36).slice(2)+'-'+now.toString(36);
        createEnemy(id,member.kind,spot,member,roamGroup);
      }
      if(placements.length) break;
    }
  }
  function impact(point:T.Vector3, damage=0,element:Weapon['ability']=null,strong=false){
    for(let i=0;i<8;i++){
      const vx=(rand()-.5)*6,vy=1.5+rand()*3,vz=(rand()-.5)*6,life=.32+rand()*.16;
      if(element&&i>=2) continue;
      const spark=bursts[sparkCursor++%bursts.length];
      spark.p.copy(point);spark.p.y+=.85;
      spark.v.set(vx,vy,vz);
      spark.life=life;
    }
    if(!damage) return;
    fx.impact(point,element,strong);
    let texture=numberTextures.get(damage);
    if(!texture){
      texture=numberTexture(damage)??undefined;
      if(!texture) return;
      numberTextures.set(damage,texture);
    }
    const number=numbers[numberCursor++%numbers.length];
    number.sprite.material.map=texture;
    number.sprite.material.needsUpdate=true;
    number.sprite.material.color.set(strong?0xffcf5b:element?{
      fire:0xffa567,lightning:0xb6ceff,ice:0x9eeeff,water:0x85ddff,wind:0xaff8d4,
    }[element]:0xffead7);
    number.sprite.position.copy(point);
    number.sprite.position.x+=((numberCursor%5)-2)*.15;
    number.base=point.y+1.98;
    number.age=0;number.strong=strong;
  }
  function clearLine(x:number,z:number,tx:number,tz:number){
    const distance=Math.hypot(x-tx,z-tz), steps=Math.ceil(distance/.75);
    for(let i=1;i<steps;i++){
      const mix=i/steps;
      if(!canWalk(x+(tx-x)*mix,z+(tz-z)*mix)) return false;
    }
    return true;
  }

  function spaceAround(enemy:Enemy,x:number,z:number){
    const p=enemy.root.position;
    return enemies.every(other=>{
      if(other===enemy||other.hp<=0) return true;
      const q=other.root.position;
      const min=(enemy.spec.scale+other.spec.scale)*.59;
      const next=Math.hypot(q.x-x,q.z-z);
      return next>=min||next>=Math.hypot(q.x-p.x,q.z-p.z);
    });
  }
  function packGoal(enemy:Enemy,gap:number){
    if((enemy.kind!=='wild'&&enemy.kind!=='dire')||gap>12||gap<enemy.spec.reach+.7) return player.position;
    const p=player.position, q=enemy.root.position;
    const allies=enemies.filter(other=>other!==enemy&&other.hp>0&&
      (other.kind==='wild'||other.kind==='dire')&&Math.hypot(other.root.position.x-p.x,other.root.position.z-p.z)<10);
    if(!allies.some(other=>other.id<enemy.id)) return p;
    const angle=Math.atan2(q.x-p.x,q.z-p.z)+(enemy.id.charCodeAt(enemy.id.length-1)%2?1:-1)*.63;
    return {x:p.x+Math.sin(angle)*2.3,z:p.z+Math.cos(angle)*2.3};
  }
  let summonCounter=0;
  function summonUndead(owner:Enemy){
    const survivors=enemies.filter(enemy=>enemy.summonedBy===owner.id&&enemy.hp>0).length;
    const p=owner.root.position, cap=owner.enraged?3:2;
    for(let i=survivors;i<cap;i++){
      for(let attempt=0;attempt<7;attempt++){
        const angle=owner.heading+(i+1)*2.399+attempt*.48;
        const x=p.x+Math.sin(angle)*3.05,z=p.z+Math.cos(angle)*3.05;
        if(!canWalk(x,z)||!spaceAround(owner,x,z)||Math.hypot(x-player.position.x,z-player.position.z)<2) continue;
        const unit=createEnemy(owner.id+'-bone-'+(++summonCounter),'skeleton',{x,z},{kind:'skeleton',level:17,elite:false});
        unit.summonedBy=owner.id;unit.hp=42;
        fx.emit(unit.root.position,0x9effba,'ring',.66,.61,{grow:2.05,opacity:.91});
        break;
      }
    }
  }
  function hitEnemy(enemy:Enemy, amount:number,element:Weapon['ability']=null,heavy=false){
    if(enemy.hp<=0) return;
    combatUntil=time+4;
    const damage=Math.round(amount*(enemy.ward>0?.35:1)*10)/10;
    enemy.hp=Math.max(0,enemy.hp-damage);
    enemy.hitFlash=.22;
    impact(enemy.root.position,damage,element,heavy);
    if(enemy.hp){
      if((enemy.kind==='sentinel'||enemy.kind==='warlord'||enemy.kind==='frostGuardian'||isAdvancedBoss(enemy.kind))&&!enemy.enraged&&enemy.hp<=enemy.spec.health*.5){
        enemy.enraged=true;
        const phaseColor=caveAt(enemy.home.z)?.color??0xcf66ff;
        fx.emit(enemy.root.position,phaseColor,'ring',1.3,.72,{grow:8.5,opacity:.92});
        fx.emit(enemy.root.position,phaseColor,'ray',1.33,.49,{y:2.1,aspect:3.7});
        fx.scatter(enemy.root.position,phaseColor,14,1.25);
        notify('Boss phase II · '+enemy.spec.name);
      }
      return;
    }
    enemy.collapse=0;
    if(enemy.summonedBy){shadows.forget(enemy.id);fx.scatter(enemy.root.position,0x7ac7a4,6,.57);return;}
    shadows.award(enemy.id,enemy.spec.xp);
    const natural=defaultShadowGrade(enemy.kind),grade=natural==='ordinary'&&enemy.elite?'elite':natural;
    const sourceId=enemy.id+'-'+(save.kills+1);
    shadows.remember(sourceId,enemy.kind,grade,enemy.level,enemy.spec.health,enemy.spec.damage,enemy.root.position);
    if(enemy.barrier) enemy.barrier.visible=false;
    const cave=caveAt(enemy.home.z);
    if(cave&&enemy.id.startsWith('cave-')){
      const run=save.caveRuns[cave.id];
      if(!run||run.readyAt||enemy.id!==caveBossId(cave,run.cycle)) return;
      run.readyAt=Date.now()+cave.respawnMs;
      if(!save.defeatedBosses.includes(cave.id)) save.defeatedBosses.push(cave.id);
      if(!save.completedDungeons.includes(cave.id)) save.completedDungeons.push(cave.id);
      save.kills++;
      const reward=enemyXpReward(enemy.kind,enemy.spec.xp);
      earnXP(save,reward);
      fx.emit(enemy.root.position,0xffd080,'ray',1.6,.70,{y:2.3,aspect:4.2});
      fx.scatter(enemy.root.position,0xffd389,17,1.2);
      notify('Cave victory · '+cave.boss+' · +'+reward+' XP');
      return;
    }
    enemy.loot.position.copy(enemy.root.position);
    enemy.loot.visible=true;
    save.pending[enemy.id]={x:enemy.loot.position.x,z:enemy.loot.position.z};
    const guaranteed=/^wolf-[0-4]$/.test(enemy.id)&&!collected.has(enemy.id)?elementalIds[Number(enemy.id.slice(-1))]:undefined;
    if(enemy.roaming){
      const cell=encounterCell(enemy.home.x,enemy.home.z), until=Date.now()+30_000+Math.floor(Math.random()*30_000);
      spawnCooldown.set(cell,until);save.returns[cell]=until;
    }
    save.drops[enemy.id]=rollDrop(enemy.kind,rand,lootBonus(effectiveStats(save)),guaranteed&&!save.arsenal.includes(guaranteed)?guaranteed:undefined,enemy.roaming?{level:enemy.level,elite:enemy.elite,gold:enemy.spec.gold}:undefined);
    const piece=enemyArmor(enemy.elite&&enemy.roaming?'elite':enemy.kind,enemy.id,save.seed,save.kills,enemy.roaming&&!enemy.elite?Math.min(save.level,enemy.level+3):save.level,save.armorItems);
    if(piece) save.drops[enemy.id].armorPiece=piece;
    enemy.loot.material.color.set(rarity[save.drops[enemy.id].rarity].color);
    if(!enemy.roaming&&enemy.spec.respawn&&!enemy.id.startsWith('den-')&&!enemy.id.startsWith('tower-')) save.returns[enemy.id]=Date.now()+30_000+Math.floor(rand()*30_000);
    oldDefeats.add(enemy.id);
    save.defeated=[...oldDefeats];
    save.kills++;
    const boss=enemy.kind==='guardian'||enemy.kind==='sentinel';
    if(boss) {
      if(!save.defeatedBosses.includes(enemy.id)) save.defeatedBosses.push(enemy.id);
      const dungeon=enemy.kind==='sentinel'?briarWatch.id:den.id;
      if(!save.completedDungeons.includes(dungeon)) save.completedDungeons.push(dungeon);
    }
    const reward=enemyXpReward(enemy.kind,enemy.spec.xp);
    earnXP(save,reward);
    const floor=towerFloorAt(enemy.home.z);
    notify((enemy.kind==='sentinel'?'Briar Watch completed':boss?den.name+' cleared':
      floor&&floorRemaining(floor,save.defeated)===0?'Floor '+floor.number+' cleared · Floor '+(floor.number+1)+' unlocked':enemy.spec.name+' defeated')+
      ' · +'+reward+' XP');

  }

  function hitPlayer(enemy:Enemy, blocking:boolean, charge=false,strength=1){
    if(!save.health) return false;
    combatUntil=time+4;
    const guard=blocking&&inArc(player.position,enemy.root.position,player.rotation.y,3,1.25);
    const shieldBlock=guard&&weapons[save.equipped].model.shield;
    if(!charge&&(shieldBlock || (guard&&save.equipped==='longsword'))){
      impact(player.position);
      if(shieldBlock) splash();
      notify('Blocked');
      return false;
    }
    const barrierActive=magic.shield.active;
    const damage=magic.shield.absorb(Math.max(.5,Math.round((guard ? Math.ceil(enemy.spec.damage*.46) : enemy.spec.damage*(enemy.enraged?1.17:1)*(charge?1.3:1))*strength*(1-mitigation(effectiveStats(save),save.armor))*100)/100));
    if(barrierActive) splash();
    if(damage===0){notify('Water barrier absorbed the attack.');return false;}
    save.health=Math.max(0,Math.round((save.health-damage)*100)/100);
    if(enemy.kind==='frostGuardian') slowUntil=time+Math.min(1.75,statusTuning.slow);
    if(!save.health) knockback.set(0,0);
    impact(player.position);
    if(!save.health){rangeTimer.cancel();queued=undefined;magic.reset();}
    notify(save.health?enemy.spec.name+' hit you.':'You fell in the Blackwater Wilds.');
    return true;
  }

  function lootNearby(){
    return enemies.find(enemy=>enemy.loot.visible &&
      Math.hypot(player.position.x-enemy.loot.position.x,player.position.z-enemy.loot.position.z)<2.95 &&
      clearLine(player.position.x,player.position.z,enemy.loot.position.x,enemy.loot.position.z));
  }
  function grantArmor(id:ArmorId|undefined){
    if(!id) return '';
    if(save.armorItems.includes(id)){
      const gold=armorPiece(id).set==='abyssal'?28:armorPiece(id).set==='blacksteel'?14:6;
      save.gold+=gold;
      return ' · Duplicate armor traded for '+gold+' gold';
    }
    save.armorItems=[...save.armorItems,id];
    return ' · '+armorPiece(id).name;
  }
  function grantWeapon(id:string,type:WeaponId,tier:Drop['rarity']){
    if(save.items.some(item=>item.id===id)) return;
    save.items.push({id,type,rarity:tier});
    if(!save.arsenal.includes(type)) save.arsenal.push(type);
  }
  const allChests=()=>[...chests,...Array.from(caveRewards.values(),value=>value.chest)];
  function prepareCave(cave:BossCave,advance=true){
    let run=save.caveRuns[cave.id];
    if(!run){
      run={cycle:1,readyAt:0,rewardVersion:2};save.caveRuns[cave.id]=run;
    }
    if(advance&&run.readyAt&&Date.now()>=run.readyAt&&save.opened.includes(caveRewardId(cave,run.cycle))){
      run={cycle:run.cycle+1,readyAt:0,rewardVersion:2};save.caveRuns[cave.id]=run;
    }
    const id=caveBossId(cave,run.cycle), rewardId=caveRewardId(cave,run.cycle);
    for(let i=enemies.length-1;i>=0;i--){
      const enemy=enemies[i];
      if(enemy.id.startsWith('cave-'+cave.id+'-')&&enemy.id!==id) removeRoamer(i);
    }
    if(!run.readyAt&&!enemies.some(enemy=>enemy.id===id)) createEnemy(id,cave.kind,caveBossPoint(cave));
    const previous=caveRewards.get(cave.id);
    if(previous?.chest.id!==rewardId){
      if(previous){previous.view.dispose();group.remove(previous.group);}
      const chest:Chest={id:rewardId,...caveTreasurePoint(cave),rarity:caveRewardTier(cave,run,save.seed),weapon:cave.weapon,
        armorPiece:caveRewardArmor(cave,run,save.seed),gold:cave.gold,armor:cave.rating};
      const holder=new T.Group();group.add(holder);
      caveRewards.set(cave.id,{chest,group:holder,view:chestModels(holder,[chest],save.opened)});
    }
    changed();
  }
  const visibleChest=(chest:Chest)=>{
    const cave=caveAt(chest.z);
    if(cave&&!save.caveRuns[cave.id]?.readyAt) return false;
    return (!chest.boss||save.defeatedBosses.includes(chest.boss))&&(!chest.guardian||oldDefeats.has(chest.guardian));
  };
  function unopenedChest(){
    return allChests().find(chest=>!save.opened.includes(chest.id)&&visibleChest(chest)&&
      Math.hypot(player.position.x-chest.x,player.position.z-chest.z)<2.9 &&
      clearLine(player.position.x,player.position.z,chest.x,chest.z));
  }
  const atCamp=()=> Math.hypot(player.position.x+45,player.position.z)<4 ||
    Math.hypot(player.position.x-154,player.position.z-103)<4;
  return {
    feedback:notify,prepareCave,blockedByBoss:arts.blocks,
    extractShadow:shadows.extract,toggleShadow:shadows.toggle,summonAllShadows:shadows.summonAll,
    dismissAllShadows:shadows.dismissAll,renameShadow:shadows.rename,shadowCommand:shadows.command,
    encounterMarkers(){
      const groups=new Map<string,{id:string;x:number;z:number;count:number;level:number;elite:boolean}>();
      for(const enemy of enemies){
        if(!enemy.roamGroup||enemy.hp<=0||enemy.root.position.distanceTo(player.position)>roaming.activeDistance+4) continue;
        const {x,z}=enemy.root.position, id=enemy.roamGroup;
        const marker=groups.get(id);
        if(marker){marker.x+=x;marker.z+=z;marker.count++;marker.level=Math.max(marker.level,enemy.level);marker.elite||=enemy.elite;}
        else groups.set(id,{id,x,z,count:1,level:enemy.level,elite:enemy.elite});
      }
      const markers=[...groups.values()].map(marker=>({...marker,x:marker.x/marker.count,z:marker.z/marker.count}));
      const gravefang=enemies.find(enemy=>enemy.id==='elite-gravefang');
      if(gravefang){
        const {x,z}=gravefang.hp>0?gravefang.root.position:gravefang.home;
        return [...markers,{id:'gravefang-marker',x,z,count:1,level:gravefang.level,elite:true,permanent:true,defeated:gravefang.hp<=0}];
      }
      return markers;
    },
    get movementFactor(){return time<slowUntil?.64:1;},
    get inCombat(){
      return time<combatUntil||arcane.active||rangeTimer.busy||!!queued||magic.dashing||
        (!safe(player.position.x,player.position.z)&&enemies.some(enemy=>enemy.hp>0&&
          Math.hypot(player.position.x-enemy.home.x,player.position.z-enemy.home.z)<enemy.spec.leash&&
          Math.hypot(player.position.x-enemy.root.position.x,player.position.z-enemy.root.position.z)<enemy.spec.awareness));
    },
    arrivalClear(x:number,z:number){
      return !enemies.some(enemy=>enemy.hp>0&&Math.hypot(x-enemy.root.position.x,z-enemy.root.position.z)<7);
    },
    grassInfluences(actors:T.Vector4[],gusts:T.Vector4[]){
      let i=0;
      for(const enemy of enemies){
        const p=enemy.root.position;
        if(i===actors.length) break;
        if(enemy.hp>0&&Math.hypot(p.x-player.position.x,p.z-player.position.z)<19)
          actors[i++].set(p.x,p.z,enemy.spec.scale*1.12,.27+enemy.gait*.50);
      }
      for(;i<actors.length;i++) actors[i].set(0,0,1,0);
      fx.grassInfluences(gusts,player.position);
    },
    waystoneEffect(point=player.position,color=0x79bfff){
      fx.emit(point,color,'ray',1.95,.53,{y:2.12,aspect:3.2});
      fx.emit(point,0xe1faff,'ring',.64,.55,{grow:7.4});
      fx.emit(point,0x805eff,'ring',.43,.48,{grow:6.4,y:.19,delay:.07});
      fx.scatter(point,0x91e7ff,15,.98);
    },
    transition(){spawnClock=.6;arts.clear();
      for(let i=enemies.length-1;i>=0;i--) if(enemies[i].summonedBy) removeRoamer(i);
      for(const enemy of enemies) if(isAdvancedBoss(enemy.kind)){
        enemy.bossCast=undefined;enemy.windup=0;enemy.charge=0;enemy.cooldown=.62;
        enemy.root.position.y=surface(enemy.root.position.x,enemy.root.position.z);
      }
      shadows.transition();slowUntil=0;arcane.clear();combatUntil=0;knockback.set(0,0);magic.reset();fx.clear();queued=undefined;rangeTimer.cancel();echoLife=shake=0;echo.visible=false;},
    get bossHealth(){
      const floor=towerFloorAt(player.position.z);
      const kind=caveAt(player.position.z)?.kind??(floor?.number===5?'sentinel':inDen(player.position.z)?'guardian':undefined);
      const boss=enemies.find(enemy=>enemy.kind===kind);
      return boss&&boss.hp>0&&Math.hypot(player.position.x-boss.root.position.x,player.position.z-boss.root.position.z)<34
        ? boss.hp : 0;
    },
    get weaponLocked(){return rangeTimer.busy || Boolean(queued) || magic.dashing;},
    get dashing(){return magic.dashing;},
    get shake(){return shake;},
    get abilityRemaining(){return Math.max(0,(cooldowns.get(save.equipped)??0)-time);},
    attack(startAnimation:(weapon:Weapon)=>boolean){
      if(!save.health||queued||magic.dashing) return;
      const weapon=tunedWeapon(weapons[save.equipped]);
      if(!rangeTimer.start(weapon)) return;
      if(!startAnimation(weapon)){rangeTimer.cancel();return;}
      attackWeapon=weapon;
    },
    cast(startAnimation:(weapon:Weapon,ability:boolean)=>boolean){
      const weapon=tunedWeapon(weapons[save.equipped],true);
      if(!save.health||!weapon.ability||queued||magic.dashing||rangeTimer.busy||
        (cooldowns.get(weapon.id)??0)>time||!startAnimation(weapon,true)) return;
      cooldowns.set(weapon.id,time+weapon.abilityCooldown);
      queued={weapon,delay:abilityAnimationSeconds*weapon.impactTime/weapon.attackDuration,yaw:player.rotation.y};
    },
    interact(){
      if(!save.health){
        arcane.clear();arts.clear();fx.clear();
        player.position.set(spawn.x,surface(spawn.x,spawn.z),spawn.z);
        player.rotation.y=0;
        save.health=maxHealth();shadows.transition();
        notify('Returned to Ember Clearing.');
        return;
      }
      const loot=lootNearby();
      if(loot){
        loot.loot.visible=false;
        if(loot.roaming){
          oldDefeats.delete(loot.id);save.defeated=[...oldDefeats];
        }else collected.add(loot.id);
        save.collected=[...collected];
        delete save.pending[loot.id];
        const drop=save.drops[loot.id]??{gold:wolfLoot.gold,material:loot.spec.material,rarity:'Common',
          weapon:elementalIds[Number(loot.id.split('-')[1])],potion:0};
        delete save.drops[loot.id];
        save.gold+=drop.gold;
        if(loot.kind==='wild') save.fangs+=wolfLoot.count;
        save.materials[drop.material]=(save.materials[drop.material]??0)+1;
        if(drop.extra) save.materials[drop.extra]=(save.materials[drop.extra]??0)+1;
        save.potions+=drop.potion??0;
        if(drop.weapon) grantWeapon(loot.id+'-'+(save.returns[loot.id]??0),drop.weapon,drop.rarity);
        const equipment=grantArmor(drop.armorPiece);
        notify('Collected '+drop.material+' · '+drop.gold+' gold'+
          (drop.weapon?' · '+drop.rarity+' '+weapons[drop.weapon].name:'')+equipment);
      } else {
        const chest=unopenedChest();
        if(chest){
          if(chest.guardians?.some(id=>!oldDefeats.has(id))){notify('Defeat the guardians to open the chest.');return;}
          save.opened.push(chest.id);
          save.gold+=chest.gold;
          save.armor=Math.max(save.armor,chest.armor);
          const bonus=chestBonus(chest,save.seed);
          save.potions+=bonus.potions;
          const cave=caveAt(chest.z);
          const material=cave?'Magic Crystal':bonus.material;
          const count=cave?.crystals??bonus.count;
          save.materials[material]=(save.materials[material]??0)+count;
          if(cave){
            save.potions+=cave.potions;
            fx.emit(chest,0xffc779,'ray',1.14,.92,{y:1.48,aspect:3.6,opacity:.59});
          }
          fx.treasure(chest,Number.parseInt(rarity[chest.rarity].color.slice(1),16),rarityOrder.indexOf(chest.rarity));
          grantWeapon('chest-'+chest.id,chest.weapon,chest.rarity);
          const equipment=grantArmor(bonus.armorPiece);
          notify('Opened '+chest.rarity+' Chest · '+weapons[chest.weapon].name+' · Armor '+save.armor+' · '+material+' × '+count+equipment);
          return;
        }
        if(atCamp()&&save.health<maxHealth()){
          save.health=maxHealth();
          notify('Rested at the campfire.');
        }
      }
    },
    drink(){
      if(save.health<=0||save.health>=maxHealth()||save.potions<=0) return;
      save.potions--;
      save.health=Math.min(maxHealth(),save.health+12);
      notify('Health Potion used.');
    },
    ui(){
      const loot=lootNearby(), chest=unopenedChest();
      const prompt=!save.health?'E · Return to Ember Clearing':
        loot?(loot.kind==='wild'?'E · Collect wolf loot':'E · Collect monster loot'):
        chest?(chest.guardians?.some(id=>!oldDefeats.has(id))?'Sealed chest · Defeat the guardians':'E · Open '+chest.rarity+' Chest'):
        atCamp()&&save.health<maxHealth()?'E · Rest at campfire':'';
      return {notification,prompt,shadowAvailable:!!shadows.available()};
    },
    update(dt:number,blocking:boolean){
      time+=dt;
      spawnClock-=dt;
      if(spawnClock<=0){spawnClock=.42;populate();}
      if(save.health&&knockback.lengthSq()>.04){
        const {x,z}=player.position, dx=knockback.x*dt,dz=knockback.y*dt;
        if(canWalk(x+dx,z)) player.position.x+=dx;
        if(canWalk(player.position.x,z+dz)) player.position.z+=dz;
        knockback.multiplyScalar(Math.exp(-8.5*dt));
      }
      let discovered=false;
      for(const chest of allChests()){
        if(save.seenChests.includes(chest.id)||!visibleChest(chest)||Math.hypot(player.position.x-chest.x,player.position.z-chest.z)>13||
          !clearLine(player.position.x,player.position.z,chest.x,chest.z)) continue;
        save.seenChests.push(chest.id);discovered=true;
      }
      if(discovered) changed();
      shake=Math.max(0,shake-dt*2.8);
      if(notification&&time>=noticeUntil){notification='';changed();}
      if(queued){
        queued.delay-=dt;
        if(queued.delay<=0){
          magic.cast(queued.weapon,queued.yaw);
          shake=queued.weapon.ability==='lightning'?1:queued.weapon.ability==='fire'?.83:.56;
          if(queued.weapon.ability==='wind') leaveEcho();
          queued=undefined;
        }
      }
      if(rangeTimer.advance(dt)&&save.health){
        const weapon=attackWeapon;
        if(weapon.id==='staff') magic.bolt(weapon,player.rotation.y);
        else {
          fx.slash(player.position,weapon.ability,player.rotation.y,weapon.range*.68,rarity[weapon.rarity].multiplier>=2.5);
          for(const enemy of enemies){
            const p=enemy.root.position;
            if(enemy.hp && Math.abs(player.position.y-p.y)<2 &&
              inArc(player.position,p,player.rotation.y,weapon.range,weapon.reachAngle) &&
              clearLine(player.position.x,player.position.z,p.x,p.z)) hitEnemy(enemy,weaponDamage(weapon),weapon.ability,rarity[weapon.rarity].multiplier>=2.5);
          }
        }
      }
      magic.update(dt);
      arcane.update(dt,blocking);
      arts.update(dt,blocking);
      for(let i=enemies.length-1;i>=0;i--){
        const enemy=enemies[i];
        if(enemy.summonedBy&&(!enemies.some(owner=>owner.id===enemy.summonedBy&&owner.hp>0)||!enemy.hp&&enemy.collapse>=1)) removeRoamer(i);
      }
      shadows.update(dt,enemies,(enemy,damage,frost)=>{
        if(frost) enemy.statuses.slow();
        hitEnemy(enemy,damage,frost?'ice':null);
      });
      waterTime-=dt;
      if(magic.shield.active&&waterTime<=0){
        waterTime=.16;
        const a=time*4.8, droplet={x:player.position.x+Math.sin(a)*1.52,z:player.position.z+Math.cos(a)*1.52};
        fx.emit(droplet,0x8ceafa,'spark',.24,.36,{y:1.15,lift:1.15,aspect:1.65});
        fx.emit(player.position,0x438cf3,'ring',1.36,.32,{y:.11,grow:.82,opacity:.34});
      }


      const currentFloor=towerFloorAt(player.position.z);
      const playerInDen=inDen(player.position.z), currentCave=caveAt(player.position.z);
      for(const enemy of enemies){
        const root=enemy.root, p=root.position;
        if(enemy.id.startsWith('cave-')&&caveAt(enemy.home.z)!==currentCave||enemy.id.startsWith('tower-')&&towerFloorAt(enemy.home.z)!==currentFloor||
          enemy.id.startsWith('den-')&&!playerInDen){
          root.visible=false;enemy.hpBar.visible=false;enemy.affinity.visible=false;
          if(enemy.title) enemy.title.visible=false;
          continue;
        }
        const {spec}=enemy;
        enemy.impactAge+=dt;
        enemy.retreat=Math.max(0,enemy.retreat-dt);
        const returnAt=save.returns[enemy.id];
        if(!enemy.hp&&!enemy.loot.visible&&returnAt&&Date.now()>=returnAt&&
          Math.hypot(player.position.x-enemy.home.x,player.position.z-enemy.home.z)>roaming.minSpawnDistance&&
          !visibleAt(enemy.home.x,enemy.home.z)){
          enemy.hp=spec.health;enemy.statuses=statuses(spec.resistance);enemy.cooldown=enemy.windup=0;
          p.copy(enemy.home);enemy.collapse=1;enemy.gait=0;enemy.anticipation=0;oldDefeats.delete(enemy.id);collected.delete(enemy.id);
          save.defeated=[...oldDefeats];save.collected=[...collected];delete save.returns[enemy.id];changed();
        }
        const gap=Math.hypot(player.position.x-p.x,player.position.z-p.z);
        if(gap>roaming.activeDistance+3){
          root.visible=enemy.hp>0&&gap<roaming.despawnDistance&&visibleAt(p.x,p.z);enemy.hpBar.visible=false;enemy.affinity.visible=false;
          if(enemy.title) enemy.title.visible=false;
          continue;
        }
        if(enemy.hp>0) enemy.statuses.update(dt,amount=>hitEnemy(enemy,amount),(dx,dz)=>{
          if(canWalk(p.x+dx,p.z)) p.x+=dx;
          if(canWalk(p.x,p.z+dz)) p.z+=dz;
        });
        const active=gap<(enemy.roaming?roaming.activeDistance:nearDistance)&&enemy.hp>0;
        if(enemy.title){
          enemy.title.visible=active&&gap<27;
          if(enemy.title.visible) enemy.title.position.set(p.x,p.y+2.58*spec.scale,p.z);
          if(active&&gap<21&&!enemy.announced){
            enemy.announced=true;
            notify('Elite encountered · '+spec.name+' · Lv '+enemy.level);
          }
        }
        if(active&&enemy.kind==='frostGuardian'&&Math.floor(time*2.7)!==Math.floor((time-dt)*2.7)){
          fx.emit(p,0x87d9ff,'mist',1.07,.57,{y:.55,lift:.46,opacity:.29,grow:.87});
        }
        const dying=!enemy.hp&&enemy.collapse<1&&gap<nearDistance;
        if(!enemy.hp&&!dying) enemy.collapse=1;
        root.visible=active||dying||enemy.hp>0&&visibleAt(p.x,p.z);
        enemy.hpBar.visible=active&&gap<23&&(['guardian','elite','ritualElite'].includes(enemy.kind)||enemy.hp<spec.health||enemy.windup>0);
        const status=enemy.statuses.visual;
        enemy.visualTick-=dt;
        if(active&&gap<24&&status!==enemy.lastVisual&&enemy.lastVisual==='frozen'){
          fx.scatter(p,0xadf2ff,8,spec.scale*.85,'crystal');
        }
        if(active&&gap<24&&status&&status!=='slowed'&&(enemy.visualTick<=0||status!==enemy.lastVisual)){
          enemy.visualTick=.17;
          const a=time*8+enemy.phase, spot={x:p.x+Math.sin(a)*spec.scale*.44,z:p.z+Math.cos(a)*spec.scale*.44};
          if(status==='burning'){
            fx.emit(spot,0xff6b28,'spark',.58,.38,{y:spec.scale*.49,lift:2.1,aspect:2.1});
            fx.emit(spot,0xf28b5a,'mist',.51,.32,{y:spec.scale*.48,lift:1.65,opacity:.47});
          }else if(status==='stunned'){
            fx.lightning(spot,p,false,true);
            fx.scatter(spot,0xb9dbff,2,spec.scale*.92);
          }else{
            fx.emit(spot,0x9bdcff,'crystal',.74,.36,{y:spec.scale*.33,aspect:2.9,yaw:a,opacity:.63});
          }
        }
        enemy.lastVisual=status;
        enemy.affinity.visible=active&&(!!status||enemy.elite);
        if(active&&enemy.elite&&!status){
          enemy.affinity.material=eliteAura;
          enemy.affinity.position.set(p.x,surface(p.x,p.z)+.12,p.z);
          enemy.affinity.scale.setScalar(spec.scale*(1.47+.19*Math.sin(time*4)));
        }
        if(status&&active){
          enemy.affinity.material=affinities[status];
          enemy.affinity.position.set(p.x,surface(p.x,p.z)+(status==='stunned' ? spec.scale*1.67 : .06),p.z);
          enemy.affinity.scale.setScalar(spec.scale*(1+.10*Math.sin(time*6)));
        }
        if(dying){
          enemy.collapse=Math.min(1,enemy.collapse+dt*1.15);
          enemy.animate({time,phase:enemy.posePhase,gait:0,windup:0,recovery:0,hit:0,leap:0,dead:enemy.collapse,frozen:false,distance:gap});
        }
        if(!active) continue;
        const homeGap=Math.hypot(p.x-enemy.home.x,p.z-enemy.home.z);
        const playerHome=Math.hypot(player.position.x-enemy.home.x,player.position.z-enemy.home.z);
        const aggro=save.health>0&&gap<spec.awareness&&playerHome<spec.leash&&!safe(player.position.x,player.position.z);
        enemy.ward=Math.max(0,enemy.ward-dt);
        enemy.wardCool=Math.max(0,enemy.wardCool-dt);
        if(enemy.barrier){
          enemy.barrier.visible=enemy.ward>0;
          const pulse=1+.06*Math.sin(time*6);
          enemy.barrier.scale.set(.92*pulse,1.46*pulse,.92*pulse);
        }
        enemy.cooldown=Math.max(0,enemy.cooldown-dt);
        enemy.hitFlash=Math.max(0,enemy.hitFlash-dt);
        let gait=0;
        const previousX=p.x, previousZ=p.z;
        const shadow=enemy.cooldown===0&&!isAdvancedBoss(enemy.kind)&&!enemy.wizard&&!enemy.windup&&!enemy.charge&&gap>spec.reach
          ? shadows.guardTarget(enemy,spec.reach+.27):undefined;
        if(enemy.statuses.halted){
          enemy.windup=0; enemy.charge=0; enemy.chargeWindup=false;enemy.slam=undefined;enemy.spell=undefined;enemy.spellTarget=undefined;enemy.sentinelMove=undefined;enemy.shadowTarget=undefined;enemy.bossCast=undefined;
        } else if(arts.flying(enemy)){
          gait=.44;
        } else if(shadow){
          enemy.shadowTarget=shadow;enemy.windup=spec.windup;
        } else if(enemy.charge>0){
          enemy.charge=Math.max(0,enemy.charge-dt);
          const speed=enemy.kind==='infernalGolem'?19:(enemy.kind==='sentinel'||enemy.kind==='warlord')?(enemy.enraged?23:19):enemy.kind==='assassin'?19:16;
          const x=p.x+Math.sin(enemy.heading)*dt*speed,z=p.z+Math.cos(enemy.heading)*dt*speed;
          if(canWalk(x,z)&&spaceAround(enemy,x,z)){p.x=x;p.z=z;gait=1;}
          else enemy.charge=0;
          if(!enemy.chargeHit&&Math.hypot(p.x-player.position.x,p.z-player.position.z)<2.1){
            enemy.chargeHit=true;
            hitPlayer(enemy,blocking,true);
            if(enemy.kind==='assassin'){fx.slash(p,null,enemy.heading,1.48);enemy.impactAge=0;}
          }
          if((enemy.kind==='sentinel'||enemy.kind==='warlord')&&enemy.charge>0&&enemy.impactAge>.08){
            enemy.impactAge=0;fx.emit(p,0x8840e5,'arc',1.42,.19,{yaw:enemy.heading,y:1.03,opacity:.74});
          }
          if(!enemy.charge){
            enemy.cooldown=(enemy.kind==='sentinel'||enemy.kind==='warlord')?(enemy.enraged?.87:1.32):enemy.kind==='guardian'?1.8:1.45;
            if(enemy.kind==='assassin') enemy.retreat=.70;
          }
        } else if(enemy.windup>0){
          enemy.windup=Math.max(0,enemy.windup-dt);
          if(!enemy.windup){
            enemy.cooldown=spec.recovery;
            enemy.impactAge=0;
            if((enemy.kind==='goblin'||enemy.kind==='assassin')&&++enemy.strikes%2===0) enemy.retreat=.72;
            if(enemy.shadowTarget){
              shadows.hit(enemy.shadowTarget,enemy,spec.damage,spec.reach+.38);
              enemy.shadowTarget=undefined;
            }else if(enemy.bossCast){
              const cast=enemy.bossCast;enemy.bossCast=undefined;
              arts.resolve(enemy,cast);
              if(cast.move==='rush'){enemy.charge=.62;enemy.chargeHit=false;}
              if(cast.move==='air') enemy.cooldown=2.15;
              else if(cast.move==='meteor') enemy.cooldown=1.8;
            }else if(enemy.sentinelMove){
              const move=enemy.sentinelMove;
              enemy.sentinelMove=undefined;
              enemy.cooldown=enemy.enraged?1.03:1.52;
              const color=enemy.kind==='frostGuardian'?0x99efff:enemy.kind==='warlord'?0xf5a164:enemy.enraged?0xd988ff:0xa86de7;
              if(move==='shadow'){
                enemy.charge=enemy.enraged?.55:.48;enemy.chargeHit=false;
                fx.scatter(p,color,9,1.1);
              }else if(move==='shock'){
                const reach=enemy.enraged?7:6;
                fx.emit(p,color,'ring',1.0,.57,{grow:reach/.57,y:.13,opacity:.94});
                fx.emit(p,0xcd9fff,'ring',.77,.33,{grow:reach/.33,y:.18});
                fx.scatter(p,color,12,.74);shake=Math.max(shake,.76);
                if(gap<reach&&clearLine(p.x,p.z,player.position.x,player.position.z)) hitPlayer(enemy,blocking,true);
                const shadow=shadows.guardTarget(enemy,reach);
                if(shadow) shadows.hit(shadow,enemy,spec.damage,reach);
              }else{
                fx.emit(p,color,'arc',3.11,.36,{yaw:enemy.heading,y:1.1,aspect:1.43,grow:1.8});
                fx.emit(p,0xe4b9ff,'arc',2.71,.26,{yaw:enemy.heading,y:.84,opacity:.78});
                if(inArc(p,player.position,enemy.heading,enemy.enraged?5.2:4.7,1.02)&&
                  clearLine(p.x,p.z,player.position.x,player.position.z)) hitPlayer(enemy,blocking);
              }
            } else if(enemy.spell){
              const spell=enemy.spell,cold=enemy.kind==='frostGuardian',elite=cold||enemy.kind==='ritualElite';
              enemy.spell=undefined;
              if(spell==='shield'){
                enemy.ward=elite?5.3:4.1;enemy.wardCool=elite?13:16;
                fx.emit(p,cold?0xc0f0ff:0xc2a1ff,'ring',.72,.46,{grow:2.8,y:.16});
                fx.scatter(p,cold?0xa4dcff:0xa98cff,7,1.06);
              }else if(spell==='domain'&&enemy.spellTarget){
                arcane.domain(enemy,enemy.spellTarget,elite,cold);
                enemy.cooldown=elite?2.34:2.05;
              }else if(aggro&&gap<spec.reach+2&&clearLine(p.x,p.z,player.position.x,player.position.z)){
                arcane.bolt(enemy,p,elite,cold);
              }
              enemy.spellTarget=undefined;
            } else if(enemy.slam){
              const target=enemy.slam;
              enemy.slam=undefined;
              fx.emit(target,0xffaf54,'ring',.72,.52,{grow:7.2});
              fx.emit(target,0x9b5026,'scorch',2.24,.74,{opacity:.55});
              fx.emit(target,0xb4a28c,'mist',1.38,.42,{grow:4.8,y:.21});
              fx.scatter(target,0xd9a276,10,.22);
              if(gap<9) shake=Math.max(shake,.58);
              if(Math.hypot(player.position.x-target.x,player.position.z-target.z)<3.15&&
                clearLine(p.x,p.z,player.position.x,player.position.z)&&hitPlayer(enemy,blocking,true)&&save.health){
                knockback.set(player.position.x-p.x,player.position.z-p.z).setLength(18);
              }
            } else if(enemy.chargeWindup){
              enemy.chargeWindup=false;
              enemy.charge=enemy.kind==='guardian'?.65:.43;enemy.chargeHit=false;
            } else if(aggro && gap<spec.reach+.35 && Math.abs(player.position.y-p.y)<1.9 &&
              clearLine(p.x,p.z,player.position.x,player.position.z)) hitPlayer(enemy,blocking);
          }
        } else if(isAdvancedBoss(enemy.kind)&&aggro&&enemy.cooldown===0&&gap<(enemy.kind==='infernalGolem'?14:enemy.kind==='skeletonKing'?12:24)&&
          clearLine(p.x,p.z,player.position.x,player.position.z)){
          const cast=arts.start(enemy,enemy.strikes++);
          if(cast){enemy.bossCast=cast;enemy.heading=cast.yaw;enemy.windup=cast.duration;}
        } else if((enemy.kind==='sentinel'||enemy.kind==='warlord')&&aggro&&enemy.cooldown===0&&gap<13&&
          clearLine(p.x,p.z,player.position.x,player.position.z)){
          enemy.heading=Math.atan2(player.position.x-p.x,player.position.z-p.z);
          const cycle=enemy.strikes++%3;
          const move=gap>7?'shadow':cycle===1?'shock':cycle===2&&gap>4?'shadow':'cleave';
          enemy.sentinelMove=move;
          const duration=move==='shock'?1.18:move==='shadow'?.87:.98;
          enemy.windup=duration*(enemy.enraged?.72:1);
          const color=enemy.kind==='warlord'?0xf9b165:enemy.enraged?0xf184cb:0xc37cff;
          if(move==='shock') fx.emit(p,color,'ring',(enemy.enraged?7:6)/.88,enemy.windup,{opacity:.87,y:.11});
          else if(move==='cleave') fx.emit(p,color,'arc',3.8,enemy.windup,{yaw:enemy.heading,y:.25,opacity:.65});
          else for(let i=1;i<9;i++){
            const x=p.x+Math.sin(enemy.heading)*i*1.2,z=p.z+Math.cos(enemy.heading)*i*1.2;
            if(!canWalk(x,z)) break;
            fx.emit({x,z},color,'ring',1.08,enemy.windup,{opacity:.64});
          }
        } else if(enemy.wizard&&!isAdvancedBoss(enemy.kind)&&aggro&&enemy.cooldown===0&&gap<spec.reach&&
          clearLine(p.x,p.z,player.position.x,player.position.z)){
          const cold=enemy.kind==='frostGuardian', elite=cold||enemy.kind==='ritualElite';
          enemy.strikes++;
          if(cold&&enemy.strikes%4===0&&gap<8.2){
            enemy.sentinelMove='shock';
            enemy.windup=1.18*(enemy.enraged?.72:1);
            fx.emit(p,0x9ceaff,'ring',(enemy.enraged?7:6)/.88,enemy.windup,{opacity:.92,y:.11});
          }else{
            enemy.spell=enemy.wardCool===0&&(gap<6.8||enemy.hp<spec.health*.69)?'shield':
              enemy.strikes%(elite?2:3)===0?'domain':'bolt';
            enemy.windup=enemy.spell==='domain'?1.04:enemy.spell==='shield'?.63:spec.windup;
            if(enemy.spell==='domain'){
              enemy.spellTarget={x:player.position.x,z:player.position.z};
              fx.emit(enemy.spellTarget,cold?0xafecff:0xaf63f1,'ring',cold?5.10:elite?4.65:3.65,enemy.windup,{opacity:.60});
            }else fx.emit(p,cold?0x8cd4ff:0x9957f4,'ring',.96,.57,{grow:1.3,y:.2});
          }
        } else if(enemy.kind==='brute'&&aggro&&gap>2.25&&gap<5.2&&enemy.cooldown===0&&
          clearLine(p.x,p.z,player.position.x,player.position.z)){
          enemy.heading=Math.atan2(player.position.x-p.x,player.position.z-p.z);
          enemy.slam={x:p.x+Math.sin(enemy.heading)*1.9,z:p.z+Math.cos(enemy.heading)*1.9};
          enemy.windup=1.27;
          fx.emit(enemy.slam,0xff9d41,'ring',3.4,1.27,{opacity:.96});
          fx.emit(enemy.slam,0xffd16d,'ring',2.9,1.27,{opacity:.49,y:.12});
        } else if(['guardian','dire','elite','assassin'].includes(enemy.kind)&&aggro&&!enemy.retreat&&gap>4&&gap<(enemy.kind==='guardian'?15:9)&&enemy.cooldown===0&&
          clearLine(p.x,p.z,player.position.x,player.position.z)){
          enemy.heading=Math.atan2(player.position.x-p.x,player.position.z-p.z);
          enemy.windup=enemy.kind==='guardian'?1.15:enemy.kind==='assassin'?.51:.89;enemy.chargeWindup=true;
          const aim={x:Math.sin(enemy.heading),z:Math.cos(enemy.heading)};
          for(let i=1;i<=(enemy.kind==='guardian'?10:7);i++){
            const point={x:p.x+aim.x*i,z:p.z+aim.z*i};
            if(!canWalk(point.x,point.z)) break;
            fx.emit(point,0xe69c51,'ring',1.15,enemy.windup,{opacity:.55});
          }
        } else if(!enemy.wizard&&!isAdvancedBoss(enemy.kind)&&enemy.kind!=='sentinel'&&enemy.kind!=='warlord'&&aggro&&!enemy.retreat&&gap<spec.reach&&enemy.cooldown===0&&clearLine(p.x,p.z,player.position.x,player.position.z)){
          enemy.windup=spec.windup;
        } else if(!aggro||gap>spec.reach-.18||enemy.retreat||enemy.kind==='assassin'||enemy.wizard){
          const backAway=enemy.wizard&&aggro&&gap<7.5;
          const circle=enemy.wizard&&aggro&&gap>=7.5&&gap<spec.reach-2;
          const strafe=enemy.kind==='assassin'&&aggro&&!enemy.retreat&&gap<5&&enemy.cooldown>0;
          const side=enemy.id.endsWith('north')||enemy.id.endsWith('west')?-1:1;
          const patrolPhase=time*.26+enemy.phase;
          const patrolX=enemy.home.x+Math.sin(patrolPhase)*8.5;
          const northRoad=path(enemy.home.x), southRoad=southPath(enemy.home.x);
          const patrolZ=Math.abs(northRoad-enemy.home.z)<4.7?path(patrolX):
            Math.abs(southRoad-enemy.home.z)<4.7?southPath(patrolX):enemy.home.z+Math.cos(patrolPhase)*3;
          const goal = strafe||circle ? {
            x:p.x+side*(p.z-player.position.z),z:p.z-side*(p.x-player.position.x),
          } : backAway||enemy.retreat && aggro ? {
            x:p.x+(p.x-player.position.x)*3,z:p.z+(p.z-player.position.z)*3,
          } : aggro ? packGoal(enemy,gap) : homeGap>8 ? enemy.home : {
            x:enemy.patrol?patrolX:enemy.home.x+Math.sin(patrolPhase)*5,
            z:enemy.patrol?patrolZ:enemy.home.z+Math.cos(patrolPhase)*5,
          };
          const dx=goal.x-p.x,dz=goal.z-p.z,remaining=Math.hypot(dx,dz);
          if(remaining>.35){
            const step=Math.min(remaining,(aggro?spec.speed:1.65)*dt*enemy.statuses.speed);
            const tryStep=(factor:number)=>{
              const angle=Math.atan2(dx,dz)+factor;
              const x=p.x+Math.sin(angle)*step,z=p.z+Math.cos(angle)*step;
              if(!canWalk(x,z)||!spaceAround(enemy,x,z)||safe(x,z)||Math.hypot(x-player.position.x,z-player.position.z)<.9) return false;
              p.x=x;p.z=z;enemy.heading=strafe||circle||backAway?Math.atan2(player.position.x-x,player.position.z-z):angle;gait=aggro?(gap>8?1:.71):.40;
              return true;
            };
            tryStep(0)||tryStep(.87)||tryStep(-.87);
          }
        }
        if(enemy.windup>0&&!enemy.chargeWindup&&!enemy.slam&&!enemy.sentinelMove&&!enemy.bossCast){
          const q=enemy.shadowTarget?shadows.guardPoint(enemy.shadowTarget)??player.position:player.position;
          enemy.heading=Math.atan2(q.x-p.x,q.z-p.z);
        }
        const angle=enemy.heading-root.rotation.y;
        const facing=Math.atan2(Math.sin(angle),Math.cos(angle));
        root.rotation.y+=facing*(1-Math.exp(-10*dt));
        enemy.turn=T.MathUtils.damp(enemy.turn,T.MathUtils.clamp(facing*1.7,-1,1),9,dt);
        p.y=surface(p.x,p.z)+arts.altitude(enemy);
        const travelled=Math.hypot(p.x-previousX,p.z-previousZ);
        const speed=travelled/Math.max(.001,dt);
        const stride=enemy.wolfRig?Math.min(1,speed/Math.max(3.8,spec.speed)):gait;
        enemy.gait=T.MathUtils.damp(enemy.gait,stride,11,dt);
        if(!enemy.statuses.halted){
          enemy.posePhase+=enemy.wolfRig
            ? travelled*Math.PI*2/((.52+enemy.gait*1.60)*spec.scale)
            : dt*(3.1+enemy.gait*9.4);
        }
        const leapDuration=enemy.kind==='infernalGolem'?.62:(enemy.kind==='sentinel'||enemy.kind==='warlord')?(enemy.enraged?.55:.48):enemy.kind==='guardian'?.65:.43;
        const sentinelWindup=enemy.sentinelMove
          ? (enemy.sentinelMove==='shock'?1.18:enemy.sentinelMove==='shadow'?.87:.98)*(enemy.enraged?.72:1) : 0;
        const currentWindup=enemy.bossCast?.duration||sentinelWindup||(enemy.spell==='domain'?1.04:enemy.spell==='shield'?.63:enemy.slam?1.27:enemy.chargeWindup?(enemy.kind==='guardian'?1.15:enemy.kind==='assassin'?.51:.89):spec.windup);
        enemy.anticipation=T.MathUtils.damp(enemy.anticipation,
          enemy.windup>0?Math.min(1,(1-enemy.windup/currentWindup)*1.5+.22):0,enemy.windup>0?12:20,dt);
        enemy.animate({time,phase:enemy.posePhase,gait:enemy.gait,
          windup:enemy.anticipation,
          recovery:Math.max(0,1-enemy.impactAge/.33),hit:enemy.hitFlash/.22,
          leap:arts.flying(enemy)?Math.max(.35,arts.altitude(enemy)/3.3):enemy.charge>0&&enemy.kind!=='guardian'?Math.sin(Math.PI*enemy.charge/leapDuration):0,
          dead:0,frozen:status==='frozen',turn:enemy.turn,alert:enemy.enraged?2:aggro?1:0,distance:gap});

      }
    },
    render(dt:number){
      chestViews.update(dt,save.defeatedBosses,save.opened,save.defeated);
      for(const [id,reward] of caveRewards){
        reward.group.visible=caveAt(player.position.z)?.id===id&&!!save.caveRuns[id]?.readyAt;
        if(reward.group.visible) reward.view.update(dt,save.defeatedBosses,save.opened,save.defeated);
      }
      fx.update(dt);shadows.render();
      fx.barrier(player.position,magic.shield.active);
      echoLife=Math.max(0,echoLife-dt);
      echo.visible=echoLife>0;
      echoMaterial.opacity=echoLife*.98;
      for(const enemy of enemies){
        enemy.hpBar.position.copy(enemy.root.position);
        enemy.hpBar.position.y+=(enemy.kind==='brute'?2.62:enemy.kind==='assassin'?2.51:2.23)*enemy.spec.scale;
        enemy.hpBar.quaternion.copy(camera.quaternion);
        enemy.fill.material=enemy.windup>0?alert:red;
        enemy.fill.scale.x=enemy.hp/enemy.spec.health;
        enemy.fill.position.x=(enemy.fill.scale.x-1)*.6;
        const sameArea=towerFloorAt(player.position.z)===towerFloorAt(enemy.loot.position.z)&&
          inDen(player.position.z)===inDen(enemy.loot.position.z)&&caveAt(player.position.z)===caveAt(enemy.loot.position.z);
        const lootMask=sameArea?1:0;
        if(enemy.loot.layers.mask!==lootMask)
          enemy.loot.traverse(object=>{object.layers.mask=lootMask;});
        enemy.beam.visible=sameArea&&enemy.loot.visible&&
          Math.hypot(player.position.x-enemy.loot.position.x,player.position.z-enemy.loot.position.z)<45;
        if(enemy.loot.visible){
          enemy.loot.position.y=surface(enemy.loot.position.x,enemy.loot.position.z)+.32+Math.sin(time*4+enemy.phase)*.12;
          enemy.loot.rotation.y=time*1.8;
          if(enemy.beam.visible){
            enemy.beam.material.color.copy(enemy.loot.material.color);
            enemy.beam.position.copy(enemy.loot.position);
            enemy.beam.position.y+=.76;
          }
        }
      }
      let cursor=0;
      for(const spark of bursts){
        if(spark.life<=0) continue;
        spark.life-=dt; spark.v.y-=9*dt;
        spark.p.addScaledVector(spark.v,dt);
        const offset=cursor++*3;
        sparkPositions[offset]=spark.p.x;sparkPositions[offset+1]=spark.p.y;sparkPositions[offset+2]=spark.p.z;
      }
      sparkGeometry.setDrawRange(0,cursor);
      sparkGeometry.attributes.position.needsUpdate=true;
      sparks.visible=cursor>0;
      for(const number of numbers){
        number.age+=dt;
        number.sprite.visible=number.age<.75;
        const size=(number.strong?2.15:1.68)*(1+.30*Math.exp(-number.age*13));
        number.sprite.scale.set(size,size*.5,1);
        number.sprite.material.opacity=1-T.MathUtils.smoothstep(number.age,.35,.75);
        number.sprite.position.y=number.base+1.68*Math.sqrt(number.age);
      }
    },
    dispose(){
      scene.remove(group);
      models.dispose();skeletons.dispose();goblins.dispose();orcs.dispose();wizards.dispose();
      affinityGeometry.dispose();Object.values(affinities).forEach(material=>material.dispose());
      for(const resource of [barGeometry,backing,red,alert,lootGeometry,drawstring,lootFang,lootCoin,bagTie,boneLoot,metalLoot,lootBeamGeometry,lootMaterial,sparkGeometry,sparks.material,echoMaterial]) resource.dispose();
      shadows.dispose();spectral.dispose();elementals.dispose();arts.dispose();fx.dispose();
      chestViews.dispose();
      for(const enemy of enemies){enemy.loot.material.dispose();enemy.beam.material.dispose();enemy.title?.material.dispose();}
      for(const texture of labels.values()) texture.dispose();
      levelNotice.dispose();eliteAura.dispose();sentinel.dispose();frostGuardian.dispose();
      for(const reward of caveRewards.values()) reward.view.dispose();
      for(const texture of numberTextures.values()) texture.dispose();
      for(const {sprite} of numbers) sprite.material.dispose();
    },
  };
}
