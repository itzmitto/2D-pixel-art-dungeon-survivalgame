"use strict";

const ITEMS = {
  wood: { label: "Wood" },
  stone: { label: "Stone" },
  copper: { label: "Copper ore" },
  potion: { label: "Potion" },
  gel: { label: "Slime gel" },
  axe: { label: "Axe", weapon: true },
  sword: { label: "Wooden sword", weapon: true },
  stoneSword: { label: "Stone sword", weapon: true },
  copperSword: { label: "Copper sword", weapon: true },
  copperSpear: { label: "Copper spear", weapon: true },
  copperHelmet: { label: "Copper helmet", slot: "helmet" },
  copperChestplate: { label: "Copper chestplate", slot: "chestplate" },
  copperBoots: { label: "Copper boots", slot: "boots" },
  copperPendant: { label: "Copper dragon charm", slot: "pet" },
  pickaxe: { label: "Wooden pickaxe", tool: true },
  fence: { label: "Fence" },
  floor: { label: "Floor tile" },
  torch: { label: "Wooden torch" },
};

const BAG_SLOTS = 27;
const HOTBAR_SLOTS = 9;
const CHEST_SLOTS = 27;
const EQUIPMENT_SLOTS = {
  left: { group: "hands", label: "Left hand · J" },
  right: { group: "hands", label: "Right hand · K" },
  helmet: { group: "armor", label: "Helmet" },
  chestplate: { group: "armor", label: "Chestplate" },
  boots: { group: "armor", label: "Boots" },
  pet: { group: "pet", label: "Vonkje’s charm" },
};

// Each row lists the exact slots required. An occupied cell may hold more than one batch.
const RECIPES = {
  bagCraft: {
    fence: [[["wood", 1], ["wood", 1]], [["wood", 1], ["wood", 1]]],
    floor: [[["wood", 1], ["wood", 1]], [null, null]],
    torch: [[["wood", 2], null], [null, null]],
  },
  benchCraft: {
    torch: [[null, ["wood", 2], null], [null, null, null], [null, null, null]],
    pickaxe: [[["wood", 1], ["wood", 1], ["wood", 1]], [null, ["wood", 1], null], [null, null, null]],
    stoneSword: [[null, ["stone", 1], null], [null, ["stone", 1], null], [null, ["wood", 1], null]],
    copperSword: [[null, ["copper", 1], null], [null, ["copper", 2], null], [null, ["wood", 1], null]],
    copperSpear: [[null, ["copper", 2], null], [null, ["wood", 1], null], [null, ["wood", 1], null]],
    copperHelmet: [[null, ["copper", 1], null], [null, null, null], [null, null, null]],
    copperChestplate: [[["copper", 1], null, ["copper", 1]], [null, null, null], [null, null, null]],
    copperBoots: [[null, null, null], [null, null, null], [null, ["copper", 1], null]],
    copperPendant: [[null, ["wood", 1], null], [null, ["copper", 1], null], [null, null, null]],
  },
};

const stage = document.querySelector(".stage");
const backpack = document.querySelector("#backpack");
const backpackToggle = document.querySelector("#backpack-toggle");
const closeBackpack = document.querySelector("#close-backpack");
const craftOutput = document.querySelector("#craft-output");
const heldDisplay = document.querySelector("#held-stack");
const drinkPotionButton = document.querySelector("#drink-potion");
const recoverButton = document.querySelector("#recover-overflow");
const slotViews = [];
let hotbarNameTimer;

function stackLimit(item) {
  const definition = ITEMS[item];
  return definition.weapon || definition.tool || definition.slot ? 1 : 64;
}

// All target grids are searched for matching stacks before any free slot is used.
function insertStack(grids, { item, count }) {
  for (const fillEmpty of [false, true]) {
    for (const grid of grids) {
      for (let i = 0; count > 0 && i < grid.length; i++) {
        const current = grid[i];
        if (fillEmpty ? current : current?.item !== item) continue;
        const added = Math.min(count, stackLimit(item) - (current?.count || 0));
        if (!added) continue;
        grid[i] = { item, count: (current?.count || 0) + added };
        count -= added;
      }
    }
  }
  return count;
}

function playerGrids(state = progress) {
  return [state.bag, state.hotbar];
}

function itemCount(item) {
  return playerGrids().flat().reduce((total, stack) => total + (stack?.item === item ? stack.count : 0), 0);
}

