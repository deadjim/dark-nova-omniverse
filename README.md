# Dark Nova: Omniverse

**DN** V0 playtest — combat lanes plus Loop 2 economy. Mobile-first. No IAPs.

## Playtest

**https://deadjim.github.io/dark-nova-omniverse/**

GitHub Pages from `main` → `/docs`.

### Access caveats

- Do **not** use Surge (`dark-nova-omniverse.surge.sh` — HTTP 451).
- Progress saves in this browser (`localStorage`). Hard refresh keeps the run. Closed-tab time fills claim piles and energy (capped ~45 min). Piles still need tap-to-claim.
- PvE has **no Revenge / Refit**. Loss is combat-log only.

## Run locally

```bash
npm install
npm run dev
```

```bash
npm run build    # writes docs/ for Pages
npm run preview
```

## What V0 includes

Tabs: **Missions · Systems · Stations**. DN chrome on every screen.

### Combat (full roster)

Player **Atk + ⌊Spd/4⌋ + roll(0…Luck)** vs **static enemy Defend**. No Revenge / Refit.

| Lane | Energy | Def | Loot | XP |
| --- | --- | --- | --- | --- |
| Ember Drift | 5 | 6 | 80 | 3 |
| Cinder Sweep | 6 | 7 | 110 | 4 |
| Ash Belt Run | 12 | 9 | 220 | 8 |
| Slag Corridor | 14 | 10 | 260 | 9 |
| Glass Meridian | 16 | 12 | 340 | 12 |
| Corsair Gate | 20 | 16 | 500 | 18 |

Wins flash the crate, then creds: scrape (margin ≤2) → **Scrap Bundle**, clean (margin ≥5) → **Hot Salvage**, jackpot (margin ≥8 or 12% of cleans) → **Jackpot Cache**.  
Mastery ★★★ sits under Engage (no modal): ★1 first clear, ★2 clean only, ★3 any 3 clears (scrapes count). Repeat loot: ★2 +10%, ★3 +20%.

### Economy (Founder locks + Critic PASS)

| Lock | Live |
| --- | --- |
| Starter | L1, **180** creds (thin wallet). |
| Station | **DN Relay Alpha is free at L1**. |
| Asteroid | **Cinder Claim** so mining works before a planet. |
| Miner | **+24/cycle** into a **claim pile**. Clock is real (~12s). **No auto-credit.** |
| Factory | **+8/cycle** into its own pile while Online. Same tap-to-claim. |
| Pile cap | ~**45 min** idle (225 cycles). Full piles stop stacking until Claim. |
| Replicate | **3 mine cycles, never creds.** No 120-cred cost. No wallet-floor confirm. |
| Service | **8 energy**. Regen +10/60s always covers one factory. |
| Bleed | **≤ mine−1** (e.g. −23 vs +24). No death spiral. |
| Soft-lock | **Rock Line / Forge Alpha stay Online**. |
| First planet | **Ember Reach = 100,000** (not discounted). Bar = **Earned toward 100k** (lifetime) — scrap spends never shrink it. |
| Mid unlocks | **2,500 earned** → second miner berth. **12,000 earned** → Ash Drift L0 outpost. |

How to try it: open Missions (Ember → Cinder → Ash → Slag → Glass → Corsair), win Ember and watch the crate flash then creds, read ★★★ under Engage, open Systems and tap a claim chip, visit Stations — **Relay online. Claim when you’re ready.**
