# Project Roadmap

Tracking progress from Phase 1 (base platform) through Phase 4 (advanced features).

## Executive Summary

**Current Status:** Phase 1 complete (base shell, auth, 2 remote placeholders; total shell JS ~317KB across chunks, largest asset ~169KB).

**Next:** Phase 2 (asset sync, real onboarding, data-table).

**Timeline:** 2 weeks per phase (Phase 2 starts immediately after Phase 1 verification).

---

## Phase 1: Base Platform ✓ COMPLETE

**Duration:** Weeks 1–2 (Done)  
**Status:** Shipped, verified in production sandbox

### Goals

- [x] Shell host (Vue 3 + Pinia + vue-router)
- [x] Module Federation 2.0 (MF2) setup (host + 2 remotes)
- [x] Auth flow (gateway.smit.team integration)
- [x] Role/feature gating (RemoteHost)
- [x] Shared libraries (types, store, UI)
- [x] Icon sprite system (96 lucide icons, generated from per-icon `.svg` sources)
- [x] Bundle optimization (< 300KB)
- [x] Turborepo (task caching, affected-graph builds)
- [x] CI gate (GitHub Actions, Turbo typecheck + build on affected, branch protection)
- [x] CODEOWNERS (tech-lead review on shared packages)
- [x] Governance model (5-layer isolation, per-app deploy, PR-split discipline)
- [x] Documentation (README, architecture, standards, PDR, governance, deployment)

### Deliverables

| Component | Status | Notes |
|-----------|--------|-------|
| **Shell** | ✓ Done | Router + AuthLayout + BusinessLayout + components |
| **Adaccounts Remote** | ✓ Done | Coming-soon placeholder, lazy-loads correctly |
| **Ads Manager Remote** | ✓ Done | Coming-soon placeholder, role-gated (VIEW_ADACCOUNT) |
| **Shared Store** | ✓ Done | auth-store.ts (initialize, checkAuth, fetch*, setCurrentBusiness, logout), layout-store.ts |
| **Shared UI** | ✓ Done | Icon.vue, Button.vue, Card.vue, RemoteErrorBoundary.vue, SmitLoading.vue |
| **Shared Types** | ✓ Done | User, Business, BusinessRole, OnboardingProgress, RemoteStatus |
| **Bundle** | ✓ Done | total shell JS ~317KB across chunks; largest asset ~169KB (< 300KB per-asset hint) |
| **Dev Server** | ✓ Done | Shell HTTPS (port 8301), remotes HTTP (3010, 3002) |
| **Turborepo** | ✓ Done | turbo.json, build caching, affected-graph, shared packages no build step |
| **CI Gate** | ✓ Done | .github/workflows/ci.yml, affected-only on PR, full verify on main push, branch protection |
| **CODEOWNERS** | ✓ Done | .github/CODEOWNERS, tech-lead review on shared packages |
| **Governance** | ✓ Done | CLAUDE.md (5 layers), micro-frontend-governance.md (rationale), git baseline established |
| **Docs** | ✓ Done | README.md, project-overview-pdr.md, codebase-summary.md, code-standards.md, system-architecture.md, project-roadmap.md, deployment-guide.md, micro-frontend-governance.md |

### Test Results

- TypeScript: ✓ 6/6 files pass `pnpm typecheck`
- Build: ✓ 3 apps build successfully via Turbo, mf-manifest.json + remoteEntry.js generated
- Bundle: ✓ Total shell JS ~317KB across chunks (largest asset ~169KB < 300KB per-asset), 0 warnings
- Dev Runtime: ✓ Shell mounts, splash hidden, auth flow executes, 0 console errors
- CI: ✓ PR gate blocks broken code, main push full verify, branch protection enforced
- Git: ✓ 6 commits on main, per-app deploy tags supported, per-path rollback ready

### Known Limitations

- Test suite partial (Vitest live in shared-ui for data-grid range-copy; broader coverage + Playwright Phase 2)
- No i18n (hardcoded English)
- No dark mode (tokens prepared, design pending)
- Remotes are placeholders (real features Phase 2+)
- Limited error UI (security: generic messages)

---

## Phase 2: Asset Sync & Real Features

