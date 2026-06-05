# Codebase Summary

Quick reference to project structure, module responsibilities, and key files.

## Overview

5-package pnpm workspace: 3 apps (shell host + 2 remotes), 3 shared libraries.

```
smit-client-vue (root)
├── apps/
│   ├── shell (host, port 8301)
│   ├── adaccounts (remote, port 3010, basic/advanced mode demo)
│   └── ads-manager (remote, port 3002, placeholder)
└── packages/
    ├── shared-types (interfaces, ~60 LOC)
    ├── shared-store (Pinia stores + API client, ~400 LOC)
    └── shared-ui (5 MF components + 24 shadcn-vue components + design system)
```

**Total LOC (excluding node_modules):** ~3,200 (adaccounts demo added, compact, focused).

---

## Apps

### Shell (`apps/shell/`)

**Purpose:** MF host, router, auth orchestration, layout state.

**Key Files:**

| File | LOC | Role |
|------|-----|------|
| **src/main.ts** | 14 | createApp + Pinia + router + mount |
| **src/router/index.ts** | ~55 | Static route tree: / → /app → /app/{adaccounts,ads-manager}; named remote parents |
| **src/router/remote-routes.ts** | ~60 | Dynamic addRoute: loads each remote's `./routes` on first navigation (idempotent, deep-link safe) |
| **src/bootstrap.ts** | ~30 | Entry point, MF bootstrap guard |
| **src/App.vue** | ~40 | Root layout: SpriteProvider + router-view |
| **src/styles.css** | ~100 | Tailwind config + theme (oklch, animations) |
| **src/components/AuthLayout.vue** | ~85 | Auth guard: initialize → redirect; transient-error retry (orphan in prototype) |
| **src/components/BusinessLayout.vue** | ~40 | Sync current_business, render layout wrapper (orphan in prototype) |
| **src/components/AppLayout.vue** | ~50 | Prototype layout: header (logo + toggle) + sidebar + router-view |
| **src/components/AppHeader.vue** | ~40 | Simplified header (logo + sidebar toggle, no auth UI in prototype) |
| **src/components/ArcSidebar.vue** | ~60 | Nav: /app/adaccounts (Quản lý TKQC), /app/ads-manager (Quản lý quảng cáo) |
| **src/components/RemoteHost.vue** | ~40 | Gating + error boundary + Suspense + router-view for remote child routes |
| **src/pages/CreateBusiness.vue** | ~30 | Placeholder onboarding page |
| **src/composables/use-click-outside.ts** | ~20 | Directive for dismissing dropdowns |
| **rspack.config.ts** | 148 | MF host config, shared deps, build optimization |
| **dev-proxy-config.ts** | ~15 | Remote URLs (adaccounts:3010, ads-manager:3002) |
| **owners.json** | ~10 | MF manifest metadata |

**Architecture:**
- Bootstrap → main.ts (setup Pinia, router, mount)
- AppLayout (new) wraps all routes: header + sidebar + router-view
- RemoteHost wraps a remote branch, renders its child routes (from `./routes`) via Suspense + error boundary
  - Prototype: no role/feature props (gating deferred)
  - (Future: AuthLayout will wrap protected routes when auth enabled)

**Dependencies:**
- @mf2/shared-store (auth-store, layout-store, api-client)
- @mf2/shared-ui (SpriteProvider, Button, Card, Icon)
- @mf2/shared-types (User, Business, BusinessRole)
- vue, vue-router, pinia (eager shared)

---

### Adaccounts Remote (`apps/adaccounts/`)

**Purpose:** Lazy-loaded remote app — Quản lý TKQC (ad accounts), basic/advanced mode demo.

**Key Files:**

