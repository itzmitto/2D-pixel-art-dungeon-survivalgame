# Vonkje

## Run locally

1. Open the `dungeon-survival` project folder and open `index.html` directly in Chrome. On Kubuntu, run `xdg-open ./index.html` from the project folder to use your default browser.
2. The game uses local files and ordinary scripts. No server, build, or `npm install` is required.
3. Click **Full screen** to hide the browser bar. Click **Exit full screen** or press **Esc** to return. Reload the same tab with **Ctrl+R** after changing the code.

| Control | Action |
| --- | --- |
| WASD or arrow keys | Move and face a direction |
| E | Use the interaction shown above the knight. At home this includes opening the chest and workbench. |
| Tab or B | Open the inventory. Tab / Shift+Tab move focus through the panel. Use the arrow keys within a slot grid. |
| Esc or B | Close the open panel. E also closes the chest and workbench. |
| 1–9 or wheel over the playfield | Select a hotbar slot |
| F | Place the selected fence, floor tile, or torch |
| J / K | Attack with the equipped left / right hand |
| Space | Fire Vonkje’s fireball |

## Inventory, chest, and crafting

The backpack and house chest each have 27 slots. The nine-slot hotbar is separate and uses the same stacks in the HUD and in the panel. Equip a weapon by putting it in a hand slot. Selecting it in the hotbar leaves both hands as they were.

- **Left click** picks up or places the whole stack. Matching stacks merge up to their limit. A different item swaps if both slots can accept the items.
- **Right click** picks up half, rounded up, or places one from the held stack. A focused slot also supports **R** for this action and **Enter** for a normal click.
- **Shift + left click** moves a stack between the chest and player storage while the chest is open. Any amount that does not fit stays in its original slot.
- Materials and supplies stack up to 64. Weapons, tools, armor, and charms take one slot each. Use **Drink potion** to heal up to one heart.
- Use the **Recipe guide** in the 2×2 backpack grid or 3×3 workbench grid. Match the exact pattern, leaving blank cells empty. Larger ingredient stacks can make multiple batches. Each click on the output takes one batch into the held stack.

Closing a panel returns the held stack and unused ingredients to available slots. If they do not fit, the panel stays open. Reloading restores an unfinished panel and its items. Items from old saves that exceed the new capacity are available through **Recover saved items** when there is space. Chest overflow is recoverable from the chest panel.

## Gathering and equipment

Face a tree and press **E** three times with an axe in the backpack, hotbar, or either hand. Pick up the dropped wood with **E**. Repair the house door for six wood, then use the workbench to make a wooden pickaxe for four wood. Carry it to mine stone and copper ore in the clearing south of the cave path. Uncollected resources outdoors survive a reload.

Armor reduces slime damage by one eighth of a heart per point of defense, to a minimum of half a heart per hit. The copper spear reaches farther and recovers more slowly than a sword. Vonkje’s copper dragon charm reduces fireball recharge from 1 second to 0.8 seconds.

## Local sprites

Use transparent PNGs and keep frame registration consistent when replacing sprites.

| File | Layout |
| --- | --- |
| `images/characters/knight-walk.png` | 240×160 sheet. Six 40×40 frames per row, ordered down, left, right, up. The first frame in each row doubles as the idle pose. |
| `images/pets/vonkje-fly.png` | 320×64 sheet. Four 80×64 frames in one row facing right. The renderer mirrors the pose when Vonkje turns left. |
| `images/objects/` | The workbench, chest, and torch each use a 32×32 PNG. |
| `images/items/` | One 24×24 icon per item ID. |

`js/sprites.js` defines frame dimensions and playback. The render buffer uses three pixels per world unit so the larger dragon sheet can show more detail. The dragon retains its 25×20 world-unit footprint, and missing or mismatched sheets still fall back to Canvas sprites.

## Code

- `js/inventory.js` handles slots, transfers, equipment, and the `RECIPES` patterns for both grids.
- `js/input.js` handles controls, hotbar selection, and full screen.
- `js/world.js` handles maps, interactions, gathering, and building.
- `js/combat.js` holds weapon, armor, and charm stats.
- `js/sprites.js` and `js/render.js` load sprites and draw the world and preview.
- `js/save.js` migrates older saves and stores slot positions, crafting ingredients, held stacks, and world progress.
- `main.js` runs the game loop and HUD. The `styles/` folder controls the fullscreen layout and inventory panels.
