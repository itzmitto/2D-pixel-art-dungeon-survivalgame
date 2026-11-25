import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import legacyUi from './legacy-ui.html?raw';
import './styles/tokens.css';
import './styles/base.css';
import styles from './styles/App.module.css';
import './styles/game.css';
import './styles/inventory.css';

const scripts = [
  '/js/world/regions.js', '/js/world/towers.js', '/js/entities/encounters.js',
  '/js/world/camera.js', '/js/world/collision.js', '/js/world.js',
  '/js/entities/party.js', '/js/movement.js', '/js/sprites.js',
  '/js/world/terrain.js', '/js/render.js', '/js/inventory.js',
  '/js/combat.js', '/js/entities/wolf.js', '/js/boss.js', '/js/save.js',
  '/js/ui/hud.js', '/js/input.js', '/main.js',
];

function GameCanvas() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    const loadAt = (index: number) => {
      if (disposed || index >= scripts.length) return;
      const script = document.createElement('script');
      script.src = scripts[index];
      script.async = false;
      script.onload = () => loadAt(index + 1);
      script.onerror = () => console.error(`Unable to load game system: ${scripts[index]}`);
      document.body.append(script);
    };
    loadAt(0);
    return () => {
      disposed = true;
      // The legacy loop has no teardown hook yet. Reloading the view is the only current reset.
    };
  }, []);
  return <div ref={host} className="legacy-game-root" dangerouslySetInnerHTML={{ __html: legacyUi }} />;
}

function SaveTools() {
  const importRef = useRef<HTMLInputElement>(null);
  const exportSave = () => {
    try {
      const save = localStorage.getItem('vonkje-survival-v1');
      if (!save) { window.alert('No browser save was found.'); return; }
      const url = URL.createObjectURL(new Blob([save], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'vonkje-save.json'; anchor.click(); URL.revokeObjectURL(url);
    } catch { window.alert('This page cannot access the old save. Open the previous file version and export its save first.'); }
  };
  const importSave = async (file?: File) => {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== 'object' || !('version' in parsed)) throw new Error('Invalid save');
      localStorage.setItem('vonkje-survival-v1', JSON.stringify(parsed));
      window.alert('Save imported. Reload the game to apply it.');
    } catch { window.alert('That save file is invalid. Your current save was not changed.'); }
  };
  return <div className={styles.saveTools}><button onClick={exportSave}>Export save</button><button onClick={() => importRef.current?.click()}>Import save</button><input ref={importRef} type="file" accept="application/json,.json" hidden onChange={e => void importSave(e.target.files?.[0])} /></div>;
}

function App() {
  return <><GameCanvas /><SaveTools /></>;
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing React root');
createRoot(root).render(<App />);
