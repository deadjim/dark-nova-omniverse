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

const state = {
  energy: 100,
  energyCap: 100,
  creds: 0,
  level: 1,
  xp: 1,
  skills: { atk: 5, def: 5, luck: 2, spd: 3 },
  points: 0,
  regenLeft: 60,
  revenge: null, // { missionId, atkBonus }
  pendingLoss: null,
};

function xpForLevel(level) {
  // cumulative XP required to REACH this level
  // L1 starts with 1 XP (already "at" L1)
  // L2 = 10, L3 = 20, L4 = 40, L5 = 80, then doubles
  if (level <= 1) return 1;
  if (level === 2) return 10;
  if (level === 3) return 20;
  if (level === 4) return 40;
  // level 5 = 80, 6 = 160, ...
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

function runMission(m, opts = {}) {
  if (!opts.freeRetry && state.energy < m.energy) {
    log("Not enough energy.", "lose");
    return;
  }
  if (!opts.freeRetry) state.energy -= m.energy;

  const bonusAtk =
    state.revenge && state.revenge.missionId === m.id ? state.revenge.atkBonus : 0;
  const playerAtk = state.skills.atk + bonusAtk;
  const p = combatScore(playerAtk, state.skills.luck, state.skills.spd);
  // Enemy is a static Defend check — no enemy luck/speed roll
  const enemyDef = m.enemy.def;
  const margin = p.score - enemyDef;
  const bonusNote = bonusAtk ? ` [Revenge +${bonusAtk} Atk]` : "";

  log(
    `${m.name}: you ${p.score} (Atk ${playerAtk}${bonusNote} +⌊Spd/4⌋ ${Math.floor(state.skills.spd / 4)} +roll ${p.roll}) vs enemy Def ${enemyDef} (static)`,
    "info"
  );

  // consume revenge kit after the fight it buffed
  if (bonusAtk) {
    state.revenge = null;
    log("Revenge Kit spent — one-shot over.", "info");
  }

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
    showBlackoutThenRevenge(m);
  }
}

function showBlackoutThenRevenge(m) {
  const bo = document.getElementById("blackout");
  bo.classList.add("show");
  setTimeout(() => {
    bo.classList.remove("show");
    state.pendingLoss = m;
    document.getElementById("revengeCopy").textContent =
      `Wrecked on ${m.name}. One-shot +4 Attack for a rematch of this mission only — or regen and replot.`;
    document.getElementById("revengeOverlay").classList.add("show");
  }, 1200);
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
}

document.getElementById("freePath").onclick = () => {
  document.getElementById("revengeOverlay").classList.remove("show");
  state.pendingLoss = null;
  log("You replot free. Wait for energy or dump Atk on level-up.", "info");
};

document.getElementById("buyRevenge").onclick = () => {
  const m = state.pendingLoss;
  if (!m) return;
  document.getElementById("confirmMission").textContent = m.name;
  document.getElementById("confirmOverlay").classList.add("show");
};

document.getElementById("cancelBuy").onclick = () => {
  document.getElementById("confirmOverlay").classList.remove("show");
};

document.getElementById("confirmBuy").onclick = () => {
  const m = state.pendingLoss;
  document.getElementById("confirmOverlay").classList.remove("show");
  document.getElementById("revengeOverlay").classList.remove("show");
  if (!m) return;
  state.revenge = { missionId: m.id, atkBonus: 4 };
  state.pendingLoss = null;
  log(`Revenge Kit armed for ${m.name} (+4 Atk, one shot). Re-engaging.`, "info");
  // free retry of same mission (energy already spent on the loss)
  runMission(m, { freeRetry: true });
};

setInterval(() => {
  state.regenLeft -= 1;
  if (state.regenLeft <= 0) {
    state.regenLeft = 60;
    if (state.energy < state.energyCap) {
      state.energy = Math.min(state.energyCap, state.energy + 10);
      log("+10 energy regenerated.", "info");
    }
  }
  render();
}, 1000);

log("Dark Nova: Omniverse V0 online. Ember Drift → Ash Belt (Def 9) → Corsair Gate.", "info");
render();
