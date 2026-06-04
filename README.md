# SMIT Agency Client — Vue 3 Micro-frontend

Base micro-frontend platform for SMIT Agency, built with Vue 3 Composition API, TypeScript, Tailwind CSS v4, and Module Federation 2.0. Focuses on lightweight, scalable architecture for lazy-loading remote applications.

**Status:** Base platform complete (shell + 2 remote coming-soon placeholders). Production-ready bundle optimization.

## Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Vue 3.5 (Composition API, `<script setup>`) |
| **Language** | TypeScript 5.6 |
| **Bundler** | Rspack 1.0 (via @rspack/cli) |
| **Module Federation** | @module-federation/enhanced 0.8 |
| **Router** | vue-router 4.0 |
| **State** | Pinia 3.0 (setup store pattern) |
| **UI** | Tailwind CSS v4 + shadcn-vue (reka-ui Primitive) |
| **Build Orchestration** | Turborepo 2.9.16 (task caching, affected-graph) |
| **Package Manager** | pnpm 10.11 (workspaces) |
| **Node** | ≥20 |

## Architecture

```
Shell (port 8301, HTTPS)
  ├─ Pinia + vue-router (host)
  ├─ shared-store (auth-store, layout-store, api-client)
  ├─ shared-ui (icon sprite, buttons, cards, design tokens)
  └─ shared-types (User, Business, BusinessRole, OnboardingProgress)
      │
      ├─→ Home Remote (port 3010, HTTP, lazy-load)
      │    └─ App.vue (coming-soon)
      │
      └─→ Ads Asset Remote (port 3002, HTTP, lazy-load)
           └─ App.vue (coming-soon, role-gated: VIEW_ADACCOUNT + feature asset-manager)
```

**MF2 Contract:**
- Shell exports nothing (consumer only)
- Remotes expose `./App` (standalone entry) **and** `./routes` (`RouteRecordRaw[]`, child routes)
- Shell injects each remote's `./routes` under `business/:bid/<remote>` on first navigation (dynamic `addRoute`)
- Shared singletons: `vue`, `vue-router`, `pinia`, `@mf2/shared-*` (eager)
- Remote shared non-eager + requiredVersion:false (workspace packages)

## Quick Start

### Installation

```bash
pnpm install
```

### Development (all apps in parallel)

```bash
pnpm dev
```

Starts:
- Shell @ https://dev.smit.team:8301 (HTTPS, with preconnect headers)
- Home @ http://localhost:3010 (HTTP)
- Ads Asset @ http://localhost:3002 (HTTP)

Edit `.env.local` per app to override `API_GATEWAY_URL` or remote URLs via `dev-proxy-config.ts`.

### Development (individual apps)

```bash
pnpm dev:shell
pnpm dev:home
pnpm dev:ads-asset
```

### Build (all apps via Turborepo)

```bash
pnpm build
```

Runs `turbo run build --filter='./apps/*'` (remotes only). Outputs static dist/ per app. Each app builds independently; shell references remotes via mf-manifest.json. Turborepo caches outputs, skipping unchanged apps.

### Type Check (via Turborepo)

```bash
pnpm typecheck
```

Runs `turbo run typecheck` (all workspaces, workspace deps first). Vue TSC strict mode enforced. CI gates PRs with affected-only filter: `turbo run typecheck build --filter=...[origin/main]`.

### Preview Built Artifacts

```bash
pnpm preview
```

Serves all apps on allocated ports (useful before deploy).

## Folder Structure

