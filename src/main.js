const MISSIONS = [
  {
    id: "ember",
    name: "Ember Drift",
    blurb: "Scout the ember lanes. Salvage crates float in the wake.",
    enemy: { atk: 4, def: 6, luck: 1, spd: 2 },
    energy: 5,
    loot: 80,
    xp: 3,
  },
  {
    id: "ash",
    name: "Ash Belt Run",
    blurb: "Cut through the ash belt. Hot rocks, hotter guns.",
    enemy: { atk: 8, def: 9, luck: 3, spd: 4 },
    energy: 12,
    loot: 220,
    xp: 8,
  },
  {
    id: "corsair",
    name: "Corsair Gate",
    blurb: "Hold the gate or become salvage yourself.",
    enemy: { atk: 14, def: 16, luck: 5, spd: 6 },
    energy: 20,
    loot: 500,
    xp: 18,
  },
];

const WORLD_NAMES = ["Ember Rock", "Ash Hold", "Corsair Reach", "Drift Hollow", "Nova Shard"];

// V0 playtest ladder (sheet L1 planet = 100,000). Labeled in UI + README.
const ECON = {
  starterCreds: 6000,
  planetL1: 2500,
  planetUpgrade: [0, 6000, 14000, 32000],
  planetSlots: [0, 1, 2, 4, 6],
  factoryCost: 700,
  factoryRate: 8,
  factoryTick: 10,
  factoryService: 70,
  factoryRepair: 180,
  minerCost: 350,
  minerMineRate: 4,
  minerMineTick: 12,
  minerWearMine: 8,
  minerWearRep: 5,
  minerReplicate: 50,
  stationCost: 1200,
  stationRate: 5,
  stationTick: 20,
  dockCreds: 12,
  dockCooldown: 25,
};

const state = {
  energy: 100,
  energyCap: 100,
  creds: ECON.starterCreds,
  level: 1,
  xp: 1,
  skills: { atk: 5, def: 5, luck: 2, spd: 3 },
  points: 0,
  regenLeft: 60,
  nextId: 1,
  planets: [],
  miners: [],
  stations: [],
};

function uid() {
  return state.nextId++;
}

function spend(n) {
  if (state.creds < n) return false;
  state.creds -= n;
  return true;
}

function xpForLevel(level) {
  if (level <= 1) return 1;
  if (level === 2) return 10;
  if (level === 3) return 20;
  if (level === 4) return 40;
  return 40 * Math.pow(2, level - 4);
}

function nextThreshold() {
  return xpForLevel(state.level + 1);
}

function roll(luck) {
  return Math.floor(Math.random() * (luck + 1));
}

function combatScore(atk, luck, spd) {
  const r = roll(luck);
  const score = atk + Math.floor(spd / 4) + r;
  return { score, roll: r };
}

function log(msg, cls = "") {
  const el = document.getElementById("log");
  const line = document.createElement("div");
  if (cls) line.className = cls;
  line.textContent = msg;
  el.prepend(line);
}

function renderSkills() {
  const root = document.getElementById("skills");
  const labels = { atk: "Attack", def: "Defend", luck: "Luck", spd: "Speed" };
  root.innerHTML = "";
  for (const key of ["atk", "def", "luck", "spd"]) {
    const row = document.createElement("div");
    row.className = "skill-row";
    row.innerHTML = `<span>${labels[key]} <strong>${state.skills[key]}</strong></span>`;
    const btn = document.createElement("button");
    btn.className = "plus";
    btn.textContent = "+";
    btn.disabled = state.points <= 0;
    btn.onclick = () => {
      if (state.points <= 0) return;
      state.skills[key] += 1;
      state.points -= 1;
      render();
    };
    row.appendChild(btn);
    root.appendChild(row);
  }
  document.getElementById("pointsLabel").textContent = `${state.points} pts`;
}

