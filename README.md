# Vonkje

## Lokaal starten

1. Open de projectmap `dungeon-survival` en open `index.html` rechtstreeks in Chrome. Op Kubuntu kun je vanuit die map ook `xdg-open ./index.html` uitvoeren. Dat gebruikt je standaardbrowser.
2. De game draait direct met lokale bestanden. Je hebt geen `npm install`, build of lokale server nodig.
3. Klik op **Volledig scherm** om de browserbalk te verbergen. Klik op **Volledig scherm verlaten** of druk op **Esc** om terug te gaan.
4. Herlaad na een codewijziging hetzelfde tabblad met **Ctrl+R**. Gebruik **Ctrl+Shift+R** als Chrome nog oude scripts of sprites toont.

| Bediening | Actie |
| --- | --- |
| WASD of pijltjes | Lopen en richten |
| E | De actie uitvoeren die boven de speler staat |
| Tab / B | Inventaris openen. Tab doorloopt de knoppen en sluit na de laatste knop. B en Esc sluiten direct. |
| J / K | Slaan met de linkerhand / rechterhand |
| Spatie | Vonkje een vuurbal laten schieten |
| 1 / 2 / 3, daarna F | Buiten hek, vloer of houten fakkel selecteren en plaatsen. Esc wist de selectie. De bouwknoppen doen hetzelfde. |

Kies een wapen in de rugzak en wijs het toe aan een hand. Klik op pantser of op de drakenhanger om die direct uit te rusten. Klik op een gevuld uitrustingsslot om het item terug te leggen. Uitrusting neemt een eigen slot in. In de rugzak deelt een stapel van hetzelfde itemtype één plek. Klik op een potion om maximaal één hartje te herstellen. De genezende potion in de dungeon werkt bij aanraking.

Pantser vermindert de schade van slimes met ⅛ hart per punt verdediging, tot minimaal een half hart schade per treffer. De koperen speer reikt verder en heeft een langere afkoeltijd dan een zwaard. De koperen drakenhanger verlaagt Vonkjes oplaadtijd van 1 naar 0,8 seconde.

## Hout en mijnbouw

Kijk naar een boom en gebruik **E** drie keer met een bijl in je rugzak of hand. Pak het gevallen hout op met **E**. Maak bij de werkbank voor 4 hout een houten houweel en draag het in je rugzak. In de open plek ten zuiden van het grottenpad kun je grijze stenen en koperaders op dezelfde manier delven. Een volle rugzak laat de stapel liggen. Ook na herladen blijft niet-opgepakte buit buiten op dezelfde plek liggen.

## Werkbank en opbergkist

Repareer de huisdeur met 6 hout. Binnen staat de werkbank links van het bed en de opbergkist rechts. Open ze met **E** en sluit ze met **E** of **Esc**. De fakkel kost 2 hout bij de werkbank. Buiten plaats je hem op een vrije grastegel. Hekken en vloeren maak je in de rugzak. Bij de werkbank maak je ook het houweel, stenen en koperen wapens, koperen pantser en de drakenhanger. De recepten tonen je voorraad en de vereiste hoeveelheid per ingrediënt.

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
- `js/input.js` koppelt de toetsen en de knoppen voor bouwen, volledig scherm, nieuw spel en respawn.
- `js/world.js` bevat de kaarten, gebiedsovergangen, botsingen, bouwtegels en E-acties.
- `js/sprites.js` laadt de PNG’s en kiest de animatieframes.
- `js/render.js` tekent de wereld en bevat de Canvas-reservesprites.
- `js/inventory.js` beheert de rugzak, houtvoorraad, recepten in `RECIPES`, uitrustingsslots en de opbergkist.
- `js/combat.js` regelt vuurbal, melee, schade en slijmloot. Pas wapenwaarden aan in `WEAPONS`, verdediging in `ARMOR` en de oplaadbonus in `PET_UPGRADES`.
- `js/save.js` leest oude saves en bewaart de nieuwe. Bouwwerken op gereserveerde tegels, zoals de nieuwe ertsplekken, schuiven op naar vrije grastegels.
- `styles/base.css`, `styles/game.css` en `styles/inventory.css` bevatten de algemene stijl, speelveld en rugzak.
