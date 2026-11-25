import test from 'node:test';
import assert from 'node:assert/strict';
import { bank, extent, landmarks, path, river, spawn, surface, walkable } from '../src/wilderness/layout.ts';

test('wilderness route crosses only by the bridge and landmarks fit inside the map', () => {
  assert.equal(walkable(spawn.x, spawn.z, []), true);
  assert.equal(path(river(0)), 0);
  for (let x = 18; x <= 46; x += .25) assert.equal(walkable(x, 0, []), true);
  assert.equal(walkable(river(12), 12, []), false);
  assert.equal(walkable(river(0), 2.45, []), false);
  assert.equal(walkable(extent, 0, []), false);
  assert.equal(walkable(spawn.x, spawn.z, [{...spawn, r: 1}]), false);
  assert.ok(surface(river(0), 0) > surface(river(12), 12));
  for (const point of landmarks) {
    assert.ok(Math.abs(point.x) < extent && Math.abs(point.z) < extent);
    if (point.z !== 0) assert.ok(bank(point.x, point.z) > 8);
  }
});
