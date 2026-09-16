# Dark Nova: Omniverse

**DN** V0 combat-loop playtest. Mobile-first single page. No planets, miners, or real payments.

## Playtest

**Live URL:** [https://temporary-speedy-mandolin-7h3nq2g.vercel.app](https://temporary-speedy-mandolin-7h3nq2g.vercel.app)

Public Vercel static deploy of the current V0 `docs/` build. No login. HTTP 200. Open on a phone or a narrow desktop window.

**Claim this site** (keeps it after 60 minutes): [https://vercel.com/claim-deployment?code=93bc3e86-9d0e-41d0-9cec-129f02555469](https://vercel.com/claim-deployment?code=93bc3e86-9d0e-41d0-9cec-129f02555469)

### Access caveats

- Surge (`dark-nova-omniverse.surge.sh`) returns **HTTP 451** and is not a beta link. Do not use it.
- This Vercel URL is an anonymous production deploy. **Claim it within 60 minutes** at the link above or it expires. Claiming attaches it to your Vercel account.
- This GitHub repo is **private**. GitHub Pages could not be enabled from the agent (Pages/Actions APIs return 403). Do not wait on Pages for the beta.
- No real checkout. PvE has **no Revenge IAP** — loss is Defeat + Regen and replot only.
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

Designer DN chrome throughout: **Dark Nova: Omniverse** wordmark, **DN** mark, lane chips.

| Piece | V0 behavior |
| --- | --- |
| Energy | Cap 100. Missions spend energy. **+10 every 60s**. |
| Skills | Attack / Defend / Luck / Speed. Level-up grants **+3 points**. Dump Atk to climb free. |
| Ember Drift | Lane 01. Enemy Def 6. 5 energy. |
| **Ash Belt Run** | Lane 02. **Enemy Def 9**. 12 energy. |
| Corsair Gate | Lane 03. Enemy Def 16. 20 energy. |
| Combat | Player **Atk + ⌊Spd/4⌋ + roll(0…Luck)** vs **static enemy Defend** only. |
| Outcomes | Win / scrape win (margin ≤ 2, half loot) / clean sweep (margin ≥ 5, +25% loot) / loss (half XP). |
| Defeat | Loss shows a **Defeat** result and **Regen and replot** only. No Revenge Kit, no $0.99, no +4 Atk rematch. |

Out of scope for this cut: Revenge IAP, persistence, accounts, real payments.

## Repo layout

- `index.html`, `src/style.css`, `src/main.js` — Vite + vanilla playtest
- `docs/` — committed production build for GitHub Pages (`main` → `/docs`)
- `.github/workflows/pages.yml` — optional Pages deploy from `main` if Actions are enabled
