import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createSnapshotStore, runtimeServices } from '../src/game/core/bridge.ts';

test('snapshot publication is stable, detached from mutations and unsubscribes', () => {
  const store = createSnapshotStore();
  const view = { progress: { bag: [{ item: 'wood', count: 2 }] }, hearts: 3 };
  let updates = 0;
  const off = store.subscribe(() => updates++);
  store.publish(view);
  const first = store.getSnapshot();
  store.publish(view);
  assert.equal(store.getSnapshot(), first);
  view.progress.bag[0].count++;
  assert.equal(first.progress.bag[0].count, 2);
  store.publish(view);
  assert.equal(updates, 2);
  off();
  store.publish({ ...view, hearts: 2 });
  assert.equal(updates, 2);
});

test('archived classic runtime starts with typed services and publishes inventory and HUD changes', () => {
  const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const paths = [...source('src/components/game/GameCanvas.tsx').matchAll(/'(\/legacy-runtime[^']+)'/g)];
  const window = new EventTarget();
  const canvas = Object.assign(new EventTarget(), { width: 2880, height: 1920,
    closest: () => null, getContext: () => ({ setTransform() {} }) });
  const memory = new Map();
  const context = vm.createContext({
    window, Event, AbortController, Image: class {},
    document: Object.assign(new EventTarget(), { querySelector: () => null }),
    localStorage: { getItem: k => memory.get(k) ?? null, setItem: (k,v) => memory.set(k,v) },
  });
  for (const [, path] of paths) vm.runInContext(source('recovery/2d/public' + path), context, { filename: path });
  let tick, starts = 0, stops = 0, running = false;
  const services = { ...runtimeServices, createLoop(update) {
    tick = update;
    return { start() { starts++; running = true; }, stop() { stops++; running = false; }, isRunning: () => running };
  } };
  const engine = window.vonkje;
  engine.start(canvas, services);
  engine.start(canvas, services);
  assert.equal(starts, 1);
  const first = engine.getSnapshot();
  assert.equal(first.hearts, 3);
  assert.equal(first.defense, 0);
  assert.equal(first.progress.bag[0].item, 'sword');
  let updates = 0;
  engine.subscribe(() => updates++);
  tick(0);
  assert.equal(engine.getSnapshot(), first);
  engine.toggleInventory();
  engine.selectHotbar(2);
  engine.clickSlot({ area: 'bag', index: 0 });
  engine.clickSlot({ area: 'equipment', index: 'left' });
  tick(0);
  assert.equal(engine.getSnapshot().progress.panelMode, 'bag');
  assert.equal(engine.getSnapshot().progress.selectedHotbar, 2);
  assert.equal(engine.getSnapshot().progress.hands.left, 'sword');
  assert.equal(updates, 1);
  engine.stop();
  engine.stop();
  assert.equal(stops, 1);
  const key = new Event('keydown', { cancelable: true });
  Object.defineProperty(key, 'key', { value: 'Tab' });
  window.dispatchEvent(key);
  assert.equal(key.defaultPrevented, false);
  engine.start(canvas, services);
  const reopened = new Event('keydown', { cancelable: true });
  Object.defineProperty(reopened, 'key', { value: 'Tab' });
  window.dispatchEvent(reopened);
  tick(0);
  assert.equal(reopened.defaultPrevented, true);
  assert.equal(engine.getSnapshot().progress.panelMode, 'bag');
  engine.stop();
});
