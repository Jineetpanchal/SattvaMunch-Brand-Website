# SattvaMunch Brand Website

An editorial, scroll-led brand site for SattvaMunch, a premium 100%-certified-organic makhana snack brand pairing India's ancient grain with globally inspired flavors.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
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

- `artifacts/sattva-munch/src/App.tsx` — single-page brand experience and interactive sections
- `artifacts/sattva-munch/src/index.css` — SattvaMunch visual system, responsive layout, motion, and reduced-motion rules
- `artifacts/sattva-munch/public/assets/` — logos, seven real campaign carousel slides, and local document copies
- `artifacts/sattva-munch/.replit-artifact/artifact.toml` — preview/deployment routing metadata
- `artifacts/api-server/` — shared API service scaffold; not currently needed by the static brand site

## Architecture decisions

- The brand site is a frontend-only React + Vite artifact; it does not depend on the API server or a database.
- Real uploaded campaign and logo assets are served from the website's public assets directory rather than remote placeholders.
- The hero uses the uploaded `public/models/sample.glb` through React Three Fiber / drei, with normalized bounds, a Suspense loader fallback, and a non-WebGL CSS fallback.
- The hero's seed/orbit treatment is canvas-driven and respects reduced-motion preferences.
- External strategy and campaign references open in new tabs; the local PDF copies remain available with the website assets.

## Product

The site presents the SattvaMunch story, four globally inspired flavors, the Seed's Passport campaign, the real social carousel, brand documents, a future-ready brand-film slot, and a reusable visual gallery layout. It includes responsive navigation, flavor selection, carousel controls, newsletter feedback, and accessible motion fallbacks.

## User preferences

The brand should feel premium, culturally confident, globally curious, and warm without drifting into generic wellness or rustic snack clichés.

## Gotchas

- The artifact workflow supplies `PORT` and `BASE_PATH`; run the website through `artifacts/sattva-munch: web`.
- The original logo uploads included large white margins, so the served copies in `public/assets` are transparently trimmed derivatives for reliable nav/footer sizing.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
