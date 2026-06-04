# System Architecture

Comprehensive guide to SMIT Client's micro-frontend architecture, data flow, and design patterns.

## High-Level Overview

```
┌────────────────────────────────────────────────────────────────┐
│ SMIT Client (Vue 3 Micro-frontend Platform)                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Shell Host (port 8301, HTTPS)                               │
│  ├─ Router (vue-router) — owns navigation                     │
│  ├─ Auth State (Pinia) — singleton, shared with remotes      │
│  ├─ Layout State (Pinia) — page title, header, sidebar       │
│  ├─ Shared UI (icons, buttons, cards) — singleton            │
│  └─ RemoteHost (gating + ErrorBoundary + Suspense + router-view) │
│                                                                │
│  ┌─ Remotes (lazy-loaded via Module Federation manifest) ────┤
│  │                                                             │
│  ├─ Adaccounts Remote (port 3010, HTTP)                       │
│  │  ├─ pages/AdAccountsPage.vue (basic/advanced mode demo)    │
│  │  └─ MF exposes ./App + ./routes                            │
│  │                                                             │
│  └─ Ads Manager Remote (port 3002, HTTP, placeholder)         │
│     ├─ pages/AdsManagerPage.vue (coming-soon)                 │
│     └─ MF exposes ./App + ./routes                            │
│                                                                │
│  ┌─ Shared Libraries (pnpm workspaces) ─────────────────────┤
│  │                                                             │
│  ├─ shared-types: User, Business, BusinessRole, OnboardingProgress │
│  ├─ shared-store: auth-store, layout-store, api-client      │
│  └─ shared-ui: components, icon sprite, design tokens       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                               │
                               │ API calls (credentials:include)
                               ▼
                   gateway.smit.team (HTTPS)
                   ├─ GET /public/authentication
                   ├─ GET /gate/me/businesses
                   ├─ GET /gate/:bid/me
                   └─ POST /gate/:bid/feature-onboarding-progress
```

---

## Module Federation 2.0 (MF2) Architecture

### Host Configuration

**Shell (rspack.config.ts):**

```javascript
new ModuleFederationPlugin({
  name: "shell_host",
  remotes: {
    adaccounts: "adaccounts@http://localhost:3010/mf-manifest.json",
    ads_manager: "ads_manager@http://localhost:3002/mf-manifest.json",
  },
  shared: {
    // Framework — eager, singleton (prevents version mismatch)
    vue: { singleton: true, eager: true, requiredVersion: "^3.5.0" },
    "vue-router": { singleton: true, eager: true, requiredVersion: "^4.0.0" },
    pinia: { singleton: true, eager: true, requiredVersion: "^3.0.0" },
    
    // Workspace packages — eager, singleton, no version check
    "@mf2/shared-types": { singleton: true, eager: true, requiredVersion: false },
    "@mf2/shared-ui": { singleton: true, eager: true, requiredVersion: false },
    "@mf2/shared-store": { singleton: true, eager: true, requiredVersion: false },
  },
})
```

**Why eager + singleton?**
- **Singleton:** Prevents multiple instances of Pinia, vue-router, etc. (critical for shared auth state)
- **Eager:** Loaded immediately with shell (not lazy), ensures auth-store ready before remotes initialize

### Remote Configuration

**Adaccounts & Ads Manager (rspack.config.ts):**

```javascript
new ModuleFederationPlugin({
  name: "adaccounts",  // or "ads_manager"
  exposes: {
    "./App": "./src/App.vue",  // Shell imports via `adaccounts/App`
    "./routes": "./src/router/routes.ts",  // Child routes
  },
  shared: {
    // Same as host, but non-eager (loaded by host)
    vue: { singleton: true, requiredVersion: "^3.5.0" },
    pinia: { singleton: true, requiredVersion: "^3.0.0" },
    "@mf2/shared-*": { singleton: true, requiredVersion: false },
  },
})
```

### Manifest Resolution Flow

```
Shell loads (port 8301)
  ↓
MF Plugin loads mf-manifest.json
  ├─ GET http://localhost:3010/mf-manifest.json (adaccounts)
  └─ GET http://localhost:3002/mf-manifest.json (ads_manager)
  ↓
Manifest returns:
{
  "adaccounts": { "url": "http://localhost:3010", "exposes": { "./App": "...", "./routes": "..." } },
  "ads_manager": { "url": "http://localhost:3002", "exposes": { "./App": "...", "./routes": "..." } }
}
  ↓
On first navigation into /app/adaccounts:
  router guard imports adaccounts/routes and addRoute(...) under the named parent (once)
  ↓
  MF loads remoteEntry.js from http://localhost:3010
  ↓
  remoteEntry.js exports shared singletons (vue, pinia from host) + local code
  ↓
  Remote child route renders into RemoteHost's <router-view>, wrapped by Suspense + ErrorBoundary
```