| File | LOC | Role |
|------|-----|------|
| **src/pages/AdAccountsPage.vue** | ~30 | Route entry, delegates to basic/advanced mode based on mode-store |
| **src/modes/basic/BasicModeView.vue** | ~60 | Layout: 3/4 table + 1/4 panel grid |
| **src/modes/basic/AdAccountTable.vue** | ~80 | Multi-select table, mock TKQC data |
| **src/modes/basic/tool-panel/ToolPanel.vue** | ~40 | Panel container, groups/functions display |
| **src/modes/basic/tool-panel/ToolGroupGrid.vue** | ~50 | Grid of tool groups, expand to functions |
| **src/modes/basic/tool-panel/ToolFunctionGrid.vue** | ~50 | Grid of functions, demo action trigger |
| **src/modes/advanced/AdvancedModePlaceholder.vue** | ~10 | Placeholder "Coming soon" text |
| **src/stores/mode-store.ts** | ~20 | useModeStore: mode state (basic\|advanced) |
| **src/composables/use-ad-accounts.ts** | ~30 | Selected accounts state (module-scoped, persists across nav) |
| **src/composables/use-tool-actions.ts** | ~25 | Group/function selection, demo action |
| **src/components/DemoActionToast.vue** | ~40 | Toast UI showing "Đã chọn N TKQC" |
| **src/data/mock-ad-accounts.ts** | ~20 | Static AdAccount[] |
| **src/data/mock-tool-groups.ts** | ~25 | Static ToolGroup[] + ToolFunction[] |
| **src/types/ad-account.ts** | ~30 | Local types (not promoted to shared-types) |
| **src/App.vue** | ~8 | Standalone entry |
| **src/router/index.ts** | ~15 | Child routes (AdAccountsPage mounted at /) |
| **src/main.ts** | ~15 | createApp (isolated from shell) |
| **rspack.config.ts** | ~100 | MF remote config |

**Architecture:**
- Owns its child routes (`./routes`), mounted by the shell under `/app/adaccounts`
- Mode toggling is runtime-only (useModeStore, no URL param, resets on page reload)
- Selection state module-scoped, persists across sidebar navigation intentionally (demo behavior)
- All data is mock (static arrays, no API calls)

**MF Contract:**
- Exposes: `./App` (standalone entry) + `./routes` (RouteRecordRaw[])
- Consumes: vue, vue-router, pinia (shared singletons from host)

---

### Ads Manager Remote (`apps/ads-manager/`)

**Purpose:** Lazy-loaded remote app (coming-soon placeholder).

**Key Files:**

| File | LOC | Role |
|------|-----|------|
| **src/pages/AdsManagerPage.vue** | ~16 | Coming-soon placeholder |
| **src/App.vue** | ~8 | Standalone entry |
| **src/router/index.ts** | ~10 | Child routes |
| **src/main.ts** | ~15 | createApp |
| **rspack.config.ts** | ~100 | MF remote config |

**Architecture:**
- Same as adaccounts; mounted by shell under `/app/ads-manager`
- (Future: will enforce role/feature gating when auth enabled; for now, accessible to all)

**MF Contract:**
- Exposes: `./App` (standalone entry) + `./routes` (RouteRecordRaw[])
- Consumes: vue, vue-router, pinia (shared singletons from host)

---

## Packages

### shared-types (`packages/shared-types/`)

**Purpose:** Central TypeScript interface definitions.

**Key Exports:**

```typescript
// User & Auth
User {
  id, email, name, phone?, phone_verified?
}

// Business entity
Business {
  business_id, name, timezone, is_agency, is_owned
}

// Roles & permissions (from /gate/:bid/me)
BusinessRole {
  roles[], business_features{}, is_owner, is_full_permission,
  business_plan?, asset_role?, smit_shield_status?, config?
}

// Onboarding state
OnboardingProgress {
  features[], earned_trial_days, total_trial_days
}

// Remote status enum
RemoteStatus = 'idle' | 'loading' | 'ready' | 'error'
```

**LOC:** ~60  
**Dependencies:** None (pure types)  
**Usage:** Imported by shared-store, shell, remotes for type safety

---

### shared-store (`packages/shared-store/`)

**Purpose:** Centralized Pinia stores + API client.

**Key Exports:**

#### Auth Store (auth-store.ts, ~180 LOC)

```typescript
useAuthStore() → {
  // State
  user, businesses, current_business, roles, onboarding,
  is_loading, is_authenticated

  // Actions
  checkAuth()  // GET /public/authentication
  fetchBusinesses()  // GET /gate/me/businesses
  fetchBusinessRoles(business_id)  // GET /gate/:bid/me
  fetchOnboardingProgress(business_id)  // POST /gate/:bid/feature-onboarding-progress
  setCurrentBusiness(business)  // Save + fetch roles
  logout()  // Clear state, redirect dashboard
  initialize()  // Boot sequence (guard: runs once via module-level promise)

  // Getters (computed)
  hasRole(role) → boolean
  hasFeature(feature) → boolean
}
```

**Guard:** Module-level `initialize_promise` prevents double-initialization.

#### Layout Store (layout-store.ts, ~40 LOC)

```typescript
useLayoutStore() → {
  page_title, header_slot, sidebar_state
  // For page customization (used by remotes)
}
```

#### API Client (api-client.ts, ~90 LOC)