```
client/
├── apps/
│   ├── shell/                # Host shell (MF consumer)
│   │   ├── src/
│   │   │   ├── bootstrap.ts  # Entry, guards MF init
│   │   │   ├── main.ts       # createApp + Pinia + router
│   │   │   ├── router/      # index.ts (static tree) + remote-routes.ts (dynamic addRoute)
│   │   │   ├── App.vue       # Root layout (SpriteProvider + router-view)
│   │   │   ├── styles.css    # Tailwind + theme tokens (oklch)
│   │   │   ├── components/   # AuthLayout, BusinessLayout, AppHeader, ArcSidebar, RemoteHost, etc.
│   │   │   ├── pages/        # CreateBusiness, QuickLogin (placeholder)
│   │   │   └── composables/  # use-click-outside.ts
│   │   ├── dev-proxy-config.ts # Remote URLs (home:3010, ads_asset:3002)
│   │   ├── owners.json        # MF manifest references
│   │   └── rspack.config.ts   # MF host config (shared, remotes, optimization)
│   ├── home/                 # Remote app (coming-soon)
│   │   └── src/{App.vue, pages/HomePage.vue, router/index.ts (./routes)}
│   └── ads_asset/            # Remote app (coming-soon, role-gated)
│       └── src/{App.vue, pages/AdsAssetPage.vue, router/index.ts (./routes)}
├── packages/
│   ├── shared-types/         # TS interfaces (User, Business, BusinessRole, OnboardingProgress, RemoteStatus)
│   ├── shared-store/         # Pinia stores + API client
│   │   └── src/
│   │       ├── auth-store.ts # useAuthStore (auth flow, hasRole, hasFeature)
│   │       ├── layout-store.ts # Page title, header slot, sidebar state
│   │       └── api-client.ts  # Fetch wrapper, ApiError, gateway.smit.team
│   └── shared-ui/            # Components + design system
│       └── src/
│           ├── icons/        # Sprite provider (90 lucide icons)
│           ├── components/   # Icon.vue, SmitLogo.vue, SmitLoading.vue, RemoteLoadingFallback.vue, RemoteErrorBoundary.vue, Button.vue, Card.vue
│           └── lib/          # utils.ts (cn), colors.ts (design tokens)
├── package.json              # Root scripts (dev, build, typecheck, clean)
└── tsconfig.base.json        # Shared TS config
```

## Key Features

### Authentication Flow

1. AuthLayout calls `auth.initialize()` on mount
2. checkAuth() calls `/public/authentication` (API gateway, credentials:include)
3. If unauthenticated → logout() redirects to dashboard signin
4. If authenticated + no owned business → redirect `/introduction` (create business)
5. If authenticated + owned business → auto-select or restore from localStorage, populate roles + onboarding
6. Route /business/:bid gates subsequent role/feature checks via RemoteHost
7. Transient init failure (network/timeout) shows a Retry instead of redirecting to signin

### Role & Feature Gating

```typescript
// Store API (Composition API)
const auth = useAuthStore();
auth.hasRole('VIEW_ADACCOUNT')     // boolean | (hasRole computation)
auth.hasFeature('asset-manager')   // boolean | (hasFeature computation)
```

Ads Asset remote only loads if user has VIEW_ADACCOUNT role AND asset-manager feature enabled. RemoteHost enforces the 403 fallback at the host (the remote chunk is never loaded when unauthorized). Gating is client-side UX only — the gateway is the real security boundary.

### Remote Error Recovery

RemoteHost + RemoteErrorBoundary provide:
- Suspense-based loading fallback (RemoteLoadingFallback.vue)
- onErrorCaptured for remote JS errors
- Manual retry via retryKey (remounts the Suspense subtree to reload the remote)

API request timeouts live in the shared api-client (`api({ timeout_ms })`, default 15s), not in the error boundary.

### Icon Sprite System

90 lucide icons compiled into a single SVG sprite (sprite-symbols.ts). Consumed via Icon.vue `<use>` tag. Reduces HTTP requests + inlines small SVG data.

## Bundle Optimization

**Performance Budget:** 300KB max per-asset size (rspack `performance` hint, warnings in production). This is a per-asset budget — no single chunk exceeds it; total JS across chunks is larger.

**Actual Sizes (production build, uncompressed JS, gzip is far smaller):**
- Vendor chunk: ~169KB (vue, vue-router, pinia, reka-ui)
- MF runtime: ~82KB (ModuleFederation setup)
- Shell entry (main): ~40KB
- Lazy chunk: ~27KB
- Total shell JS: ~317KB across chunks (no single asset over the 300KB per-asset budget)

**Techniques:**
- `runtimeChunk` isolated (avoids vendor cache invalidation)
- `splitChunks` with cacheGroups (mfRuntime priority 30 > vendor 10)
- Tree-shaking enabled (ES6 imports, no CommonJS fallback)
- CSS inlined via postcss-loader (no separate CSS file for dev)
- RemoteLoadingFallback CSS is pure (no animation libraries)

Remote apps (home, ads_asset) are lazy-loaded; initial shell load is ~300KB total.

## Deployment

Each app builds independently to `dist/`. Deploy strategy:

1. **Shell (host):** Deploy to primary CDN/S3 + CloudFront (update on every build)
2. **Remotes (home, ads_asset):** Deploy to secondary CDN/S3 + enable versioning (update on every build; shell always fetches latest via mf-manifest.json)
3. **Update config:** Modify `dev-proxy-config.ts` → `app_urls` to point production CDN URLs

Remote URL resolution:
- **Dev:** Hardcoded localhost (http://localhost:3010, etc.)
- **Production:** Environment variables `HOME_REMOTE_URL`, `ADS_ASSET_REMOTE_URL` (loaded at build time or runtime via global defines)

No shared state between remotes. Each remote fetches its own data from API gateway. Shell orchestrates auth + layout.

## Development Workflow

### Adding a New Feature

1. **Shell feature** (navigation, layout, auth flow):
   - Add route in `src/router/index.ts`
   - Create component in `src/components/` or `src/pages/`
   - Use `useAuthStore()` for auth checks, `useLayoutStore()` for page title
   - Import shared-ui components (Button, Card, Icon, etc.)

2. **Shared library** (icon, utility, type):
   - Add to `packages/shared-ui/src/` or `packages/shared-types/src/`
   - Update `packages/*/src/index.ts` exports
   - Reimport in app if needed (pnpm workspace resolution automatic)

3. **Remote app** (home, ads_asset):
   - Develop in `apps/{remote}/src/` (layer convention created on demand — see `.claude/features/README.md`)
   - Expose `./App` (standalone entry) and `./routes` (child routes) — MF contract
   - Shell mounts `./routes` into RemoteHost; gating + error boundary handled at the host

### Testing

Currently no test suite. Tests should target:
- Store actions (checkAuth, fetchBusinesses, hasRole, hasFeature)
- Component rendering (AuthLayout redirect logic, RemoteHost gating)
- RemoteErrorBoundary retry logic
- API client error handling (timeout, 401, network classification)

### Debugging

1. **Type errors:** `pnpm typecheck`
2. **Build errors:** `pnpm build` (check dist/ or rspack output)
3. **Runtime errors:** Browser console (dev mode shows unminified stack traces)
4. **MF issues:** Check `__@mf-types__/*.d.ts` (auto-generated), `mf-manifest.json`, `remoteEntry.js`
5. **Remote load failure:** Check Network tab (CORS? HTTPS/HTTP mix?), RemoteErrorBoundary boundary in console

## Environment Variables

**Shell (apps/shell/):**
- `API_GATEWAY_URL` (default: https://gateway.smit.team) — API backend
- `DASHBOARD_URL` (default: https://dashboard.smit.team) — logout redirect

**Dev proxy config** (apps/shell/dev-proxy-config.ts):
- `app_urls.home` (default: http://localhost:3010)
- `app_urls.ads_asset` (default: http://localhost:3002)

Set via `.env.local` or export before running `pnpm dev:shell`.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Module not found in shell** | Check `tsconfig.base.json` paths, ensure package exports in `package.json` main/types |
| **Remote not loading (gray 404)** | Verify remote dev server is running, check `dev-proxy-config.ts` URL, inspect Network tab for CORS errors |
| **Mixed content (HTTPS shell + HTTP remote)** | Chrome secure-context exception allows http://localhost in development; production requires both HTTPS |
| **Pinia store undefined** | Ensure app.use(createPinia()) before app.mount() in main.ts; import useAuthStore() inside <script setup> |
| **Icons not showing** | Check SpriteProvider is parent of app in App.vue; ensure Icon.vue sprite href matches sprite-symbols.ts export |
| **Build fails with MF error** | Clear `.rspack_cache` and `@mf-types/` directory, run `pnpm clean`, retry |

## Contributing

1. Follow code standards in `./docs/code-standards.md`
2. Use Composition API + `<script setup>` for new components
3. Keep components focused (≤150 LOC per file)
4. No console.logs in production code
5. Test auth flow changes thoroughly (affects all routes)

## Related Documentation

- **[System Architecture](./docs/system-architecture.md)** — MF2 flow, remote lifecycle, auth patterns
- **[Code Standards](./docs/code-standards.md)** — naming, style, patterns
- **[Deployment Guide](./docs/deployment-guide.md)** — CDN strategy, environment setup
- **[Project Roadmap](./docs/project-roadmap.md)** — planned features, milestones

## License

Proprietary — SMIT Agency