function removeItem(item, count) {
  if (itemCount(item) < count) return false;
  for (const grid of playerGrids()) {
    for (let i = 0; count && i < grid.length; i++) {
      const stack = grid[i];
      if (stack?.item !== item) continue;
      const taken = Math.min(count, stack.count);
      grid[i] = smallerStack(stack, taken);
      count -= taken;
    }
  }
  return true;
}

function addItem(item, count) {
  const grids = playerGrids().map(grid => grid.slice());
  if (insertStack(grids, { item, count })) return false;
  [progress.bag, progress.hotbar] = grids;
  return true;
}

function getSlot({ area, index }, state = progress) {
  if (area !== "equipment") return state[area][index];
  const item = state[EQUIPMENT_SLOTS[index].group][index];
  return item ? { item, count: 1 } : null;
}

function setSlot({ area, index }, stack, state = progress) {
  if (area === "equipment") state[EQUIPMENT_SLOTS[index].group][index] = stack?.item || null;
  else state[area][index] = stack;
}

function acceptsSlot({ area, index }, item) {
  if (area !== "equipment") return true;
  return index === "left" || index === "right" ? Boolean(ITEMS[item].weapon) : ITEMS[item].slot === index;
}

function smallerStack(stack, count) {
  return stack.count > count ? { item: stack.item, count: stack.count - count } : null;
}

function slotAction(target, single = false) {
  const current = getSlot(target);
  const held = progress.held;
  if (!held) {
    if (!current) return;
    const count = single ? Math.ceil(current.count / 2) : current.count;
    progress.held = { item: current.item, count, source: target };
    setSlot(target, smallerStack(current, count));
  } else {
    if (!acceptsSlot(target, held.item)) {
      panelMessage("That item does not fit in this equipment slot.");
      return;
    }
    if (current && current.item !== held.item) {
      if (single) return;
      if (held.source && !acceptsSlot(held.source, current.item)) {
        panelMessage("The other item does not fit in the source slot.");
        return;
      }
      setSlot(target, { item: held.item, count: held.count });
      progress.held = { ...current, source: target };
    } else {
      const added = Math.min(single ? 1 : held.count, stackLimit(held.item) - (current?.count || 0));
      if (!added) return;
      setSlot(target, { item: held.item, count: (current?.count || 0) + added });
      progress.held = held.count > added ? { ...held, count: held.count - added } : null;
    }
  }
  inventoryChanged();
}

function quickTransfer(source) {
  if (progress.panelMode !== "chest" || !["bag", "hotbar", "chest"].includes(source.area)) return;
  const stack = getSlot(source);
  if (!stack) return;
  const grids = source.area === "chest" ? playerGrids() : [progress.chest];
  const remaining = insertStack(grids, stack);
  if (remaining === stack.count) {
    panelMessage(source.area === "chest" ? "Backpack and hotbar are full." : "The chest is full.");
    return;
  }
  setSlot(source, remaining ? { item: stack.item, count: remaining } : null);
  inventoryChanged();
  if (remaining) panelMessage("Moved " + (stack.count - remaining) + ". The rest stayed in its slot.");
}

function craftingArea() {
  if (progress.panelMode === "workbench") return "benchCraft";
  return progress.panelMode === "bag" ? "bagCraft" : null;
}

function matchingRecipe(area = craftingArea()) {
  if (!area) return null;
  const grid = progress[area];
  for (const [item, rows] of Object.entries(RECIPES[area])) {
    const cells = rows.flat();
    if (cells.every((cell, i) => cell
      ? grid[i]?.item === cell[0] && grid[i].count >= cell[1]
      : !grid[i])) return { item, cells };
  }
  return null;
}

function takeCraftOutput() {
  panelMessage("");
  const area = craftingArea();
  const recipe = matchingRecipe(area);
  if (!recipe) return;
  const held = progress.held;
  if (held && (held.item !== recipe.item || held.count >= stackLimit(recipe.item))) {
    panelMessage("Free your cursor stack before taking this output.");
    return;
  }
  recipe.cells.forEach((cell, i) => {
    if (cell) progress[area][i] = smallerStack(progress[area][i], cell[1]);
  });
  progress.held = { item: recipe.item, count: (held?.count || 0) + 1, source: held?.source || null };
  inventoryChanged();
}

