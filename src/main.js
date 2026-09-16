const MISSIONS = [
  {
    id: "ember",
    name: "Ember Drift",
    blurb: "Skim the burn. Bring back what floats.",
    enemy: { atk: 4, def: 6, luck: 1, spd: 2 },
    energy: 5,
    loot: 80,
    xp: 3,
    tier: 1,
    lane: "Lane 01",
  },
  {
    id: "sweep",
    name: "Cinder Sweep",
    blurb: "Cinder patrol. Sweep the lane, pocket the glow.",
    enemy: { atk: 5, def: 7, luck: 2, spd: 3 },
    energy: 6,
    loot: 110,
    xp: 4,
    tier: 1,
    lane: "Lane 01",
  },
  {
    id: "ash",
    name: "Ash Belt Run",
    blurb: "Thread the slag. Don’t kiss the rocks.",
    enemy: { atk: 8, def: 9, luck: 3, spd: 4 },
    energy: 12,
    loot: 220,
    xp: 8,
    tier: 2,
    lane: "Lane 02",
  },
  {
    id: "slag",
    name: "Slag Corridor",
    blurb: "Hot corridor. Exit with scrap or not at all.",
    enemy: { atk: 9, def: 10, luck: 3, spd: 4 },
    energy: 14,
    loot: 260,
    xp: 9,
    tier: 2,
    lane: "Lane 02",
  },
  {
    id: "glass",
    name: "Glass Meridian",
    blurb: "Mirror field. One clean pass pays.",
    enemy: { atk: 11, def: 12, luck: 4, spd: 5 },
    energy: 16,
    loot: 340,
    xp: 12,
    tier: 3,
    lane: "Lane 03",
  },
  {
    id: "corsair",
    name: "Corsair Gate",
    blurb: "Their door. Your problem.",
    enemy: { atk: 14, def: 16, luck: 5, spd: 6 },
    energy: 20,
    loot: 500,
    xp: 18,
    tier: 3,
    lane: "Lane 03",
  },
];

const SAVE_KEY = "dn-omniverse-v1";
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
  factoryRate: 8,
  idleCycles: 225, // ~45 min at 12s — pile caps; no infinite balloon
};

const MAX_CATCHUP = ECON.idleCycles * CYCLE; // ~45 min — piles cap here; no infinite years

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
  lastTick: Date.now(),
  mastery: {},
  miners: [{ id: 1, dock: "cinder" }],
  modes: { cinder: "mine", ember: "mine", relay: "mine", "ash-l0": "mine" },
  replicateLeft: { cinder: 0, ember: 0, relay: 0, "ash-l0": 0 },
  minePile: { cinder: 0, ember: 0, relay: 0, "ash-l0": 0 },
  pileFull: { cinder: false, ember: false, relay: false, "ash-l0": false },
  systems: [
    {
      id: "cinder",
      name: "Cinder Claim",
      flavor: "Starter asteroid. Mine it before you own a world.",
      accent: "ember",
      owned: true,
      kind: "asteroid",
      factories: [
        { id: "rock-line", name: "Rock Line", status: "online", idle: 0, lockedOnline: true, pile: 0 },
        { id: "slag-beta", name: "Slag Line Beta", status: "online", idle: 0, lockedOnline: false, pile: 0 },
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
        { id: "forge-alpha", name: "Forge Alpha", status: "online", idle: 0, lockedOnline: true, pile: 0 },
        { id: "slag-reach", name: "Slag Line Beta", status: "online", idle: 0, lockedOnline: false, pile: 0 },
      ],
    },
  ],
};

