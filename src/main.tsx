import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { GameCanvas } from './components/game/GameCanvas';
import './styles/tokens.css';
import './styles/base.css';
import './styles/game.css';
import './styles/inventory.css';
import './styles/mode.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing React root');
const Wilderness = lazy(() => import('./wilderness/Wilderness'));
const isWilderness = new URLSearchParams(window.location.search).get('mode') === '3d';
createRoot(root).render(<StrictMode>{isWilderness
  ? <Suspense fallback={<p>Loading the wilderness…</p>}><Wilderness /></Suspense>
  : <><GameCanvas /><a className="mode-link" href="?mode=3d">3D wilderness</a></>}
</StrictMode>);
