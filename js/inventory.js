"use strict";

const ITEMS = {
  wood: { label: "Hout" },
  potion: { label: "Potion" },
  axe: { label: "Bijl", weapon: true },
  sword: { label: "Houten zwaard", weapon: true },
  fence: { label: "Hek", cost: 4, button: document.querySelector("#craft-fence") },
  floor: { label: "Vloer", cost: 2, button: document.querySelector("#craft-floor") },
  gel: { label: "Slijmgel" },
};
const BAG_SLOTS = 6;
const backpack = document.querySelector("#backpack");
const backpackToggle = document.querySelector("#backpack-toggle");
const bagItems = document.querySelector("#bag-items");
const weaponControls = document.querySelector("#weapon-controls");
const handLabels = { left: document.querySelector("#left-hand"), right: document.querySelector("#right-hand") };
const equipButtons = { left: document.querySelector("#equip-left"), right: document.querySelector("#equip-right") };
const unequipButton = document.querySelector("#unequip");
let selectedWeapon;

function itemCount(item) {
  return progress.bag[item] || 0;
}

// Elk itemtype neemt één plek in. Een uitgerust wapen blijft eigendom van de rugzak.
function changeItem(item, amount) {
  const count = itemCount(item) + amount;
  if (count > 0) progress.bag[item] = count;
  else delete progress.bag[item];
}

function addItem(item, amount) {
  if (!itemCount(item) && Object.keys(progress.bag).length >= BAG_SLOTS) return false;
  changeItem(item, amount);
  return true;
}

function toggleBackpack(open = backpack.hidden) {
  backpack.hidden = !open;
  backpackToggle.setAttribute("aria-expanded", String(open));
  if (open) pressed.clear();
  updateInventory();
}

function updateInventory() {
  document.querySelector("#wood").textContent = "Hout " + itemCount("wood");
  for (const [item, { label, cost, button }] of Object.entries(ITEMS)) {
    if (!button) continue;
    button.textContent = label + " maken · " + cost + " hout · " + itemCount(item) + " op zak";
    button.disabled = phase !== "playing" || itemCount("wood") < cost;
  }
  const selection = document.querySelector("#build-selection");
  selection.textContent = buildItem
    ? ITEMS[buildItem].label + " geselecteerd · F om te plaatsen · Esc om te stoppen"
    : "1 — Hek selecteren · 2 — Vloer selecteren";
  selection.hidden = area !== "forest";

  for (const [hand, element] of Object.entries(handLabels)) {
    const item = progress.hands[hand];
    const title = hand === "left" ? "Linkerhand · J" : "Rechterhand · K";
    element.textContent = title + " · " + (ITEMS[item]?.label || "Leeg");
  }
  if (backpack.hidden) return;
  document.querySelector("#bag-capacity").textContent =
    Object.keys(progress.bag).length + " / " + BAG_SLOTS + " plekken";
  bagItems.replaceChildren();
  for (const [item, definition] of Object.entries(ITEMS)) {
    if (!itemCount(item)) continue;
    const element = document.createElement(definition.weapon || item === "potion" ? "button" : "span");
    element.textContent = definition.label + (definition.weapon ? "" : " × " + itemCount(item));
    if (definition.weapon) {
      element.type = "button";
      element.setAttribute("aria-pressed", String(selectedWeapon === item));
      element.addEventListener("click", () => {
        selectedWeapon = item;
        updateInventory();
        equipButtons.left.focus();
      });
    } else if (item === "potion") {
      element.type = "button";
      element.textContent += " · Drink";
      element.disabled = player.hearts === 3 || phase !== "playing";
      element.addEventListener("click", () => {
        if (phase !== "playing" || player.hearts === 3 || !itemCount("potion")) return;
        changeItem("potion", -1);
        player.hearts++;
        storeProgress();
        updateHud();
        showFeedback("Potion gedronken · +1 hartje");
      });
    }
    bagItems.append(element);
  }
  weaponControls.hidden = !selectedWeapon;
  for (const [hand, button] of Object.entries(equipButtons)) {
    button.disabled = !selectedWeapon || progress.hands[hand] === selectedWeapon;
  }
  unequipButton.disabled = !selectedWeapon || !Object.values(progress.hands).includes(selectedWeapon);
}

function assignWeapon(hand) {
  if (!ITEMS[selectedWeapon]?.weapon || !itemCount(selectedWeapon)) return;
  for (const slot of ["left", "right"]) {
    if (progress.hands[slot] === selectedWeapon) progress.hands[slot] = null;
  }
  if (hand) progress.hands[hand] = selectedWeapon;
  storeProgress();
  updateInventory();
}

function craft(item) {
  const { label, cost } = ITEMS[item];
  const wood = itemCount("wood");
  if (phase !== "playing" || wood < cost) return;
  if (!itemCount(item) && wood > cost && Object.keys(progress.bag).length >= BAG_SLOTS) {
    showFeedback("Rugzak vol.");
    return;
  }
  changeItem("wood", -cost);
  addItem(item, 1);
  storeProgress();
  updateInventory();
  showFeedback(label + " gemaakt.");
}

function bindInventory() {
  backpackToggle.addEventListener("click", () => toggleBackpack());
  for (const [hand, button] of Object.entries(equipButtons)) {
    button.addEventListener("click", () => assignWeapon(hand));
  }
  unequipButton.addEventListener("click", () => assignWeapon(null));
  for (const [item, { button }] of Object.entries(ITEMS)) {
    button?.addEventListener("click", () => craft(item));
  }
}