function saveState() {
  try {
    state.lastTick = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (_) {
    /* quota / private mode — run continues unsaved */
  }
}

function mergeSystems(savedSystems) {
  if (!Array.isArray(savedSystems)) return;
  const byId = Object.fromEntries(savedSystems.map((s) => [s.id, s]));
  for (const sys of state.systems) {
    const s = byId[sys.id];
    if (!s) continue;
    sys.owned = !!s.owned;
    if (!Array.isArray(s.factories)) continue;
    for (const f of sys.factories) {
      const sf = s.factories.find((x) => x.id === f.id);
      if (!sf) continue;
      if (sf.status) f.status = sf.status;
      if (sf.idle != null) f.idle = sf.idle;
      if (sf.pile != null) f.pile = sf.pile;
    }
  }
  for (const s of savedSystems) {
    if (!state.systems.some((x) => x.id === s.id)) state.systems.push(s);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object" || typeof saved.creds !== "number") return false;
    const scalars = [
      "energy",
      "energyCap",
      "creds",
      "earned",
      "scrap",
      "level",
      "xp",
      "points",
      "regenLeft",
      "cycleLeft",
      "nextMiner",
      "minerCap",
      "outpost",
      "meridianOpen",
    ];
    for (const k of scalars) {
      if (saved[k] !== undefined) state[k] = saved[k];
    }
    if (saved.skills && typeof saved.skills === "object") {
      state.skills = { ...state.skills, ...saved.skills };
    }
    if (saved.mastery && typeof saved.mastery === "object") state.mastery = saved.mastery;
    if (Array.isArray(saved.miners) && saved.miners.length) state.miners = saved.miners;
    if (saved.modes && typeof saved.modes === "object") state.modes = { ...state.modes, ...saved.modes };
    if (saved.replicateLeft && typeof saved.replicateLeft === "object") {
      state.replicateLeft = { ...state.replicateLeft, ...saved.replicateLeft };
    }
    if (saved.minePile && typeof saved.minePile === "object") {
      state.minePile = { ...state.minePile, ...saved.minePile };
    }
    if (saved.pileFull && typeof saved.pileFull === "object") {
      state.pileFull = { ...state.pileFull, ...saved.pileFull };
    }
    mergeSystems(saved.systems);
    catchUp(typeof saved.lastTick === "number" ? saved.lastTick : 0);
    return true;
  } catch (_) {
    return false;
  }
}

function applyCyclePiles(opts = {}) {
  const quiet = !!opts.quiet;
  let stacked = 0;
  for (const dock of Object.keys(state.modes)) {
    if (state.modes[dock] === "mine") {
      const gain = mineIncome(dock);
      if (gain) {
        const was = state.minePile[dock] || 0;
        const full = addPile(state.minePile, dock, gain, mineCap(dock));
        stacked += (state.minePile[dock] || 0) - was;
        if (full && !state.pileFull[dock]) {
          state.pileFull[dock] = true;
          if (!quiet) log(`Mine pile at ${dock} is full (~45 min idle). Claim to keep stacking.`, "info");
        }
      }
    } else if (minersAt(dock).length) {
      state.replicateLeft[dock] -= 1;
      if (state.replicateLeft[dock] <= 0) {
        if (state.miners.length < state.minerCap) {
          state.miners.push({ id: state.nextMiner++, dock });
          if (!quiet) log(`Replica complete at ${dock}. Fleet +1.`, "info");
        } else if (!quiet) {
          log(`Replica finished but berth is full.`, "lose");
        }
        state.modes[dock] = "mine";
        state.replicateLeft[dock] = 0;
      }
    }
  }
  for (const sys of state.systems) {
    if (!sys.owned) continue;
    for (const f of sys.factories) {
      if (f.lockedOnline) {
        f.status = "online";
        f.idle = 0;
        stacked += stackFactory(f);
        continue;
      }
      if (f.status === "online") stacked += stackFactory(f);
    }
  }
  return stacked;
}

function catchUp(lastTick) {
  const now = Date.now();
  if (!lastTick || lastTick > now) {
    state.lastTick = now;
    return;
  }
  let elapsed = Math.floor((now - lastTick) / 1000);
  if (elapsed < 2) {
    state.lastTick = now;
    return;
  }
  elapsed = Math.min(elapsed, MAX_CATCHUP);

  const energyBefore = state.energy;
  let energySec = elapsed;
  while (energySec >= state.regenLeft && state.energy < state.energyCap) {
    energySec -= state.regenLeft;
    state.regenLeft = 60;
    state.energy = Math.min(state.energyCap, state.energy + 10);
  }
  if (state.energy >= state.energyCap) state.regenLeft = 60;
  else state.regenLeft = Math.max(1, state.regenLeft - energySec);

  let cycles = 0;
  let cycleSec = elapsed;
  if (cycleSec >= state.cycleLeft) {
    cycleSec -= state.cycleLeft;
    cycles += 1 + Math.floor(cycleSec / CYCLE);
    state.cycleLeft = CYCLE - (cycleSec % CYCLE);
    if (state.cycleLeft <= 0) state.cycleLeft = CYCLE;
  } else {
    state.cycleLeft -= cycleSec;
  }

  let stacked = 0;
  for (let i = 0; i < cycles; i++) stacked += applyCyclePiles({ quiet: true });

  state.lastTick = now;
  if (cycles || state.energy !== energyBefore) {
    const mins = Math.max(1, Math.round(elapsed / 60));
    log(
      `Offline catch-up · ${mins}m · ${cycles} cycle${cycles === 1 ? "" : "s"} stacked +${stacked} unclaimed. Energy ${state.energy}/${state.energyCap}. Tap Claim to bank.`,
      "info"
    );
  }
}

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

function mineCap(dock) {
  const n = Math.max(1, minersAt(dock).length);
  return n * ECON.minePerMiner * ECON.idleCycles;
}

function factoryCap() {
  return ECON.factoryRate * ECON.idleCycles;
}

function addPile(map, key, amount, cap) {
  const next = Math.min(cap, (map[key] || 0) + amount);
  const full = next >= cap && amount > 0;
  map[key] = next;
  return full;
}

function claimMine(dock) {
  const n = state.minePile[dock] || 0;
  if (!n) {
    toast("Nothing to claim yet — wait for a mine cycle.");
    return;
  }
  state.minePile[dock] = 0;
  state.pileFull[dock] = false;
  gainCreds(n);
  log(`Claimed ${n} mine creds.`, "win");
  toast(`Banked ${n} creds.`, true);
  maybeUnlockMids();
  render();
}

function claimFactory(factory) {
  const n = factory.pile || 0;
  if (!n) {
    toast("Factory pile is empty.");
    return;
  }
  factory.pile = 0;
  gainCreds(n);
  log(`Claimed ${n} factory creds from ${factory.name}.`, "win");
  toast(`Banked ${n} creds.`, true);
  maybeUnlockMids();
  render();
}

function claimSystem(sys) {
  let n = 0;
  const mine = state.minePile[sys.id] || 0;
  if (mine) {
    state.minePile[sys.id] = 0;
    state.pileFull[sys.id] = false;
    n += mine;
  }
  for (const f of sys.factories) {
    if (f.pile) {
      n += f.pile;
      f.pile = 0;
    }
  }
  if (!n) {
    toast("Nothing stacked here yet — wait for a cycle.");
    return;
  }
  gainCreds(n);
  log(`Claim burst ${n} creds on ${sys.name}.`, "win");
  toast(`Banked ${n} creds.`, true);
  maybeUnlockMids();
  render();
}

function pileHeat(amount, cap) {
  if (!amount) return "empty";
  const pct = amount / cap;
  if (pct >= 1) return "full";
  if (pct >= 0.8) return "pull";
  return "quiet";
}

function credChip({ amount, cap, label, onClaim }) {
  const heat = pileHeat(amount, cap);
  const pct = Math.min(100, Math.round((amount / cap) * 100));
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `cred-chip heat-${heat}`;
  btn.disabled = !amount;
  btn.setAttribute("aria-label", amount ? `Claim ${amount} ${label}` : `${label} empty`);
  btn.innerHTML = `
    <span class="cred-chip-amt">${amount ? `+${amount.toLocaleString()}` : "—"}</span>
    <span class="cred-chip-sub">${amount ? (heat === "full" ? "FULL · tap claim" : `${pct}% · tap claim`) : label}</span>
    <span class="cred-chip-fill" style="width:${pct}%"></span>
  `;
  btn.onclick = onClaim;
  return btn;
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

function masteryRec(id) {
  if (!state.mastery[id]) state.mastery[id] = { wins: 0, cleans: 0 };
  return state.mastery[id];
}

function starSlots(m) {
  const rec = masteryRec(m.id);
  return {
    s1: rec.wins >= 1,
    s2: rec.cleans >= 1,
    s3: rec.wins >= 3,
  };
}

function starGlyphs(m) {
  const s = starSlots(m);
  return `${s.s1 ? "★" : "☆"}${s.s2 ? "★" : "☆"}${s.s3 ? "★" : "☆"}`;
}

function masteryBonus(m) {
  const s = starSlots(m);
  if (s.s3) return 0.2;
  if (s.s2) return 0.1;
  return 0;
}

function salvageCrate(m, margin) {
  const cinder = m.id === "sweep";
  if (margin <= 2) return { name: "Scrap Bundle", kind: "scrape", lootMult: 0.5 };
  if (margin >= 8) return { name: "Jackpot Cache", kind: "jackpot", lootMult: 1.4 };
  const cleanAt = cinder ? 3 : 5;
  if (margin >= cleanAt) {
    const jackpotChance = cinder ? 0.08 : 0.12;
    if (Math.random() < jackpotChance) return { name: "Jackpot Cache", kind: "jackpot", lootMult: 1.4 };
    return { name: "Hot Salvage", kind: "clean", lootMult: cinder ? 1.2 : 1 };
  }
  return { name: "Scrap Bundle", kind: "scrape", lootMult: 0.85 };
}

function flashSalvage(crateName, loot) {
  const el = document.getElementById("salvageFlash");
  const crate = document.getElementById("salvageCrate");
  const creds = document.getElementById("salvageCreds");
  crate.textContent = crateName;
  creds.textContent = "";
  el.hidden = false;
  el.classList.add("show");
  el.classList.remove("creds-in");
  clearTimeout(flashSalvage._t1);
  clearTimeout(flashSalvage._t2);
  flashSalvage._t1 = setTimeout(() => {
    creds.textContent = `+${loot.toLocaleString()} creds`;
    el.classList.add("creds-in");
  }, 520);
  flashSalvage._t2 = setTimeout(() => {
    el.classList.remove("show", "creds-in");
    el.hidden = true;
  }, 1700);
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
    const crate = salvageCrate(m, margin);
    const rec = masteryRec(m.id);
    const bonus = masteryBonus(m);
    const loot = Math.floor(m.loot * crate.lootMult * (1 + bonus));
    rec.wins += 1;
    if (crate.kind === "clean" || crate.kind === "jackpot") rec.cleans += 1;
    const stars = starGlyphs(m);
    gainCreds(loot);
    state.xp += m.xp;
    applyLevelUps();
    const result = crate.kind === "scrape" ? "Scrape" : crate.kind === "jackpot" ? "Jackpot" : "Clean";
    log(`${crate.name}. Then +${loot} creds, +${m.xp} XP. ${result} (margin ${margin}). Mastery ${stars}`, "win");
    flashSalvage(crate.name, loot);
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
    toast("Gate open. Six lanes are already live.");
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
        { id: "ring-yard", name: "Ring Yard One", status: "online", idle: 0, lockedOnline: true, pile: 0 },
      ],
    });
    log("Mid unlock: Ash Drift L0 outpost claimed.", "win");
    toast("L0 outpost online.", true);
  }
}

