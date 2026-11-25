import type { MouseEvent } from 'react';
import type { ItemStack, SlotRef } from '../../game/items/inventoryModel';
import { ITEMS } from '../../game/items/catalog';

interface InventorySlotProps {
  readonly stack: ItemStack | null;
  readonly label: string;
  readonly reference: SlotRef;
  readonly selected?: boolean;
  readonly number?: string;
  readonly quantity?: boolean;
  readonly onActivate: (reference: SlotRef, options: { single: boolean; shift: boolean }) => void;
}

export function InventorySlot({ stack, label, reference, selected = false, number, quantity = false, onActivate }: InventorySlotProps) {
  const name = stack ? ITEMS[stack.item].label : 'Empty';
  const split = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onActivate(reference, { single: true, shift: false });
  };
  return <button
    type="button"
    className={`slot${selected ? ' selected' : ''}`}
    aria-label={`${label}: ${name}${stack && (quantity || stack.count > 1) ? ` × ${stack.count}` : ''}`}
    aria-pressed={selected}
    data-slot="true"
    title={stack ? `${name}${stack.count > 1 ? ` × ${stack.count}` : ''}` : `${label} · Empty`}
    onClick={(event) => onActivate(reference, { single: false, shift: event.shiftKey })}
    onContextMenu={split}
    onKeyDown={(event) => {
      if (event.key.toLowerCase() === 'r' && !event.repeat) {
        event.preventDefault();
        onActivate(reference, { single: true, shift: false });
      }
    }}
  >
    {number && <span className="slot-number" aria-hidden="true">{number}</span>}
    {stack && <img className="slot-icon" src={`/images/items/${stack.item}.png`} alt="" draggable={false} />}
    {stack && (quantity || stack.count > 1) && <span className="slot-count">{stack.count}</span>}
  </button>;
}
