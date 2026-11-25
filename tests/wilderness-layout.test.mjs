import test from 'node:test';
import assert from 'node:assert/strict';
import { bank, bridges, extent, landmarks, path, river, spawn, surface, walkable } from '../src/wilderness/layout.ts';

test('wilderness route crosses only by the bridge and landmarks fit inside the map', () => {
  assert.equal(walkable(spawn.x, spawn.z, []), true);
  assert.equal(path(river(0)), 0);
  for (const bridge of bridges) {
    for (let dx = -15; dx <= 15; dx += .25) assert.equal(walkable(bridge.x+dx,bridge.z,[]),true);
    assert.ok(bank(bridge.x,bridge.z)<1);
  }
  for (let x = 18; x <= 46; x += .25) assert.equal(walkable(x, 0, []), true);
  assert.equal(walkable(river(12), 12, []), false);
  assert.equal(walkable(river(0), 2.45, []), false);
  assert.equal(walkable(extent, 0, []), false);
  assert.equal(walkable(spawn.x, spawn.z, [{...spawn, r: 1}]), false);
  assert.ok(surface(river(0), 0) > surface(river(12), 12));
  for (const point of landmarks) {
    assert.ok(Math.abs(point.x) < extent && Math.abs(point.z) < extent);
    if (point.kind !== 'bridge') assert.ok(bank(point.x, point.z) > 8);
  }
});

test('exploration reveals nearby cells and round-trips without revealing distant caves', async () => {
  const {cellAt,newExploration,readExploration,reveal}=await import('../src/wilderness/exploration.ts');
  const progress=newExploration(), seen=new Set();
  reveal(seen,progress.position);
  assert.ok(seen.has(cellAt(spawn.x,spawn.z)));
  const cave=landmarks.find(location=>location.kind==='cave');
  assert.equal(seen.has(cellAt(cave.x,cave.z)),false);
  progress.discovered=[...seen];
  assert.deepEqual(readExploration(JSON.stringify(progress)),progress);
  assert.equal(readExploration('{"version":2}'),null);
});