function stackFactory(factory) {
  if (factory.pile == null) factory.pile = 0;
  const cap = factoryCap();
  const before = factory.pile;
  factory.pile = Math.min(cap, before + ECON.factoryRate);
  return factory.pile - before;
}

function tickEconomy() {
  const stacked = applyCyclePiles();
  let bleed = 0;
  for (const sys of state.systems) {
    if (!sys.owned) continue;
    const cap = bleedCap(sys);
    for (const f of sys.factories) {
      if (f.lockedOnline) continue;
      if (f.status === "online") {
        f.idle += 1;
        if (f.idle >= ECON.neglectAfter) f.status = "neglected";
      }
      if (f.status === "neglected") bleed += cap;
    }
  }
  if (bleed) state.creds = Math.max(0, state.creds - bleed);
  if (stacked) log(`Cycle stacked +${stacked} unclaimed. Tap Claim to bank.`, "info");
  if (bleed) log(`Neglect bleed −${bleed} creds (≤ mine−1).`, "lose");
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
  const rule = document.createElement("p");
  rule.className = "salvage-rule";
  rule.textContent = "Scrape (margin ≤2) → Scrap Bundle. Clean (margin ≥5) → Hot Salvage. Jackpot Cache = margin ≥8 or 12% of cleans — rarer than clean.";
  root.appendChild(rule);
  for (const m of MISSIONS) {
    const card = document.createElement("div");
    card.className = "mission " + m.id;
    const e = m.enemy;
    const slots = starSlots(m);
    const stars = starGlyphs(m);
    const bonus = masteryBonus(m);
    card.innerHTML = `
      <div class="lane">${m.lane} · T${m.tier} · DN</div>
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
    const under = document.createElement("div");
    under.className = "mastery-under";
    under.setAttribute("aria-label", `Mastery ${stars}`);
    const row = document.createElement("div");
    row.className = "star-row";
    [
      { on: slots.s1, n: 1, tip: "first clear" },
      { on: slots.s2, n: 2, tip: "clean sweep" },
      { on: slots.s3, n: 3, tip: "3 clears" },
    ].forEach((slot) => {
      const mark = document.createElement("span");
      mark.className = "star-slot" + (slot.on ? " on" : "");
      mark.innerHTML = `<span class="star">${slot.on ? "★" : "☆"}</span><span class="star-n">★${slot.n}</span>`;
      mark.title = `★${slot.n} ${slot.tip}`;
      row.appendChild(mark);
    });
    under.appendChild(row);
    const chip = document.createElement("span");
    chip.className = "mastery-chip" + (bonus ? " bonus" : "");
    if (bonus) chip.textContent = `+${Math.round(bonus * 100)}% loot`;
    else if (!slots.s1) chip.textContent = "★1 first clear";
    else if (!slots.s2) chip.textContent = "★2 needs clean";
    else chip.textContent = "★3 any 3 clears";
    under.appendChild(chip);
    card.appendChild(under);
    root.appendChild(card);
  }
}

function minerBox(dock, label) {
  const count = minersAt(dock).length;
  const mode = state.modes[dock];
  const mining = mode === "mine";
  const gain = count * ECON.minePerMiner;
  const left = state.replicateLeft[dock];
  const pile = state.minePile[dock] || 0;
  const cap = mineCap(dock);
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
        ? `<span class="gain">+${gain}/cycle into pile</span> · ${count ? `${ECON.minePerMiner} each · clock ${CYCLE}s` : "no hulls docked"}`
        : `<span class="cost">${ECON.replicateCycles} cycles · no creds</span> · grow +1 · mine paused${count ? ` · ${left} left` : ""}`}
    </div>
  `;
  wrap.querySelectorAll(".mode-chip").forEach((chip) => {
    chip.onclick = () => setMode(dock, chip.getAttribute("data-mode"));
  });
  wrap.appendChild(
    credChip({
      amount: pile,
      cap,
      label: "mine pile",
      onClaim: () => claimMine(dock),
    })
  );
  return wrap;
}

function renderProgress(root) {
  const planetPct = Math.min(100, (state.earned / ECON.planetL1) * 100);
  const berthPct = Math.min(100, (state.earned / ECON.berthAt) * 100);
  const outPct = Math.min(100, (state.earned / ECON.outpostAt) * 100);
  const box = document.createElement("article");
  box.className = "panel cyan";
  box.innerHTML = `
    <div class="panel-head">
      <div>
        <h2>Path to Ember Reach</h2>
        <p class="flavor">Earned toward 100k — scrap spends never pull this bar back. Wallet still needs ${ECON.planetL1.toLocaleString()} on hand to claim the world.</p>
      </div>
    </div>
    <div class="meter">
      <div class="row"><span>Earned toward 100k</span><strong>${state.earned.toLocaleString()} / ${ECON.planetL1.toLocaleString()}</strong></div>
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
    if (sys.owned) {
      const sysMine = state.minePile[sys.id] || 0;
      const sysFact = sys.factories.reduce((sum, f) => sum + (f.pile || 0), 0);
      const sysPile = sysMine + sysFact;
      const sysCap = mineCap(sys.id) + sys.factories.length * factoryCap();
      head.appendChild(
        credChip({
          amount: sysPile,
          cap: sysCap,
          label: "planet pile",
          onClaim: () => claimSystem(sys),
        })
      );
    }
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
      const pile = f.pile || 0;
      const fcap = factoryCap();
      row.innerHTML = `
        <div class="factory-meta">
          <p class="factory-name">${f.name}</p>
          <span class="status ${neglected ? "neglected" : "online"}"><span class="dot"></span> ${neglected ? "Neglected" : "Online"}</span>
          ${neglected ? `<div class="bleed">Bleeding −${cap} creds/cycle · capped ≤ mine−1</div>` : f.lockedOnline ? `<div class="hint" style="margin:4px 0 0">Stays Online · free regen service path</div>` : `<div class="hint" style="margin:4px 0 0">+${ECON.factoryRate}/cycle into pile</div>`}
        </div>
      `;
      const actions = document.createElement("div");
      actions.className = "factory-actions";
      actions.appendChild(
        credChip({
          amount: pile,
          cap: fcap,
          label: "factory pile",
          onClaim: () => claimFactory(f),
        })
      );
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
        <p class="flavor">Relay online. Claim when you’re ready.</p>
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
    <p>Open <strong style="color:var(--text)">Glass Meridian</strong> — free grind gate. No IAP. The six-lane roster is already live.</p>
    <div class="req">
      <span class="chip">Need <strong>${ECON.unlockCreds.toLocaleString()}</strong> creds</span>
      <span class="chip">Need Lv <strong>${ECON.unlockLevel}</strong></span>
      <span class="chip">You · <strong>${state.creds.toLocaleString()}</strong> / Lv <strong>${state.level}</strong></span>
    </div>
  `;
  const unlock = document.createElement("button");
  unlock.className = "cyan block";
  unlock.textContent = state.meridianOpen ? "Gate open" : locked ? `Unlock · locked (Lv ${ECON.unlockLevel})` : "Unlock Glass Meridian";
  unlock.disabled = locked && !state.meridianOpen;
  unlock.onclick = tryUnlock;
  gate.appendChild(unlock);
  article.appendChild(gate);
  root.appendChild(article);
  const note = document.createElement("p");
  note.className = "footnote";
  note.textContent = "Relay online. Claim when you’re ready.";
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
  saveState();
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

const restored = loadState();
log("Dark Nova: Omniverse V0. Six lanes. Mastery ★★★. Salvage crates named.", "info");
log("Cinder Claim + miner 24/cycle into a claim pile. Tap Claim to bank. Relay Alpha free. No Refit in PvE.", "info");
if (restored) log("Save loaded. Refresh keeps this run.", "win");
function catchUpFromStorage() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const last = raw ? JSON.parse(raw).lastTick : state.lastTick;
    catchUp(typeof last === "number" ? last : 0);
    render();
  } catch (_) {
    /* ignore */
  }
}
window.addEventListener("pagehide", saveState);
window.addEventListener("focus", catchUpFromStorage);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveState();
  else catchUpFromStorage();
});
render();
