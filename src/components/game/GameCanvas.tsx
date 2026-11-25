import { useEffect, useRef, useState } from 'react';
import { useGameSnapshot } from '../../hooks/useGameSnapshot';
import { HUD } from '../hud/HUD';
import { InteractionPrompt } from '../hud/InteractionPrompt';
import { LootNotifications } from '../hud/LootNotifications';
import { Hotbar } from '../inventory/Hotbar';
import { Inventory } from '../inventory/Inventory';
import { SaveTransfer } from '../menus/SaveTransfer';

const RUNTIME_SCRIPTS = [
  '/legacy-runtime/js/world/regions.js', '/legacy-runtime/js/world/towers.js', '/legacy-runtime/js/entities/encounters.js',
  '/legacy-runtime/js/world/camera.js', '/legacy-runtime/js/world/collision.js', '/legacy-runtime/js/world.js',
  '/legacy-runtime/js/entities/party.js', '/legacy-runtime/js/movement.js', '/legacy-runtime/js/sprites.js',
  '/legacy-runtime/js/world/terrain.js', '/legacy-runtime/js/render.js', '/legacy-runtime/js/inventory.js',
  '/legacy-runtime/js/combat.js', '/legacy-runtime/js/entities/wolf.js', '/legacy-runtime/js/boss.js', '/legacy-runtime/js/save.js',
  '/legacy-runtime/js/ui/hud.js', '/legacy-runtime/js/input.js', '/legacy-runtime/main.js',
];
let runtimeLoad: Promise<void> | undefined;

function loadRuntime(): Promise<void> {
  if (runtimeLoad) return runtimeLoad;
  runtimeLoad = RUNTIME_SCRIPTS.reduce<Promise<void>>((previous, src) => previous.then(() => new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-vonkje-src="${src}"]`);
    if (existing?.dataset.loaded === 'true') { resolve(); return; }
    const script = existing ?? document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.vonkjeSrc = src;
    script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
    script.onerror = () => reject(new Error(`Unable to load game system ${src}`));
    if (!existing) document.head.append(script);
  })), Promise.resolve());
  return runtimeLoad;
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadError, setLoadError] = useState('');
  const snapshot = useGameSnapshot();
  useEffect(() => {
    let mounted = true;
    void loadRuntime().then(() => {
      if (mounted) window.vonkje?.start(canvasRef.current);
    }).catch((error: unknown) => {
      if (mounted) setLoadError(error instanceof Error ? error.message : 'The game could not start.');
    });
    return () => {
      mounted = false;
      window.vonkje?.stop();
    };
  }, []);

  return <main id="game" className="game" data-area={snapshot.region} aria-label="Vonkje playfield">
    <div className="stage">
      <div className="room">
        <canvas ref={canvasRef} id="dungeon" width={2880} height={1920} aria-label="Pixel world with the knight and Vonkje" />
      </div>
      <InteractionPrompt hint={snapshot.action?.hint ?? null} />
      <LootNotifications message={snapshot.feedback} />
      {snapshot.phase !== 'playing' && <section className="ending" aria-live="polite">
        <strong>{snapshot.result}</strong>
        <button type="button" onClick={() => window.vonkje?.reset()}>Return to field camp</button>
      </section>}
    </div>
    <HUD snapshot={snapshot} />
    <button id="fullscreen-toggle" className="fullscreen-toggle" type="button" aria-pressed={snapshot.fullscreen}
      onClick={() => window.vonkje?.toggleFullscreen()}>{snapshot.fullscreen ? 'Exit full screen' : 'Full screen'}</button>
    <Hotbar />
    <Inventory />
    <SaveTransfer />
    {loadError && <p className="runtime-error" role="alert">{loadError}</p>}
  </main>;
}
