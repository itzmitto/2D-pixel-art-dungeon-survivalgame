import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createEncounters } from '../src/wilderness/encounters.ts';
import { newExploration, readExploration } from '../src/wilderness/exploration.ts';
import { inArc, swingTimer } from '../src/wilderness/combatRules.ts';

test('the longsword only strikes once at its impact frame and checks range and facing', () => {
  const swing = swingTimer();
  assert.equal(swing.start(), true);
  assert.equal(swing.advance(.24), false);
  assert.equal(swing.advance(.11), true);
  assert.equal(swing.advance(.2), false);
  assert.equal(swing.start(), false);
  assert.equal(inArc({x:0,z:0},{x:0,z:2},0,2.9,1),true);
  assert.equal(inArc({x:0,z:0},{x:0,z:-2},0,2.9,1),false);
  assert.equal(inArc({x:0,z:0},{x:0,z:3},0,2.9,1),false);
});

test('live wolf encounter grants XP and collectible loot once and keeps both after reload', () => {
  const prior = globalThis.document;
  globalThis.document = { createElement: () => ({ getContext: () => null }) };
  const scene = new T.Scene(), camera = new T.PerspectiveCamera(), hero = new T.Group();
  const save = newExploration();
  const encounter = createEncounters(scene,camera,hero,save,()=>true,()=>{});
  try {
    const actor = scene.getObjectByName('wolf-0');
    const aim = () => {
      hero.position.set(actor.position.x,actor.position.y,actor.position.z-2.65);
      hero.rotation.y=0;
    };
    for (let strike=0;strike<2;strike++) {
      aim();
      encounter.attack(()=>true);
      for (let frame=0;frame<48;frame++) {
        aim();
        encounter.update(1/60,true);
      }
    }
    assert.ok(save.defeated.includes('wolf-0'));
    assert.equal(save.xp,20);
    assert.equal(save.health,10);
    assert.equal(encounter.ui().prompt,'E · Collect wolf loot');
    encounter.interact();
    encounter.interact();
    assert.equal(save.gold,4);
    assert.equal(save.fangs,1);
    const restored=readExploration(JSON.stringify(save));
    const resumed=createEncounters(scene,camera,hero,restored,()=>true,()=>{});
    try {
      resumed.interact();
      assert.equal(restored.gold,4);
      assert.equal(restored.fangs,1);
    } finally { resumed.dispose(); }
  } finally {
    encounter.dispose();
    if (prior===undefined) delete globalThis.document;
    else globalThis.document=prior;
  }
});
