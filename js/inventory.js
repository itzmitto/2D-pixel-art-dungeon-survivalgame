"use strict";

const ITEMS = {
  wood: { label: "Hout" },
  stone: { label: "Steen" },
  copper: { label: "Kopererts" },
  potion: { label: "Potion" },
  gel: { label: "Slijmgel" },
  axe: { label: "Bijl", weapon: true },
  sword: { label: "Houten zwaard", weapon: true },
  stoneSword: { label: "Stenen zwaard", weapon: true },
  copperSword: { label: "Koperen zwaard", weapon: true },
  copperSpear: { label: "Koperen speer", weapon: true },
  copperHelmet: { label: "Koperen helm", slot: "helmet" },
  copperChestplate: { label: "Koperen borstplaat", slot: "chestplate" },
  copperBoots: { label: "Koperen laarzen", slot: "boots" },
  copperPendant: { label: "Koperen drakenhanger", slot: "pet" },
  pickaxe: { label: "Houten houweel" },
  fence: { label: "Hek" },
  floor: { label: "Vloer" },
  torch: { label: "Houten fakkel" },
};

const RECIPES = {
  fence: { wood: 4 },
  floor: { wood: 2 },
  torch: { wood: 2 },
  pickaxe: { wood: 4 },
  stoneSword: { wood: 1, stone: 2 },
  copperSword: { wood: 1, copper: 3 },
  copperSpear: { wood: 2, copper: 2 },
  copperHelmet: { copper: 1 },
  copperChestplate: { copper: 2 },
  copperBoots: { copper: 1 },
  copperPendant: { wood: 1, copper: 1 },
};
const BAG_RECIPES = ["fence", "floor"];
const BAG_SLOTS = 6;
const CHEST_SLOTS = 8;
const EQUIPMENT_SLOTS = {
  left: { group: "hands", label: "Linkerhand · J", id: "left-hand" },
  right: { group: "hands", label: "Rechterhand · K", id: "right-hand" },
  helmet: { group: "armor", label: "Helm", id: "helmet" },
  chestplate: { group: "armor", label: "Borstplaat", id: "chestplate" },
  boots: { group: "armor", label: "Laarzen", id: "boots" },
  pet: { group: "pet", label: "Hanger", id: "pet-slot" },
};
const housePanel = document.querySelector("#house-panel");
const closeHouseButton = document.querySelector("#close-house-panel");
const backpack = document.querySelector("#backpack");
const backpackToggle = document.querySelector("#backpack-toggle");
const bagItems = document.querySelector("#bag-items");
const equipChoices = document.querySelector("#equip-choices");
const equipButtons = { left: document.querySelector("#equip-left"), right: document.querySelector("#equip-right") };
const recipeButtons = {};
let houseMode, selectedWeapon;

function itemCount(item) {
  return progress.bag[item] || 0;
}

function changeItem(item, amount, bag = progress.bag) {
  const count = (bag[item] || 0) + amount;
  if (count > 0) bag[item] = count;
  else delete bag[item];
}

function hasRoom(container, capacity, item) {
  return Boolean(container[item]) || Object.keys(container).length < capacity;
}

function addItem(item, amount) {
  if (!hasRoom(progress.bag, BAG_SLOTS, item)) return false;
  changeItem(item, amount);
  return true;
}

function inventoryOpen() {
  return !backpack.hidden || !housePanel.hidden;
}

function openHousePanel(mode) {
  houseMode = mode;
  pressed.clear();
  housePanel.hidden = false;
  document.querySelector("#house-title").textContent = mode === "chest" ? "Opbergkist" : "Werkbank";
  document.querySelector("#workbench-recipes").hidden = mode !== "workbench";
  document.querySelector("#chest-contents").hidden = mode !== "chest";
  updateInventory();
  closeHouseButton.focus();
}

function closeHousePanel() {
  if (housePanel.hidden) return;
  houseMode = undefined;
  housePanel.hidden = true;
  updateBuildControls();
  backpackToggle.focus();
}

function toggleBackpack(open = backpack.hidden, focus = true) {
  if (open) closeHousePanel();
  backpack.hidden = !open;
  backpackToggle.setAttribute("aria-expanded", String(open));
  selectedWeapon = undefined;
  pressed.clear();
  updateInventory();
  if (focus) (open ? document.querySelector("#close-backpack") : backpackToggle).focus();
}

