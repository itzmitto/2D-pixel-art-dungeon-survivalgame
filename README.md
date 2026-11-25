# Vonkje

## Run locally

Install Node.js 22.18 or newer, run `npm install` and then `npm run dev`. Open the local URL printed by Vite. The default app is the Three.js wilderness and requires WebGL2. `npm run build` generates the production version in `dist/`.

| Input | Action |
| --- | --- |
| WASD | Walk |
| Shift | Sprint |
| Left click | Swing the longsword |
| Mouse wheel | Zoom the world camera or open map |
| M | Open or close the map |
| Esc | Close the map |
| Drag on the map | Pan when zoomed in |

## Blackwater Wilds

The Dark Knight starts near Ember Clearing. Follow paths to two river crossings, Moonwatch Ruin and the Standing Stones. Explore farther to find Raven Camp, Hollowmouth Cave, Greyfen Tower and the Lantern Rest campfire. The cave and tower are outdoor landmarks for now.

The map shows the knight's direction, water, terrain, paths and discovered landmarks. Unexplored cells are covered. Use the wheel or the map's zoom buttons, then drag to pan. Movement and sword input pause while the map is open.

Terrain and landmarks have a fixed layout. Forest, boulder and grass placement use the saved world seed. Terrain, vegetation and rock batches are partitioned spatially, and movement tests only nearby obstacles. The world uses the existing original Three.js knight, procedural meshes and nighttime lighting.

## Saves and recovery

The 3D exploration save uses `vonkje-wilderness-v1`. It stores the seed, position, facing and discovered cells. It leaves the old 2D save key untouched. An unreadable or incompatible 3D save is retained and the session starts from the clearing without writing to that key.

The original 2D game remains available for offline recovery in `legacy-index.html` with its original files. The former Vite 2D runtime and assets are archived under `recovery/2d/public/`, outside production assets. Keep using the same browser, origin or original file path when recovering an origin-specific save.

## Next milestones

- Add sword damage, enemy AI and loot collection.
- Open the cave and tower interiors with encounters, bosses and chests.
- Connect inventory, equipment and leveling to a versioned progression save.
- Add the horse and mount controls.

No asset download is required. See the [original asset credits](recovery/2d/public/images/ASSET_CREDITS.md).
