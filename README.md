# Dark Nova: Omniverse

**DN** V0 playtest — combat lanes plus Loop 2 economy. Mobile-first. No IAPs.

## Playtest

**https://deadjim.github.io/dark-nova-omniverse/**

GitHub Pages from `main` → `/docs`.

### Access caveats

- Do **not** use Surge (`dark-nova-omniverse.surge.sh` — HTTP 451).
- No save file. Refresh resets the run.
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
| Cinder Sweep | 6 | 7 | 100 | 4 |
| Ash Belt Run | 12 | 9 | 220 | 8 |
| Slag Corridor | 14 | 10 | 260 | 9 |
| Glass Meridian | 16 | 12 | 340 | 12 |
| Corsair Gate | 20 | 16 | 500 | 18 |

Wins name the crate: scrape → **Scrap Bundle**, clean → **Hot Salvage**, jackpot (margin ≥ 5 or Corsair) → **Jackpot Cache**.  
Mastery ★★★ per mission (1★ first win, 2★ repeats, 3★ deeper + a jackpot). Small loot/XP% bonuses. Mid-lanes star faster.

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

How to try it: open Missions for all six lanes + ★★★ mastery, win Ember and read the crate name in the log, open Systems, wait a 12s cycle, tap the glowing cred chip (wallet does not tick up on its own — piles never decay), buy scrap and watch **Earned toward 100k** hold, Ignore Slag Line Beta for capped bleed, Service for 8⚡, toggle Replicate (3 cycles, no Advance button), visit Stations for the free relay + scrap + Glass Meridian gate.
