# Project Overview & PDR

## Project Vision

SMIT Agency Client is a production-grade micro-frontend platform (Vue 3) serving as the base for SMIT's SaaS dashboard. Achieves 2.5× smaller bundle than React baseline through careful optimization (Rspack, selective code-splitting, lazy-remote-loading). Focus: lightweight, maintainable, scalable for incremental feature deployment via Module Federation 2.0.

## Scope — Prototype (Current)

**What's In:**
- Shell host (HTTPS, port 8301) with simplified routing (/app/<remote>, auth bypassed)
- Adaccounts remote (port 3010): basic/advanced mode demo UI, mock data
- Ads Manager remote (port 3002): coming-soon placeholder
- Shared stores (Pinia), shared types, shared UI (shadcn-vue)
- Icon sprite system (90 lucide icons)
- Bundle optimization (300KB performance budget)

**What's Out (Phase 2+):**
- Auth flow enablement (currently code exists but routers don't use it)
- Role/feature gating (code exists, not active in prototype routes)
- Asset sync (Facebook Ads Manager integration)
- Data tables, advanced filtering
- Real business context + multi-business orchestration
- Offline support

## Key Decisions (Locked)

### 1. Vue 3 over React
- **Why:** Smaller bundle (315KB vs 804KB), faster boot-up for micro-frontend consumers
- **Trade-off:** Smaller ecosystem (ok for internal tools), longer hiring ramp (mitigated by docs)
- **Lock:** Vue 3.5 Composition API + TypeScript mandatory. No Options API.

### 2. Rspack + Module Federation 2.0 (MF2)
- **Why:** Native MF2 support (no @module-federation/core patches), faster build (Rspack 3–5× faster than Webpack), remote manifest versioning
- **Trade-off:** Rspack ecosystem still maturing (mitigated: use proven plugins only)
- **Lock:** Shell = MF host. Remotes = stateless, lazy-load via manifest.json.

### 3. Pinia + Setup Store Pattern
- **Why:** Reactive, no boilerplate, works seamlessly with Composition API
- **Trade-off:** Learning curve for Redux veterans (docs + examples provided)
- **Lock:** No Vuex, no module pattern. Single setup store per domain (auth-store, layout-store).

### 4. Tailwind CSS v4 + shadcn-vue
- **Why:** utility-first, extreme bundling efficiency (tree-shake unused classes), reka-ui primitives are unstyled (complete control)
- **Trade-off:** No pre-built complex components (custom build required)
- **Lock:** No Material UI, no Bootstrap. Icons via sprite only (no font-icons).

### 5. Localhost HTTP for Remotes (Dev)
- **Why:** Secure-context exception allows http://localhost in HTTPS-shell dev environment; avoids cert generation hassle
- **Trade-off:** Production requires both HTTPS; no mixed-content warnings in prod
- **Lock:** Dev = http://localhost:XXXX. Prod = https://cdn.smit.team/remote-name/... (env-configured).

### 6. Eager Shared Singletons (vue, vue-router, pinia, @mf2/shared-*)
- **Why:** Prevents version mismatch at runtime (critical for shared store), faster initialization
- **Trade-off:** Slightly larger shell bundle (vue + router + pinia eager = ~180KB, unavoidable)
- **Lock:** All framework deps + workspace packages are eager:true. No lazy-shared fallback.

## Functional Requirements

| Req | Description | Status |
|-----|-----------|--------|
| **FR1** | Shell loads without blocking on remotes | ✓ Done (Suspense + RemoteLoadingFallback) |
| **FR2** | Auth flow (checkAuth → redirect → businesses list) | ✓ Code ready, disabled for prototype (auth bypass) |
| **FR3** | Role-based access control (hasRole, hasFeature) | ✓ Code ready, disabled for prototype (no gating in routes) |
| **FR4** | Remote error recovery (retry, 403 fallback) | ✓ Done (RemoteErrorBoundary) |
| **FR5** | Icon sprite inlined (no external requests) | ✓ Done (sprite-symbols.ts + Icon.vue) |
| **FR6** | API client with credentials (cross-origin auth) | ✓ Done (api-client.ts, credentials:include) |

## Non-Functional Requirements

| Req | Target | Status |
|-----|--------|--------|
| **NFR1** | Per-asset size < 300KB (rspack hint) | ✓ Done (largest asset ~169KB; total shell JS ~317KB across chunks) |
| **NFR2** | TypeScript strict mode | ✓ Done (tsconfig.base.json, vue-tsc --strict) |
| **NFR3** | All types exported from shared-types | ✓ Done (User, Business, BusinessRole, etc.) |
| **NFR4** | No console.log in production | ✓ Process (linting rule added) |
| **NFR5** | Dev HTTPS (preconnect headers) | ✓ Done (rspack devServer https + preconnect injection) |
| **NFR6** | MF manifest versioning (no hash caching) | ✓ Done (mf-manifest.json in dist/, remoteEntry.js separate) |

## Technical Constraints

1. **Node ≥20:** Modern async/await, top-level await support
2. **pnpm workspaces:** No symlink monorepo (pnpm hoisting)
3. **Gateway API:** Must support credentials:include (CORS + SameSite:Strict)
4. **Remote ports fixed:** adaccounts:3010, ads-manager:3002 (hardcoded in shell config)
5. **No IE11 support:** Rspack outputs ES2022 (let, const, arrow functions, etc.)

## Architecture Highlights

**Shell (MF Host):**
- Owns router, auth, layout state
- Loads remote child routes on demand (dynamic addRoute from each remote's `./routes`)
- Shared vue/vue-router/pinia as singletons (eager)

**Remotes:**
- Own their own data fetching + child routes
- Expose `./App` (standalone entry) + `./routes` (RouteRecordRaw[])
- Own route tree under /app/<remote> (shell mounts it via RemoteHost)
  - adaccounts: basic/advanced mode toggling at runtime, mock data demo
  - ads-manager: coming-soon placeholder

**API Client:**
- Centralized fetch wrapper (shared-store/api-client.ts) with per-call timeout + error classification
- Centralized 401 → single logout() via registered handler
- Throw ApiError (kind: http|auth|network|timeout|aborted); is_transient marks retryable

**Auth Flow:**
1. Mount → auth.initialize() (module-level guard; reset on failure so retry works)
2. checkAuth() → transient error rethrown (not treated as logged out); 401 → logout
3. If not auth → logout() (redirects dashboard); transient → Retry UI
4. If auth → fetchBusinesses() + restore or pick first
5. setCurrentBusiness() → fetchBusinessRoles() + fetchOnboardingProgress() (AbortController-guarded)
6. RemoteHost checks hasRole/hasFeature → 403 if denied

## Success Metrics

- **Bundle:** Largest shell asset < 300KB (per-asset budget); total shell JS ~317KB across chunks; remotes lazy
- **Startup:** First paint < 1.5s (HTTPS + preconnect, no remote blocker)
- **Auth:** Redirect from login → dashboard in < 500ms
- **Errors:** 99.5% uptime (remote fetch failures do not crash shell)
- **Maintenance:** New feature ≤ 2 PRs (1 shell route + feature, 1 remote implementation)

## Dependencies & Version Pins

**Core:**
- Vue 3.5 (^3.5.0)
- vue-router 4 (^4.0.0)
- Pinia 3 (^3.0.0)
- TypeScript 5.6 (^5.6.3)

**Build:**
- Rspack 1.0 (^1.0.0)
- @module-federation/enhanced 0.8 (^0.8.0)
- Tailwind CSS 4 (^4.0.0)
- rspack-vue-loader 17.2 (^17.2.2)

**UI:**
- reka-ui 2.9 (^2.9.0)
- lucide-vue-next (icons, ~90 compiled into sprite)

**Node:** ≥20.0.0

**pnpm:** 10.11.0 (pinned in package.json packageManager field)

## Known Limitations

1. **No test suite yet:** Manual testing only. Plan: add Vitest + Playwright in Phase 2.
2. **No i18n:** Hardcoded English. Plan: add vue-i18n if multi-language required.
3. **No dark mode:** Tailwind theme (oklch) supports future dark variant; design tokens in shared-ui/lib/colors.ts.
4. **Limited error messages:** API errors logged generically (security: no leak sensitive data). Plan: user-facing error UI in Phase 2.
5. **No analytics:** No event tracking. Plan: add Posthog/Mixpanel integration if metrics needed.
6. **Single shell instance:** No multi-shell orchestration. Each domain gets own shell instance if needed.

## Roadmap Alignment

**Phase 1 (Current):** ✓ Base platform, auth, 2 remote placeholders, bundle optimized.

**Phase 2 (Next):** Port asset-sync (FB Ads Manager), real onboarding flow, data-table-v2.

**Phase 3:** Add analytics, campaign management, multi-remote scenarios.

**Phase 4:** Offline support, progressive enhancement.

## Ownership & Escalation

- **Technical Lead:** Architecture decisions, MF2 policy, bundle budget approval
- **DevOps:** Deployment strategy, CDN setup, env variable management
- **Security:** Auth flow review, API endpoint vetting, CORS policy

Escalate:
- Breaking changes to shared-types → affects all remotes
- MF config changes (shared singletons) → requires rebuild of shell + all remotes
- API endpoint changes (auth-store calls) → requires API team sync

## Open Questions (Resolved)

All key decisions locked for Phase 1. Monitor in Phase 2+:
- Should remotes share state beyond Pinia singleton? (Current: no, independent fetch)
- When to split shell further (layout wrapper, auth dialog, etc.)? (Current: monolithic is fine for <30KB of components)

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-04  
**Status:** Locked for Phase 1 (Base platform complete, awaiting Phase 2 scope expansion)