function planReturnedItems(preferSource) {
  const state = { ...progress };
  for (const key of ["bag", "hotbar", "chest", "hands", "armor", "pet"]) {
    state[key] = Array.isArray(progress[key]) ? progress[key].slice() : { ...progress[key] };
  }

  const held = progress.held;
  if (held) {
    let remaining = held.count;
    const source = held.source;
    const storageSource = source && !["bagCraft", "benchCraft"].includes(source.area);
    if (storageSource && (preferSource || source.area === "equipment") && acceptsSlot(source, held.item)) {
      const current = getSlot(source, state);
      if (!current || current.item === held.item) {
        const existing = current?.count || 0;
        const returned = Math.min(remaining, stackLimit(held.item) - existing);
        if (returned) setSlot(source, { item: held.item, count: existing + returned }, state);
        remaining -= returned;
      }
    }
    const grids = playerGrids(state);
    if (progress.panelMode === "chest") grids.push(state.chest);
    if (remaining && insertStack(grids, { item: held.item, count: remaining })) return false;
  }

  for (const key of ["bagCraft", "benchCraft"]) {
    for (const stack of progress[key]) {
      if (stack && insertStack(playerGrids(state), stack)) return false;
    }
    state[key] = Array(progress[key].length).fill(null);
  }
  return state;
}

function returnPendingItems() {
  const state = planReturnedItems(true) || planReturnedItems(false);
  if (!state) return false;
  Object.assign(progress, state, { held: null, panelMode: null });
  return true;
}

function inventoryOpen() {
  return !backpack.hidden;
}

function inventoryPausesWorld() {
  return inventoryOpen() && progress.panelMode !== "bag";
}

function openInventory(mode = "bag") {
  if (inventoryOpen() && progress.panelMode !== mode && !closeInventory(false)) return;
  progress.panelMode = mode;
  const area = craftingArea();
  document.querySelector("#panel-title").textContent = { bag: "Inventory", chest: "House chest", workbench: "Workbench" }[mode];
  document.querySelector("#chest-section").hidden = mode !== "chest";
  document.querySelector("#craft-section").hidden = !area;
  if (area) {
    const size = area === "bagCraft" ? 2 : 3;
    document.querySelector("#craft-title").textContent = size + " × " + size + " crafting";
    document.querySelector("#craft-grid").dataset.size = String(size);
    renderRecipeGuide(area);
  }
  document.querySelector("#recipe-guide").open = false;
  panelMessage("");
  backpack.hidden = false;
  stage.dataset.panel = mode;
  backpackToggle.setAttribute("aria-expanded", "true");
  swing = undefined;
  updateInventory();
  closeBackpack.focus();
}

function openHousePanel(mode) {
  openInventory(mode);
}

function closeInventory(focus = true) {
  if (!inventoryOpen()) return true;
  if (!returnPendingItems()) {
    panelMessage("Make space in storage for the held stack and crafting ingredients before closing.");
    return false;
  }
  backpack.hidden = true;
  delete stage.dataset.panel;
  backpackToggle.setAttribute("aria-expanded", "false");
  inventoryChanged();
  if (focus) backpackToggle.focus();
  return true;
}

function resumeInventory() {
  if (progress.held || progress.bagCraft.some(Boolean) || progress.benchCraft.some(Boolean)) {
    const mode = progress.panelMode || (progress.benchCraft.some(Boolean) ? "workbench" : "bag");
    if (mode !== "bag") enterArea("house", player.hearts, stationResume[mode]);
    openInventory(mode);
    panelMessage("Your unfinished inventory changes were restored.");
  } else {
    progress.panelMode = null;
    backpack.hidden = true;
    delete stage.dataset.panel;
    backpackToggle.setAttribute("aria-expanded", "false");
    updateInventory();
  }
}

function recoverOverflow() {
  for (const location of ["bag", "chest"]) {
    if (location === "chest" && progress.panelMode !== "chest") continue;
    const grids = location === "bag" ? playerGrids() : [progress.chest];
    for (const [item, count] of Object.entries(progress.overflow[location])) {
      const remaining = insertStack(grids, { item, count });
      if (remaining) progress.overflow[location][item] = remaining;
      else delete progress.overflow[location][item];
    }
  }
  inventoryChanged();
  if (recoverButton.hidden) closeBackpack.focus();
  panelMessage(recoverButton.hidden ? "Saved items recovered." : "Make more room to recover the remaining saved items.");
}