function renderMissions() {
  const root = document.getElementById("missions");
  root.innerHTML = "";
  for (const m of MISSIONS) {
    const card = document.createElement("div");
    card.className = "mission " + m.id;
    const e = m.enemy;
    const lane = { ember: "Lane 01", ash: "Lane 02", corsair: "Lane 03" }[m.id] || "Lane";
    card.innerHTML = `
      <div class="lane">${lane} · DN</div>
      <h3>${m.name}</h3>
      <p>${m.blurb}</p>
      <div class="chips">
        <span class="chip">Energy <strong>${m.energy}</strong></span>
        <span class="chip">Loot <strong>${m.loot}</strong> creds</span>
        <span class="chip">XP <strong>${m.xp}</strong></span>
        <span class="chip">Enemy Def <strong>${e.def}</strong></span>
        <span class="chip">E Atk/Lck/Spd <strong>${e.atk}/${e.luck}/${e.spd}</strong></span>
      </div>
    `;
    const btn = document.createElement("button");
    btn.textContent = `Engage · ${m.energy} energy`;
    btn.disabled = state.energy < m.energy;
    btn.onclick = () => runMission(m);
    card.appendChild(btn);
    root.appendChild(card);
  }
}

function applyLevelUps() {
  let gained = 0;
  while (state.xp >= nextThreshold()) {
    state.level += 1;
    state.points += 3;
    gained += 1;
  }
  if (gained) log(`Level up ×${gained} → L${state.level}. +${gained * 3} skill points.`, "info");
}

function runMission(m) {
  if (state.energy < m.energy) {
    log("Not enough energy.", "lose");
    return;
  }
  state.energy -= m.energy;

  const playerAtk = state.skills.atk;
  const p = combatScore(playerAtk, state.skills.luck, state.skills.spd);
  const enemyDef = m.enemy.def;
  const margin = p.score - enemyDef;

  log(
    `${m.name}: you ${p.score} (Atk ${playerAtk} +⌊Spd/4⌋ ${Math.floor(state.skills.spd / 4)} +roll ${p.roll}) vs enemy Def ${enemyDef} (static)`,
    "info"
  );

  if (p.score >= enemyDef) {
    let loot = m.loot;
    let result = "Win";
    let cls = "win";
    if (margin <= 2) {
      loot = Math.floor(m.loot / 2);
      result = "Scrape win";
    } else if (margin >= 5) {
      loot = m.loot + Math.floor(m.loot * 0.25);
      result = "Clean sweep";
    }
    state.creds += loot;
    state.xp += m.xp;
    applyLevelUps();
    log(`${result} (margin ${margin}). Salvage +${loot} creds, +${m.xp} XP.`, cls);
    render();
  } else {
    const xpGain = Math.floor(m.xp / 2);
    state.xp += xpGain;
    applyLevelUps();
    log(`Loss (margin ${margin}). +${xpGain} XP. Hull critical.`, "lose");
    render();
    showDefeat(m);
  }
}

function showDefeat(m) {
  document.getElementById("defeatCopy").textContent =
    `Lost on ${m.name}. Regen energy and replot the lanes.`;
  document.getElementById("defeatOverlay").classList.add("show");
}

function planetSlots(level) {
  return ECON.planetSlots[level] || ECON.planetSlots[ECON.planetSlots.length - 1];
}

function buyPlanet() {
  if (!spend(ECON.planetL1)) {
    log("Need more creds for an L1 world.", "lose");
    return;
  }
  const name = WORLD_NAMES[(state.planets.length) % WORLD_NAMES.length];
  state.planets.push({
    id: uid(),
    name,
    level: 1,
    factories: [],
  });
  log(`Claimed ${name} (L1, 1 factory berth). V0 playtest price ${ECON.planetL1}.`, "win");
  render();
}

function upgradePlanet(planet) {
  const next = planet.level + 1;
  if (next >= ECON.planetSlots.length) {
    log(`${planet.name} is at max V0 level.`, "info");
    return;
  }
  const cost = ECON.planetUpgrade[next - 1];
  if (!spend(cost)) {
    log(`Need ${cost} creds to raise ${planet.name}.`, "lose");
    return;
  }
  planet.level = next;
  log(`${planet.name} raised to L${next} · ${planetSlots(next)} factory berths.`, "info");
  render();
}

function addFactory(planet) {
  if (planet.factories.length >= planetSlots(planet.level)) {
    log(`${planet.name} has no open berths. Raise the world first.`, "lose");
    return;
  }
  if (!spend(ECON.factoryCost)) {
    log("Need more creds for a factory.", "lose");
    return;
  }
  planet.factories.push({
    id: uid(),
    pending: 0,
    serviceLeft: ECON.factoryService,
    produceLeft: ECON.factoryTick,
    failed: false,
  });
  log(`Factory online on ${planet.name}. Service it or lose the yield.`, "info");
  render();
}

