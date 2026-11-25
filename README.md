# Vonkje

## Run locally

The React/Vite entry point is `index.html`. The game world still runs in Canvas 2D, with the existing engine loaded from `public/legacy-runtime/` while its systems are migrated into TypeScript. The original direct-file version remains at `legacy-index.html` for save recovery and comparison.

1. Install Node.js 22.18 or newer.
2. Run `npm install` once, then `npm run dev`.
3. Open the local URL printed by Vite. Use the corner **Full screen** button to hide browser chrome.
4. Run `npm run typecheck`, `npm run build`, and `npm test` for terminal checks. `npm run build` creates the production bundle in `dist/`.

Use **Export save** and **Import save** in the upper-right corner. Import checks the JSON before changing browser storage. See Migration status below for recovering a save from the original file version.

After changing code, reload the Vite tab. The old direct-file game can still be opened with `xdg-open ./legacy-index.html` on Kubuntu.

| Control | Action |
| --- | --- |
| WASD or arrow keys | Walk and face a direction. Use WASD while the backpack is open. |
| Right click on the playfield | Walk to the clicked spot. Use WASD or the arrow keys to cancel the route. |
| Either Shift key | Hold to sprint at double speed with keyboard or mouse movement. |
| E | Pick up nearby loot, open a chest, or use the field kit. |
| Tab or B | Toggle the backpack. Use the arrow keys to move between slots and panel controls. |
| Esc | Close the open panel. E also closes chest and field kit panels. |
| 1–9, wheel over the playfield, or click the HUD hotbar | Select a hotbar slot. |
| F | Place the selected fence, floor tile, or torch near the field camp. |
| Left click on the playfield / J | Swing the equipped left-hand weapon in the direction the knight faces. |
| K | Right-hand attack. |
| Space | Fire Vonkje’s fireball. |

## Wilderness and progression

Explore the continuous **Ashen Wilds**. The old village and cottage are gone from the overworld. You begin in a small forest clearing with a field kit and a **Field cache** that retains your former home storage. The camera follows behind the knight and keeps the trail ahead visible. Dark grass, moss, flowers, fireflies and torchlight mark a route through the trees.

1. Follow the old paths east toward **Briar Keep**. Shadow Wolves and Cave Snakes pursue you when they notice you. Their attacks show a warning pose before damage. Defeated enemies leave Wolf Fangs or Serpent Scales on the ground. Press **E** to collect them. Drops remain on the ground if your backpack is full.
2. Find the keep key in the outer ruins and use it to open the eastern gate. The **Supply chest** and **Reserve chest** contain early crafting materials. Return to the field camp when you want to store loot or use the field kit. The Fang Blade and Scale Armor can be crafted before the main boss.
3. Explore **Briar Watch** in the far northeast. Open its provisions chest, climb the stairs and fight the Bellkeeper. Its reward chest keeps its saved contents. **Fen Spire**, far to the southwest, has a flooded cistern, a separate cache, and a route back outside.
4. Continue into the ruined keep's undercroft and **Warden's Court**. Step clear of the Warden's red charge lane and gold ground-slam ring, then attack while it recovers. Its reward chest grants one Ember Core for the Ember Charm.

Tower interiors are separate floors; the wilderness between landmarks is seamless. Tower doors and stairs have safe arrival points. Enemy selections are seeded and saved. Your equipment, backpack, field-cache contents, tower progress, boss clears, chest contents and unclaimed drops persist through reloads and respawn. Old saves keep their items and equipment. Old village or cottage positions move to the safe field clearing; completed tower floors and other outdoor positions are preserved where they remain safe. Old home storage is available from the Field cache. Existing placed buildings stay in the wilderness or use the saved relocation and recovery system if terrain blocks them.

## Inventory, chests and crafting

The backpack and each chest have 27 slots. The nine-slot hotbar shows the same stacks and selection in the HUD and in the panel. Equip a weapon by putting it in a hand slot. Selecting it in the hotbar leaves both hands as they were.

Press **Tab** again to close the centered backpack. Its overlay does not move or resize the game view or hotbar. Keep walking with **WASD** while it is open. Chest and field-kit panels open with **E** and pause movement. Close a panel to attack or set a mouse destination.

- Left click picks up or places a whole stack. Matching stacks merge up to their limit. A different item swaps if both slots can accept the items.
- Right click picks up half, rounded up, or places one from the held stack. A focused slot also supports **R** for this action and **Enter** for a normal click.
- Shift + left click moves a stack between the chest and player storage while a chest is open. Any amount that does not fit stays in its original slot.
- Materials and supplies stack up to 64. Weapons, tools, armor, and charms take one slot each. Use a potion to heal.
- Use the recipe guide in the 2×2 backpack grid or 3×3 field-kit grid. Match the pattern and quantities, leaving blank cells empty. Ingredients are consumed when you successfully take the output.

Closing a panel returns the held stack and unused ingredients to available slots. If they do not fit, the panel stays open. Reloading restores an unfinished panel and its items. Old items that exceed the new capacity remain available through the recovery controls.

