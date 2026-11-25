# Vonkje

## Run locally

Install Node.js 22.18 or newer, run `npm install` and then `npm run dev`. Open the local URL printed by Vite. The default app is the Three.js wilderness and requires WebGL2. `npm run build` generates the production version in `dist/`.

| Input | Action |
| --- | --- |
| WASD | Walk |
| Shift | Sprint |
| Left click | Attack with the equipped weapon in the knight's facing direction |
| Q | Use the equipped weapon's elemental ability |
| 1–5 | Equip a weapon assigned to a hotbar slot |
| Hold right mouse button | Guard from the front. The starter sword and the shield fully block wolf bites. |
| E | Collect nearby loot, rest at a campfire, or respawn |
| Tab | Open or close the inventory |
| Mouse wheel | Zoom the world camera or open map |
| M | Open or close the map |
| Esc | Close the map |
| Drag on the map | Pan when zoomed in |

## Blackwater Wilds

The Dark Knight starts near Ember Clearing. Follow paths to two river crossings, Moonwatch Ruin and the Standing Stones. Explore farther to find Raven Camp, Hollowmouth Cave, Greyfen Tower and the Lantern Rest campfire. The cave and tower are outdoor landmarks for now.

The map shows the knight's direction, water, terrain, paths and discovered landmarks. Unexplored cells are covered. Use the wheel or the map's zoom buttons, then drag to pan. Movement and combat pause while the map or inventory is open.

Terrain and landmarks have a fixed layout. Forest, boulder and grass placement use the saved world seed. Terrain, vegetation and rock batches are partitioned spatially, and movement tests only nearby obstacles. The world uses the existing original Three.js knight, procedural meshes and nighttime lighting.

## Fighting wolves

Blackwater Wolves patrol territories near the forest, Raven Camp, the crossing approaches and the northern landmarks. Face a wolf before swinging. The strike lands at the impact frame of the animation. Back away during the wolf's windup or hold right mouse to guard while facing it. Wolf kills award experience and leave a pickup for gold and Wolf Fangs. If defeated, press **E** to return to Ember Clearing. Campfires restore health with **E**.

## Elemental weapons

The Common longsword is your starting weapon. Five wolf territories award unique weapons on loot pickup and the Ember Clearing exchange lets you spend one Wolf Fang on a missing weapon. The exchange is also available to players who already collected the original wolf rewards. Open **Tab**, inspect a weapon, select **Equip** or assign it to a hotbar slot. The world HUD displays the equipped element and Q cooldown. Cooldowns run during active play and are shared across equipment changes for each weapon. They are session state.

| Weapon | Normal attack | Q ability |
| --- | --- | --- |
| Greatsword · Fire | Slow sweep that can hit several targets | **Infernal Cleave**, 8 s. A moving flame wave ignites enemies. |
| Battle Axe · Lightning | Heavy axe swing | **Thunderstrike**, 10 s. A ground strike chains to up to three targets and briefly stuns them. |
| Magic Staff · Ice | Ice bolt that stops at the first enemy or obstruction | **Frozen Domain**, 12 s. A field pulses damage, slows enemies and freezes each once. |
| Sword & Shield · Water | Balanced sword strike with a shield on the left forearm | **Tidal Guardian**, 10 s. A pulse pushes nearby enemies away and a barrier absorbs up to six damage. |
| Katana · Wind | Quick cut with short recovery | **Gale Slash**, 6 s. A collision-checked dash with a damaging wind blade. |

**Developer Weapon Lab:** run `npm run dev` and open `/?weaponLab=1` on the local URL. All five are on slots 1–5, wolves start alive, and the session never reads or writes the normal save. The production build does not offer this mode.

Rarity colors and damage multipliers are configured for Common, Uncommon, Rare, Epic, Legendary and Mythic in `src/wilderness/weapons.ts`. Each weapon currently has one defined rarity. Boss crowd-control resistance has a configuration profile for future encounters.

## Saves and recovery

The 3D exploration save uses `vonkje-wilderness-v1`. It stores the seed, position, facing, health, level, experience, gold, Wolf Fangs, defeated wolves, unclaimed drop positions, collected rewards, owned weapons, equipped weapon, hotbar assignments and discovered cells. It leaves the old 2D save key untouched. An unreadable or incompatible 3D save is retained and the session starts from the clearing without writing to that key.

The original 2D game remains available for offline recovery in `legacy-index.html` with its original files. The former Vite 2D runtime and assets are archived under `recovery/2d/public/`, outside production assets. Keep using the same browser, origin or original file path when recovering an origin-specific save.

## Next milestones

- Open the cave and tower interiors with encounters, bosses and chests.
- Add chest and boss loot, variant rarity drops, armor and consumable hotbar slots.
- Add the horse and mount controls.

No asset download is required. See the [original asset credits](recovery/2d/public/images/ASSET_CREDITS.md).
