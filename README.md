# Dark Nova: Omniverse

**DN** V0 combat-loop playtest. Mobile-first single page. No planets, miners, or real payments.

## Playtest

**Live URL:** [https://dark-nova-omniverse.surge.sh](https://dark-nova-omniverse.surge.sh)

Public static host (Surge). No login. Open on a phone or a narrow desktop window.

### Access caveats

- This GitHub repo is **private**. This agent could not enable GitHub Pages (Pages/Actions APIs return 403). Even after the owner turns Pages on for `main` → `/docs`, a private-repo Pages site is not a public share link unless the account has GitHub Pro *and* Pages visibility is set to public.
- Expected Pages URL if the owner enables it: `https://deadjim.github.io/dark-nova-omniverse/`
- Revenge Kit is **simulated** ($0.99 sim only). No real checkout.
- V0 has no save file. Refresh resets energy, skills, and creds.

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL (Vite, default `http://localhost:5173`). Intended viewport is phone-width (`min(420px, 100%)`).

```bash
npm run build    # writes static files to docs/ (GitHub Pages folder)
npm run preview  # serve the production build
```

You can also drop the `docs/` folder onto Netlify, Vercel, or Surge.

## What V0 includes

Designer DN chrome throughout: **Dark Nova: Omniverse** wordmark, **DN** mark, lane chips, wreck blackout, Refit card.

| Piece | V0 behavior |
| --- | --- |
| Energy | Cap 100. Missions spend energy. **+10 every 60s**. |
| Skills | Attack / Defend / Luck / Speed. Level-up grants **+3 points**. Dump Atk to climb free. |
| Ember Drift | Lane 01. Enemy Def 6. 5 energy. |
| **Ash Belt Run** | Lane 02. **Enemy Def 9**. 12 energy. |
| Corsair Gate | Lane 03. Enemy Def 16. 20 energy. |
| Combat | Player Atk + ⌊Spd/4⌋ + luck roll vs enemy **Def** + ⌊Spd/4⌋ + luck roll. |
| Outcomes | Win / scrape win (margin ≤ 2, half loot) / clean sweep (margin ≥ 5, +25% loot) / loss (half XP). |
| Revenge / Refit | On wreck: blackout → **Dark Nova · Refit** card. Free “regen and replot”, or simulated Revenge Kit (+4 Atk, one-shot, this mission only, free retry). |

Out of scope for V0: planets, miners, persistence, accounts, real payments.

## Repo layout

- `index.html`, `src/style.css`, `src/main.js` — Vite + vanilla playtest
- `docs/` — committed production build for GitHub Pages (`main` → `/docs`)
- `.github/workflows/pages.yml` — optional Pages deploy from `main` if Actions are enabled