---

## Authentication & Authorization Flow

### Initialization Sequence

```
Browser loads shell (https://dev.smit.team:8301/)
  ↓
bootstrap.ts initializes MF, loads app
  ↓
main.ts creates Vue app
  ├─ app.use(createPinia())  ← Pinia instance created
  ├─ app.use(router)         ← Router instance created
  └─ app.mount('#root')
  ↓
App.vue mounts (root component)
  ├─ SpriteProvider (injects icon sprite)
  └─ <router-view />
  ↓
Router navigates to initial path (/ → /app → /app/adaccounts)
  ↓
**Prototype routing (auth bypass for CORS restrictions):**
  AuthLayout mounted but NOT in critical path; AppLayout renders directly
  ↓
AppLayout component mounts (shell layout: header + sidebar + <router-view>)
  ├─ ArcSidebar displays 2 nav items: Quản lý TKQC (/app/adaccounts), Quản lý quảng cáo (/app/ads-manager)
  └─ AppHeader shows logo + toggle button only (no auth UI in prototype)
  ↓
**When auth is enabled (future):**
  AuthLayout will mount first (module guard for single initialize)
  ↓
auth.initialize():
  1. is_loading.value = true
  2. await checkAuth() → GET /public/authentication
     ├─ if 200 → user.value = data.user, is_authenticated = true
     └─ if 401 → is_authenticated = false, skip to end
  3. if !is_authenticated → is_loading = false, return (logout triggered by watch)
  4. await fetchBusinesses() → GET /gate/me/businesses
     └─ businesses.value = data.data || []
  5. Restore saved business from localStorage or pick first
  6. await Promise.all([
       fetchBusinessRoles(target.business_id),
       fetchOnboardingProgress(target.business_id)
     ])
  7. is_loading.value = false
  ↓
watch([is_loading, is_authenticated, businesses]) triggers evaluateRedirect():
  ├─ if is_loading → return (wait for init)
  ├─ if !is_authenticated → auth.logout() → redirect dashboard
  ├─ if !has_owned → router.replace('/introduction')
  ├─ if route is introduction + has_owned → router.replace('/')
  └─ if route is / → router.replace(`/business/${current_business.id}/...`)
```

### Authorization Checks

**Two-Level Gating (deferred for prototype):**

1. **Store-level:** `auth.hasRole(role)`, `auth.hasFeature(feature)` (computed getters; `is_owner`/`is_full_permission` bypass) — code exists, not used in prototype
2. **Host-level:** `RemoteHost` component (403 fallback when auth enabled — currently no role/feature props for prototype routes)

**Example (Future — Ads Manager Remote):**

```typescript
// Route definition (shell router/index.ts) — when auth enabled, will add role/feature gating
{
  path: 'ads-manager',
  name: 'remote-ads-manager',
  component: RemoteHost,
  props: { name: 'ads-manager', roles: ['VIEW_ADACCOUNT'], feature: 'asset-manager' },
}

// RemoteHost computes `allowed`; if false renders 403 panel, else remote loads
// into <router-view> wrapped by RemoteErrorBoundary + Suspense.
```

**Current (Prototype):**

```typescript
// No role/feature props — all remotes accessible
{
  path: 'adaccounts',
  name: 'remote-adaccounts',
  component: RemoteHost,
  props: { name: 'adaccounts' },  // Only the MF name
}
```

### Logout & Session Cleanup

```
User clicks logout (UserDropdown component)
  ↓
auth.logout()
  ├─ localStorage.removeItem('mf2_current_business')
  ├─ initialize_promise = null  ← Reset module guard
  ├─ Clear all state (user, businesses, roles, etc.)
  └─ window.location.href = `${DASHBOARD_URL}/signin?referer=...`
  ↓
Browser navigates to external dashboard
  (full page redirect, clears all Vue state + cookies if SameSite:Strict)
```

---

## Remote Loading & Error Recovery

### RemoteHost Component (host layout)

`RemoteHost` gates by role/feature, then wraps the remote's child `<router-view>` in
`RemoteErrorBoundary` + `Suspense`. The error boundary exposes a `retryKey` via slot prop;
bumping it (Retry button) remounts the Suspense subtree, which re-runs the remote loader.