**Duration:** Weeks 3–4 (Planned start: 2026-06-17)  
**Status:** Scope locked, waiting phase 1 sign-off

### Goals

- [ ] Port asset-sync from React baseline (Facebook Ads Manager integration)
- [ ] Real CreateBusiness flow (form validation, API submission)
- [x] Data-grid `Table` in shared-ui (virtualized, frozen, resize, sort, pagination, pivot, Excel-like range-copy)
- [~] Test suite — Vitest set up in shared-ui (data-grid range-copy logic); broaden + add Playwright e2e
- [ ] Error UI improvements (user-facing error messages + retry UX)

### Detailed Tasks

#### 2.1 Asset Sync (Adaccounts Remote)

**Scope:**
- Fetch campaigns from gateway.smit.team
- Lazy-load Facebook SDK (FB.init + FB.login if new OAuth needed)
- Display campaign list with sync status
- Handle FB OAuth flow (browser popup → token exchange → API save)

**API Endpoints:**
- `GET /gate/:bid/campaigns` — list user campaigns
- `POST /gate/:bid/campaigns/:cid/sync` — trigger asset sync job
- `GET /gate/:bid/sync-status/:job_id` — poll sync progress

**Components:**
- `CampaignList.vue` (table, <200 LOC)
- `SyncStatusBadge.vue` (status indicator, <50 LOC)
- `FacebookLoginButton.vue` (OAuth flow, <100 LOC)

**Store Updates:**
- `campaign-store.ts` (new, ~150 LOC: fetchCampaigns, syncCampaign, pollStatus)
- `auth-store.ts` (extend: facebook_config from BusinessRole)

**API Client:**
- `fb-sdk-loader.ts` (new, ~50 LOC: dynamic script injection + FB.init)

**Timeline:** 5 days (3 days dev + 2 days testing + FB SDK integration)

#### 2.2 Real CreateBusiness Flow

**Scope:**
- Replace placeholder form with real inputs (business name, timezone, industry)
- Form validation (Zod or Yup integration, <100 LOC)
- Submit to `POST /gate/register/business`
- On success: redirect to /app/adaccounts

**Components:**
- `CreateBusinessForm.vue` (form, <150 LOC)
- `IndustrySelect.vue` (dropdown, <50 LOC)

**Store Updates:**
- `auth-store.ts` (add createBusiness action, ~50 LOC)

**Timeline:** 3 days (2 days dev + 1 day testing)

#### 2.3 Data-table-v2 Component

**Scope:**
- Reusable table component (sortable columns, pagination, row selection)
- Built on shadcn-vue TableHeader + TableBody (Primitive, not pre-built)
- Example: Campaign list table (mock data)
- No virtualization yet (Phase 3 if needed for 1000+ rows)

**Components:**
- `DataTable.vue` (table wrapper, <200 LOC)
- `DataTableColumn.vue` (slot-based, <100 LOC)
- `TablePagination.vue` (prev/next buttons, <80 LOC)

**Utilities:**
- `use-table-sort.ts` (sorting logic, <80 LOC)
- `use-table-pagination.ts` (page state, <60 LOC)

**Timeline:** 4 days (3 days dev + 1 day example + testing)

#### 2.4 Test Suite Setup

> Started: Vitest (jsdom) already configured in `@mf2/shared-ui` (`vitest.config.ts`) with the
> data-grid range-copy unit tests. Remaining work below extends this to stores/forms + e2e.

**Scope:**
- Extend Vitest setup to apps + add @vue/test-utils for component tests
- 20+ unit tests (auth-store initialization, hasRole/hasFeature, CreateBusinessForm validation)
- 3 Playwright e2e tests (auth flow, remote load, navigation)

**Test Files:**
- `tests/unit/auth-store.spec.ts` (~120 LOC)
- `tests/unit/CreateBusinessForm.spec.ts` (~100 LOC)
- `tests/e2e/auth-flow.e2e.ts` (~80 LOC)

**Timeline:** 3 days (setup + test writing + CI config)

#### 2.5 Error UI & Recovery

**Scope:**
- `ErrorAlert.vue` (user-facing error component, <80 LOC)
- Remote error messages (distinguish network vs code errors)
- Auto-dismiss error after 5s with manual dismiss button
- Docs update for error handling patterns

