# Math Role Simulations

A series of browser simulations where you take on a role (a howitzer gunner, an F1 race engineer, ...) and learn a piece of math by working it with your own hands.

| # | Episode | Math |
|---|---|---|
| 01 | [Calculus Howitzer](episodes/01-calculus-howitzer/) | derivatives, integrals, numerical integration |

## Run

```bash
pnpm install
pnpm dev          # http://localhost:5173/ (landing), /episodes/01-calculus-howitzer/
pnpm build        # → dist/ (static site)
pnpm check        # typecheck + dependency rules + unit tests
pnpm test:e2e     # browser tests (uses the system Chrome; set PW_CHANNEL= to use Playwright's Chromium)
```

## Layout

- `engine/` — shared engine (`@series/engine`), imported by every episode
  - `math/` integrators, quadratic roots, seeded RNG, angle conversion
  - `sim/` fixed-timestep loop (pause, single step, playback speed)
  - `ui/` theme tokens and components CSS, canvas sizing, tooltips, storage
  - `i18n/` Korean/English strings (`tr`, `P`, `data-i18n`); the language choice is shared across the series
  - `tutorial/` mission engine: coach-mark card, gated steps, quizzes
- `episodes/NN-slug/` — one episode each
  - `src/model/` pure math only (no DOM), every function unit-tested in `tests/`
  - `episode.json` metadata used by the landing page
- `episodes/_template/` — copy this to start a new episode (see its README)
- `site/` — landing page, built to `/`
- `e2e/` — Playwright tests. `e2e/legacy/howitzer.html` is the original single-file game, kept as the reference for `parity.spec.ts`
- `docs/setup-log.md` — what was set up, step by step

## Rules

- Episodes import only `@series/engine`, never another episode (`pnpm check:boundaries`).
- Every formula and physical value has its source in a comment next to the code.
- Core math functions have unit tests.
- Every episode must be playable on a phone.