function describeItem(item) {
  const definition = ITEMS[item];
  if (!definition) return "Leeg";
  const weapon = WEAPONS[item];
  if (weapon) return definition.label + " · " + weapon.damage + " schade · bereik " + weapon.range +
    " · " + formatNumber(weapon.cooldown) + " s";
  if (ARMOR[item]) return definition.label + " · " + ARMOR[item] + " verdediging";
  if (PET_UPGRADES[item]) return definition.label + " · " + formatNumber(PET_UPGRADES[item]) + " s sneller";
  return definition.label;
}

function updateInventory() {
  document.querySelector("#wood").textContent = "Hout " + itemCount("wood");
  updateBuildControls();
  for (const [hand, shortcut] of [["left", "J"], ["right", "K"]]) {
    const item = progress.hands[hand];
    document.querySelector("#hud-" + hand + "-hand").textContent = shortcut + " · " + (ITEMS[item]?.label || "Leeg");
  }
  for (const [item, button] of Object.entries(recipeButtons)) {
    const ingredients = Object.entries(RECIPES[item]);
    button.textContent = "Maak " + describeItem(item) + " · " +
      ingredients.map(([material, cost]) => ITEMS[material].label + " " + itemCount(material) + "/" + cost).join(" · ");
    button.disabled = phase !== "playing" || ingredients.some(([material, cost]) => itemCount(material) < cost);
  }
  if (houseMode === "chest") updateChest();
  if (backpack.hidden) return;

  document.querySelector("#bag-capacity").textContent =
    "Rugzak · " + Object.keys(progress.bag).length + " / " + BAG_SLOTS + " plekken";
  document.querySelector("#armor-total").textContent = "Pantser · " + totalDefense() + " verdediging";
  document.querySelector("#pet-recharge").textContent = "Vonkje · " + formatNumber(fireballRecharge()) + " s oplaadtijd";
  for (const [slot, { group, label, id }] of Object.entries(EQUIPMENT_SLOTS)) {
    const item = progress[group][slot];
    const button = document.querySelector("#" + id);
    button.textContent = label + " · " + describeItem(item);
    button.disabled = !item || phase !== "playing";
    button.title = item ? "Leg terug in de rugzak" : "";
  }

  bagItems.replaceChildren();
  for (const [item, count] of Object.entries(progress.bag)) {
    const { weapon, slot } = ITEMS[item];
    const element = document.createElement(weapon || slot || item === "potion" ? "button" : "span");
    element.textContent = describeItem(item) + " × " + count;
    element.dataset.item = item;
    if (weapon) {
      element.type = "button";
      element.setAttribute("aria-pressed", String(selectedWeapon === item));
      element.addEventListener("click", () => {
        selectedWeapon = item;
        updateInventory();
        equipButtons.left.focus();
      });
    } else if (slot) {
      element.type = "button";
      element.textContent += " · Draag";
      element.addEventListener("click", () => changeEquipment(slot, item));
    } else if (item === "potion") {
      element.type = "button";
      element.textContent += " · Drink";
      element.disabled = player.hearts === 3 || phase !== "playing";
      element.addEventListener("click", () => {
        if (phase !== "playing" || player.hearts === 3 || !itemCount("potion")) return;
        changeItem("potion", -1);
        player.hearts = Math.min(3, player.hearts + 1);
        storeProgress();
        updateHud();
        (bagItems.querySelector('[data-item="potion"]:enabled') || document.querySelector("#close-backpack")).focus();
        showFeedback("Potion gedronken");
      });
    }
    bagItems.append(element);
  }
  equipChoices.hidden = !selectedWeapon;
}

function changeEquipment(slot, item = null) {
  const { group, id } = EQUIPMENT_SLOTS[slot];
  const old = progress[group][slot];
  if (phase !== "playing" || old === item) return;
  if (item && (!itemCount(item) || (group === "hands" ? !ITEMS[item].weapon : ITEMS[item].slot !== slot))) return;
  const bag = { ...progress.bag };
  if (item) changeItem(item, -1, bag);
  if (old && !hasRoom(bag, BAG_SLOTS, old)) {
    showFeedback("Rugzak vol · " + ITEMS[old].label + " blijft uitgerust.");
    return;
  }
  if (old) changeItem(old, 1, bag);
  progress.bag = bag;
  progress[group][slot] = item;
  selectedWeapon = undefined;
  storeProgress();
  updateInventory();
  updateFireballStatus();
  const next = item ? document.querySelector("#" + id) : bagItems.querySelector('[data-item="' + old + '"]');
  next?.focus();
  showFeedback(item ? ITEMS[item].label + " uitgerust." : ITEMS[old].label + " terug in rugzak.");
}