```vue
<RemoteErrorBoundary :name="name" v-slot="{ retryKey }">
  <Suspense :key="retryKey">
    <router-view />
    <template #fallback>
      <RemoteLoadingFallback :name="name" />
    </template>
  </Suspense>
</RemoteErrorBoundary>
```

**Flow:**
1. Router guard registers the remote's `./routes` (once, deep-link safe) → MF resolves the chunk URL via manifest
2. Suspense renders fallback (RemoteLoadingFallback) while loading
3. Remote child route mounts into `<router-view>`
4. If error thrown → `onErrorCaptured` in RemoteErrorBoundary stops propagation + shows a Retry panel
5. Retry bumps `retryKey` → Suspense subtree remounts → remote reloads

### RemoteErrorBoundary

`onErrorCaptured` records the error, logs it, and returns `false` to stop propagation.
The Retry button increments `retryKey` (passed down via slot prop); there is no auto-hide timer.

**Error Types Handled:**
- Remote chunk fails to load (network down, corrupted remoteEntry.js)
- Missing shared dependency (version mismatch)
- Remote code throws during render

> API request timeouts are handled in the shared api-client (`api({ timeout_ms })`, default 15s),
> not here. The error boundary only covers remote-chunk/render failures.

---

## State Management (Pinia)

### Auth Store (useAuthStore)

```
State:
├─ user: User | null
├─ businesses: Business[]
├─ current_business: Business | null
├─ roles: BusinessRole | null
├─ onboarding: OnboardingProgress | null
├─ is_loading: boolean
└─ is_authenticated: boolean

Actions:
├─ initialize() → Sequential: checkAuth → fetchBusinesses → fetchRoles + Onboarding
├─ checkAuth() → GET /public/authentication
├─ fetchBusinesses() → GET /gate/me/businesses
├─ fetchBusinessRoles(bid) → GET /gate/:bid/me
├─ fetchOnboardingProgress(bid) → POST /gate/:bid/feature-onboarding-progress
├─ setCurrentBusiness(b) → localStorage + refetch roles
└─ logout() → Clear state + redirect dashboard

Getters:
├─ hasRole(role) → boolean (checks roles.roles[], full_permission bypass)
└─ hasFeature(feature) → boolean (checks roles.business_features{}, full_permission bypass)
```

**Module-Level Guard:**
```typescript
let initialize_promise: Promise<void> | null = null;

async function initialize() {
  if (initialize_promise) return initialize_promise;
  initialize_promise = (async () => { ... })();
  return initialize_promise;
}
```

Prevents double-init if AuthLayout mounts multiple times (HMR, suspense resume, etc.).

### Layout Store (useLayoutStore)

```
State:
├─ page_title: string
├─ header_slot: string (for custom header content)
└─ sidebar_state: { isCollapsed: boolean }

Used by:
├─ Shell to set header title dynamically
└─ Remotes to customize header appearance
```

---

## API Client Architecture

### api-client.ts

```typescript
class ApiError extends Error {
  status: number;
  data: Record<string, any>;
}

async function api(url: string, options: RequestInit): Promise<Response> {
  const apiUrl = `${__API_GATEWAY_URL__}${url}`;
  
  const response = await fetch(apiUrl, {
    ...options,
    credentials: 'include',  // Send cookies for cross-origin auth
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    
    if (response.status === 401) {
      useAuthStore().logout();  // Auto-logout on 401
    }
    
    throw new ApiError(response.status, errorData);
  }
  
  return response.json();
}

async function api_get<T>(url: string, query?: Record<string, string>): Promise<T> {
  const queryStr = query ? '?' + new URLSearchParams(query).toString() : '';
  return api(url + queryStr, { method: 'GET' });
}

async function api_post<T>(url: string, body: Record<string, any>): Promise<T> {
  return api(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
```

**Features:**
- Centralized fetch wrapper (single point for logging, auth handling)
- Auto-logout on 401 (prevents auth loops)
- Typed response via generics
- Credentials sent (enables cookie-based session auth)

---

## Data Flow Example: Logging In

