function loadImage(url) {
  let image = new Image();
  image.src = url;
  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject();
  });
}

function findGear(id) {
  return gears.find((e) => e["id"] === id);
}

function getGearInfo(gearId, unitType, slot, set, tier, lvl, relic) {
  return {
    gearId: gearId,
    unitType: unitType,
    slot: slot,
    set: set,
    tier: tier,
    lvl: lvl,
    relic: relic,
  };
}

function copy(gearInfo) {
  return getGearInfo(
    gearInfo.gearId,
    gearInfo.unitType,
    gearInfo.slot,
    gearInfo.set,
    gearInfo.tier,
    gearInfo.lvl,
    gearInfo.relic
  );
}

function drawGear(canvas, gearInfo, dx, dy, dw, dh) {
  let main = false;
  if (typeof canvas === "number") {
    main = true;
    let slot = canvas;
    canvas = document.getElementById("slots");
    gearInfo = slots[slot];
    dx = (canvas.width / 4) * slot;
    dy = 0;
    dw = canvas.width / 4;
    dh = canvas.height;
  } else {
    if (dx == undefined) dx = 0;
    if (dy == undefined) dy = 0;
    if (dw == undefined) dw = 250;
    if (dh == undefined) dh = 250;
  }
  let loads = [
    loadImage(`images/gear/${gearInfo.gearId}_${gearInfo.unitType}_${gearInfo.slot}`),
    loadImage(`images/set/${gearInfo.set}`),
    loadImage(`images/tier/t${gearInfo.tier}`),
  ];
  if (gearInfo.lvl > 0) loads.push(loadImage(`images/lvl/lvl_${gearInfo.lvl}`));
  var relic = findGear(gearInfo.gearId)["tier"] == 7;
  if (relic) loads.push(loadImage(`images/relic/relic_${gearInfo.relic}`));
  var key = `${dx},${dy},${dw},${dw},${dh}`;
  var id = seed++;
  if (canvas.dataset.lastDraw == undefined) canvas.dataset.lastDraw = "{}";
  let json = JSON.parse(canvas.dataset.lastDraw);
  json[key] = id;
  canvas.dataset.lastDraw = JSON.stringify(json);
  Promise.all(loads).then((images) => {
    let json = JSON.parse(canvas.dataset.lastDraw);
    if (json[key] != id) {
      console.log(`old promise! (key:${key},id:${id},now:${json[key]})`);
      return;
    }
    delete json[key];
    canvas.dataset.lastDraw = JSON.stringify(json);
    let context = canvas.getContext("2d");
    context.drawImage(background, dx, dy, dw, dh);
    context.drawImage(
      images[0],
      gearInfo.slot == 0
        ? dx + (249 * dw) / 250 - (((dw * 244) / 250) * images[0].width) / 256
        : dx + (5 * dw) / 250,
      dy + (124 * dh) / 250 - (((dh * 244) / 250) * images[0].height) / 256 / 2,
      (((dw * 244) / 250) * images[0].width) / 256,
      (((dh * 244) / 250) * images[0].height) / 256
    );
    context.drawImage(
      images[1],
      dx + (170 * dw) / 250,
      dy + (1 * dh) / 250,
      (dw * 80) / 250,
      (dh * 80) / 250
    );
    context.drawImage(
      images[2],
      dx + (10 * dw) / 250,
      dy + (179 * dh) / 250,
      (dw * 53) / 250,
      (dh * 42) / 250
    );
    if (gearInfo.lvl > 0)
      context.drawImage(
        images[3],
        dx + (162 * dw) / 250,
        dy + (179 * dh) / 250,
        (dw * 88) / 250,
        (dh * 42) / 250
      );
    if (relic)
      context.drawImage(
        images[gearInfo.lvl > 0 ? 4 : 3],
        dx + (171 * dw) / 250,
        dy + (71 * dh) / 250,
        (dw * 78) / 250,
        (dh * 70) / 250
      );
    if (main)
      document.getElementById("download").parentElement.href = canvas.toDataURL("images/png");
  });
}

const RELIC_STR = "00111223333";
var seed = 0;
var gears;
var sets;
var presets;
var background;
var prevType;
var prevSlot;
var prevSub;
var selectedType = "c";
var selectedSlot = 0;
var slots = [];

