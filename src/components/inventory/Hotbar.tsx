import { useGameSnapshot } from '../../hooks/useGameSnapshot';
import { InventorySlot } from './InventorySlot';

export function Hotbar() {
  const snapshot = useGameSnapshot();
  const { progress } = snapshot;
  return <footer className="controls">
    <div className="hotbar" aria-label="Hotbar">
      <p className="hotbar-name" role="status">{progress.hotbar[progress.selectedHotbar] ? 'Selected item' : `Empty slot ${progress.selectedHotbar + 1}`}</p>
      <div className="slot-grid" role="group" aria-label="Nine-slot hotbar">
        {progress.hotbar.map((stack, index) => <InventorySlot
          key={index} stack={stack} label={`Hotbar slot ${index + 1}`} number={String(index + 1)}
          reference={{ area: 'hotbar', index }} selected={index === progress.selectedHotbar}
          onActivate={(ref) => window.vonkje?.selectHotbar(Number(ref.index))}
        />)}
      </div>
    </div>
    <div className="game-actions">
      <button id="build-place" type="button" disabled={!snapshot.canBuild} onClick={() => window.vonkje?.build()}><kbd>F</kbd> Place</button>
      <button id="new-game" type="button" onClick={() => {
        if (window.confirm('Start a new game? Your saved progress will be erased.')) window.vonkje?.clearProgress();
      }}>New game</button>
    </div>
  </footer>;
}