## Dungeon gear recipes

| Upgrade | 3×3 field-kit pattern | Effect |
| --- | --- | --- |
| Fang Blade | Center column from top to bottom: 2 Wolf Fangs, 1 Copper ore, 1 Wood | 3 damage, with 0.25 seconds between swings |
| Scale Armor | Top row: 1 Serpent Scale, 1 Copper ore, 1 Serpent Scale. Center cell: 1 Serpent Scale | Equip in the chestplate slot for 3 defense |
| Ember Charm | Top center: 1 Ember Core. Middle row: 1 Wolf Fang, 1 Copper ore, 1 Serpent Scale | Equip in Vonkje's charm slot for a 0.6-second fireball recharge |

The first tower and keep supply chests contain enough material to craft a useful upgrade before the boss. The Ember Charm requires the Warden's guaranteed Ember Core.

## Local art

The game reuses the local knight, golden Vonkje, wolf, snake, terrain, chest and Cyclops art. The rear-facing knight view already exists in `images/characters/knight-walk.png`: use row 4 (the `up` row), frames 1–6 (columns 1–6). No rear-view knight frames are missing. The camera keeps pixel art sharp and does not stretch source sprites to add detail.

The towers are drawn with the existing pixel terrain palette and Canvas renderer. No replacement image assets were generated or downloaded. Dedicated optional assets that would add more variety are `images/structures/briar-watch.png`, `images/structures/fen-spire.png`, `images/animals/deer-idle.png`, and `images/animals/raven-idle.png`. Add local files only when their terms permit use in the game, and record imported art in [the asset credits](images/ASSET_CREDITS.md).

## Migration status

React renders the HUD, boss bar, interaction prompts, notifications, inventory, equipment, crafting, hotbar and save controls. It subscribes to a typed snapshot. The runtime batches changes and keeps the same snapshot when the visible state is unchanged.

The Vite runtime uses TypeScript for the frame scheduler, camera calculations and stack insertion. Canvas rendering, input handlers, world and tower transitions, combat, save migration and most inventory transactions still run in `public/legacy-runtime/`. The other typed modules in `src/game/` have terminal tests but are not yet connected to live gameplay. Typechecking covers the React app and the migrated modules listed in `tsconfig.engine.json`.

The original direct-file recovery version remains in `legacy-index.html` with its original scripts in `js/`. For an older save stored under a file URL, copy the value of `vonkje-survival-v1` from that version's browser storage into a JSON file and import it from the Vite page. Import backs up the current Vite save under a separate browser storage key, then reloads the game.

The next migration step is to connect the typed inventory transactions and their save handling, replacing the remaining classic slot, crafting and chest operations together.

## 3D wilderness prototype

Run `npm install` and `npm run dev`, then open **3D wilderness** from the 2D game or add `?mode=3d` to the local URL. Use **2D game** to return to the existing game. The 3D mode requires WebGL2 and uses its own temporary exploration state. It does not read or write 2D saves.

- **WASD** walks relative to the fixed camera direction. **Shift** sprints.
- Scroll over the world to zoom. **M** opens and closes the world map, and **Escape** closes it. Movement stops while it is open.
- Follow the trail from Ember Clearing to Blackwater Crossing. Cross the bridge and follow the far bank trail toward Moonwatch Ruin. The Standing Stones are southwest of the crossing.
- Health, armor and the empty hotbar are prototype interface elements. Combat, Vonkje, storage, crafting, loot, tower interiors, bosses and progression remain in 2D.

The Three.js scene builds its terrain, vegetation, river, landmarks and map from original procedural data in `src/wilderness/`. Grass uses instanced clumps with distance-based density and shader-driven wind and player interaction. The environment uses moon shadows, animated water, fog, mist, campfire lighting and particles. The [ABYSS project](https://github.com/saifali96/gcdAbyss) inspired the steep perspective and nighttime atmosphere.

### Next 3D assets

The current knight is a labeled development model made from simple geometry. For the next pass, place licensed ZIP files in the project root next to `package.json`. Include license and attribution files and keep any referenced PNG textures with the model when using GLTF.

| Priority | Category | Format and animations | Style and search terms |
| --- | --- | --- | --- |
| First | Rigged playable knight | GLB preferred, GLTF with PNG textures also suitable. Clips for idle, walk, run, sword slash, block, hit reaction and death. Prefer in-place locomotion and consistent orientation. | Readable silhouette from above, muted steel and leather, stylized low-poly medieval. Search for “rigged low poly medieval knight GLB in place animations”. |
| Later | Forest and ruin kit | GLB or GLTF with PNG textures. Static conifers, boulders, broken masonry and tower sections need no animations. | Dark mossy stone and restrained colors. Search for “stylized dark medieval ruins conifers low poly GLTF”. |
| Later | Golden dragon companion | Rigged GLB with idle, takeoff, sustained flight, turn, fire breath and landing clips. | Small, readable golden hatchling. Search for “rigged low poly dragon hatchling GLB flight animations”. |

See [asset credits](public/images/ASSET_CREDITS.md) for attribution.
