# Vonkje

Open `index.html` rechtstreeks in Chrome. Het spel gebruikt gewone scripts en slaat voortgang op in de browser.

| Bediening | Actie |
| --- | --- |
| WASD of pijltjes | Lopen en richten |
| E | De actie uitvoeren die boven de speler staat |
| B | Rugzak openen of sluiten |
| J / K | Slaan met de linkerhand / rechterhand |
| Spatie | Vonkje een vuurbal laten schieten |
| 1 / 2 / 3, daarna F | Hek / vloer / houten fakkel selecteren en plaatsen |

Kies in de rugzak een wapen en wijs het toe aan een hand. Ieder itemtype gebruikt één plek, ook als je meerdere stuks of een uitgerust wapen hebt. Klik op een potion in de rugzak om die te drinken als je een hartje mist. De potion in de dungeon geneest zodra je hem met ontbrekende hartjes aanraakt.

## Werkbank en opbergkist

Repareer de huisdeur met 6 hout. Binnen staat de werkbank links van het bed en de opbergkist rechts. Open ze met **E** en sluit ze met **E** of **Esc**. De fakkel kost 2 hout bij de werkbank. Buiten plaats je hem op een vrije grastegel. Hekken en vloeren maak je in de rugzak.

Klik in de kist op een item om de hele stapel naar de andere kant te verplaatsen. Een stapel gebruikt één vak per itemtype. De rugzak heeft zes vakken en de kist acht. De kistinhoud en geplaatste fakkels worden bewaard samen met je eerdere voortgang.

## Sprites vervangen

Vervang een PNG op hetzelfde pad en exporteer met een transparante achtergrond. Zet de frames direct tegen elkaar en houd de positie van het personage binnen elke cel gelijk.

| Bestand | Indeling |
| --- | --- |
| `images/characters/knight-walk.png` | 240×160 pixels. Vier rijen in de volgorde beneden, links, rechts, boven. Elke rij bevat zes frames van 40×40. Het eerste frame is ook de stilstandpose. |
| `images/pets/vonkje-fly.png` | 160×32 pixels. Vier frames van 40×32 op één rij, met de snuit naar rechts. Het spel spiegelt de hele pose voor links. |
| `images/objects/workbench.png`, `chest.png` en `torch.png` | Elk één frame van 32×32 pixels. |

Pas bij een nieuwe celmaat of een ander aantal frames de waarden in `PNG_SPRITES` aan. In `js/sprites.js` staan ook de richtingsvolgorde en de snelheden in frames per seconde. De getekende grootte staat in `js/render.js`. Bij een ontbrekende PNG of onjuiste afmetingen tekent het spel de Canvas-variant.

## Code

- `main.js` bestuurt de game loop, HUD en de toestand van de speler.
- `js/input.js` koppelt de toetsen en de knoppen voor een nieuw spel en respawn.
- `js/world.js` bevat de kaarten, gebiedsovergangen, botsingen, bouwtegels en E-acties.
- `js/sprites.js` laadt de PNG’s en kiest de animatieframes.
- `js/render.js` tekent de wereld en bevat de Canvas-reservesprites.
- `js/inventory.js` beheert de rugzak, houtvoorraad, recepten, handslots en de opbergkist.
- `js/combat.js` regelt vuurbal, melee, schade en slijmloot.
- `js/save.js` leest oude saves en bewaart de nieuwe. Bouwwerken die het nieuwe grottenpad zouden blokkeren, schuiven op naar vrije grastegels.
- `styles/base.css`, `styles/game.css` en `styles/inventory.css` bevatten de algemene stijl, speelveld en rugzak.
