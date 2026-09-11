# MetroMind AI [Historical Prototype Notes]

> [!NOTE]
> **Historical Documentation**: This document records the early Express.js prototype architecture and is maintained for historical reference. The active, canonical production application uses the **FastAPI Python backend** located in `backend/` and the **React / Vite / TypeScript frontend** in `artifacts/metromind-ai/`. For the authoritative project guide, architecture, and setup instructions, refer to the root [README.md](README.md).

An academic decision-support app that forecasts public-transport demand and turns uncertainty into route-level fleet recommendations.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server on the configured `PORT`
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth contract for the MetroMind endpoints
- `artifacts/api-server/src/lib/metromind.ts` — deterministic demo dataset and TypeScript mathematics engine
- `artifacts/api-server/src/routes/metromind.ts` — validated Express handlers for the dashboard pipeline
- `artifacts/metromind-ai/src/pages/metro-pages.tsx` — product pages and controls
- `artifacts/metromind-ai/src/components/metro-shell.tsx` — shared navigation, panels, states, and responsive shell
- `artifacts/metromind-ai/src/index.css` — signal-room visual system and responsive styling

## Architecture decisions

- The project uses the existing Express/TypeScript API architecture rather than introducing a separate Python service.
- Demo data is deterministic and generated in-process, so a viva/demo is reproducible without an external feed.
- The calculation pipeline is explicit: summaries, correlations, regression evidence, model comparison, prediction intervals, residual-based risk, Fourier periodicity, integer allocation, and simulation.
- AI narration is optional; mathematical results remain available when Gemini is not configured.
- OpenAPI numeric fields are used for values that were previously modeled as integers because the installed Zod version does not expose the generated integer helper.

## Product

MetroMind AI includes overview, data intake, analysis, prediction, risk, optimization, simulator, model comparison, route map/insights, passenger journey, and assumptions/settings views. CSV upload accepts the documented transport schema and activates the uploaded dataset for subsequent calculations. The passenger view provides a route/time forecast with demand interval, crowding level, and a less-crowded travel suggestion.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Route utilization and probability values are API ratios (0–1); presentation code converts them to percentages.
- The upload parser accepts `text/csv` and enforces a 5 MB request limit.
- The demo network uses route IDs `R1`–`R4`; UI fallback copy should remain route-agnostic.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
