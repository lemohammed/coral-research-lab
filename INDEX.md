# CORAL Research Lab

- `app/` — research dashboard and same-origin API routes
- `app/console/` — reference-matched instrument console, research inspectors, and replay controls
- `app/console/scene/` — real-time geographic renderer, camera, water, vessels, and map interaction
- `public/data/vancouver/` — attributed OpenStreetMap geometry for the English Bay and Stanley Park scene
- `lib/` — paper catalogue, live scholarly discovery, composition contracts, and architecture logic
- `db/` — owner-scoped persistent workspace schema
- `drizzle/` — append-only database migrations
- `public/` — retained research findings, provenance records, and downloadable evidence
- `public/assets/` — scene attribution documentation
- `build/`, `scripts/` — Sites runtime and build integration
- `tests/` — bounded checks for composition, input handling, and research metadata
- `.openai/` — local hosting configuration; provision your own identity for deployment
- `.sites-runtime/`, `.wrangler/`, `.vinext/` — ignored local runtime, database, and preview state
- `dist/`, `node_modules/` — generated deployment output and pinned dependencies

Build working data, caches, logs, screenshots, and publication archives are indexed at the parent project in `runs/agent-lab-dashboard/` and `logs/agent-lab-dashboard/`.

- `runs/local-database/` — ignored local D1 initialization configuration
- `docs/` — open source setup, architecture, and contribution documentation

- `design-qa.md` — visual comparison, interaction acceptance, and known polish limits

- `tools/vancouver-scene/` — geographic preparation and refresh script
- `data/vancouver-scene/` — ignored raw geographic source captures used during regeneration
