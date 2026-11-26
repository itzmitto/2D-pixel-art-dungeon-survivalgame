import { goblinModels } from './goblins.ts';
import { loft, shapedPlate, type CreatureRig } from './creatureGeometry.ts';
import { skeletonModels } from './skeletons.ts';
import { den, inDen } from './denLayout.ts';
import { enemyXpReward, monsters, rarityOrder, rollDrop, type MonsterKind, type Drop } from './huntData.ts';
import { elementalRarity, instanceWeapon } from './itemInstances.ts';
import { chestBonus, chestModels, worldChests, type Chest } from './treasure.ts';
import { attackSpeed, earnXP, elemental, maxHunterHealth, mitigation, physical, lootBonus } from './progression.ts';
import * as T from 'three';
import { inArc, swingTimer, wolfLoot } from './combatRules.ts';
import type { Exploration } from './exploration.ts';
import { randomSequence, spawn, surface } from './layout.ts';
import { wolfModels } from './wolves.ts';
import { abilityAnimationSeconds, elementalIds, weaponDamage, weapons, rarity, type Weapon, type WeaponId } from './weapons.ts';
import { createMagicEffects } from './magicEffects.ts';
import { abilityCombat } from './abilities.ts';
import { statuses } from './statusEffects.ts';

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
    const speed=attackSpeed(save.stats);
    return {...weapon,damage:weapon.damage*(magic||weapon.id==='staff'?elemental(save.stats)*(item&&magic?elementalRarity(item):1):physical(save.stats)),
      attackDuration:weapon.attackDuration/speed, impactTime:weapon.impactTime/speed,cooldown:weapon.cooldown/speed};
  }
  const models=wolfModels(), skeletons=skeletonModels(), goblins=goblinModels();
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
  let echoLife=0,shake=0,waterTime=0;
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
  const chests:Chest[]=[...worldChests,
    {id:'den-hidden',x:20,z:350,rarity:'Rare',weapon:'katana',gold:31,armor:4},
    {id:'den-entry-supplies',x:-4.1,z:382,rarity:'Common',weapon:'axe',gold:10,armor:1},
    {id:'den-guardian-reliquary',x:13,z:314,rarity:'Epic',weapon:'shield',gold:38,armor:4,boss:den.boss},
    {id:'den-reward',x:0,z:311,rarity:'Legendary',weapon:'greatsword',gold:100,armor:7,boss:den.boss},
  ];
  const chestViews=chestModels(group,chests,save.opened);
  const cooldowns=new Map<WeaponId,number>();
  let attackWeapon=weapons.longsword, queued:{weapon:Weapon;delay:number;yaw:number}|undefined;
  let time=0, notification='', noticeUntil=0;
  const notify=(message:string)=>{
    notification=message; noticeUntil=time+notificationsSeconds; changed();
  };
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
  type Enemy = CreatureRig & {
    affinity:T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>;
    wolfRig:boolean; turn:number;
    posePhase:number; gait:number; anticipation:number; collapse:number; impactAge:number; retreat:number; strikes:number;

    id:string; kind:MonsterKind; spec:typeof monsters[MonsterKind]; home:T.Vector3; hp:number; hpBar:T.Group; fill:T.Mesh;
    statuses:ReturnType<typeof statuses>; visualTick:number; lastVisual:ReturnType<typeof statuses>['visual']; cooldown:number; windup:number; heading:number; phase:number; hitFlash:number; charge:number; chargeWindup:boolean; chargeHit:boolean; beam:T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>; loot:T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
  };
  const affinityGeometry=new T.RingGeometry(.53,.69,19).rotateX(-Math.PI/2);
  const affinities={
    burning:new T.MeshBasicMaterial({color:0xe4894f,transparent:true,opacity:.55,depthWrite:false}),
    frozen:new T.MeshBasicMaterial({color:0xa4e9f7,transparent:true,opacity:.7,depthWrite:false}),
    stunned:new T.MeshBasicMaterial({color:0x9ac5ff,transparent:true,opacity:.65,depthWrite:false}),
    slowed:new T.MeshBasicMaterial({color:0x679bcf,transparent:true,opacity:.44,depthWrite:false}),
  };
  const enemies:Enemy[]=[];
  const spawns=[
    ...territories.map((center,i)=>({center,id:'wolf-'+i,kind:'wild' as const})),
    ...packTerritories.map((center,i)=>({center,id:'wolf-pack-'+i,kind:'wild' as const})),
    ...direTerritories.map((center,i)=>({center,id:'dire-'+i,kind:'dire' as const})),
    ...[{x:111,z:-92},{x:107,z:-103},{x:169,z:-159}].map((center,i)=>({center,id:'skeleton-'+i,kind:'skeleton' as const})),
    ...[{x:-187,z:64},{x:-178,z:70},{x:-193,z:72}].map((center,i)=>({center,id:'goblin-'+i,kind:'goblin' as const})),
    {center:{x:205,z:-182},id:'elite-gravefang',kind:'elite' as const},
    ...den.encounters.map(entry=>({center:entry,id:entry.id,kind:entry.kind})),
  ];
  for(const {center,id,kind} of spawns){
    const spec=monsters[kind];
    const candidates=Array.from({length:30},()=>{
      const a=rand()*Math.PI*2,r=2+rand()*9;
      return {x:center.x+Math.cos(a)*r,z:center.z+Math.sin(a)*r};
    });
    const spot=id.startsWith('den-') ? (canWalk(center.x,center.z) ? center : undefined) : candidates.find(({x,z})=>!safe(x,z)&&canWalk(x,z)&&enemies.every(enemy=>Math.hypot(enemy.home.x-x,enemy.home.z-z)>4));
    if(!spot) continue;
    const actor=kind==='skeleton'?skeletons.make():kind==='goblin'?goblins.make():models.make(kind);
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
    enemies.push({...actor,id,kind,spec,home,affinity,wolfRig:kind!=='skeleton'&&kind!=='goblin',turn:0,posePhase:enemies.length*.92,gait:0,anticipation:0,collapse:1,
      impactAge:3,retreat:0,strikes:0,hp:(oldDefeats.has(id)||save.defeatedBosses.includes(id))?0:spec.health,hpBar,fill,
      statuses:statuses(spec.resistance),visualTick:0,lastVisual:null,cooldown:0,windup:0,heading:rand()*6.28,phase:rand()*10,hitFlash:0,charge:0,chargeWindup:false,chargeHit:false,loot,beam});
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
  const magic=abilityCombat(player.position,enemies.map(enemy=>({
    point:enemy.root.position,alive:()=>enemy.hp>0,get effects(){return enemy.statuses;},
    hit:(damage,element,heavy)=>hitEnemy(enemy,damage,element,heavy),
  })),canWalk,clearLine,fx);
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
  function hitEnemy(enemy:Enemy, amount:number,element:Weapon['ability']=null,heavy=false){
    if(enemy.hp<=0) return;
    const damage=Math.round(amount*10)/10;
    enemy.hp=Math.max(0,enemy.hp-damage);
    enemy.hitFlash=.22;
    impact(enemy.root.position,damage,element,heavy);
    if(enemy.hp) return;
    enemy.collapse=0;
    enemy.loot.position.copy(enemy.root.position);
    enemy.loot.visible=true;
    save.pending[enemy.id]={x:enemy.loot.position.x,z:enemy.loot.position.z};
    const guaranteed=/^wolf-[0-4]$/.test(enemy.id)&&!collected.has(enemy.id)?elementalIds[Number(enemy.id.slice(-1))]:undefined;
    save.drops[enemy.id]=rollDrop(enemy.kind,rand,lootBonus(save.stats),guaranteed&&!save.arsenal.includes(guaranteed)?guaranteed:undefined);
    enemy.loot.material.color.set(rarity[save.drops[enemy.id].rarity].color);
    if(enemy.spec.respawn&&!enemy.id.startsWith('den-')) save.returns[enemy.id]=Date.now()+enemy.spec.respawn*1000;
    oldDefeats.add(enemy.id);
    save.defeated=[...oldDefeats];
    save.kills++;
    const boss=enemy.kind==='guardian';
    if(boss) {
      if(!save.defeatedBosses.includes(enemy.id)) save.defeatedBosses.push(enemy.id);
      if(!save.completedDungeons.includes(den.id)) save.completedDungeons.push(den.id);
    }
    const reward=enemyXpReward(enemy.kind);
    earnXP(save,reward);
    notify((boss?den.name+' cleared':enemy.spec.name+' defeated')+' · +'+reward+' XP');

  }

  function hitPlayer(enemy:Enemy, blocking:boolean, charge=false){
    const guard=blocking&&inArc(player.position,enemy.root.position,player.rotation.y,3,1.25);
    const shieldBlock=guard&&weapons[save.equipped].model.shield;
    if(!charge&&(shieldBlock || (guard&&save.equipped==='longsword'))){
      impact(player.position);
      if(shieldBlock) splash();
      notify('Blocked');
      return;
    }
    const barrierActive=magic.shield.active;
    const damage=magic.shield.absorb(Math.max(.5,Math.round((guard ? Math.ceil(enemy.spec.damage*.46) : enemy.spec.damage*(charge?1.3:1))*(1-mitigation(save.stats,save.armor))*100)/100));
    if(barrierActive) splash();
    if(damage===0){notify('Water barrier absorbed the attack.');return;}
    save.health=Math.max(0,Math.round((save.health-damage)*100)/100);
    impact(player.position);
    if(!save.health){rangeTimer.cancel();queued=undefined;magic.reset();}
    notify(save.health?enemy.spec.name+' hit you.':'You fell in the Blackwater Wilds.');
  }

  function lootNearby(){
    return enemies.find(enemy=>enemy.loot.visible &&
      Math.hypot(player.position.x-enemy.loot.position.x,player.position.z-enemy.loot.position.z)<2.95 &&
      clearLine(player.position.x,player.position.z,enemy.loot.position.x,enemy.loot.position.z));
  }
  function grantWeapon(id:string,type:WeaponId,tier:Drop['rarity']){
    if(save.items.some(item=>item.id===id)) return;
    save.items.push({id,type,rarity:tier});
    if(!save.arsenal.includes(type)) save.arsenal.push(type);
  }
  function unopenedChest(){
    return chests.find(chest=>!save.opened.includes(chest.id)&&(!chest.boss||save.defeatedBosses.includes(chest.boss))&&(!chest.guardian||oldDefeats.has(chest.guardian))&&
      Math.hypot(player.position.x-chest.x,player.position.z-chest.z)<2.9 &&
      clearLine(player.position.x,player.position.z,chest.x,chest.z));
  }
  const atCamp=()=> Math.hypot(player.position.x+45,player.position.z)<4 ||
    Math.hypot(player.position.x-154,player.position.z-103)<4;
  return {
    feedback:notify,
    transition(){magic.reset();fx.clear();queued=undefined;rangeTimer.cancel();echoLife=shake=0;echo.visible=false;},
    get bossHealth(){
      const boss=enemies.find(enemy=>enemy.kind==='guardian');
      return boss&&boss.hp>0&&inDen(player.position.z)&&
        Math.hypot(player.position.x-boss.root.position.x,player.position.z-boss.root.position.z)<34
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
        player.position.set(spawn.x,surface(spawn.x,spawn.z),spawn.z);
        player.rotation.y=0;
        save.health=maxHealth();
        notify('Returned to Ember Clearing.');
        return;
      }
      const loot=lootNearby();
      if(loot){
        loot.loot.visible=false;
        collected.add(loot.id);
        save.collected=[...collected];
        delete save.pending[loot.id];
        const drop=save.drops[loot.id]??{gold:wolfLoot.gold,material:loot.spec.material,rarity:'Common',
          weapon:elementalIds[Number(loot.id.split('-')[1])],potion:0};
        delete save.drops[loot.id];
        save.gold+=drop.gold;
        if(loot.kind==='wild') save.fangs+=wolfLoot.count;
        save.materials[drop.material]=(save.materials[drop.material]??0)+1;
        save.potions+=drop.potion??0;
        if(drop.weapon) grantWeapon(loot.id+'-'+(save.returns[loot.id]??0),drop.weapon,drop.rarity);
        notify('Collected '+drop.material+' · '+drop.gold+' gold'+
          (drop.weapon?' · '+drop.rarity+' '+weapons[drop.weapon].name:''));
      } else {
        const chest=unopenedChest();
        if(chest){
          save.opened.push(chest.id);
          save.gold+=chest.gold;
          save.armor=Math.max(save.armor,chest.armor);
          const bonus=chestBonus(chest,save.seed);
          save.potions+=bonus.potions;
          save.materials[bonus.material]=(save.materials[bonus.material]??0)+bonus.count;
          fx.treasure(chest,Number.parseInt(rarity[chest.rarity].color.slice(1),16),rarityOrder.indexOf(chest.rarity));
          grantWeapon('chest-'+chest.id,chest.weapon,chest.rarity);
          notify('Opened '+chest.rarity+' Chest · '+weapons[chest.weapon].name+' · Armor '+save.armor+' · '+bonus.material+' × '+bonus.count);
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
        chest?'E · Open '+chest.rarity+' Chest':
        atCamp()&&save.health<maxHealth()?'E · Rest at campfire':'';
      return {notification,prompt};
    },
    update(dt:number,blocking:boolean){
      time+=dt;
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
      waterTime-=dt;
      if(magic.shield.active&&waterTime<=0){
        waterTime=.16;
        const a=time*4.8, droplet={x:player.position.x+Math.sin(a)*1.52,z:player.position.z+Math.cos(a)*1.52};
        fx.emit(droplet,0x8ceafa,'spark',.24,.36,{y:1.15,lift:1.15,aspect:1.65});
        fx.emit(player.position,0x438cf3,'ring',1.36,.32,{y:.11,grow:.82,opacity:.34});
      }


      for(const enemy of enemies){
        const root=enemy.root, p=root.position;
        const {spec}=enemy;
        enemy.impactAge+=dt;
        enemy.retreat=Math.max(0,enemy.retreat-dt);
        const returnAt=save.returns[enemy.id];
        if(!enemy.hp&&!enemy.loot.visible&&returnAt&&Date.now()>=returnAt&&
          Math.hypot(player.position.x-enemy.home.x,player.position.z-enemy.home.z)>18){
          enemy.hp=spec.health;enemy.statuses=statuses(spec.resistance);enemy.cooldown=enemy.windup=0;
          p.copy(enemy.home);enemy.collapse=1;enemy.gait=0;enemy.anticipation=0;oldDefeats.delete(enemy.id);collected.delete(enemy.id);
          save.defeated=[...oldDefeats];save.collected=[...collected];delete save.returns[enemy.id];changed();
        }
        if(enemy.hp>0) enemy.statuses.update(dt,amount=>hitEnemy(enemy,amount),(dx,dz)=>{
          if(canWalk(p.x+dx,p.z)) p.x+=dx;
          if(canWalk(p.x,p.z+dz)) p.z+=dz;
        });
        const gap=Math.hypot(player.position.x-p.x,player.position.z-p.z);
        const active=gap<nearDistance&&enemy.hp>0;
        const dying=!enemy.hp&&enemy.collapse<1&&gap<nearDistance;
        root.visible=active||dying;
        enemy.hpBar.visible=active&&gap<23&&(['guardian','elite'].includes(enemy.kind)||enemy.hp<spec.health||enemy.windup>0);
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
        enemy.affinity.visible=active&&!!status;
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
        enemy.cooldown=Math.max(0,enemy.cooldown-dt);
        enemy.hitFlash=Math.max(0,enemy.hitFlash-dt);
        let gait=0;
        const previousX=p.x, previousZ=p.z;
        if(enemy.statuses.halted){
          enemy.windup=0; enemy.charge=0; enemy.chargeWindup=false;
        } else if(enemy.charge>0){
          enemy.charge=Math.max(0,enemy.charge-dt);
          const x=p.x+Math.sin(enemy.heading)*dt*16,z=p.z+Math.cos(enemy.heading)*dt*16;
          if(canWalk(x,z)&&spaceAround(enemy,x,z)){p.x=x;p.z=z;gait=1;}
          else enemy.charge=0;
          if(!enemy.chargeHit&&Math.hypot(p.x-player.position.x,p.z-player.position.z)<2.1){
            enemy.chargeHit=true;
            hitPlayer(enemy,blocking,true);
          }
          if(!enemy.charge) enemy.cooldown=enemy.kind==='guardian'?1.8:1.45;
        } else if(enemy.windup>0){
          enemy.windup=Math.max(0,enemy.windup-dt);
          if(!enemy.windup){
            enemy.cooldown=spec.recovery;
            enemy.impactAge=0;
            if(enemy.kind==='goblin'&&++enemy.strikes%2===0) enemy.retreat=.72;
            if(enemy.chargeWindup){
              enemy.chargeWindup=false;
              enemy.charge=enemy.kind==='guardian'?.65:.43;enemy.chargeHit=false;
            } else if(aggro && gap<spec.reach+.35 && Math.abs(player.position.y-p.y)<1.9 &&
              clearLine(p.x,p.z,player.position.x,player.position.z)) hitPlayer(enemy,blocking);
          }
        } else if(['guardian','dire','elite'].includes(enemy.kind)&&aggro&&gap>4&&gap<(enemy.kind==='guardian'?15:9)&&enemy.cooldown===0&&
          clearLine(p.x,p.z,player.position.x,player.position.z)){
          enemy.heading=Math.atan2(player.position.x-p.x,player.position.z-p.z);
          enemy.windup=enemy.kind==='guardian'?1.15:.89;enemy.chargeWindup=true;
          const aim={x:Math.sin(enemy.heading),z:Math.cos(enemy.heading)};
          for(let i=1;i<=(enemy.kind==='guardian'?10:7);i++){
            const point={x:p.x+aim.x*i,z:p.z+aim.z*i};
            if(!canWalk(point.x,point.z)) break;
            fx.emit(point,0xe69c51,'ring',1.15,enemy.windup,{opacity:.55});
          }
        } else if(aggro&&!enemy.retreat&&gap<spec.reach&&enemy.cooldown===0&&clearLine(p.x,p.z,player.position.x,player.position.z)){
          enemy.windup=spec.windup;
        } else if(!aggro||gap>spec.reach-.18||enemy.retreat){
          const goal = enemy.retreat && aggro ? {
            x:p.x+(p.x-player.position.x)*3,z:p.z+(p.z-player.position.z)*3,
          } : aggro ? packGoal(enemy,gap) : homeGap>8 ? enemy.home : {
            x:enemy.home.x+Math.sin(time*.31+enemy.phase)*5,
            z:enemy.home.z+Math.cos(time*.26+enemy.phase)*5,
          };
          const dx=goal.x-p.x,dz=goal.z-p.z,remaining=Math.hypot(dx,dz);
          if(remaining>.35){
            const step=Math.min(remaining,(aggro?spec.speed:1.65)*dt*enemy.statuses.speed);
            const tryStep=(factor:number)=>{
              const angle=Math.atan2(dx,dz)+factor;
              const x=p.x+Math.sin(angle)*step,z=p.z+Math.cos(angle)*step;
              if(!canWalk(x,z)||!spaceAround(enemy,x,z)||safe(x,z)||Math.hypot(x-player.position.x,z-player.position.z)<.9) return false;
              p.x=x;p.z=z;enemy.heading=angle;gait=aggro?(gap>8?1:.71):.40;
              return true;
            };
            tryStep(0)||tryStep(.87)||tryStep(-.87);
          }
        }
        if(enemy.windup>0&&!enemy.chargeWindup) enemy.heading=Math.atan2(player.position.x-p.x,player.position.z-p.z);
        const angle=enemy.heading-root.rotation.y;
        const facing=Math.atan2(Math.sin(angle),Math.cos(angle));
        root.rotation.y+=facing*(1-Math.exp(-10*dt));
        enemy.turn=T.MathUtils.damp(enemy.turn,T.MathUtils.clamp(facing*1.7,-1,1),9,dt);
        p.y=surface(p.x,p.z);
        const travelled=Math.hypot(p.x-previousX,p.z-previousZ);
        const speed=travelled/Math.max(.001,dt);
        const stride=enemy.wolfRig?Math.min(1,speed/Math.max(3.8,spec.speed)):gait;
        enemy.gait=T.MathUtils.damp(enemy.gait,stride,11,dt);
        if(!enemy.statuses.halted){
          enemy.posePhase+=enemy.wolfRig
            ? travelled*Math.PI*2/((.52+enemy.gait*1.60)*spec.scale)
            : dt*(3.1+enemy.gait*9.4);
        }
        const leapDuration=enemy.kind==='guardian'?.65:.43;
        const currentWindup=enemy.chargeWindup?(enemy.kind==='guardian'?1.15:.89):spec.windup;
        enemy.anticipation=T.MathUtils.damp(enemy.anticipation,
          enemy.windup>0?Math.min(1,(1-enemy.windup/currentWindup)*1.5+.22):0,enemy.windup>0?12:20,dt);
        enemy.animate({time,phase:enemy.posePhase,gait:enemy.gait,
          windup:enemy.anticipation,
          recovery:Math.max(0,1-enemy.impactAge/.33),hit:enemy.hitFlash/.22,
          leap:enemy.charge>0&&enemy.kind!=='guardian'?Math.sin(Math.PI*enemy.charge/leapDuration):0,
          dead:0,frozen:status==='frozen',turn:enemy.turn,alert:aggro?1:0,distance:gap});

      }
    },
    render(dt:number){
      chestViews.update(dt,save.defeatedBosses,save.opened,save.defeated);
      fx.update(dt);
      fx.barrier(player.position,magic.shield.active);
      echoLife=Math.max(0,echoLife-dt);
      echo.visible=echoLife>0;
      echoMaterial.opacity=echoLife*.98;
      for(const enemy of enemies){
        enemy.hpBar.position.copy(enemy.root.position);
        enemy.hpBar.position.y+=2.23*enemy.spec.scale;
        enemy.hpBar.quaternion.copy(camera.quaternion);
        enemy.fill.material=enemy.windup>0?alert:red;
        enemy.fill.scale.x=enemy.hp/enemy.spec.health;
        enemy.fill.position.x=(enemy.fill.scale.x-1)*.6;
        enemy.beam.visible=enemy.loot.visible&&
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
      models.dispose();skeletons.dispose();goblins.dispose();
      affinityGeometry.dispose();Object.values(affinities).forEach(material=>material.dispose());
      for(const resource of [barGeometry,backing,red,alert,lootGeometry,drawstring,lootFang,lootCoin,bagTie,boneLoot,metalLoot,lootBeamGeometry,lootMaterial,sparkGeometry,sparks.material,echoMaterial]) resource.dispose();
      fx.dispose();
      chestViews.dispose();
      for(const enemy of enemies){enemy.loot.material.dispose();enemy.beam.material.dispose();}
      for(const texture of numberTextures.values()) texture.dispose();
      for(const {sprite} of numbers) sprite.material.dispose();
    },
  };
}
