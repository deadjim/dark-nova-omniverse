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

### Combat (roster frozen)

Ember Drift (Def 6) → Ash Belt (Def 9) → Corsair Gate (Def 16).  
Player **Atk + ⌊Spd/4⌋ + roll(0…Luck)** vs **static enemy Defend**. Ember is not discounted.

### Economy (Founder locks + Critic PASS)

| Lock | Live |
| --- | --- |
| Starter | L1, **180** creds (thin wallet). |
| Station | **DN Relay Alpha is free at L1**. |
| Asteroid | **Cinder Claim** so mining works before a planet. |
| Miner | **+24 creds/cycle** while Mining. |
| Replicate | **3 cycles, no cred cost**. Confirm required. Blocked if wallet &lt; one mine tick. |
| Service | **8 energy**. Regen +10/60s always covers one factory. |
| Bleed | **≤ mine−1** (e.g. −23 vs +24). No death spiral. |
| Soft-lock | **Rock Line / Forge Alpha stay Online**. |
| First planet | **Ember Reach = 100,000** (not discounted). Progress meter on Systems. |
| Mid unlocks | **2,500 earned** → second miner berth. **12,000 earned** → Ash Drift L0 outpost. |

How to try it: open Systems, watch the 100k meter, Ignore Slag Line Beta to see capped bleed, Service for 8⚡, toggle Replicate (confirm), visit Stations for the free relay + scrap + Glass Meridian gate (roster still frozen).