Promise.all([
  window.onload,
  fetch("jsons/gears.json").then((res) => res.json()),
  fetch("jsons/sets.json").then((res) => res.json()),
  fetch("jsons/presets.json").then((res) => res.json()),
  loadImage("images/background"),
]).then((result) => {
  gears = result[1];
  sets = result[2];
  presets = result[3];
  background = result[4];
  document.getElementById("copy").onclick = () => {
    document.getElementById("slots").toBlob((blob) => {
      try {
        navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        alert("복사되었습니다.");
      } catch (error) {
        alert("복사하지 못했습니다. 다운로드 기능을 이용해주세요.");
      }
    }, "image/png");
  };
  let typeSelect = document.getElementById("typeSelect");
  typeSelect.onchange = () => {
    selectedType = typeSelect.value;
    for (let i = 0; i < 4; i++) {
      if (selectedSlot == i) continue;
      slots[i].unitType = selectedType;
      updateSettings(i);
      drawGear(i);
    }
    slots[selectedSlot].unitType = selectedType;
    updateSettings(selectedSlot);
    drawGear(selectedSlot);
    updatePresets();
  };
  let slotSelect = document.getElementById("slotSelect");
  slotSelect.onchange = () => {
    let value = parseInt(slotSelect.value);
    if (value < 2) {
      subSelect.hidden = true;
    } else {
      subSelect.hidden = false;
    }
    selectedSlot = value;
    updateSettings();
  };
  let gearSelect = document.getElementById("gearSelect");
  gearSelect.onchange = () => {
    slots[selectedSlot].gearId = gearSelect.value;
    updateSettings();
    drawGear(selectedSlot);
  };
  let subSelect = document.getElementById("subSelect");
  subSelect.onchange = () => {
    if (selectedSlot < 2) return;
    slots[selectedSlot].slot = subSelect.value === "a" ? 2 : 3;
    updateSettings();
    drawGear(selectedSlot);
  };
  let setSelect = document.getElementById("setSelect");
  setSelect.onchange = () => {
    slots[selectedSlot].set = setSelect.value;
    drawGear(selectedSlot);
  };
  let tierInputs = document.querySelectorAll("#tierSelect > input");
  for (let i = 0; i < 3; i++) {
    let tier = i + 5;
    tierInputs[i].onclick = () => {
      slots[selectedSlot].tier = tier;
      updateTier(selectedSlot);
      drawGear(selectedSlot);
    };
  }
  let lvlInput = document.getElementById("lvlInput");
  lvlInput.onchange = () => {
    if (lvlInput.value === "") lvlInput.value = 0;
    let lvl = Math.max(Math.min(lvlInput.value, 10), 0);
    lvlInput.value = lvl;
    slots[selectedSlot].lvl = lvl;
    slots[selectedSlot].relic = RELIC_STR[lvl];
    drawGear(selectedSlot);
  };
  let hover = document.getElementById("hover");
  let slotsCanvas = document.getElementById("slots");
  slotsCanvas.addEventListener("click", (e) => {
    let rect = slotsCanvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let slot = Math.max(Math.min(Math.floor((x / rect.width) * 4), 3), 0);
    slotSelect.value = slot;
    slotSelect.onchange();
    hover.style.background = "#ffffff00";
  });
  slotsCanvas.addEventListener("mousemove", (e) => {
    let rect = slotsCanvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let slot = Math.max(Math.min(Math.floor((x / rect.width) * 4), 3), 0);
    hover.style.left = `${rect.left + (slot * rect.width) / 4}px`;
    hover.style.width = `${rect.height}px`;
    hover.style.background = "#ffffff40";
  });
  slotsCanvas.addEventListener("mouseleave", () => (hover.style.background = "#ffffff00"));
  initPresets();
  let defaultPreset = presets.find((e) => e["name"] === "메스충")["gearInfo"];
  for (let i = 0; i < 4; i++) {
    slots[i] = copy(defaultPreset[i]);
    drawGear(i);
  }
  updateSettings();
});

function initPresets() {
  let p = document.getElementById("presets");
  for (let preset of presets) {
    let div = document.createElement("div");
    let canvas = document.createElement("canvas");
    let btn = document.createElement("button");
    div.className = "preset";
    canvas.className = "preset";
    canvas.width = 240;
    canvas.height = 60;
    btn.textContent = "적용";
    div.append(preset["name"], document.createElement("br"), canvas, " ", btn);
    p.append(div);
    if (preset.limit != undefined && !preset["limit"].includes(selectedType)) {
      div.hidden = true;
      continue;
    } else div.hidden = false;
    preset["gearInfo"] = [];
    for (let i = 0; i < 4; i++) {
      let gear = preset["preset"][i];
      let slot = i < 2 ? i : gear["type"] == "A" ? 2 : 3;
      let tier = findGear(gear["gear"])["tier"] ?? gear["tier"];
      let relic = RELIC_STR[gear["lvl"]];
      let info = getGearInfo(
        gear["gear"],
        selectedType,
        slot,
        gear["set"],
        tier,
        gear["lvl"] ?? 0,
        relic
      );
      preset["gearInfo"].push(info);
      drawGear(canvas, info, i * 60, 0, 60, 60);
    }
    btn.onclick = () => {
      for (let i = 0; i < 4; i++) {
        slots[i] = copy(preset["gearInfo"][i]);
        slots[i].unitType = selectedType;
        drawGear(i);
      }
      updateSettings();
    };
  }
}

