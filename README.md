# Dark Nova: Omniverse

**DN** V0 playtest — combat lanes plus a clickable Loop 2 economy skeleton. Mobile-first single page. No IAPs, no paywalls, no real payments.

## Playtest

**Live URL:** [https://deadjim.github.io/dark-nova-omniverse/](https://deadjim.github.io/dark-nova-omniverse/)

GitHub Pages from `main` → `/docs`. Phone-width is the intended viewport.

### Access caveats

- Do **not** use `https://dark-nova-omniverse.surge.sh` (HTTP 451).
- V0 has no save file. Refresh resets energy, skills, creds, and owned assets.
- PvE has **no Revenge IAP**. Loss is Defeat + Regen and replot only.

## Run locally

```bash
npm install
npm run dev
```

```bash
npm run build    # writes static files to docs/
npm run preview
```

## What V0 includes

Designer DN chrome throughout: **Dark Nova: Omniverse** wordmark, **DN** mark, lane chips.

### Combat (3 missions)

| Piece | V0 behavior |
| --- | --- |
| Energy | Cap 100. Missions spend energy. **+10 every 60s**. |
| Skills | Attack / Defend / Luck / Speed. Level-up grants **+3 points**. |
| Ember Drift | Lane 01. Enemy Def 6. 5 energy. |
| **Ash Belt Run** | Lane 02. **Enemy Def 9**. 12 energy. |
| Corsair Gate | Lane 03. Enemy Def 16. 20 energy. |
| Combat | Player **Atk + ⌊Spd/4⌋ + roll(0…Luck)** vs **static enemy Defend**. |
| Outcomes | Win / scrape (margin ≤ 2) / clean sweep (margin ≥ 5) / loss (half XP). |
| Defeat | **Regen and replot** only. No Revenge Kit, no $0.99, no +4 Atk rematch. |

### Loop 2 economy (clickable skeleton)

Starter **4,000 creds** is a **V0 playtest grant** so the belt is clickable immediately. Free grind still works: mission loot banks toward a first world.

| Asset | How to try it |
| --- | --- |
| **Planets** | **Claim L1 world** for **2,500** (playtest). Sheet L1 is **100,000**. L1 holds 1 factory. Raise the world for more berths (L2 6,000 / 2 slots, L3 14,000 / 4, L4 32,000 / 6). |
| **Factories** | Build on a planet (700). They bank creds every 10s. **Service · collect** before ~70s or the line **fails and pending creds are lost**. Repair costs 180. |
| **Miners** | Buy a robotic miner (350). Toggle **Mine** (small creds, wears out) or **Replicate** (copies a chassis, also wears). Not both at once. 100% wear = scrap. |
| **Stations** | **Buy DN dock** (1,200). Fees tick into creds while the page is open. **Dock** for a small extra haul on cooldown. |

Idle ticks run only while the tab is open (same spirit as energy regen). No new IAPs.

## Repo layout

- `index.html`, `src/style.css`, `src/main.js` — Vite + vanilla playtest
- `docs/` — committed production build for GitHub Pages