```
1. User lands on https://dev.smit.team:8301/
   ↓
2. Shell loads, router navigates to /
   ↓
3. AuthLayout.onMounted() → auth.initialize()
   ↓
4. checkAuth() → GET /public/authentication (credentials:include)
   ├─ API returns user object → is_authenticated = true
   └─ Alternative: 401 → is_authenticated = false
   ↓
5a. If authenticated:
   ├─ fetchBusinesses() → GET /gate/me/businesses
   ├─ Restore business from localStorage or pick [0]
   └─ fetchBusinessRoles + fetchOnboardingProgress (parallel)
   ↓
   watch() evaluates redirect:
   ├─ has_owned? → redirect /business/:bid/home
   └─ !has_owned? → redirect /introduction
   ↓
5b. If not authenticated:
   ├─ logout() → auth.logout()
   └─ window.location.href = `${DASHBOARD_URL}/signin?referer=...`
   ↓
6. If user navigates to /business/:bid/ads-asset:
   ├─ Router guard registers ads_asset/routes (once) → matches RemoteHost (name: remote-ads-asset)
   ├─ RemoteHost computes hasRole('VIEW_ADACCOUNT') && hasFeature('asset-manager')
   ├─ If true → remote child route renders into <router-view>
   │  ├─ MF loads remoteEntry.js from http://localhost:3002
   │  ├─ Suspense renders RemoteLoadingFallback
   │  └─ Page mounts (wrapped by RemoteErrorBoundary)
   └─ If false → render 403 page (remote chunk never loaded)
```

---

## Bundle Optimization Strategy

### Code Splitting

**Rspack config (shell):**

```javascript
optimization: {
  runtimeChunk: { name: 'runtime' },
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      mfRuntime: {
        test: /[\\/]node_modules[\\/]@module-federation[\\/]/,
        name: 'mf-runtime',
        priority: 30,
      },
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10,
      },
    },
  },
}
```

**Outputs (production, uncompressed JS):**
- `vendors.js` (~169KB) — vue, vue-router, pinia, reka-ui (shared singletons)
- `runtime.js` (~82KB) — Rspack + MF runtime, manifest loader
- `main.js` (~40KB) — Shell components + router logic
- lazy chunk (~27KB)
- **Total shell JS:** ~317KB across chunks (no single asset exceeds the 300KB per-asset budget)

### Tree-Shaking

- **Vue:** treeshake=true by default (SFC compiler includes used components only)
- **Tailwind:** Scoped CSS (unused utilities not included in build)
- **Lucide icons:** Sprite-compiled (~2.5KB per icon, 90 icons = ~225KB, but inlined as one SVG)

### Remote Lazy-Loading

Remotes don't load until route matches:

```
Shell initial load: ~317KB JS (across chunks)
  ├─ Includes MF manifest loader (in runtime chunk)
  ├─ Includes shared stores + types (eager)
  └─ Excludes remote code

Route /business/:bid/home:
  ├─ Load home remote (~40KB)
  └─ First byte from network

No prefetch (conservative, reduces unnecessary traffic)
```

---

## Deployment Architecture

### Static Build Outputs

**Shell (`dist/`):**
```
index.html              (splash loader, preconnect links)
runtime.js              (30KB, Rspack runtime)
mf-runtime.js           (45KB, MF loader)
vendors.js              (95KB, shared libs)
main.js                 (95KB, shell code)
mf-manifest.json        (routes remotes to CDN)
remoteEntry.js          (empty for host)
```

**Home/Ads Asset (`dist/`):**
```
index.html              (standalone dev server)
main.js                 (40KB, remote code)
runtime.js              (30KB)
mf-manifest.json        (routes to self)
remoteEntry.js          (exports ./App)
```

### Deployment Strategy

**Development:**
- Shell: localhost:8301 (HTTPS, dev server)
- Home: localhost:3010 (HTTP, dev server)
- Ads Asset: localhost:3002 (HTTP, dev server)
- Hardcoded URLs in dev-proxy-config.ts

**Production:**
- Shell: `https://cdn.smit.team/shell/` (CloudFront)
- Home: `https://cdn.smit.team/home/` (CloudFront, separate origin for cache isolation)
- Ads Asset: `https://cdn.smit.team/ads-asset/` (CloudFront)
- URLs set via environment variables or build-time defines

**Update owners.json (shell):**

```json
{
  "home": "https://cdn.smit.team/home/mf-manifest.json",
  "ads_asset": "https://cdn.smit.team/ads-asset/mf-manifest.json"
}
```

No shell rebuild needed for remote updates (shell always fetches latest manifest).

---

## CI/CD & Governance

### Build Orchestration (Turborepo 2.9.16)

**Task Graph (turbo.json):**

