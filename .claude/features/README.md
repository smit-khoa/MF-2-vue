# Feature Map — AI navigation index

Read this first to locate a feature, then open its doc for files + flow + APIs.
Each doc lists the **real file paths** that make up the feature (this repo is layer-based —
a feature spans api/components/pages/stores, so the doc is the map that re-assembles it).

## Index

| Feature | Remote | Route | Roles | Flag | Status | Doc |
|---------|--------|-------|-------|------|--------|-----|
| Auth flow | shell | (protected tree) | — | — | done | [auth-flow](auth-flow.md) |
| Role & feature gating | shell | /app/<remote> | — | — | disabled (prototype bypass) | [role-feature-gating](role-feature-gating.md) |
| Remote loading & recovery | shell | /app/<remote> | — | — | done | [remote-loading-recovery](remote-loading-recovery.md) |
| Quản lý TKQC — chế độ cơ bản | adaccounts | /app/adaccounts | — | — | done | [adaccounts-basic-mode](adaccounts-basic-mode.md) |

## Update discipline (MANDATORY)

Updating the matching feature doc is part of any code task that changes its logic, files,
routes, or APIs — not optional. See CLAUDE.md "Feature Docs" rule. Skipping updates rots the map.

Rules:
- One file per feature. Frontmatter + sections per `_TEMPLATE.md`.
- List real, verified file paths. No speculative docs for features that don't exist yet.
- Store only non-derivable knowledge (purpose, flow, decisions). Types live in `*/types` or
  `shared-types`; route tables live in `*/router` — do NOT hand-copy them here.
- New feature: copy `_TEMPLATE.md` -> `<slug>.md`, fill it, add a row above.

## Remote layer convention (where new code goes)

Inside each remote (`apps/<remote>/src/`), created on demand (not pre-stubbed):
`api/` (typed fns wrapping shared api — components never call fetch directly) ·
`components/` · `composables/` (use-*) · `pages/` (route views) · `stores/` (remote-local Pinia) ·
`router/` (child RouteRecordRaw[] exposed as ./routes) · `types/` (promote to shared-types only when ≥2 apps need).
Cross-cutting state (auth/layout) stays in `packages/shared-store`.
