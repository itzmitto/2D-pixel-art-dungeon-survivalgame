import { ITEMS } from '../../game/items/catalog';
import { ingredientsFor, RECIPES, type CraftingArea } from '../../game/items/recipes';
import type { GameSnapshot } from '../../game/core/bridge';
import { InventorySlot } from './InventorySlot';

export function CraftingPanel({ snapshot, area, onActivate }: {
  readonly snapshot: GameSnapshot;
  readonly area: CraftingArea;
  readonly onActivate: (reference: Parameters<typeof InventorySlot>[0]['reference'], options: { single: boolean; shift: boolean }) => void;
}) {
  const slots = area === 'bagCraft' ? snapshot.progress.bagCraft : snapshot.progress.benchCraft;
  const size = area === 'bagCraft' ? 2 : 3;
  const recipes = RECIPES[area];
  const craftable = Object.values(recipes).find((recipe) => recipe.pattern.every((cell, index) => cell
    ? slots[index]?.item === cell.item && slots[index].count >= cell.count
    : !slots[index]));
  return <section className="inventory-section" aria-labelledby="craft-title">
    <h3 id="craft-title">Crafting</h3>
    <div className="craft-workspace">
      <div className="slot-grid" data-size={size}>
        {slots.map((stack, index) => <InventorySlot
          key={index} stack={stack} label={`Ingredient ${index + 1}`}
          reference={{ area, index }} onActivate={onActivate}
        />)}
      </div>
      <span className="craft-arrow" aria-hidden="true">→</span>
      <div className="craft-result">
        <button type="button" className="slot" aria-label={craftable ? `Craft ${ITEMS[craftable.output].label}` : 'No crafting output'} disabled={!craftable} onClick={() => window.vonkje?.takeCraftOutput()}>
          {craftable && <img className="slot-icon" src={`/images/items/${craftable.output}.png`} alt="" />}
        </button>
        <span>Output</span>
      </div>
    </div>
    <details>
      <summary>Recipe guide</summary>
      <div className="recipe-list">
        {Object.values(recipes).map((recipe) => {
          const ingredients = [...ingredientsFor(recipe)];
          return <article className="recipe-card" key={recipe.output}>
            <strong>{ITEMS[recipe.output].label}</strong>
            <small>{ingredients.map(([item, count]) => `${ITEMS[item].label} × ${count}`).join(' · ')}</small>
          </article>;
        })}
      </div>
    </details>
  </section>;
}
