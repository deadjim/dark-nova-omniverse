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

const CYCLE = 12;

const ECON = {
  planetL1: 100000,
  thinStart: 180,
  serviceEnergy: 8,
  minePerMiner: 24,
  replicateCycles: 3,
  neglectAfter: 4,
  scrapBuy: 40,
  scrapSell: 28,
  unlockCreds: 8000,
  unlockLevel: 10,
  berthAt: 2500,
  outpostAt: 12000,
};

const state = {
  energy: 100,
  energyCap: 100,
  creds: ECON.thinStart,
  earned: ECON.thinStart,
  scrap: 0,
  level: 1,
  xp: 1,
  skills: { atk: 5, def: 5, luck: 2, spd: 3 },
  points: 0,
  regenLeft: 60,
  cycleLeft: CYCLE,
  nextMiner: 2,
  minerCap: 1,
  outpost: false,
  meridianOpen: false,
  miners: [{ id: 1, dock: "cinder" }],
  modes: { cinder: "mine", ember: "mine", relay: "mine", "ash-l0": "mine" },
  replicateLeft: { cinder: 0, ember: 0, relay: 0, "ash-l0": 0 },
  systems: [
    {
      id: "cinder",
      name: "Cinder Claim",
      flavor: "Starter asteroid. Mine it before you own a world.",
      accent: "ember",
      owned: true,
      kind: "asteroid",
      factories: [
        { id: "rock-line", name: "Rock Line", status: "online", idle: 0, lockedOnline: true },
        { id: "slag-beta", name: "Slag Line Beta", status: "online", idle: 0, lockedOnline: false },
      ],
    },
    {
      id: "ember",
      name: "Ember Reach",
      flavor: "Cinder world. Foundries run hot — or not at all.",
      accent: "ember",
      owned: false,
      kind: "planet",
      cost: 100000,
      factories: [
        { id: "forge-alpha", name: "Forge Alpha", status: "online", idle: 0, lockedOnline: true },
        { id: "slag-reach", name: "Slag Line Beta", status: "online", idle: 0, lockedOnline: false },
      ],
    },
  ],
};

function toast(msg, ok) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.toggle("ok", !!ok);
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2200);
}

function gainCreds(n) {
  if (n <= 0) return;
  state.creds += n;
  state.earned += n;
}

function minersAt(dock) {
  return state.miners.filter((m) => m.dock === dock);
}

function mineIncome(dock) {
  if (state.modes[dock] !== "mine") return 0;
  return minersAt(dock).length * ECON.minePerMiner;
}

function bleedCap(sys) {
  const mine = mineIncome(sys.id);
  if (mine <= 0) return 0;
  return Math.max(0, mine - 1);
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
  return { score: atk + Math.floor(spd / 4) + r, roll: r };
}

function log(msg, cls = "") {
  const el = document.getElementById("log");
  const line = document.createElement("div");
  if (cls) line.className = cls;
  line.textContent = msg;
  el.prepend(line);
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
    toast("Not enough energy.");
    return;
  }
  state.energy -= m.energy;
  const p = combatScore(state.skills.atk, state.skills.luck, state.skills.spd);
  const enemyDef = m.enemy.def;
  const margin = p.score - enemyDef;
  log(
    `${m.name}: you ${p.score} (Atk ${state.skills.atk} +⌊Spd/4⌋ ${Math.floor(state.skills.spd / 4)} +roll ${p.roll}) vs enemy Def ${enemyDef} (static)`,
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
    gainCreds(loot);
    state.xp += m.xp;
    applyLevelUps();
    log(`${result} (margin ${margin}). Salvage +${loot} creds, +${m.xp} XP.`, cls);
  } else {
    const xpGain = Math.floor(m.xp / 2);
    state.xp += xpGain;
    applyLevelUps();
    log(`Loss (margin ${margin}). +${xpGain} XP. Replot from the log — no Refit.`, "lose");
  }
  render();
}

function serviceFactory(sys, factory) {
  if (factory.lockedOnline && factory.status === "online") {
    toast(`${factory.name} stays Online — free regen path.`);
    return;
  }
  if (state.energy < ECON.serviceEnergy) {
    toast("Not enough energy — regen +10/60s covers one 8⚡ service.");
    return;
  }
  state.energy -= ECON.serviceEnergy;
  factory.status = "online";
  factory.idle = 0;
  log(`Serviced ${factory.name} on ${sys.name} (−${ECON.serviceEnergy} energy).`, "info");
  toast(`${factory.name} restored · Online.`, true);
  render();
}

