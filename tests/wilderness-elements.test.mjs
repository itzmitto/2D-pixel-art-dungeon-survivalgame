import test from 'node:test';
import assert from 'node:assert/strict';
import { weapons, elementalIds } from '../src/wilderness/weapons.ts';
import { statuses } from '../src/wilderness/statusEffects.ts';
import { abilityCombat } from '../src/wilderness/abilities.ts';
import { weaponModel } from '../src/wilderness/weaponModels.ts';
import { readExploration, newExploration } from '../src/wilderness/exploration.ts';

const fx={emit(){},scatter(){},lightning(){}};
const clear=()=>true;
const dummy=(z,x=0)=>{
  let damage=0;
  return {point:{x,z},alive:()=>true,effects:statuses(),hit(amount){damage+=amount;},get damage(){return damage;}};
};

test('elemental shapes are distinct and lightweight',()=>{
  for(const id of elementalIds){
    const {right,left}=weaponModel(id);
    let triangles=0;
    for(const group of [right,left]) group.traverse(object=>{
      if(!object.isMesh) return;
      triangles+=(object.geometry.index?.count??object.geometry.attributes.position.count)/3;
      object.geometry.dispose();
      object.material.dispose();
    });
    assert.ok(triangles>0&&triangles<1000,id+' triangles: '+triangles);
    assert.equal(left.children.length>0,id==='shield');
  }
});

test('fire hits once and burns on fixed ticks, lightning caps its chain, and ice freezes',()=>{
  const victim=dummy(4);
  const fire=abilityCombat({x:0,z:0},[victim],clear,clear,fx);
  fire.cast(weapons.greatsword,0);
  for(let i=0;i<60;i++) fire.update(1/60);
  assert.ok(victim.damage>0);
  const direct=victim.damage;
  victim.effects.update(2.5,victim.hit,()=>{});
  assert.equal(victim.damage-direct,3);

  const targets=[dummy(1),dummy(2),dummy(3),dummy(4)];
  const lightning=abilityCombat({x:0,z:0},targets,clear,clear,fx);
  lightning.cast(weapons.axe,0);
  assert.equal(targets.filter(t=>t.damage>0).length,3);
  assert.equal(targets[0].effects.halted,true);

  const ice=abilityCombat({x:0,z:0},targets,clear,clear,fx);
  ice.cast(weapons.staff,0);
  ice.update(1/60);
  assert.equal(targets[3].effects.halted,true);
  targets[3].effects.update(2,()=>{},()=>{});
  assert.equal(targets[3].effects.halted,false);
  assert.ok(targets[3].effects.speed<1);
});

test('shield absorbs a finite budget and both dash and projectile stop at obstacles',()=>{
  const hero={x:0,z:0};
  const target=dummy(5);
  const magic=abilityCombat(hero,[target],(_x,z)=>z<2,clear,fx);
  magic.cast(weapons.shield,0);
  assert.equal(magic.shield.absorb(4),0);
  assert.equal(magic.shield.absorb(3),1);
  magic.bolt(weapons.staff,0);
  magic.cast(weapons.katana,0);
  for(let i=0;i<60;i++) magic.update(1/60);
  assert.ok(hero.z>1&&hero.z<2);
  assert.equal(target.damage,0);
});

test('old saves gain only the starter and equipment is validated against owned weapons',()=>{
  const legacy=newExploration();
  delete legacy.arsenal;
  delete legacy.equipped;
  delete legacy.hotbar;
  assert.deepEqual(readExploration(JSON.stringify(legacy)).arsenal,['longsword']);
  const restored=readExploration(JSON.stringify({...legacy,arsenal:['staff'],equipped:'axe',hotbar:['axe','staff']}));
  assert.equal(restored.equipped,'longsword');
  assert.deepEqual(restored.hotbar,[null,'staff',null,null,null]);
});
