import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GameCanvas } from './components/game/GameCanvas';
import './styles/tokens.css';
import './styles/base.css';
import './styles/game.css';
import './styles/inventory.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing React root');
createRoot(root).render(<StrictMode><GameCanvas /></StrictMode>);
