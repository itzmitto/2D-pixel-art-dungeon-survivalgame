import { useGameSnapshot } from '../../hooks/useGameSnapshot';
import type { KeyboardEvent } from 'react';
import { ITEMS } from '../../game/items/catalog';
import type { SlotRef } from '../../game/items/inventoryModel';
import { EquipmentPanel } from './EquipmentPanel';
import { CraftingPanel } from './CraftingPanel';
import { InventorySlot } from './InventorySlot';

export function Inventory() {
  const snapshot = useGameSnapshot();
  const { progress } = snapshot;
  const open = progress.panelMode !== null;
  const stationSlots = progress.chestId && progress.chestId !== 'house'
    ? progress.dungeonChests[progress.chestId] ?? []
    : progress.chest;
  const onActivate = (reference: SlotRef, options: { single: boolean; shift: boolean }) => {
    window.vonkje?.clickSlot(reference, options);
  };
  const navigateSlots = (event: KeyboardEvent<HTMLElement>) => {
    const directions: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -9, ArrowDown: 9 };
    const amount = directions[event.key];
    if (amount === undefined) return;
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.hasAttribute('data-slot')) return;
    const slots = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button[data-slot]:enabled')];
    const index = slots.indexOf(target);
    const next = slots[index + amount];
    if (next) { event.preventDefault(); next.focus(); }
  };

  return <>
    <button id="backpack-toggle" className="backpack-toggle" type="button" aria-expanded={open}
      onClick={() => window.vonkje?.toggleInventory()}>Inventory <kbd>Tab</kbd></button>
    {open && <div className="inventory"><aside id="backpack" aria-label="Inventory and storage" onKeyDown={navigateSlots}>
      <header className="panel-heading">
        <h2 id="panel-title">{progress.panelMode === 'chest' ? 'Storage chest' : progress.panelMode === 'workbench' ? 'Field kit' : 'Inventory'}</h2>
        <button id="close-backpack" autoFocus type="button" onClick={() => window.vonkje?.closeInventory()}>Close <kbd>Esc</kbd></button>
      </header>
      <div className="panel-body">
        <div className="panel-storage">
          {progress.panelMode === 'chest' && <section className="inventory-section" aria-labelledby="chest-label">
            <h3 id="chest-label">Chest</h3>
            <div className="slot-grid" id="chest-slots">
              {stationSlots.map((stack, index) => <InventorySlot key={index} stack={stack} label={`Chest ${index + 1}`}
                reference={{ area: 'chest', index, chestId: progress.chestId ?? 'house' }} onActivate={onActivate} />)}
            </div>
          </section>}
          <section className="inventory-section" aria-labelledby="bag-label">
            <div className="section-heading"><h3 id="bag-label">Backpack</h3><span>{progress.bag.filter(Boolean).length} / 27</span></div>
            <div className="slot-grid" id="bag-items">
              {progress.bag.map((stack, index) => <InventorySlot key={index} stack={stack} label={`Backpack ${index + 1}`}
                reference={{ area: 'bag', index }} onActivate={onActivate} />)}
            </div>
          </section>
          <section className="inventory-section" aria-labelledby="inventory-hotbar-label">
            <h3 id="inventory-hotbar-label">Hotbar</h3>
            <div className="slot-grid" id="inventory-hotbar">
              {progress.hotbar.map((stack, index) => <InventorySlot key={index} stack={stack} label={`Hotbar ${index + 1}`}
                number={String(index + 1)} reference={{ area: 'hotbar', index }} onActivate={onActivate} />)}
            </div>
          </section>
          <button type="button" id="recover-overflow" onClick={() => window.vonkje?.recoverOverflow()}>Recover saved items</button>
        </div>
        <div className="panel-tools">
          <EquipmentPanel snapshot={snapshot} onActivate={onActivate} />
          {progress.panelMode !== 'chest' && <CraftingPanel snapshot={snapshot} area={progress.panelMode === 'workbench' ? 'benchCraft' : 'bagCraft'} onActivate={onActivate} />}
        </div>
      </div>
      <footer className="panel-footer">
        <button id="drink-potion" type="button" onClick={() => window.vonkje?.drinkPotion()}>Drink potion</button>
        <p className="inventory-hints">Click: move stack · Right click: split or place one · Shift-click: transfer at chest</p>
        <p id="panel-feedback" role="status">{snapshot.panelMessage}</p>
        {progress.held && <span className="held-stack">Holding {ITEMS[progress.held.item].label} × {progress.held.count}</span>}
      </footer>
    </aside></div>}
  </>;
}