function serviceFactory(factory, planet) {
  if (factory.failed) {
    if (!spend(ECON.factoryRepair)) {
      log("Need more creds to repair that factory.", "lose");
      return;
    }
    factory.failed = false;
    factory.pending = 0;
    factory.serviceLeft = ECON.factoryService;
    factory.produceLeft = ECON.factoryTick;
    log(`Factory on ${planet.name} repaired. Line is cold — yield was lost.`, "info");
    render();
    return;
  }
  const got = factory.pending;
  state.creds += got;
  factory.pending = 0;
  factory.serviceLeft = ECON.factoryService;
  log(got ? `Serviced ${planet.name} factory. Collected ${got} creds.` : `Serviced ${planet.name} factory. Line reset.`, "win");
  render();
}

function buyMiner() {
  if (!spend(ECON.minerCost)) {
    log("Need more creds for a miner.", "lose");
    return;
  }
  state.miners.push({
    id: uid(),
    mode: "mine",
    wear: 0,
    tick: ECON.minerMineTick,
    replicateLeft: ECON.minerReplicate,
  });
  log("Robotic miner deployed. Mine or self-replicate — not both.", "info");
  render();
}

function setMinerMode(miner, mode) {
  if (miner.wear >= 100) return;
  miner.mode = mode;
  miner.tick = ECON.minerMineTick;
  miner.replicateLeft = ECON.minerReplicate;
  log(`Miner #${miner.id} set to ${mode}.`, "info");
  render();
}

function buyStation() {
  if (!spend(ECON.stationCost)) {
    log("Need more creds for a DN dock.", "lose");
    return;
  }
  state.stations.push({
    id: uid(),
    name: `DN Dock ${state.stations.length + 1}`,
    tick: ECON.stationTick,
    dockLeft: 0,
  });
  log("Space station claimed. Dock fees tick in while the page is open.", "win");
  render();
}

function dockStation(station) {
  if (station.dockLeft > 0) {
    log(`${station.name} is cycling the last dock.`, "info");
    return;
  }
  state.creds += ECON.dockCreds;
  station.dockLeft = ECON.dockCooldown;
  log(`Docked at ${station.name}. +${ECON.dockCreds} creds.`, "win");
  render();
}

function tickEconomy() {
  for (const planet of state.planets) {
    for (const f of planet.factories) {
      if (f.failed) continue;
      f.produceLeft -= 1;
      if (f.produceLeft <= 0) {
        f.produceLeft = ECON.factoryTick;
        f.pending += ECON.factoryRate;
      }
      f.serviceLeft -= 1;
      if (f.serviceLeft <= 0) {
        f.failed = true;
        const lost = f.pending;
        f.pending = 0;
        log(`Factory on ${planet.name} failed. Lost ${lost} uncollected creds.`, "lose");
      }
    }
  }

  const born = [];
  for (const miner of state.miners) {
    if (miner.wear >= 100) continue;
    if (miner.mode === "mine") {
      miner.tick -= 1;
      if (miner.tick <= 0) {
        miner.tick = ECON.minerMineTick;
        state.creds += ECON.minerMineRate;
        miner.wear = Math.min(100, miner.wear + ECON.minerWearMine);
        if (miner.wear >= 100) log(`Miner #${miner.id} wore out and is scrap.`, "lose");
      }
    } else {
      miner.replicateLeft -= 1;
      if (miner.replicateLeft <= 0) {
        miner.replicateLeft = ECON.minerReplicate;
        miner.wear = Math.min(100, miner.wear + ECON.minerWearRep);
        born.push({
          id: uid(),
          mode: "mine",
          wear: 0,
          tick: ECON.minerMineTick,
          replicateLeft: ECON.minerReplicate,
        });
        log(`Miner #${miner.id} replicated a chassis.`, "info");
        if (miner.wear >= 100) log(`Miner #${miner.id} wore out after the split.`, "lose");
      }
    }
  }
  state.miners.push(...born);

  for (const st of state.stations) {
    st.tick -= 1;
    if (st.tick <= 0) {
      st.tick = ECON.stationTick;
      state.creds += ECON.stationRate;
    }
    if (st.dockLeft > 0) st.dockLeft -= 1;
  }
}

