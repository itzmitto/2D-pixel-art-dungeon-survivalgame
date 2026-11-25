# Vonkje

## Run locally

Install Node.js 22.18 or newer, run `npm install` and then `npm run dev`. Open the local URL printed by Vite. The default app is the Three.js wilderness and requires WebGL2. `npm run build` generates the production version in `dist/`.

| Input | Action |
| --- | --- |
| WASD | Walk |
| Shift | Sprint |
| Left click | Attack with the equipped weapon in the knight's facing direction |
| Q | Use the equipped weapon's elemental ability |
| 1–9 | Equip a weapon assigned to a hotbar slot |
| Hold right mouse button | Guard from the front. The starter sword and the shield fully block wolf bites. |
| E | Collect loot, open chests, enter or leave the Den, rest, or respawn |
| P | Open or close Character Status |
| R | Drink a Health Potion if wounded |
| Tab | Open or close the Armory, then select Inventory or Equipment |
| Mouse wheel | Zoom the world camera or open map |
| M | Open or close the World Atlas |
| Esc | Close the active overlay |
| Drag on the map | Pan when zoomed in |

## Blackwater Wilds

The Dark Knight starts near Ember Clearing. Follow paths to two river crossings, Moonwatch Ruin and the Standing Stones. Explore farther to find Raven Camp, Hollowmouth Cave, Greyfen Tower and the Lantern Rest campfire. The Hollow Fang Den gate is by Hollowmouth Cave. Greyfen Tower remains an outdoor landmark with a cache near its entrance.

The map shows the knight's direction, water, terrain, paths and discovered landmarks. Unexplored cells are covered. Use the wheel or the map's zoom buttons, then drag to pan. Movement and combat pause in the map, inventory and Character Status.

Terrain and landmarks have a fixed layout. Forest, boulder and grass placement use the saved world seed. Terrain, vegetation and rock batches are partitioned spatially, and movement tests only nearby obstacles. The world uses the existing original Three.js knight, procedural meshes and nighttime lighting.

## World Atlas and Hunter System

**M** opens the illustrated atlas. Its relief, contours, river, bridges and roads are sampled from the playable terrain. Zoom with the wheel or buttons, drag the map, or center it on the hunter. The atlas keeps unvisited terrain dim and reveals landmark pins as you explore. Select a location to see its details, including the Den's rank, recommended level and clear status. Inside the Den, the atlas shows its chambers and exit.

Velren Forest is the playable region and includes the Blackwater Wilds and Hollow Fang Den. Its level range is 1–15. Aurelia, Elaris Highlands, Mournshade Marshes, Sunken Bastion, Crimson Wastes, Stormveil Heights and Shadowspire Monolith are listed as planned regions. The atlas shows the surveyed world boundary. The current world has a river and bridges but no coastline or lake to chart.

**Tab** opens the Armory. Filter the inventory by category and select an icon for details. The bag gains display pages as you collect more items, so existing loot is retained. Use **Equip** or the hotbar selector to assign a specific weapon instance. The hotbar has nine positions and old assignments remain in their original positions. The **Equipment** tab previews the current knight and weapon, including the off-hand shield when equipped. Armor is still one defense rating. Individual armor, cape and accessory slots are reserved for future items.

**P** shows the Character Status dossier. Upgrade buttons show actual attribute bonuses and spend earned stat points. Level gains, rank promotions, rare and higher weapon acquisitions, boss defeats and dungeon clears trigger temporary System notifications without interrupting movement.

## Hunter progression

Open **P** to see your level, hunter rank, XP, health, armor, weapon and kill totals. Every level gives three stat points and adds five base maximum health. Buy upgrades in Strength, Vitality, Agility, Intelligence, Defense or Luck. Agility, Defense and Luck bonuses have caps. Rank follows level: E 1–9, D 10–24, C 25–49, B 50–74, A 75–99, S 100–149, SS 150–199 and SSS from 200.