function craft(item) {
  const recipe = RECIPES[item];
  if (phase !== "playing" || !recipe ||
      (!BAG_RECIPES.includes(item) && (area !== "house" || houseMode !== "workbench"))) return false;
  const ingredients = Object.entries(recipe);
  if (ingredients.some(([material, cost]) => itemCount(material) < cost)) return false;

  const bag = { ...progress.bag };
  for (const [material, cost] of ingredients) changeItem(material, -cost, bag);
  if (!hasRoom(bag, BAG_SLOTS, item)) {
    showFeedback("Rugzak vol.");
    return false;
  }
  changeItem(item, 1, bag);
  progress.bag = bag;
  storeProgress();
  updateInventory();
  if (recipeButtons[item]?.disabled) {
    (BAG_RECIPES.includes(item) ? document.querySelector("#close-backpack") : closeHouseButton).focus();
  }
  showFeedback(ITEMS[item].label + " gemaakt.");
  return true;
}

function updateChest() {
  const sides = [
    { container: progress.bag, capacity: BAG_SLOTS, title: "Rugzak", id: "chest-bag-items", toChest: true },
    { container: progress.chest, capacity: CHEST_SLOTS, title: "Kist", id: "chest-slots", toChest: false },
  ];
  for (const { container, capacity, title, id, toChest } of sides) {
    const list = document.querySelector("#" + id);
    const entries = Object.entries(container);
    list.previousElementSibling.textContent = title + " · " + entries.length + " / " + capacity;
    list.replaceChildren();
    for (const [item, count] of entries) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = describeItem(item) + " × " + count;
      const destination = toChest ? "kist" : "rugzak";
      button.title = "Verplaats stapel naar " + destination;
      button.setAttribute("aria-label", button.textContent + " · naar " + destination);
      button.addEventListener("click", () => {
        if (transferStack(item, toChest)) {
          const otherList = document.querySelector(toChest ? "#chest-slots" : "#chest-bag-items");
          otherList.querySelector('[data-item="' + item + '"]').focus();
        }
      });
      button.dataset.item = item;
      list.append(button);
    }
    for (let slot = entries.length; slot < capacity; slot++) {
      const empty = document.createElement("span");
      empty.textContent = "Leeg";
      list.append(empty);
    }
  }
}

function transferStack(item, toChest) {
  if (phase !== "playing" || area !== "house" || houseMode !== "chest") return false;
  const source = toChest ? progress.bag : progress.chest;
  const destination = toChest ? progress.chest : progress.bag;
  const count = source[item];
  if (!count) return false;
  const capacity = toChest ? CHEST_SLOTS : BAG_SLOTS;
  if (!hasRoom(destination, capacity, item)) {
    showFeedback(toChest ? "Kist vol." : "Rugzak vol.");
    return false;
  }
  destination[item] = (destination[item] || 0) + count;
  delete source[item];
  storeProgress();
  updateInventory();
  showFeedback(ITEMS[item].label + (toChest ? " naar de kist." : " naar de rugzak."));
  return true;
}


function bindInventory() {
  closeHouseButton.addEventListener("click", closeHousePanel);
  backpackToggle.addEventListener("click", () => toggleBackpack());
  document.querySelector("#close-backpack").addEventListener("click", () => toggleBackpack(false));
  for (const [slot, { id }] of Object.entries(EQUIPMENT_SLOTS)) {
    document.querySelector("#" + id).addEventListener("click", () => changeEquipment(slot));
  }
  for (const [hand, button] of Object.entries(equipButtons)) {
    button.addEventListener("click", () => {
      if (selectedWeapon) changeEquipment(hand, selectedWeapon);
    });
  }
  for (const item of Object.keys(RECIPES)) {
    const button = document.createElement("button");
    button.type = "button";
    button.addEventListener("click", () => craft(item));
    recipeButtons[item] = button;
    document.querySelector(BAG_RECIPES.includes(item) ? "#bag-recipes" : "#workbench-recipes").append(button);
  }
}