```javascript
{
  "tasks": {
    "build": {
      "outputs": ["dist/**"],
      "env": ["NODE_ENV", "API_GATEWAY_URL", "DASHBOARD_URL"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]  // shared packages typecheck first
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Task Execution:**
- **PR to main:** `pnpm turbo run typecheck build --filter=...[origin/main]`
  - Affected-only: builds changed package + dependent apps
  - Example: Fix in `shared-types` → typechecks/builds `shared-types`, `shared-store`, `shared-ui`, `shell`, `home`, `ads_asset` (all dependents)
  - Broken app = PR blocked (CI gate)

- **Push to main:** `pnpm turbo run typecheck build` (full)
  - Diffs main against itself = zero tasks without filter (so always full build to keep main green)

**Cache Strategy:**
- Local cache: `.turbo/` directory (gitignore'd)
- CI cache: keyed on `hashFiles('pnpm-lock.yaml')` (shared deps stable)
- Cache hit skips work entirely (verified: typecheck 4.756s cold → 17ms warm / FULL TURBO)

### CI Gate (GitHub Actions, .github/workflows/ci.yml)

**PR Verification:**
```yaml
- Checkout (fetch-depth:0 for git diff)
- Install pnpm 10.11, node 20
- Run: pnpm turbo run typecheck build --filter=...[origin/main]
- Fails if: changed pkg doesn't compile, dependent app breaks
- Blocks merge: branch protection requires CI green
```

**Push to Main Verification:**
```yaml
- Run: pnpm turbo run typecheck build (full, no filter)
- Ensures main always compiles and deploys cleanly
```

**Concurrency:**
- Cancels stale PR runs (new commit pushed)
- Never cancels main push (post-merge verification must complete)

### Code Ownership (CODEOWNERS)

**Enforcement:**
- Shared package changes require @tech-lead review (enforces additive + PR-split discipline)
- App-specific changes can be reviewed by assigned dev

**File Routing:**
```
/packages/shared-*/   @tech-lead
/apps/home/           @dev-a
/apps/ads_asset/      @dev-b
/turbo.json           @tech-lead
/.github/             @tech-lead
```

Requires GitHub branch protection: "Require review from Code Owners" + "Dismiss stale reviews on push".

### Governance Model

Full rationale: [docs/micro-frontend-governance.md](./micro-frontend-governance.md)

**5 Isolation Layers (prevent → recover):**

| Layer | Mechanism | Enforcement |
|-------|-----------|------------|
| **1. Additive Changes** | No breaking changes to `shared-*` public API | Code review (tech-lead) |
| **2. PR-Split** | Never mix `packages/` + `apps/*` in one PR | CODEOWNERS forces separate PRs |
| **3. Per-App Deploy** | Each app builds + deploys independently | CI tags: `home-deploy-YYYY.MM.DD` |
| **4. CI Gate** | Broken code cannot merge to main | GitHub branch protection |
| **5. Git Restore** | Roll back one app without touching others | `git restore --source <ref> -- apps/{app}/` |

**Key Implication (Singleton Truth):**
- All remotes share ONE runtime instance of each `shared-*` package (MF `singleton:true`)
- Breaking change in `shared-*` breaks EVERY app simultaneously (regardless of versioning)
- Isolation comes from **process discipline**, not repo boundaries
- Single shared PR must merge before dependent app PR (Layer 2 + Layer 4 together)

---

## Security Considerations

1. **CORS + Credentials:** API Gateway must set `Access-Control-Allow-Credentials: true` + specific origin
2. **SameSite Cookies:** Dashboard signs cookies with `SameSite=Strict` (only sent to dashboard domain)
3. **HTTPS Enforcement:** Shell HTTPS, remotes HTTPS in prod (dev exception: localhost HTTP)
4. **MF Manifest Versioning:** Each build produces new manifest, prevents stale remote references
5. **No Token Storage:** Cookies only (httpOnly preferred), no localStorage tokens

---

## Monitoring & Debugging

### Available Signals

- **MF Manifest Load:** Network tab → mf-manifest.json (should be 200)
- **Remote Entry Load:** Network tab → remoteEntry.js (should be 200)
- **Shared Deps:** Browser console → check Pinia version, vue version match
- **Auth State:** DevTools → Vue tab → useAuthStore state inspect
- **Error Boundary:** Browser console → [remote-name] Error captured logs

### Common Issues

| Issue | Debug | Fix |
|-------|-------|-----|
| Remote returns 404 | Check dev server running, Network tab URL | `pnpm dev:home` |
| Shared dep mismatch | Console warns version conflict | Ensure rspack.config shared config matches |
| Mixed content warning | HTTPS shell + HTTP remote (prod only) | Deploy remotes to HTTPS CDN |
| Undefined shared module | Remote can't find shared-store | Verify @mf2/shared-store in rspack shared config |
| Auth token invalid | 401 response from API | Check gateway CORS, cookie SameSite policy |

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-04  
**Audience:** Backend devs, DevOps, frontend architects (tech decision reference)