function updatePresets() {
  let p = document.getElementById("presets");
  for (let i = 0; i < presets.length; i++) {
    let preset = presets[i];
    let element = p.children[i + 1];
    if (preset.limit != undefined && !preset["limit"].includes(selectedType)) {
      element.hidden = true;
      continue;
    } else element.hidden = false;
    for (let i = 0; i < 4; i++) {
      let info = copy(preset["gearInfo"][i]);
      info.unitType = selectedType;
      drawGear(element.children[1], info, i * 60, 0, 60, 60);
    }
  }
}

function updateSettings(slot) {
  if (slot == undefined) slot = selectedSlot;
  let sub = document.getElementById("subSelect").value;
  if (prevType != selectedType || prevSlot != slot || prevSub != sub) updateGears(slot);
  prevType = selectedType;
  prevSlot = slot;
  prevSub = sub;
  if (slot >= 2) updateSub(slot);
  updateSets(slot);
  updateTier(slot);
  let gear = slots[slot];
  let gearSelect = document.getElementById("gearSelect");
  let setSelect = document.getElementById("setSelect");
  let lvlInput = document.getElementById("lvlInput");
  gearSelect.value = gear.gearId;
  setSelect.value = gear.set;
  lvlInput.value = gear.lvl;
}

function updateGears(slot) {
  let gearSelect = document.getElementById("gearSelect");
  while (gearSelect.options.length > 0) gearSelect.remove(0);
  let change = false;
  let first;
  for (let gear of gears) {
    let limit = gear["limit"]?.[slots[slot].slot];
    if (limit != undefined && limit !== "*" && !limit.includes(selectedType)) {
      if (slots[slot].gearId === gear["id"]) change = true;
      continue;
    }
    if (first == undefined) first = gear;
    let option = document.createElement("option");
    option.value = gear["id"];
    option.textContent = gear["name"];
    gearSelect.add(option);
  }
  if (change) slots[slot].gearId = first["id"];
}

function updateSub(slot) {
  let gearSelect = document.getElementById("gearSelect");
  let subSelect = document.getElementById("subSelect");
  subSelect.value = slots[slot].slot == 2 ? "a" : "b";
  let gear = findGear(slots[slot].gearId);
  let limit = gear.limit;
  let a = limit?.[2] != undefined && limit?.[2] !== "*" && !limit?.[2].includes(selectedType);
  let b = limit?.[3] != undefined && limit?.[3] !== "*" && !limit?.[3].includes(selectedType);
  if ((a && b) || (a && slots[slot].slot == 2) || (b && slots[slot].slot == 3))
    slots[slot].gearId = gearSelect.options[0].value;
  else if (a) slots[slot].slot = 3;
  else if (b) slots[slot].slot = 2;
}

function updateSets(slot) {
  let setSelect = document.getElementById("setSelect");
  let type = findGear(slots[slot].gearId)["set"] ?? "default";
  while (setSelect.options.length > 0) setSelect.remove(0);
  let list = sets.find((e) => e["type"] === type)["sets"];
  for (let set of list) {
    let option = document.createElement("option");
    option.value = set["id"];
    option.textContent = set["name"];
    setSelect.add(option);
  }
  if (list.find((e) => e["id"] === slots[slot].set) == undefined) slots[slot].set = list[0]["id"];
}

function updateTier(slot) {
  let tierInputs = document.querySelectorAll("#tierSelect > input");
  let tier = findGear(slots[slot].gearId).tier;
  if (tier != undefined) slots[slot].tier = tier;
  else if (slots[slot].tier == 5) slots[slot].tier = 6;
  for (let i = 0; i < 3; i++) {
    if ((tier != undefined && tier != i + 5) || (tier == undefined && i == 0))
      tierInputs[i].disabled = true;
    else tierInputs[i].disabled = false;
    if (slots[slot].tier == i + 5) tierInputs[i].checked = true;
    else tierInputs[i].checked = false;
  }
}
