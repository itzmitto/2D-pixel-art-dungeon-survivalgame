import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { allocate, earnXP, maxHunterHealth, rank, xpNeeded } from '../src/wilderness/progression.ts';
import { den, denWalkable, inDen } from '../src/wilderness/denLayout.ts';
import { createEncounters } from '../src/wilderness/encounters.ts';
import { newExploration, readExploration } from '../src/wilderness/exploration.ts';
import { walkable } from '../src/wilderness/layout.ts';

test('hunter rank boundaries, multiple level-ups, spending and migration',()=>{
  const save=newExploration();
  assert.deepEqual([1,9,10,24,25,49,50,74,75,99,100,149,150,199,200].map(rank),
    ['E','E','D','D','C','C','B','B','A','A','S','S','SS','SS','SSS']);
  earnXP(save,xpNeeded(1)+xpNeeded(2)+xpNeeded(3)+1);
  assert.equal(save.level,4);
  assert.equal(save.statPoints,9);
  assert.equal(maxHunterHealth(save),25);
  assert.equal(allocate(save,'vitality'),true);
  assert.equal(save.health,28);
  for(let i=0;i<8;i++) assert.equal(allocate(save,'agility'),true);
  assert.equal(allocate(save,'strength'),false);
  assert.deepEqual(readExploration(JSON.stringify(save)),save);
  const legacy={...save,level:10,health:10};
  delete legacy.stats;delete legacy.statPoints;delete legacy.items;
  const migrated=readExploration(JSON.stringify(legacy));
  assert.equal(migrated.statPoints,27);
  assert.equal(migrated.items[0].id,'longsword');
});

test('the den has a connected route and guardian rewards survive reload exactly once',()=>{
  for(let z=den.entry.z;z>=311;z-=.25) assert.equal(denWalkable(0,z),true);
  assert.equal(denWalkable(11,362),false);
  const oldDocument=globalThis.document;
  globalThis.document={createElement:()=>({getContext:()=>null})};
  const scene=new T.Scene(),hero=new T.Group(),camera=new T.PerspectiveCamera();
  const save=newExploration();
  save.stats.strength=100;
  save.level=40;
  save.health=maxHunterHealth(save);
  const canWalk=(x,z)=>inDen(z)?denWalkable(x,z):walkable(x,z,[]);
  const encounter=createEncounters(scene,camera,hero,save,canWalk,()=>{});
  try {
    const guardian=scene.getObjectByName(den.boss);
    assert.ok(guardian);
    hero.position.set(0,0,312);
    encounter.interact();
    assert.ok(!save.opened.includes('den-reward'));
    for(let attempts=0;attempts<15&&!save.defeatedBosses.length;attempts++){
      for(let frame=0;frame<51;frame++){
        hero.position.set(guardian.position.x,0,guardian.position.z-2.45);
        hero.rotation.y=0;
        if(!frame) encounter.attack(()=>true);
        encounter.update(1/60,true);
      }
    }
    assert.deepEqual(save.defeatedBosses,[den.boss]);
    assert.deepEqual(save.completedDungeons,[den.id]);
    assert.equal(save.kills,1);
    hero.position.set(0,0,311);
    encounter.interact();
    encounter.interact();
    assert.ok(save.opened.includes('den-reward'));
    const gold=save.gold;
    save.position={x:0,z:311,yaw:0};
    const restored=readExploration(JSON.stringify(save));
    assert.equal(restored.position.z,311);
    assert.ok(restored.items.some(item=>item.id==='chest-den-reward'&&item.rarity==='Legendary'));
    const resumed=createEncounters(new T.Scene(),camera,hero,restored,canWalk,()=>{});
    try {
      resumed.update(0,false);
      assert.equal(resumed.bossHealth,0);
      resumed.interact();
      assert.equal(restored.gold,gold);
      assert.equal(restored.items.filter(item=>item.id==='chest-den-reward').length,1);
    } finally {resumed.dispose();}
  } finally {
    encounter.dispose();
    if(oldDocument===undefined) delete globalThis.document;
    else globalThis.document=oldDocument;
  }
});
