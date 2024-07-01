function loadImage(url) {
  let image = new Image();
  image.src = url;
  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
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
  if (typeof canvas === "number") {
    dx = 250 * canvas;
    canvas = document.getElementById("slots");
  }
  if (dx == undefined) dx = 0;
  if (dy == undefined) dy = 0;
  if (dw == undefined) dw = 250;
  if (dh == undefined) dh = 250;
  let loads = [
    loadImage(
      `img/gear/${gearInfo.gearId}/${gearInfo.gearId}_${gearInfo.unitType}_${gearInfo.slot}.png`
    ),
    loadImage(`img/set/${gearInfo.set}.png`),
    loadImage(`img/tier/t${gearInfo.tier}.png`),
  ];
  if (gearInfo.lvl > 0) loads.push(loadImage(`img/lvl/lvl_${gearInfo.lvl}.png`));
  var relic = findGear(gearInfo.gearId)["tier"] == 7;
  if (relic) loads.push(loadImage(`img/relic/relic_${gearInfo.relic}.png`));
  Promise.all(loads).then((images) => {
    let context = canvas.getContext("2d");
    context.drawImage(background, dx, dy, dw, dh);
    context.drawImage(
      images[0],
      dx + (5 * dw) / 250,
      dy + (2 * dh) / 250,
      (((dw * 244) / 250) * images[0].width) / 256,
      (dh * 244) / 250
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
  });
}

var gears;
var sets;
var presets;
var background;
var selectedType = "c";
var slots = [];

Promise.all([
  window.onload,
  fetch("gears.json").then((res) => res.json()),
  fetch("sets.json").then((res) => res.json()),
  fetch("presets.json").then((res) => res.json()),
  loadImage("img/background.png"),
]).then((result) => {
  gears = result[1];
  sets = result[2];
  presets = result[3];
  background = result[4];
  let typeSelect = document.getElementById("unitType");
  typeSelect.onchange = () => {
    selectedType = typeSelect.value;
    for (let i = 0; i < 4; i++) {
      let info = slots[i];
      info.unitType = selectedType;
      drawGear(i, info);
    }
  };
  let p = document.getElementById("presets");
  for (let preset of presets) {
    let div = document.createElement("div");
    let canvas = document.createElement("canvas");
    let btn = document.createElement("button");
    div.className = "preset";
    canvas.className = "preset";
    canvas.width = 240;
    canvas.height = 60;
    btn.className = "preset";
    btn.textContent = "적용";
    div.append(preset["name"], document.createElement("br"), canvas, " ", btn);
    p.append(div);
    preset["gearInfo"] = [];
    for (let i = 0; i < 4; i++) {
      let gear = preset["preset"][i];
      let slot = i < 2 ? i : gear["type"] == "A" ? 2 : 3;
      let tier = findGear(gear["gear"])["tier"] ?? gear["tier"];
      let relic = "00111223333"[gear["lvl"]];
      let info = getGearInfo(gear["gear"], "c", slot, gear["set"], tier, gear["lvl"], relic);
      preset["gearInfo"].push(info);
      drawGear(canvas, info, i * 60, 0, 60, 60);
    }
    btn.onclick = () => {
      for (let i = 0; i < 4; i++) {
        let info = copy(preset["gearInfo"][i]);
        info.unitType = selectedType;
        slots[i] = info;
        drawGear(i, info);
      }
    };
  }
  for (let i = 0; i < 4; i++) {
    let info = copy(presets.find((e) => e["name"] === "메스충")["gearInfo"][i]);
    slots[i] = info;
    drawGear(i, info);
  }
});
