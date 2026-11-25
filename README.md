# Vonkje

## Run locally

1. Open the `dungeon-survival` project folder and open `index.html` directly in Chrome. On Kubuntu, run `xdg-open ./index.html` from the project folder to use your default browser.
2. The game uses local files and ordinary scripts. No server, build, or `npm install` is required.
3. Click **Full screen** to hide the browser bar. Click **Exit full screen** or press **Esc** to return. Reload the same tab with **Ctrl+R** after changing the code.

| Control | Action |
| --- | --- |
| WASD or arrow keys | Move and face a direction. Use WASD while the backpack is open. |
| Right click on the playfield | Walk to the clicked spot. Use WASD or the arrow keys to cancel the route. |
| Either Shift key | Hold to sprint at double speed with keyboard or mouse movement. |
| E | Pick up nearby loot, open a chest, or use the workbench or bed. |
| Tab or B | Open the backpack. Tab / Shift+Tab move focus through the panel. Use the arrow keys within a slot grid. |
| Esc or B | Close the open panel. E also closes chest and workbench panels. |
| 1–9, wheel over the playfield, or click the HUD hotbar | Select a hotbar slot |
| F | Place the selected fence, floor tile, or torch |
| Left click on the playfield / J | Swing the equipped left-hand weapon in the direction the knight faces |
| K | Right-hand attack |
| Space | Fire Vonkje’s fireball |

## Dungeon progression

The cottage door is always open. Walk north through the doorway to enter the house, then walk south through the inside doorway to return to the porch. You can also right click a doorway to walk through it.

1. Equip the starter wooden sword in your left hand, then follow the trail into the cave. Open the **Supply chest** with **E** in the western side room. It contains wood, stone, copper ore, two Wolf Fangs, a Serpent Scale, and potions. Its materials are enough to craft a Fang Blade before fighting the boss.
2. Defeat Shadow Wolves for **Wolf Fangs** and Cave Snakes for **Serpent Scales**. Pick up their drops with **E**. Loot stays on the ground if the backpack and hotbar are full. Walk over the key in room 1 to unlock the door to room 2. Room 2 has a **Reserve chest** with more materials and potions.
3. Return to the cottage through the doors you came in and use **E** at the workbench. Craft and equip upgrades, store spare items in the house chest, and rest at the bed before heading back.
4. The east door in room 2 leads to the **Cyclops Warden**. Step out of the red charge lane or the gold ground-slam ring, then attack while the Warden recovers. Defeating him unlocks the **Reward chest** with one Ember Core and the east exit back to the cave entrance.

The key, enemy health, defeated encounters, unclaimed drops, and each chest's contents are saved. Returning home or respawning keeps collected items. The forest remains a place to build and reach the cave. Wood, stone, and copper for the existing recipes come from dungeon chests.

## Inventory, chest, and crafting

The backpack and each chest have 27 slots. The nine-slot hotbar shows the same stacks and selection in the HUD and in the panel. Equip a weapon by putting it in a hand slot. Selecting it in the hotbar leaves both hands as they were.

The backpack opens in the center of the playfield and scrolls internally in smaller windows. The playfield and bottom hotbar stay in place. Keep walking with **WASD** while the backpack is open. Chest and workbench panels pause movement and open with **E**. Close the panel to attack or set a mouse destination. Clicks on the hotbar, slots, and other interface controls act on those controls.

- **Left click** picks up or places the whole stack. Matching stacks merge up to their limit. A different item swaps if both slots can accept the items.
- **Right click** picks up half, rounded up, or places one from the held stack. A focused slot also supports **R** for this action and **Enter** for a normal click.
- **Shift + left click** moves a stack between the chest and player storage while the chest is open. Any amount that does not fit stays in its original slot.
- Materials and supplies stack up to 64. Weapons, tools, armor, and charms take one slot each. Use **Drink potion** to heal up to one heart.
- Use the **Recipe guide** in the 2×2 backpack grid or 3×3 workbench grid. Match the pattern and quantities, leaving blank cells empty. Ingredients are consumed when you successfully take the output. Larger ingredient stacks can make multiple batches.

Closing a panel returns the held stack and unused ingredients to available slots. If they do not fit, the panel stays open. Reloading restores an unfinished panel and its items. Items from old saves that exceed the new capacity are available through **Recover saved items** when there is space. Chest overflow is recoverable from the chest panel.

## Dungeon gear recipes

| Upgrade | 3×3 workbench pattern | Effect |
| --- | --- | --- |
| Fang Blade | Center column from top to bottom: 2 Wolf Fangs, 1 Copper ore, 1 Wood | 3 damage, with 0.25 seconds between swings |
| Scale Armor | Top row: 1 Serpent Scale, 1 Copper ore, 1 Serpent Scale. Center cell: 1 Serpent Scale | Equip in the chestplate slot for 3 defense |
| Ember Charm | Top center: 1 Ember Core. Middle row: 1 Wolf Fang, 1 Copper ore, 1 Serpent Scale | Equip in Vonkje's charm slot for a 0.6-second fireball recharge |

Armor reduces damage by one eighth of a heart per point of defense, to a minimum of half a heart per hit. The copper spear reaches farther and recovers more slowly than a sword. Vonkje’s copper dragon charm reduces fireball recharge from 1 second to 0.8 seconds. Old saves keep their existing gear, tools, materials, and buildings.

## Local sprites

Use transparent PNGs and keep frame registration consistent when replacing sprites.

| File | Layout |
| --- | --- |
| `images/characters/knight-walk.png` | 240×160 dark-steel knight sheet. Six 40×40 frames per row, ordered down, left, right, up. The first frame in each row doubles as the idle pose. |
| `images/pets/vonkje-flight.png` | 1024×204 game sheet. Four 256×204 frames in one row facing right. The renderer mirrors the pose when Vonkje turns left. The source art is `vonkje-fly.png`. |
| `images/enemies/` | Shadow wolf and cave serpent. Each 670×102 sheet has four 134×102 movement frames and one attack frame facing right. |
| `images/terrain/` | Grass, rock, and dungeon stone sheets use 102×102 tiles. Tree frames are 40×36 and the stump is 29×13. |
| `images/house/` | Cottage exterior, porch, two open doorway views, interior floor and wall with hearth and shelves, and rug. |
| `images/objects/` | The bed, workbench, chest, and torch each use a 32×32 PNG. |
| `images/third-party/superpowers-medieval-fantasy/` | Dungeon chest sprites and the 32×16 Cyclops sprite. See the [asset credits](images/ASSET_CREDITS.md). |
| `images/items/` | One 24×24 icon per item ID. |

`js/sprites.js` defines frame dimensions and playback. The render buffer uses six pixels per world unit. The dragon retains its 25×20 world-unit footprint, and missing or mismatched sheets still fall back to Canvas sprites. Fixed grass and dungeon tile variants are cached as backgrounds for each area.

## Code

- `js/inventory.js` handles slots, transfers, equipment, and the `RECIPES` patterns for both grids.
- `js/input.js` handles controls, hotbar selection, and full screen.
- `js/movement.js` handles keyboard movement, sprinting, and mouse routes using world collision.
- `js/world.js` handles maps, walking through thresholds, loot interactions, and building.
- `js/combat.js` holds weapon, armor, and charm stats.
- `js/boss.js` runs the Warden's attacks and health bar.
- `js/sprites.js` and `js/render.js` load sprites and draw the world and preview.
- `js/save.js` migrates older saves and stores slot positions, crafting ingredients, held stacks, and world progress.
- `main.js` runs the game loop and HUD. The `styles/` folder controls the fullscreen layout and inventory panels.