```typescript
class ApiError extends Error { status, data }

api(url, options) → Promise<T>  // Fetch wrapper + error handling
api_get<T>(url, query?) → Promise<T>
api_post<T>(url, body) → Promise<T>
// Base: __API_GATEWAY_URL__ (env define, default: https://gateway.smit.team)
// Auto-adds: credentials:include, Content-Type: application/json
// On 401 → calls useAuthStore().logout()
```

**LOC:** ~400 total  
**Dependencies:** @mf2/shared-types, pinia, vue  
**Usage:** Imported by shell (initialize), remotes (data fetching)

---

### shared-ui (`packages/shared-ui/`)

**Purpose:** Shared components + design system.

**Key Exports:**

#### Components

**MF custom components** (`components/`):

| Component | LOC | Role |
|-----------|-----|------|
| **Icon.vue** | ~20 | `<Icon name="check" />` → renders sprite symbol |
| **SmitLogo.vue** | ~15 | SMIT logo component |
| **SmitLoading.vue** | ~30 | Loading spinner (CSS animation) |
| **RemoteLoadingFallback.vue** | ~25 | Suspense fallback (gray box + spinner) |
| **RemoteErrorBoundary.vue** | ~60 | onErrorCaptured → retry button + error message |

**shadcn-vue components** (`components/ui/<name>/`, folder-per-component, added via `shadcn-vue` CLI):

24 components grouped — core (button, card, input, label, badge, separator), form (select, checkbox, radio-group, switch, textarea, form), overlay (dialog, drawer, dropdown-menu, popover, tooltip, sonner, tabs), data (table, skeleton, avatar, pagination), layout (resizable).