function renderPlanets() {
  const root = document.getElementById("planets");
  root.innerHTML = "";
  const buy = document.getElementById("buyPlanet");
  buy.textContent = `Claim L1 world · ${ECON.planetL1} creds`;
  buy.disabled = state.creds < ECON.planetL1;

  if (!state.planets.length) {
    root.innerHTML = `<p class="hint">No worlds claimed. L1 holds 1 factory. Sheet price 100,000 — V0 playtest is ${ECON.planetL1}.</p>`;
    return;
  }

  for (const planet of state.planets) {
    const slots = planetSlots(planet.level);
    const next = planet.level + 1;
    const upCost = ECON.planetUpgrade[next - 1];
    const card = document.createElement("div");
    card.className = "asset";
    card.innerHTML = `
      <div class="lane">World · DN</div>
      <h3>${planet.name}</h3>
      <div class="chips">
        <span class="chip">Level <strong>${planet.level}</strong></span>
        <span class="chip">Factories <strong>${planet.factories.length}/${slots}</strong></span>
      </div>
    `;
    const row = document.createElement("div");
    row.className = "btn-row";
    const add = document.createElement("button");
    add.className = "secondary";
    add.textContent = `Build factory · ${ECON.factoryCost}`;
    add.disabled = planet.factories.length >= slots || state.creds < ECON.factoryCost;
    add.onclick = () => addFactory(planet);
    row.appendChild(add);
    if (next < ECON.planetSlots.length) {
      const up = document.createElement("button");
      up.className = "secondary";
      up.textContent = `Raise L${next} · ${upCost}`;
      up.disabled = state.creds < upCost;
      up.onclick = () => upgradePlanet(planet);
      row.appendChild(up);
    }
    card.appendChild(row);
    root.appendChild(card);
  }
}

function renderFactories() {
  const root = document.getElementById("factories");
  root.innerHTML = "";
  const list = [];
  for (const planet of state.planets) {
    for (const f of planet.factories) list.push({ planet, f });
  }
  if (!list.length) {
    root.innerHTML = `<p class="hint">No factories. Claim a world, then build. Unserviced lines fail and dump pending creds.</p>`;
    return;
  }
  for (const { planet, f } of list) {
    const card = document.createElement("div");
    card.className = "asset" + (f.failed ? " failed" : f.serviceLeft <= 20 ? " warn" : "");
    const status = f.failed ? "FAILED" : f.serviceLeft <= 20 ? "service due" : "online";
    card.innerHTML = `
      <div class="lane">${planet.name} · factory</div>
      <div class="chips">
        <span class="chip">Pending <strong>${f.pending}</strong></span>
        <span class="chip">Service <strong>${f.failed ? "—" : f.serviceLeft + "s"}</strong></span>
        <span class="chip">Status <strong>${status}</strong></span>
      </div>
    `;
    const btn = document.createElement("button");
    btn.className = f.failed ? "danger" : "secondary";
    btn.textContent = f.failed ? `Repair · ${ECON.factoryRepair}` : "Service · collect";
    btn.disabled = f.failed && state.creds < ECON.factoryRepair;
    btn.onclick = () => serviceFactory(f, planet);
    card.appendChild(btn);
    root.appendChild(card);
  }
}