Wild Wolves hunt alone and in packs. Dire Wolves patrol farther from camp and move faster and hit harder. Skeleton Warriors near the ruins and tower wind up before swinging their swords. Give them space or face them when blocking. Eligible outdoor encounters return after a delay once their loot is collected and you move away. Dungeon encounters stay cleared.

Pick up glowing monster loot with **E**. Wolves drop fangs or hides, dire wolves drop Dire Fangs, and skeletons drop Bones or Iron. XP is awarded on kills. Drops may include health potions and graded weapons, with a bounded Luck bonus on rare drops. Open nearby color-coded chests with **E**. Their lids animate and the contents can be claimed once. Chests can improve your armor automatically. Press **R** to use a health potion. If defeated, press **E** to return to Ember Clearing.

## Hollow Fang Den

Find the blue gate near Hollowmouth Cave in the northwest. Press **E** to enter the E-rank dungeon. Level 5 is recommended. Follow the corridors through Wild Wolves and a Dire Wolf, and look for a side chamber with a chest. In the final arena, step sideways out of the Fang Guardian's marked charge lane, then attack during recovery. The Guardian has reduced crowd-control durations. Defeating it awards boss and clear XP and unlocks the Legendary reward chest. Use the starting portal to leave. The map shows the interior while you're inside.

## Elemental weapons

The Common longsword is your starting weapon. Five wolf territories can award their associated weapon on loot pickup and the Ember Clearing exchange lets you spend one Wolf Fang on a missing weapon. The exchange is also available to players who already collected the original wolf rewards. Open **Tab**, inspect a weapon, select **Equip** or assign it to a hotbar slot. The world HUD displays the equipped element and Q cooldown. Cooldowns run during active play and are shared across equipment changes for each weapon. They are session state.

| Weapon | Normal attack | Q ability |
| --- | --- | --- |
| Greatsword · Fire | Slow sweep that can hit several targets | **Infernal Cleave**, 8 s. A moving flame wave ignites enemies. |
| Battle Axe · Lightning | Heavy axe swing | **Thunderstrike**, 10 s. A ground strike chains to up to three targets and briefly stuns them. |
| Magic Staff · Ice | Ice bolt that stops at the first enemy or obstruction | **Frozen Domain**, 12 s. A field pulses damage, slows enemies and freezes each once. |
| Sword & Shield · Water | Balanced sword strike with a shield on the left forearm | **Tidal Guardian**, 10 s. A pulse pushes nearby enemies away and a barrier absorbs up to six damage. |
| Katana · Wind | Quick cut with short recovery | **Gale Slash**, 6 s. A collision-checked dash with a damaging wind blade. |

**Developer Weapon Lab:** run `npm run dev` and open `/?weaponLab=1` on the local URL. All five are on slots 1–5, wolves start alive, and the session never reads or writes the normal save. The production build does not offer this mode.

Rarity colors and damage multipliers are configured for Common, Uncommon, Rare, Epic, Legendary and Mythic in `src/wilderness/weapons.ts`. Generated weapons are independent saved instances with actual rarity-based attack damage and elemental bonuses. All instances of one weapon type reuse its model and animation.

## Saves and recovery

The 3D exploration save uses `vonkje-wilderness-v1`. It stores the seed, position, facing, health, level, experience, gold, Wolf Fangs, defeated wolves, unclaimed drop positions, collected rewards, owned weapons, equipped weapon, hotbar assignments, discovered cells, allocated stats, pending drops, opened chests, defeated bosses and dungeon clears. It leaves the old 2D save key untouched. An unreadable or incompatible 3D save is retained and the session starts from the clearing without writing to that key.

The original 2D game remains available for offline recovery in `legacy-index.html` with its original files. The former Vite 2D runtime and assets are archived under `recovery/2d/public/`, outside production assets. Keep using the same browser, origin or original file path when recovering an origin-specific save.

## Next milestones

- Add goblins, orcs and dark wizards and their distinct combat styles.
- Expand Greyfen Tower into playable floors and add higher-ranked dungeons.
- Add separate armor items and equipment slots. Chest armor currently applies as a defense rating.

No asset download is required. See the [original asset credits](recovery/2d/public/images/ASSET_CREDITS.md).