function ignoreFactory(sys, factory) {
  if (factory.lockedOnline) {
    toast(`${factory.name} stays Online. Soft-lock: ≥1 factory always serviceable.`);
    return;
  }
  factory.status = "neglected";
  const cap = bleedCap(sys);
  toast(`Ignored — bleed −${cap}/cycle (≤ mine−1). Rock Line stays Online.`);
  log(`${factory.name} neglected. Bleed −${cap} (capped ≤ mine−1).`, "lose");
  render();
}

function buyPlanet(sys) {
  if (sys.owned) return;
  if (state.creds < ECON.planetL1) {
    toast(`Need ${ECON.planetL1.toLocaleString()} creds on hand for Ember Reach.`);
    return;
  }
  state.creds -= ECON.planetL1;
  sys.owned = true;
  log(`Claimed ${sys.name} for ${ECON.planetL1.toLocaleString()} creds.`, "win");
  toast(`${sys.name} is yours.`, true);
  render();
}

function setMode(dock, mode) {
  if (mode === "mine") {
    state.modes[dock] = "mine";
    state.replicateLeft[dock] = 0;
    log(`Fleet at ${dock} set to mine.`, "info");
    render();
    return;
  }
  if (state.miners.length >= state.minerCap) {
    toast(`Berth full (${state.minerCap}). Earn ${ECON.berthAt.toLocaleString()} for a second miner slot.`);
    return;
  }
  if (!minersAt(dock).length) {
    toast("No miner here to replicate.");
    return;
  }
  state.modes[dock] = "replicate";
  state.replicateLeft[dock] = ECON.replicateCycles;
  log(`Replicating at ${dock} · ${ECON.replicateCycles} mine cycles · no creds.`, "info");
  toast("Replicating — 3 mine cycles, never creds.", true);
  render();
}

function dockMiner(from, to) {
  const miner = state.miners.find((m) => m.dock === from);
  if (!miner) {
    toast("No miner to dock from there.");
    return;
  }
  miner.dock = to;
  toast(`Miner #${miner.id} moved.`, true);
  render();
}

function buyScrap() {
  if (state.creds < ECON.scrapBuy) {
    toast("Not enough creds for scrap.");
    return;
  }
  state.creds -= ECON.scrapBuy;
  state.scrap += 1;
  toast(`Bought 1 scrap (−${ECON.scrapBuy} creds).`);
  render();
}

function sellScrap() {
  if (state.scrap < 1) {
    toast("No scrap to sell.");
    return;
  }
  state.scrap -= 1;
  gainCreds(ECON.scrapSell);
  toast(`Sold 1 scrap (+${ECON.scrapSell} creds).`);
  render();
}

function tryUnlock() {
  if (state.meridianOpen) {
    toast("Gate open. Roster still Ember → Ash → Corsair.");
    return;
  }
  if (state.level < ECON.unlockLevel || state.creds < ECON.unlockCreds) {
    toast(`Need Lv ${ECON.unlockLevel} and ${ECON.unlockCreds.toLocaleString()} creds.`);
    return;
  }
  state.meridianOpen = true;
  toast("Gate flagged. Mission roster still frozen.", true);
  render();
}

function maybeUnlockMids() {
  if (state.minerCap < 2 && state.earned >= ECON.berthAt) {
    state.minerCap = 2;
    log("Mid unlock: second miner berth online.", "win");
    toast("Second miner berth unlocked.", true);
  }
  if (!state.outpost && state.earned >= ECON.outpostAt) {
    state.outpost = true;
    state.systems.push({
      id: "ash-l0",
      name: "Ash Drift L0",
      flavor: "Thin-ring outpost. Not a world — a yard on the 100k path.",
      accent: "ash",
      owned: true,
      kind: "outpost",
      factories: [
        { id: "ring-yard", name: "Ring Yard One", status: "online", idle: 0, lockedOnline: true },
      ],
    });
    log("Mid unlock: Ash Drift L0 outpost claimed.", "win");
    toast("L0 outpost online.", true);
  }
}