function renderMiners() {
  const root = document.getElementById("miners");
  root.innerHTML = "";
  const buy = document.getElementById("buyMiner");
  buy.textContent = `Buy robotic miner · ${ECON.minerCost} creds`;
  buy.disabled = state.creds < ECON.minerCost;

  if (!state.miners.length) {
    root.innerHTML = `<p class="hint">No miners. They grind small creds or copy themselves. Wear-out is scrap.</p>`;
    return;
  }

  for (const miner of state.miners) {
    const scrap = miner.wear >= 100;
    const card = document.createElement("div");
    card.className = "asset" + (scrap ? " failed" : "");
    const eta = miner.mode === "mine" ? `next haul ${miner.tick}s` : `replica ${miner.replicateLeft}s`;
    card.innerHTML = `
      <div class="lane">Miner #${miner.id} · DN</div>
      <div class="chips">
        <span class="chip">Mode <strong>${scrap ? "scrap" : miner.mode}</strong></span>
        <span class="chip">Wear <strong>${miner.wear}%</strong></span>
        <span class="chip">${scrap ? "dead chassis" : eta}</span>
      </div>
      <div class="bar"><span style="width:${miner.wear}%"></span></div>
    `;
    if (!scrap) {
      const row = document.createElement("div");
      row.className = "btn-row";
      const mine = document.createElement("button");
      mine.className = miner.mode === "mine" ? "cyan" : "secondary";
      mine.textContent = "Mine";
      mine.onclick = () => setMinerMode(miner, "mine");
      const rep = document.createElement("button");
      rep.className = miner.mode === "replicate" ? "cyan" : "secondary";
      rep.textContent = "Replicate";
      rep.onclick = () => setMinerMode(miner, "replicate");
      row.appendChild(mine);
      row.appendChild(rep);
      card.appendChild(row);
    }
    root.appendChild(card);
  }
}

function renderStations() {
  const root = document.getElementById("stations");
  root.innerHTML = "";
  const buy = document.getElementById("buyStation");
  buy.textContent = `Buy DN dock · ${ECON.stationCost} creds`;
  buy.disabled = state.creds < ECON.stationCost;

  if (!state.stations.length) {
    root.innerHTML = `<p class="hint">No stations. A dock collects fees over time. Tap Dock for a small haul.</p>`;
    return;
  }

  for (const st of state.stations) {
    const card = document.createElement("div");
    card.className = "asset";
    card.innerHTML = `
      <div class="lane">Station · DN</div>
      <h3>${st.name}</h3>
      <div class="chips">
        <span class="chip">Fees <strong>+${ECON.stationRate}/${ECON.stationTick}s</strong></span>
        <span class="chip">Next <strong>${st.tick}s</strong></span>
      </div>
    `;
    const btn = document.createElement("button");
    btn.className = "cyan";
    btn.textContent = st.dockLeft > 0 ? `Dock cycling · ${st.dockLeft}s` : `Dock · +${ECON.dockCreds} creds`;
    btn.disabled = st.dockLeft > 0;
    btn.onclick = () => dockStation(st);
    card.appendChild(btn);
    root.appendChild(card);
  }
}

function render() {
  document.getElementById("energy").textContent = state.energy;
  document.getElementById("energyCap").textContent = state.energyCap;
  document.getElementById("energyFill").style.width =
    `${Math.min(100, (state.energy / state.energyCap) * 100)}%`;
  document.getElementById("creds").textContent = state.creds;
  document.getElementById("level").textContent = state.level;
  document.getElementById("xp").textContent = state.xp;
  const next = nextThreshold();
  const prev = xpForLevel(state.level);
  document.getElementById("xpNext").textContent = next;
  const span = Math.max(1, next - prev);
  const prog = Math.min(100, ((state.xp - prev) / span) * 100);
  document.getElementById("xpFill").style.width = `${Math.max(0, prog)}%`;
  document.getElementById("tickLabel").textContent = `regen ${state.regenLeft}s`;
  renderSkills();
  renderMissions();
  renderPlanets();
  renderFactories();
  renderMiners();
  renderStations();
}

document.getElementById("defeatDismiss").onclick = () => {
  document.getElementById("defeatOverlay").classList.remove("show");
  log("You replot. Wait for energy or dump Atk on level-up.", "info");
};

document.getElementById("buyPlanet").onclick = buyPlanet;
document.getElementById("buyMiner").onclick = buyMiner;
document.getElementById("buyStation").onclick = buyStation;

setInterval(() => {
  state.regenLeft -= 1;
  if (state.regenLeft <= 0) {
    state.regenLeft = 60;
    if (state.energy < state.energyCap) {
      state.energy = Math.min(state.energyCap, state.energy + 10);
      log("+10 energy regenerated.", "info");
    }
  }
  tickEconomy();
  render();
}, 1000);

log("Dark Nova: Omniverse V0 online. Ember Drift → Ash Belt (Def 9) → Corsair Gate.", "info");
log("Loop 2 skeleton live: planets, factories, miners, docks. No IAP.", "info");
render();