- Config: `components.json` (style `new-york`, Tailwind v4, `cssVariables`).
- **Import convention inside ui/**: relative only (`../../../lib/utils`), NOT `@/` — because each app's rspack aliases `@`→app/src, so `@/` in shared-ui would break the consuming build. CLI-generated `@/` imports are rewritten to relative on add.
- **Toast**: `<Toaster>` (sonner) imports `vue-sonner/style.css` itself (v2 no longer auto-bundles CSS); consumers mount `<Toaster />` once + call `toast()`.

#### Design System

| File | Role |
|------|------|
| **lib/utils.ts** | `cn()` helper (merge Tailwind classes) |
| **lib/colors.ts** | Design tokens (oklch, semantic colors) |
| **icons/sprite-provider.ts** | Injects SVG sprite via provide/inject |
| **icons/sprite-symbols.ts** | ~2,500 LOC (compiled 90 lucide icons into single SVG) |
| **icons/index.ts** | Exports SpriteProvider, sprite object |

**Dependencies:** reka-ui (primitives + Splitter), class-variance-authority, clsx, tailwind-merge, @radix-icons/vue, @vueuse/core, vee-validate + @vee-validate/zod + zod (form), vue-sonner (toast), @tanstack/vue-table (table), vaul-vue (drawer), vue  
**Note:** all are MF singletons — every remote shares one instance; keep changes additive.  
**Usage:** Imported by shell + remotes

---

## Key Flows

### Authentication Initialization

```
AuthLayout.onMounted()
  ↓
auth.initialize()  [module guard prevents rerun]
  ↓
  ├─ checkAuth() → GET /public/authentication
  │   └─ if 401 → is_authenticated = false
  │
  └─ if authenticated:
     ├─ fetchBusinesses() → GET /gate/me/businesses
     ├─ restore or pick first business
     └─ setCurrentBusiness(business)
        ├─ fetchBusinessRoles() → GET /gate/:bid/me
        └─ fetchOnboardingProgress() → POST /gate/:bid/feature-onboarding-progress

AuthLayout.watch([is_loading, is_authenticated, businesses])
  ↓ evaluateRedirect()
  ├─ if !authenticated → logout() → redirect dashboard
  ├─ if !has_owned → redirect /introduction
  └─ if owned → redirect /app/adaccounts
```

### Remote Loading

```
Shell.router → /app/ads-manager

router guard (remote-routes.ts)
  ↓ first navigation: import('ads_manager/routes') + addRoute under 'remote-ads-manager' (once)

RemoteHost (route props: name, roles, feature)
  ↓ computed checks auth.hasRole('VIEW_ADACCOUNT') && auth.hasFeature('asset-manager')
  ├─ if denied → render 403 panel
  └─ if allowed → RemoteErrorBoundary → Suspense (fallback: RemoteLoadingFallback) → <router-view>
       ↓ remote child route component import()  [MF manifest loaded]
       └─ page mounted; retry bumps retryKey to remount on error
```

### API Calls

```
Shell or Remote component
  ↓
useAuthStore() → auth.fetchBusinesses()
  ↓
api_get('/gate/me/businesses', { page: '1', limit: '100' })
  ↓
fetch('https://gateway.smit.team/gate/me/businesses?page=1&limit=100', {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
  ↓
if 401 → useAuthStore().logout()  [redirect dashboard]
if non-2xx → throw ApiError(status, data)
if 2xx → return parsed JSON
```

---

## Configuration Files

| File | Purpose |
|------|---------|
| **package.json (root)** | Scripts: dev, build (via Turbo), typecheck (via Turbo), clean; pnpm workspaces config |
| **pnpm-workspace.yaml** | (implicit) pnpm workspaces definition |
| **turbo.json** | Turbo task definitions: build (outputs dist/, env vars), typecheck (dependsOn ^typecheck), dev (cache:false, persistent) |
| **tsconfig.base.json** | Shared TS config (paths, strict, esModuleInterop) |
| **apps/shell/rspack.config.ts** | MF host: shared deps, remotes config, optimization budget |
| **apps/shell/dev-proxy-config.ts** | Remote URLs (dev-only) |
| **apps/shell/tailwind.config.ts** | Tailwind theme (oklch, components) |
| **apps/adaccounts/rspack.config.ts** | MF remote: expose ./App |
| **apps/ads-manager/rspack.config.ts** | MF remote: expose ./App |
| **.github/workflows/ci.yml** | GitHub Actions: Turbo typecheck + build gate for PRs (affected-only), full verify on push to main |
| **.github/CODEOWNERS** | Required reviewers: @tech-lead for packages/shared-*, per-app owners for apps/* |
| **CLAUDE.md** | Governance rules: 5 isolation layers (additive, PR-split, per-app deploy, CI gate, git restore) |

---

## Dependency Graph

```
shell (host)
  ├─ shared-store
  │   ├─ shared-types
  │   └─ pinia, vue
  ├─ shared-ui
  │   ├─ reka-ui (primitives + Splitter), @radix-icons/vue, SVG icon sprite
  │   ├─ cva + clsx + tailwind-merge (cn helper)
  │   └─ vee-validate/zod, vue-sonner, @tanstack/vue-table, vaul-vue, @vueuse/core
  ├─ shared-types
  ├─ vue, vue-router, pinia (eager shared)
  └─ remotes (adaccounts, ads-manager) lazy-load via MF

adaccounts (remote)
  ├─ shared-store (shared singleton)
  ├─ shared-ui (shared singleton)
  ├─ shared-types (shared singleton)
  └─ vue, vue-router, pinia (shared singletons from host)

ads-manager (remote)
  ├─ shared-store (shared singleton)
  ├─ shared-ui (shared singleton)
  ├─ shared-types (shared singleton)
  └─ vue, vue-router, pinia (shared singletons from host)
```

---

## Build Outputs

**Shell (dist/), production uncompressed JS:**
- index.html (splash loader CSS)
- vendors.js (~169KB, vue, vue-router, pinia, reka-ui)
- runtime.js (~82KB, Rspack + ModuleFederation + manifest loader)
- main.js (~40KB, shell components + router)
- lazy chunk (~27KB)
- mf-manifest.json (routes remotes to CDN URLs)
- remoteEntry.js (MF entry point, empty for host)

**Adaccounts (dist/):**
- mf-manifest.json
- remoteEntry.js (exports ./App + ./routes)
- main.js + lazy page chunk
- index.html (standalone dev server)

**Ads Manager (dist/):**
- Same shape as adaccounts

**Total Shell JS:** ~317KB across chunks (no single asset over the 300KB per-asset budget); remotes lazy-loaded.

---

## File Naming Conventions

- **Components:** PascalCase, kebab-case file names (`AppHeader.vue`, `app-header.vue`) — both used interchangeably
- **Stores:** Suffix `-store.ts` (auth-store.ts, layout-store.ts)
- **Composables:** Prefix `use-` (use-click-outside.ts)
- **Utilities:** kebab-case (utils.ts, colors.ts)
- **Types:** Exported from shared-types/index.ts

---

## Known Technical Debt

1. **No tests:** Tests planned for Phase 2 (Vitest + Playwright)
2. **No i18n:** English only; vue-i18n integration planned if needed
3. **No dark mode:** Theme tokens exist; awaiting design spec
4. **Limited error UI:** Generic API error messages (security precaution)
5. **Hardcoded remote URLs:** dev-proxy-config.ts (should be env-driven in Phase 2)

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-04  
**Scope:** Phase 1 complete, Phase 2 planning underway
