# Vonkje

## Run locally

1. Open the `dungeon-survival` project folder and open `index.html` directly in Chrome. On Kubuntu, run `xdg-open ./index.html` from the project folder to use your default browser.
2. The game uses local files and ordinary scripts. No server, build, or `npm install` is required.
3. Use the corner **Full screen** button to hide the browser bar. Click **Exit full screen** or press **Esc** to return. Reload the same tab with **Ctrl+R** after changing the code.

| Control | Action |
| --- | --- |
| WASD or arrow keys | Move and face a direction. Use WASD while the backpack is open. |
| Right click on the playfield | Walk to the clicked spot. Use WASD or the arrow keys to cancel the route. |
| Either Shift key | Hold to sprint at double speed with keyboard or mouse movement. |
| E | Pick up nearby loot, open a chest, or use the workbench or bed. |
| Tab or B | Toggle the backpack. Use the arrow keys to move between slots and panel controls. |
| Esc | Close the open panel. E also closes chest and workbench panels. |
| 1–9, wheel over the playfield, or click the HUD hotbar | Select a hotbar slot |
| F | Place the selected fence, floor tile, or torch |
| Left click on the playfield / J | Swing the equipped left-hand weapon in the direction the knight faces |
| K | Right-hand attack |
| Space | Fire Vonkje’s fireball |

## The open world

You start at the cottage in **Lantern Hollow**. Walk through the open doorway for a cutaway view of the workbench, house chest, and bed. You can place fences, flooring, and torches on the village's open grass. The village is safe from the monsters across the river.

1. Equip the starter wooden sword in your left hand. Follow the village road east across **Blackwater Bridge**, then take the forest trails through **Gloamwood**. Watch for the amber warning before a wolf bites.
2. Follow the southern forest trail to the western breach in **Briar Keep**. Open the **Supply chest** with **E** in the western side room. It guarantees the materials for a Fang Blade. Shadow Wolves drop **Wolf Fangs** and Cave Snakes drop **Serpent Scales**. Pick them up with **E**. Drops stay on the ground when your backpack and hotbar are full.
3. Return to the cottage to craft and equip upgrades, store loot, or rest. At the keep, collect the key in the northeast of the outer ruins. The key opens the gate at the east end of the southern aisle. Follow the passage into **the Undercroft** for its **Reserve chest** and tougher enemies.
4. Follow the eastern passage to **Warden's Court**. Step out of the red charge lane or the gold ground-slam ring, then attack while the Cyclops Warden recovers. Defeating him opens the **Reward chest** with one Ember Core and unlocks the western shortcut to the forest.

The camera follows you across the continuous map. Right-click destinations follow the visible terrain as the camera moves. Your position, key, enemy health, defeated encounters, ground loot, and chest contents are saved. Respawning returns you to the cottage with your collected items. Old recorded room positions are moved to safe spots in the corresponding regions. Buildings that conflict with the new layout are relocated or returned through the existing item recovery system.

## Inventory, chest, and crafting

The backpack and each chest have 27 slots. The nine-slot hotbar shows the same stacks and selection in the HUD and in the panel. Equip a weapon by putting it in a hand slot. Selecting it in the hotbar leaves both hands as they were.

The backpack opens in the center of the playfield and scrolls internally in smaller windows. Press **Tab** again to close it. The HUD and bottom hotbar stay in place. Keep walking with **WASD** while the backpack is open. Chest and workbench panels pause movement and open with **E**. Close the panel to attack or set a mouse destination. Clicks on the hotbar, slots, and other interface controls act on those controls.

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
| `images/enemies/` | Original shadow wolf walk and fallback art, and the cave serpent. Each 670×102 sheet has four 134×102 movement frames and one attack frame facing right. |
| `images/third-party/wolf-enemy/` | Licensed left-facing wolf idle and attack sheets with 320×160 cells. The existing wolf walk cycle supplies movement. |
| `images/terrain/` | Grass, rock, and dungeon stone sheets use 102×102 tiles. Tree frames are 40×36 and the stump is 29×13. |
| `images/house/` | Cottage exterior, porch, two open doorway views, interior floor and wall with hearth and shelves, and rug. |
| `images/objects/` | The bed, workbench, chest, and torch each use a 32×32 PNG. |
| `images/third-party/superpowers-medieval-fantasy/` | Dungeon chest sprites and the 32×16 Cyclops sprite. See the [asset credits](images/ASSET_CREDITS.md). |
| `images/items/` | One 24×24 icon per item ID. |

`js/sprites.js` defines frame dimensions. The render buffer uses six pixels per world unit. The dragon retains its 25×20 world-unit footprint. The renderer draws the terrain and scenery around the camera from fixed local tile variants.

## Code

- `js/world/` defines the map and regions, collision, camera, and visible terrain. `js/world.js` handles interactions, encounters, loot, and building.
- `js/entities/` handles the knight and Vonkje's party placement and following, plus wolf behavior and animation. `js/combat.js` and `js/boss.js` handle attacks and equipment stats.
- `js/ui/hud.js` updates the HUD, and `js/inventory.js` handles slots, transfers, equipment, and recipe patterns.
- `js/input.js` handles controls and full screen. `js/movement.js` handles walking, sprinting, and mouse routes.
- `js/sprites.js` and `js/render.js` load and draw the local art. `js/save.js` migrates saves and stores world and inventory progress.
- `main.js` initializes the game and runs the frame loop. `styles/` layouts the game and inventory.

## Towers

Follow the northern forest to **Briar Watch**. Walk through its door, open the provisions chest for early crafting materials, then take the stairs in the northeast to the Bellkeeper's room. The same stairs lead back down after the fight. The reward chest unlocks once and retains its contents.

**Fen Spire** stands south of the forest. Its cistern has a central flooded channel, narrow crossings, and a cache on the far side. Walk back to the marked exit to return outside. Tower layouts live in `js/world/towers.js`. Seeded spawn pools and mob drops live in `js/entities/encounters.js`.

The towers use the cottage and ruin sprites, and the Bellkeeper uses the Cyclops sprite. Dedicated tower exteriors, stair and doorway markers, and a distinct Bellkeeper sprite can replace those visuals when licensed local art is available.
