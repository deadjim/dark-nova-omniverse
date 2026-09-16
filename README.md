# Dark Nova: Omniverse

**DN** V0 combat-loop playtest. Mobile-first single page. No planets, miners, or real payments.

## Playtest

**Live URL:** [https://temporary-quick-boron-jw6rw6w.vercel.app](https://temporary-quick-boron-jw6rw6w.vercel.app)

Public Vercel deploy. No login. HTTP 200. Open on a phone or a narrow desktop window.

**Claim this site** (keeps it after 60 minutes): [https://vercel.com/claim-deployment?code=d2326116-88a7-47c2-8470-aeb8a4a7c3bd](https://vercel.com/claim-deployment?code=d2326116-88a7-47c2-8470-aeb8a4a7c3bd)

### Access caveats

- Surge (`dark-nova-omniverse.surge.sh`) returns **HTTP 451** and is not a beta link. Do not use it.
- This Vercel URL is an anonymous production deploy. **Claim it within 60 minutes** at the link above or it expires. Claiming attaches it to your Vercel account.
- This GitHub repo is **private**. GitHub Pages could not be enabled from the agent (Pages/Actions APIs return 403). Do not wait on Pages for the beta.
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

You can also drop the `docs/` folder onto Vercel or Netlify. Do not use Surge (HTTP 451).

## What V0 includes

Designer DN chrome throughout: **Dark Nova: Omniverse** wordmark, **DN** mark, lane chips, wreck blackout, Refit card.

| Piece | V0 behavior |
| --- | --- |
| Energy | Cap 100. Missions spend energy. **+10 every 60s**. |
| Skills | Attack / Defend / Luck / Speed. Level-up grants **+3 points**. Dump Atk to climb free. |
| Ember Drift | Lane 01. Enemy Def 6. 5 energy. |
| **Ash Belt Run** | Lane 02. **Enemy Def 9**. 12 energy. |
| Corsair Gate | Lane 03. Enemy Def 16. 20 energy. |
| Combat | Player **Atk + ⌊Spd/4⌋ + roll(0…Luck)** vs **static enemy Defend** only. |
| Outcomes | Win / scrape win (margin ≤ 2, half loot) / clean sweep (margin ≥ 5, +25% loot) / loss (half XP). |
| Revenge / Refit | On wreck: blackout → **Dark Nova · Refit** card. Free “regen and replot”, or simulated Revenge Kit (+4 Atk, one-shot, this mission only, free retry). |

Out of scope for V0: planets, miners, persistence, accounts, real payments.

## Repo layout

- `index.html`, `src/style.css`, `src/main.js` — Vite + vanilla playtest
- `docs/` — committed production build for GitHub Pages (`main` → `/docs`)
- `.github/workflows/pages.yml` — optional Pages deploy from `main` if Actions are enabled