function drinkPotion() {
  if (player.hearts >= 3 || !removeItem("potion", 1)) return;
  player.hearts = Math.min(3, player.hearts + 1);
  storeProgress();
  updateHud();
  if (drinkPotionButton.disabled) closeBackpack.focus();
  panelMessage("Potion used.");
}

function inventoryChanged() {
  storeProgress();
  updateInventory();
  updateFireballStatus();
}

function panelMessage(message) {
  document.querySelector("#panel-feedback").textContent = message;
}

function describeItem(item) {
  const label = ITEMS[item].label;
  const weapon = WEAPONS[item];
  if (weapon) return label + " · " + weapon.damage + " damage · range " + weapon.range +
    " · " + formatNumber(weapon.cooldown) + " s";
  if (ARMOR[item]) return label + " · " + ARMOR[item] + " defense";
  if (PET_UPGRADES[item]) return label + " · " + formatNumber(PET_UPGRADES[item]) + " s faster recharge";
  return label;
}

function stackIcon(item) {
  const icon = document.createElement("img");
  icon.className = "slot-icon";
  icon.src = "./images/items/" + item + ".png";
  icon.alt = "";
  icon.draggable = false;
  return icon;
}

function paintStack(element, stack, number = "", label = "Slot", showQuantity = false) {
  const tag = stack ? stack.item + ":" + stack.count : "";
  if (element.dataset.stack !== tag) {
    element.dataset.stack = tag;
    element.replaceChildren();
    if (number) {
      const keyLabel = document.createElement("span");
      keyLabel.className = "slot-number";
      keyLabel.textContent = number;
      element.append(keyLabel);
    }
    if (stack) {
      element.append(stackIcon(stack.item));
      if (showQuantity || stack.count > 1) {
        const quantity = document.createElement("span");
        quantity.className = "slot-count";
        quantity.textContent = stack.count;
        element.append(quantity);
      }
    }
  }
  element.title = stack ? describeItem(stack.item) + (showQuantity || stack.count > 1 ? " × " + stack.count : "") : label + " · Empty";
  element.setAttribute("aria-label", label + (stack ? " · " + element.title : " · Empty"));
}

function renderRecipeGuide(area) {
  const list = document.querySelector("#recipe-list");
  list.replaceChildren();
  for (const [item, rows] of Object.entries(RECIPES[area])) {
    const card = document.createElement("div");
    card.className = "recipe-card";
    const name = document.createElement("strong");
    name.textContent = ITEMS[item].label;
    const pattern = document.createElement("div");
    pattern.className = "recipe-pattern";
    pattern.dataset.size = String(rows.length);
    rows.flat().forEach((cell, index) => {
      const square = document.createElement("span");
      square.className = "recipe-cell";
      paintStack(square, cell ? { item: cell[0], count: cell[1] } : null, "", "Cell " + (index + 1), true);
      pattern.append(square);
    });
    card.append(name, pattern);
    list.append(card);
  }
}

function selectedStack() {
  return progress.hotbar[progress.selectedHotbar];
}

function selectHotbar(index) {
  progress.selectedHotbar = index;
  storeProgress();
  updateInventory();
  const name = document.querySelector("#hotbar-name");
  const stack = selectedStack();
  name.textContent = stack ? ITEMS[stack.item].label : "Empty slot " + (index + 1);
  name.hidden = false;
  window.clearTimeout(hotbarNameTimer);
  hotbarNameTimer = window.setTimeout(() => { name.hidden = true; }, 1100);
}