function tickEconomy() {
  let mineGain = 0;
  let bleed = 0;

  for (const dock of Object.keys(state.modes)) {
    if (state.modes[dock] === "mine") {
      mineGain += mineIncome(dock);
    } else if (minersAt(dock).length) {
      state.replicateLeft[dock] -= 1;
      if (state.replicateLeft[dock] <= 0) {
        if (state.miners.length < state.minerCap) {
          state.miners.push({ id: state.nextMiner++, dock });
          log(`Replica complete at ${dock}. Fleet +1.`, "info");
        } else {
          log(`Replica finished but berth is full.`, "lose");
        }
        state.modes[dock] = "mine";
        state.replicateLeft[dock] = 0;
      }
    }
  }

  for (const sys of state.systems) {
    if (!sys.owned) continue;
    const cap = bleedCap(sys);
    for (const f of sys.factories) {
      if (f.lockedOnline) {
        f.status = "online";
        f.idle = 0;
        continue;
      }
      if (f.status === "online") {
        f.idle += 1;
        if (f.idle >= ECON.neglectAfter) f.status = "neglected";
      }
      if (f.status === "neglected") bleed += cap;
    }
  }

  gainCreds(mineGain);
  if (bleed) state.creds = Math.max(0, state.creds - bleed);
  if (mineGain) log(`Mine cycle +${mineGain} creds.`, "win");
  if (bleed) log(`Neglect bleed −${bleed} creds (≤ mine−1).`, "lose");
  maybeUnlockMids();
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

function minerBox(dock, label) {
  const count = minersAt(dock).length;
  const mode = state.modes[dock];
  const mining = mode === "mine";
  const gain = count * ECON.minePerMiner;
  const left = state.replicateLeft[dock];
  const wrap = document.createElement("div");
  wrap.className = "miners-box";
  wrap.innerHTML = `
    <div class="miners-count">Fleet · <strong>${count}</strong> / ${state.minerCap} ${label}</div>
    <div class="mode-row">
      <div class="chips" role="group">
        <button type="button" class="mode-chip" data-mode="mine" aria-pressed="${mining}">Mine</button>
        <button type="button" class="mode-chip" data-mode="replicate" aria-pressed="${!mining}">Replicate</button>
      </div>
    </div>
    <div class="mode-stat">
      ${mining
        ? `<span class="gain">+${gain} creds/cycle</span> · ${count ? `${ECON.minePerMiner} each` : "no hulls docked"}`
        : `<span class="cost">${ECON.replicateCycles} cycles · no creds</span> · grow +1 · mine paused${count ? ` · ${left} left` : ""}`}
    </div>
  `;
  wrap.querySelectorAll(".mode-chip").forEach((chip) => {
    chip.onclick = () => setMode(dock, chip.getAttribute("data-mode"));
  });
  return wrap;
}

function renderProgress(root) {
  const planetPct = Math.min(100, (state.creds / ECON.planetL1) * 100);
  const berthPct = Math.min(100, (state.earned / ECON.berthAt) * 100);
  const outPct = Math.min(100, (state.earned / ECON.outpostAt) * 100);
  const box = document.createElement("article");
  box.className = "panel cyan";
  box.innerHTML = `
    <div class="panel-head">
      <div>
        <h2>Path to Ember Reach</h2>
        <p class="flavor">First planet stays ${ECON.planetL1.toLocaleString()} creds. Mid unlocks keep the grind from going void.</p>
      </div>
    </div>
    <div class="meter">
      <div class="row"><span>First world</span><strong>${state.creds.toLocaleString()} / ${ECON.planetL1.toLocaleString()}</strong></div>
      <div class="bar"><span style="width:${planetPct}%"></span></div>
    </div>
  `;
  const u1 = document.createElement("div");
  u1.className = "unlock" + (state.minerCap >= 2 ? " done" : state.earned >= ECON.berthAt ? " ready" : "");
  u1.innerHTML = `<div class="row"><span>Mid 1 · Second miner berth</span><strong>${state.minerCap >= 2 ? "OWNED" : `${Math.min(state.earned, ECON.berthAt).toLocaleString()} / ${ECON.berthAt.toLocaleString()}`}</strong></div><div class="bar"><span style="width:${berthPct}%"></span></div>`;
  const u2 = document.createElement("div");
  u2.className = "unlock" + (state.outpost ? " done" : state.earned >= ECON.outpostAt ? " ready" : "");
  u2.innerHTML = `<div class="row"><span>Mid 2 · L0 outpost</span><strong>${state.outpost ? "OWNED" : `${Math.min(state.earned, ECON.outpostAt).toLocaleString()} / ${ECON.outpostAt.toLocaleString()}`}</strong></div><div class="bar"><span style="width:${outPct}%"></span></div>`;
  box.appendChild(u1);
  box.appendChild(u2);
  root.appendChild(box);
}

function renderSystems() {
  const root = document.getElementById("systemsRoot");
  root.innerHTML = "";
  renderProgress(root);
  maybeUnlockMids();

  for (const sys of state.systems) {
    const article = document.createElement("article");
    article.className = `panel ${sys.accent}`;
    const head = document.createElement("div");
    head.className = "panel-head";
    head.innerHTML = `<div><h2>${sys.name}</h2><p class="flavor">${sys.flavor}</p></div>`;
    article.appendChild(head);

    if (!sys.owned) {
      const gate = document.createElement("div");
      gate.className = "gate";
      gate.innerHTML = `<p>First planet is <strong style="color:var(--text)">${ECON.planetL1.toLocaleString()} creds</strong> — aspirational. Price is not discounted. Mine the claim or run Ember.</p>`;
      const buy = document.createElement("button");
      buy.className = "cyan block";
      buy.textContent = `Claim world · ${ECON.planetL1.toLocaleString()} creds`;
      buy.disabled = state.creds < ECON.planetL1;
      buy.onclick = () => buyPlanet(sys);
      gate.appendChild(buy);
      article.appendChild(gate);
      root.appendChild(article);
      continue;
    }

    const fl = document.createElement("div");
    fl.className = "section-label";
    fl.textContent = "Factories";
    article.appendChild(fl);

    const cap = bleedCap(sys);
    for (const f of sys.factories) {
      const neglected = f.status === "neglected" && !f.lockedOnline;
      const row = document.createElement("div");
      row.className = "factory" + (neglected ? " neglected" : "");
      row.innerHTML = `
        <div class="factory-meta">
          <p class="factory-name">${f.name}</p>
          <span class="status ${neglected ? "neglected" : "online"}"><span class="dot"></span> ${neglected ? "Neglected" : "Online"}</span>
          ${neglected ? `<div class="bleed">Bleeding −${cap} creds/cycle · capped ≤ mine−1</div>` : f.lockedOnline ? `<div class="hint" style="margin:4px 0 0">Stays Online · free regen service path</div>` : ""}
        </div>
      `;
      const actions = document.createElement("div");
      actions.className = "factory-actions";
      const svc = document.createElement("button");
      svc.textContent = `Service factory · ${ECON.serviceEnergy}⚡`;
      svc.disabled = f.lockedOnline || state.energy < ECON.serviceEnergy;
      svc.onclick = () => serviceFactory(sys, f);
      const ign = document.createElement("button");
      ign.className = "ghost";
      ign.textContent = "Ignore";
      ign.onclick = () => ignoreFactory(sys, f);
      actions.appendChild(svc);
      actions.appendChild(ign);
      row.appendChild(actions);
      article.appendChild(row);
    }

    const ml = document.createElement("div");
    ml.className = "section-label";
    ml.textContent = "Miners";
    article.appendChild(ml);
    article.appendChild(minerBox(sys.id, `on ${sys.name}`));
    root.appendChild(article);
  }
}

function renderStations() {
  const root = document.getElementById("stationsRoot");
  root.innerHTML = "";
  const article = document.createElement("article");
  article.className = "panel cyan";
  article.innerHTML = `
    <div class="panel-head">
      <div>
        <h2>DN Relay Alpha</h2>
        <p class="flavor">Starter station. Free at L1. Dock, trade scrap, unlock the next lane.</p>
      </div>
    </div>
    <div class="section-label">Docked miners</div>
  `;
  article.appendChild(minerBox("relay", "at Relay Alpha"));

  const dockRow = document.createElement("div");
  dockRow.className = "stub-row";
  dockRow.style.marginTop = "8px";
  const toRelay = document.createElement("button");
  toRelay.className = "secondary";
  toRelay.textContent = "Dock from Cinder Claim";
  toRelay.disabled = !minersAt("cinder").length;
  toRelay.onclick = () => dockMiner("cinder", "relay");
  const toClaim = document.createElement("button");
  toClaim.className = "secondary";
  toClaim.textContent = "Send to Cinder Claim";
  toClaim.disabled = !minersAt("relay").length;
  toClaim.onclick = () => dockMiner("relay", "cinder");
  dockRow.appendChild(toRelay);
  dockRow.appendChild(toClaim);
  article.appendChild(dockRow);
  if (state.outpost) {
    const extra = document.createElement("div");
    extra.className = "stub-row";
    const toOut = document.createElement("button");
    toOut.className = "secondary";
    toOut.textContent = "Dock at L0 outpost";
    toOut.disabled = !minersAt("cinder").length && !minersAt("relay").length;
    toOut.onclick = () => dockMiner(minersAt("cinder").length ? "cinder" : "relay", "ash-l0");
    extra.appendChild(toOut);
    article.appendChild(extra);
  }

  const sl = document.createElement("div");
  sl.className = "section-label";
  sl.textContent = "Scrap exchange";
  article.appendChild(sl);
  const stubs = document.createElement("div");
  stubs.className = "stub-row";
  stubs.innerHTML = `
    <div class="stub">
      <div class="k">Buy scrap</div>
      <div class="v">${ECON.scrapBuy} creds</div>
    </div>
    <div class="stub">
      <div class="k">Sell scrap</div>
      <div class="v">${ECON.scrapSell} creds · have ${state.scrap}</div>
    </div>
  `;
  const buyBtn = document.createElement("button");
  buyBtn.className = "secondary";
  buyBtn.textContent = "Buy";
  buyBtn.disabled = state.creds < ECON.scrapBuy;
  buyBtn.onclick = buyScrap;
  stubs.children[0].appendChild(buyBtn);
  const sellBtn = document.createElement("button");
  sellBtn.className = "secondary";
  sellBtn.textContent = "Sell";
  sellBtn.disabled = state.scrap < 1;
  sellBtn.onclick = sellScrap;
  stubs.children[1].appendChild(sellBtn);
  article.appendChild(stubs);

  const gl = document.createElement("div");
  gl.className = "section-label";
  gl.textContent = "Unlock next system";
  article.appendChild(gl);
  const locked = state.level < ECON.unlockLevel || state.creds < ECON.unlockCreds;
  const gate = document.createElement("div");
  gate.className = "gate";
  gate.innerHTML = `
    <p>Open <strong style="color:var(--text)">Glass Meridian</strong> — free grind gate. No IAP. Roster not expanded yet.</p>
    <div class="req">
      <span class="chip">Need <strong>${ECON.unlockCreds.toLocaleString()}</strong> creds</span>
      <span class="chip">Need Lv <strong>${ECON.unlockLevel}</strong></span>
      <span class="chip">You · <strong>${state.creds.toLocaleString()}</strong> / Lv <strong>${state.level}</strong></span>
    </div>
  `;
  const unlock = document.createElement("button");
  unlock.className = "cyan block";
  unlock.textContent = state.meridianOpen ? "Gate open · roster frozen" : locked ? `Unlock · locked (Lv ${ECON.unlockLevel})` : "Unlock Glass Meridian";
  unlock.disabled = locked && !state.meridianOpen;
  unlock.onclick = tryUnlock;
  gate.appendChild(unlock);
  article.appendChild(gate);
  root.appendChild(article);
  const note = document.createElement("p");
  note.className = "footnote";
  note.textContent = "DN Relay Alpha is free at L1 · no paywall on the first station.";
  root.appendChild(note);
}

function render() {
  document.getElementById("creds").textContent = state.creds.toLocaleString();
  document.getElementById("energy").textContent = state.energy;
  document.getElementById("energyCap").textContent = state.energyCap;
  document.getElementById("level").textContent = state.level;
  document.getElementById("tickLabel").textContent = `regen ${state.regenLeft}s · cycle ${state.cycleLeft}s`;
  renderSkills();
  renderMissions();
  renderSystems();
  renderStations();
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const id = tab.getAttribute("data-tab");
    document.querySelectorAll(".tab").forEach((t) => {
      t.setAttribute("aria-selected", t === tab ? "true" : "false");
    });
    document.getElementById("panel-missions").classList.toggle("hidden", id !== "missions");
    document.getElementById("panel-systems").classList.toggle("hidden", id !== "systems");
    document.getElementById("panel-stations").classList.toggle("hidden", id !== "stations");
  });
});

setInterval(() => {
  state.regenLeft -= 1;
  if (state.regenLeft <= 0) {
    state.regenLeft = 60;
    if (state.energy < state.energyCap) {
      state.energy = Math.min(state.energyCap, state.energy + 10);
      log("+10 energy regenerated.", "info");
    }
  }
  state.cycleLeft -= 1;
  if (state.cycleLeft <= 0) {
    state.cycleLeft = CYCLE;
    tickEconomy();
  }
  render();
}, 1000);

log("Dark Nova: Omniverse V0. Ember Drift → Ash Belt (Def 9) → Corsair Gate.", "info");
log("Cinder Claim + miner 24/cycle. Relay Alpha free. No Refit in PvE.", "info");
render();
