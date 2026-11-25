import { InventorySlot } from './InventorySlot';
import type { GameSnapshot } from '../../game/core/bridge';

const EQUIPMENT = [
  ['left', 'Left hand · J'], ['right', 'Right hand · K'], ['helmet', 'Helmet'],
  ['chestplate', 'Chestplate'], ['boots', 'Boots'], ['pet', 'Vonkje’s charm'],
] as const;

export function EquipmentPanel({ snapshot, onActivate }: {
  readonly snapshot: GameSnapshot;
  readonly onActivate: (reference: Parameters<typeof InventorySlot>[0]['reference'], options: { single: boolean; shift: boolean }) => void;
}) {
  const { progress } = snapshot;
  return <section className="inventory-section" aria-labelledby="equipment-label">
    <h3 id="equipment-label">Equipment</h3>
    <div className="equipment">
      <div className="knight-portrait"><canvas id="knight-preview" width="40" height="40" aria-label="Equipped knight preview" /></div>
      <div className="equipment-slots">
        {EQUIPMENT.map(([key, label]) => {
          const item = key === 'left' || key === 'right' ? progress.hands[key] : key === 'pet' ? progress.pet.pet : progress.armor[key];
          return <div className="equipment-slot" key={key}>
            <span>{label}</span>
            <InventorySlot stack={item ? { item, count: 1 } : null} label={label} reference={{ area: 'equipment', index: key }} onActivate={onActivate} />
          </div>;
        })}
      </div>
    </div>
    <div className="equipment-stats"><span>Defense {snapshot.defense}</span><span>{snapshot.fireballLabel}</span></div>
  </section>;
}