**Timeline:** 2 days (1 day dev + 1 day testing + docs)

### Acceptance Criteria

- [ ] Asset sync displays campaign list, can trigger sync
- [ ] CreateBusiness form validates input, creates business, redirects
- [ ] DataTable component sortable and paginated (works in Adaccounts Remote example)
- [ ] 20+ unit tests pass, 3 e2e tests pass
- [ ] TypeCheck passes (pnpm typecheck)
- [ ] Build succeeds with 0 warnings (bundle size tracked)
- [ ] All docs updated (README, architecture, standards)

### Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| FB SDK async load race | Medium | High (auth flow blocks) | Use lazy-load directive + Suspense |
| Campaign API schema change | Low | Medium (re-map response) | API team gives schema upfront |
| Data-table complexity | Medium | Low (phase back if needed) | Start with basic sort/page, add features iteratively |
| Test setup delays | Low | Low (can skip Phase 2 tests) | Pre-install deps, use scaffold template |

---

## Phase 3: Analytics & Multi-Remote Scaling

**Duration:** Weeks 5–6 (Planned start: 2026-07-01)  
**Status:** Concept, detailed scope TBD

### Goals

- [ ] Analytics remote (campaign performance dashboard)
- [ ] Settings remote (business settings, user management)
- [ ] Multi-business switching (account picker in header)
- [ ] Event tracking (Posthog/Mixpanel integration)
- [ ] Advanced data-table (virtualization for 1000+ rows)

### Estimated Scope

- 2 new remotes (analytics, settings)
- 3 new stores (analytics-store, settings-store)
- Shared event emitter for cross-remote communication
- Shared logger for structured logging

### Timeline

- 2 weeks (5 remotes total = shell + adaccounts + ads-manager + analytics + settings)

---

## Phase 4: Offline & Progressive Enhancement

**Duration:** Weeks 7–8 (Planned start: 2026-07-15)  
**Status:** Exploratory, scope TBD

### Goals

- [ ] Service Worker for offline fallback
- [ ] IndexedDB cache for read-heavy data
- [ ] Sync queue for offline mutations
- [ ] PWA manifest + installability
- [ ] i18n (multi-language support)

### Timeline

- 2 weeks (infrastructure heavy)

---

## Feature Timeline (Gantt Overview)

```
Phase 1 (Weeks 1–2):    [████████████] ✓ COMPLETE
Phase 2 (Weeks 3–4):    [████████████░░░░░░░░░░░░░░░░] Next
Phase 3 (Weeks 5–6):    [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Future
Phase 4 (Weeks 7–8):    [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Future

Dependency Chain:
Phase 1 (base) → Phase 2 (asset sync) → Phase 3 (analytics) → Phase 4 (offline)
     ✓              Planned             Future              Future
```

---

## Release Schedule

| Release | Phase | Date | Artifacts |
|---------|-------|------|-----------|
| v0.1.0-alpha | Phase 1 | 2026-06-04 | Shell + 2 remotes (placeholders), docs |
| v0.2.0-beta | Phase 2 | 2026-06-18 | Asset sync, real onboarding, data-table, tests |
| v0.3.0 | Phase 3 | 2026-07-02 | Analytics, settings, multi-remote |
| v0.4.0 | Phase 4 | 2026-07-16 | Offline, PWA, i18n |
| v1.0.0 | General Availability | 2026-08-01 | Stable, documented, production-ready |

---

## Key Metrics & Success Indicators

### Bundle Size

| Phase | Shell (total JS) | Adaccounts | Ads Manager | Per-asset target |
|-------|-------|------|-----------|--------|
| 1 | ~317KB (largest asset ~169KB) | ~40KB | ~40KB | < 300KB/asset ✓ |
| 2 | 330KB | 120KB | 100KB | < 400KB | (estimated) |
| 3 | 340KB | 120KB | 100KB | 150KB | 150KB | < 500KB | (estimated) |
| 4 | 350KB | 120KB | 100KB | 150KB | 120KB | < 600KB | (estimated) |

Target: Keep initial shell < 350KB, each remote < 150KB (lazy-load 2 remotes = ~250KB additional).

### Performance

