# Vonkje

Open `index.html` rechtstreeks in Chrome. Het spel gebruikt gewone scripts en slaat voortgang op in de browser.

| Bediening | Actie |
| --- | --- |
| WASD of pijltjes | Lopen en richten |
| E | De actie uitvoeren die boven de speler staat |
| B | Rugzak openen of sluiten |
| J / K | Slaan met de linkerhand / rechterhand |
| Spatie | Vonkje een vuurbal laten schieten |
| 1 / 2, daarna F | Hek / vloer selecteren en plaatsen |

Kies in de rugzak een wapen en wijs het toe aan een hand. Ieder itemtype gebruikt één plek, ook als je meerdere stuks of een uitgerust wapen hebt. Klik op een potion in de rugzak om die te drinken als je een hartje mist. De potion in de dungeon geneest zodra je hem met ontbrekende hartjes aanraakt.

## Code

- `main.js` bestuurt de game loop, HUD en de toestand van de speler.
- `js/input.js` koppelt de toetsen en de knoppen voor een nieuw spel en respawn.
- `js/world.js` bevat de kaarten, gebiedsovergangen, botsingen, bouwtegels en E-acties.
- `js/render.js` bevat de pixelrasters, animaties en Canvas-tekenfuncties.
- `js/inventory.js` beheert de rugzak, houtvoorraad, recepten en handslots.
- `js/combat.js` regelt vuurbal, melee, schade en slijmloot.
- `js/save.js` leest oude saves en bewaart de nieuwe. Bouwwerken die het nieuwe grottenpad zouden blokkeren, schuiven op naar vrije grastegels.
- `styles/base.css`, `styles/game.css` en `styles/inventory.css` bevatten de algemene stijl, speelveld en rugzak.