function updateInventory() {
  document.querySelector("#wood").textContent = "Wood " + itemCount("wood");
  updateBuildControls();
  for (const [hand, shortcut] of [["left", "J"], ["right", "K"]]) {
    document.querySelector("#hud-" + hand + "-hand").textContent = shortcut + " · " +
      (ITEMS[progress.hands[hand]]?.label || "Empty");
  }

  const craftArea = craftingArea();
  for (const { button, target, number, label, hud, crafting } of slotViews) {
    if (!hud && !inventoryOpen()) continue;
    if (crafting) {
      button.hidden = target.index >= (craftArea ? progress[craftArea].length : 0);
      if (button.hidden) continue;
      target.area = craftArea;
    }
    if (target.area === "hotbar") {
      button.setAttribute("aria-pressed", String(target.index === progress.selectedHotbar));
    }
    paintStack(button, getSlot(target), number, label);
  }
  heldDisplay.hidden = !inventoryOpen() || !progress.held;
  if (!inventoryOpen()) return;

  document.querySelector("#bag-capacity").textContent = progress.bag.filter(Boolean).length + " / " + BAG_SLOTS;
  document.querySelector("#armor-total").textContent = "Defense " + totalDefense();
  document.querySelector("#pet-recharge").textContent = "Fireball recharge " + formatNumber(fireballRecharge()) + " s";
  const output = matchingRecipe(craftArea);
  paintStack(craftOutput, output ? { item: output.item, count: 1 } : null, "", "Crafting output");
  craftOutput.setAttribute("aria-disabled", String(!output));
  const held = progress.held;
  paintStack(heldDisplay, held, "", "Held stack");
  drinkPotionButton.disabled = player.hearts >= 3 || !itemCount("potion");
  recoverButton.hidden = !Object.keys(progress.overflow.bag).length &&
    !(progress.panelMode === "chest" && Object.keys(progress.overflow.chest).length);
  drawKnightPreview();
}

function registerSlot(parent, target, label, options = {}) {
  const { hud = false, crafting = false, number = "" } = options;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "slot";
  parent.append(button);
  // The crafting view reuses its buttons, but held stacks keep their original slot reference.
  const act = (single, quick = false) => {
    if (hud) selectHotbar(target.index);
    else if (inventoryOpen()) {
      panelMessage("");
      if (quick && progress.panelMode === "chest") quickTransfer({ ...target });
      else slotAction({ ...target }, single);
    }
  };
  button.addEventListener("click", event => act(false, event.shiftKey));
  if (!hud) {
    button.addEventListener("contextmenu", event => {
      event.preventDefault();
      act(true);
    });
    button.addEventListener("keydown", event => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.toLowerCase() === "r" && !event.repeat) {
        event.preventDefault();
        act(true);
      }
      if (!parent.classList.contains("slot-grid")) return;
      const columns = Number(parent.dataset.size) || HOTBAR_SLOTS;
      const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[event.key];
      if (!delta) return;
      event.preventDefault();
      const next = parent.children[target.index + delta];
      if (next && !next.hidden) next.focus();
    });
  }
  slotViews.push({ button, target, label, number, hud, crafting });
}

function bindInventory() {
  backpackToggle.addEventListener("click", () => inventoryOpen() ? closeInventory() : openInventory());
  closeBackpack.addEventListener("click", () => closeInventory());
  recoverButton.addEventListener("click", recoverOverflow);
  drinkPotionButton.addEventListener("click", drinkPotion);
  craftOutput.addEventListener("click", takeCraftOutput);
  craftOutput.addEventListener("contextmenu", event => {
    event.preventDefault();
    takeCraftOutput();
  });
  document.addEventListener("pointermove", event => {
    if (!inventoryOpen()) return;
    heldDisplay.style.left = Math.min(event.clientX, window.innerWidth - 64) + "px";
    heldDisplay.style.top = Math.min(event.clientY, window.innerHeight - 64) + "px";
  });
  const grids = [
    ["bag", BAG_SLOTS, "bag-items", "Backpack"],
    ["chest", CHEST_SLOTS, "chest-slots", "Chest"],
    ["hotbar", HOTBAR_SLOTS, "inventory-hotbar", "Hotbar"],
    ["hotbar", HOTBAR_SLOTS, "hud-hotbar", "Hotbar"],
    ["benchCraft", 9, "craft-grid", "Ingredient"],
  ];
  for (const [area, count, id, name] of grids) {
    const grid = document.querySelector("#" + id);
    for (let index = 0; index < count; index++) {
      registerSlot(grid, { area, index }, name + " " + (index + 1), {
        hud: id === "hud-hotbar", crafting: id === "craft-grid", number: area === "hotbar" ? String(index + 1) : "",
      });
    }
  }
  const equipment = document.querySelector("#equipment-slots");
  for (const [index, { label }] of Object.entries(EQUIPMENT_SLOTS)) {
    const wrapper = document.createElement("div");
    wrapper.className = "equipment-slot";
    const title = document.createElement("span");
    title.textContent = label;
    wrapper.append(title);
    registerSlot(wrapper, { area: "equipment", index }, label);
    equipment.append(wrapper);
  }
}
