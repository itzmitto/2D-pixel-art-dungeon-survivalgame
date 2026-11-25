import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';

const Wilderness = lazy(() => import('./wilderness/Wilderness'));
const root = document.getElementById('root');
if (!root) throw new Error('Missing React root');
createRoot(root).render(<StrictMode>
  <Suspense fallback={<p>Loading the wilderness…</p>}><Wilderness /></Suspense>
</StrictMode>);
