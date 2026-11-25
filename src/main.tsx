import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import legacyUi from './legacy-ui.html?raw';
import './styles/tokens.css';
import './styles/base.css';
import styles from './styles/App.module.css';
import { exportSaveText, parseSaveFile } from './storage/saveTransfer';
import './styles/game.css';
import './styles/inventory.css';

const scripts = [
  '/legacy-runtime/js/world/regions.js', '/legacy-runtime/js/world/towers.js', '/legacy-runtime/js/entities/encounters.js',
  '/legacy-runtime/js/world/camera.js', '/legacy-runtime/js/world/collision.js', '/legacy-runtime/js/world.js',
  '/legacy-runtime/js/entities/party.js', '/legacy-runtime/js/movement.js', '/legacy-runtime/js/sprites.js',
  '/legacy-runtime/js/world/terrain.js', '/legacy-runtime/js/render.js', '/legacy-runtime/js/inventory.js',
  '/legacy-runtime/js/combat.js', '/legacy-runtime/js/entities/wolf.js', '/legacy-runtime/js/boss.js', '/legacy-runtime/js/save.js',
  '/legacy-runtime/js/ui/hud.js', '/legacy-runtime/js/input.js', '/legacy-runtime/main.js',
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
      window.vonkjeStop?.();
    };
  }, []);
  return <div ref={host} className="legacy-game-root" dangerouslySetInnerHTML={{ __html: legacyUi }} />;
}

function SaveTools() {
  const importRef = useRef<HTMLInputElement>(null);
  const exportSave = () => {
    try {
      const save = exportSaveText(localStorage, 'vonkje-survival-v1');
      const url = URL.createObjectURL(new Blob([save], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'vonkje-save.json'; anchor.click(); URL.revokeObjectURL(url);
    } catch { window.alert('This page cannot access the old save. Open the previous file version and export its save first.'); }
  };
  const importSave = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = parseSaveFile(await file.text());
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
