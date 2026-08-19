# Nest

> Your quiet little place to work.

Nest is a local-first focus room: choose one thing, settle into a place, and work without streaks, guilt, or productivity-dashboard noise.

## What exists now

The first vertical slice is functional:

- Cozy responsive room interface
- Time-of-day atmosphere
- Three Places: Rainy Café, Old Library, and 2:17 AM
- 25 / 45 / 60 minute or open-ended focus sessions
- Pause / resume and +10 minute controls
- Session state persisted in `localStorage`
- Local journal of completed sessions
- Installable PWA configuration
- Reduced-motion support

## Run locally

Requires Node.js 20.19+.

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Product rule

**Nest should make the user want to stay, not make the user feel inadequate.**

That means no streak punishment, fake urgency, noisy dashboards, or gamification that turns quiet work into another score to optimize.

## Current architecture

```text
src/
  App.tsx       main product flow and local state
  main.tsx      React entry point
  styles.css    room, atmosphere, responsive UI
public/
  nest.svg      app icon
vite.config.ts  Vite + PWA configuration
```

This is intentionally small. There is no backend, account system, global state library, component framework, or database yet.

## Next milestones

1. **Audio system** — legal/local ambience and music layers with independent volume controls.
2. **Session model cleanup** — move persistence and timer logic out of `App.tsx` and add tests.
3. **Place system** — define each room as data instead of hard-coding visual variations.
4. **PWA polish** — proper raster icons, install UX, offline verification, update behavior.
5. **Room interactions** — lamp, window, notebook, and record player become meaningful controls.
6. **Journal refinement** — dates, totals, export, and a calm weekly view without turning it into analytics software.

## Cut list for V1

Not yet:

- Accounts or authentication
- Cloud sync
- AI features
- Teams / collaboration
- Payments
- Social features
- Tauri desktop wrapper
- Huge music catalog

The goal is to make the core room feel worth returning to before adding infrastructure.