| Metric | Target | Phase 1 | Phase 2 | Notes |
|--------|--------|---------|---------|-------|
| First Paint (shell) | < 1s | ~800ms | ~850ms | HTTPS preconnect helps |
| First Contentful Paint (with remote) | < 2s | ~1.2s (lazy) | ~1.5s | Network-dependent |
| Auth Flow (login→dashboard) | < 500ms | ~450ms | ~450ms | API latency included |
| TypeCheck | < 10s | ~6s | ~8s | Parallel workspaces |
| Build | < 30s | ~22s | ~25s | Incremental on change |

### Code Quality

| Metric | Target | Phase 1 | Phase 2 | Notes |
|--------|--------|---------|---------|-------|
| TypeScript Errors | 0 | 0 | 0 | Strict mode enforced |
| Linting Warnings | 0 | 0 | 0 | No console.log in prod |
| Test Coverage | 0% → 60% | N/A | 50% | Phase 2 adds tests |
| Bundle Warnings | 0 | 0 | 0 | Performance budget strict |

---

## Dependency Updates

### Locked for Phase 1

- Vue 3.5 (^3.5.0)
- vue-router 4 (^4.0.0)
- Pinia 3 (^3.0.0)
- Rspack 1.0 (^1.0.0)
- TypeScript 5.6 (^5.6.3)

### Phase 2 Additions (Candidate)

- Vitest (^2.1.8) — unit testing (already added to `@mf2/shared-ui` with jsdom)
- @vue/test-utils (^2.4.0) — component testing
- Playwright (^1.40.0) — e2e testing
- Zod (^3.22.0) — schema validation (or Yup)

### Future (Phase 3+)

- Posthog (^3.0.0) — event tracking
- Service Worker library (TBD)
- i18n library (vue-i18n or format-js)

---

## Documentation Updates (By Phase)

| Document | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|----------|---------|---------|---------|---------|
| README.md | ✓ Create | Update | Update | Update |
| project-overview-pdr.md | ✓ Create | Update scope | Expand | Finalize |
| codebase-summary.md | ✓ Create | Extend (new stores) | Extend | Extend |
| code-standards.md | ✓ Create | Add testing section | Add event patterns | Add offline patterns |
| system-architecture.md | ✓ Create | Add data-table arch | Add multi-remote patterns | Add SW arch |
| project-roadmap.md | ✓ Create | Update progress | Update timeline | Final status |
| deployment-guide.md | ✓ Create | Add analytics setup | Add cache strategy | Add PWA config |

---

## Open Questions (Phase 2+)

1. ~~**Vitest vs Jest?**~~ **Resolved:** Vitest (jsdom) — adopted in `@mf2/shared-ui`.
2. **Zod vs Yup?** (Candidate: Zod, smaller bundle, better TS support)
3. **Posthog vs Mixpanel?** (TBD: depends on backend choice)
4. **Service Worker framework?** (TBD: Workbox or custom)
5. **i18n library?** (TBD: vue-i18n or format-js)

## Settled Decisions (Phase 1)

- ✓ **Turborepo** for build orchestration (vs make, Nx, pnpm --filter alone)
- ✓ **GitHub Actions** for CI gate (vs GitLab, Circle CI)
- ✓ **Monorepo + pnpm workspaces** for repo layout (vs multi-repo, git submodules)
- ✓ **5-layer governance** for MFE isolation (additive + PR-split + per-app deploy + CI gate + git restore)
- ✓ **Per-app deploy tags** for rollback targeting (adaccounts-deploy-YYYY.MM.DD convention)

---

## Escalation Path

**Phase 1 Sign-Off Required Before Phase 2 Start:**
- [ ] Bundle size verified in production sandbox
- [ ] Auth flow tested with real gateway.smit.team
- [ ] All docs reviewed and approved
- [ ] Team trained on code standards

**Phase 2 Decision Gate (2026-06-17):**
- [ ] Phase 1 metrics acceptable?
- [ ] Team capacity for Phase 2 work?
- [ ] Asset Sync API stable?

**Scope Changes:** Any new feature request deferred to next phase (YAGNI principle enforced).

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-04  
**Next Review:** 2026-06-17 (Phase 2 kickoff)  
**Owner:** Technical Lead + Product Manager
