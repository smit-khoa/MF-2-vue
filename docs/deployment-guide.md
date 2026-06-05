# Deployment Guide

Complete walkthrough for building, testing, and deploying SMIT Client to production.


---

## Dist-repo pipeline (current deploy)

The three apps build to static files and are served from **one origin**. Single origin
→ no CORS, no mixed-content. Remotes run on bundled mock data, so the demo needs no backend.

There is **no CI auto-deploy** — the old `deploy-pages.yml` was retired. The team lead
publishes manually from a dedicated dist repo, controlling deploy timing.

### How it works

Same-origin is built into the artifacts, not the host: in production the shell references
its remotes by **BASE_PATH-relative path** (`/adaccounts/...`, `/ads-manager/...`), so the
browser resolves them same-origin regardless of domain. No absolute remote URL is baked in.

Local pipeline (all in `client/`):

```bash
pnpm build            # build apps + assemble directly into ../client-adscheck
# then, in ../client-adscheck: review, commit, push to deploy
```

`pnpm build` (`scripts/build.mjs`) runs `turbo run build`, then `scripts/assemble-dist.mjs`
merges each app's `dist/` straight into the standalone dist repo (default sibling
`../client-adscheck`):

```
client-adscheck/
├── index.html + *.js   (shell host, at root)
├── 404.html            (copy of index.html — SPA deep-link fallback)
├── adaccounts/         (remoteEntry.js, mf-manifest.json)
└── ads-manager/        (hyphen segment — MF name ads_manager)
```

- **No `dist-bundle/` middle step** — assembly writes directly to the deploy repo.
- **Completeness checked before writing**: if shell (host) or any remote's `dist/` is
  missing (partial build / `pnpm clean`), assembly aborts and leaves `../client-adscheck`
  untouched — no half-overwritten deploy repo.
- **Mirror, `.git` preserved**: the target's published files are wiped then copied fresh
  (stale `[contenthash]` files never accumulate); the dist repo's `.git` is kept. Refuses a
  target that is the repo or any ancestor of it.
- **Copy only** — never commits or pushes. Review + commit + push from the dist repo yourself.
- Selecting apps: `pnpm build --apps adaccounts,shell`, or run `pnpm build` with no flag in a
  terminal to pick from a checkbox menu (shell always included). To rebuild the full deploy
  tree, build every app (`pnpm build` with no `--apps` in CI / non-TTY builds all).
- Override the target: `pnpm build` then `pnpm assemble /path/to/dist-repo`, or
  `DIST_TARGET=/path pnpm build`.

### BASE_PATH

`BASE_PATH` (default `/`) prefixes both `output.publicPath` and the relative remote URLs.
Serve at domain root → keep `/`. Serve under a sub-path (e.g. `/client-adscheck/`) →
`BASE_PATH=/client-adscheck/ pnpm build`. An absolute `*_REMOTE_URL` env still overrides the
relative path per remote (kept for flexibility; unused by the default same-origin flow).

### Verification scripts

```bash
pnpm verify:same-origin   # prod build → assert every remote URL is BASE_PATH-relative, no domain
pnpm verify:dist          # assert ../client-adscheck complete (shell + every remote + 404)
```

---

## Pre-Deployment Checklist

Before any deployment:

- [ ] `pnpm typecheck` passes (0 errors)
- [ ] `pnpm build` succeeds (all 3 apps) — pre-merge sanity gate only; the deploy unit is one app, deployed independently (see [micro-frontend-governance.md](micro-frontend-governance.md) Layer 3)
- [ ] Bundle analysis shows all chunks < 300KB (shell) / < 150KB (remotes)
- [ ] No console.log in production code (grep check)
- [ ] All docs updated (README, architecture, standards)
- [ ] Version bumped (package.json, Git tag)
- [ ] Environment variables configured (.env.production)

---

## Build Process

### 1. Clean Build

```bash
# Remove caches and dist/ from previous builds
pnpm clean
```

Removes:
- `dist/` directories (all apps)
- `node_modules/.cache/`
- `.rspack_cache/`
- `@mf-types/` (MF type definitions)

### 2. Install Dependencies

```bash
pnpm install
```

Resolves workspace dependencies using pnpm hoisting (no node_modules symlinks).

### 3. Type Check

```bash
pnpm typecheck
```

Runs `vue-tsc --noEmit` on all workspaces. Must pass before build.

**Output:**
```
✓ apps/shell typecheck
✓ apps/adaccounts typecheck
✓ apps/ads-manager typecheck
✓ packages/shared-store typecheck
✓ packages/shared-ui typecheck
✓ packages/shared-types typecheck
```

### 4. Build All Apps

```bash
# Production build (all 3 apps in parallel)
pnpm build

# Output: apps/shell/dist, apps/adaccounts/dist, apps/ads-manager/dist
```

**Environment Setup (before build):**

```bash
# .env.production (or export before pnpm build)
export NODE_ENV=production
export API_GATEWAY_URL=https://gateway.smit.team
export DASHBOARD_URL=https://dashboard.smit.team
export BASE_PATH=/
```

**Turbo build task environment (turbo.json):**
- `NODE_ENV` — production for minified builds
- `API_GATEWAY_URL` — gateway domain
- `DASHBOARD_URL` — dashboard domain for redirects
- `BASE_PATH` — path prefix if serving under subdirectory (default `/`)
- `ADACCOUNTS_REMOTE_URL` — override remote URL (optional; same-origin default uses BASE_PATH-relative)

**Build Output Structure:**

```
apps/shell/dist/
├── index.html (entry point)
├── runtime.js (30KB)
├── mf-runtime.js (45KB)
├── vendors.js (95KB)
├── main.js (95KB)
├── mf-manifest.json (routes remotes to BASE_PATH-relative paths)
└── remoteEntry.js (empty for host)

apps/adaccounts/dist/
├── index.html
├── main.js (40KB)
├── runtime.js (30KB)
├── mf-manifest.json
└── remoteEntry.js (exports ./App + ./routes)

apps/ads-manager/dist/
├── index.html
├── main.js (40KB)
├── runtime.js (30KB)
├── mf-manifest.json
└── remoteEntry.js (exports ./App + ./routes)
```

### 5. Verify Bundle Sizes

```bash
# Check sizes
ls -lh apps/*/dist/*.js

# Expected (production, uncompressed JS):
# shell/vendors.js:     ~169KB
# shell/runtime.js:     ~82KB
# shell/main.js:        ~40KB
# shell lazy chunk:     ~27KB
# adaccounts/main.js:   ~40KB
# ads-manager/main.js:  ~40KB

# Total shell JS: ~317KB across chunks (no single asset over 300KB) ✓
```

**If sizes exceeded:**

1. Identify culprit: `rspack build --analyze` (generates report)
2. Check for:
   - Unused imports (tree-shake)
   - Duplicate dependencies (hoisting issues)
   - Large dependencies (Tailwind unused utilities)
3. Fix and rebuild


---

## Environment Variables

### Build-Time (Rspack Defines)

Set before `pnpm build`:

```bash
export NODE_ENV=production
export API_GATEWAY_URL=https://gateway.smit.team
export DASHBOARD_URL=https://dashboard.smit.team
```

**Used by:** rspack.config.ts `DefinePlugin`, injected as global `__API_GATEWAY_URL__`, etc.

---

## Rolling Back

If a deployed version has a critical bug, use per-app rollback (never force-push main backwards):

```bash
# Find the last-good ref for an app (check git log or use a deploy tag)
git log --oneline -- apps/adaccounts/

# Roll back ONE app by restoring it to a known-good state
git restore --source=adaccounts-deploy-2026.06.04 -- apps/adaccounts/

# Verify the bad commit didn't also change shared packages
git show <bad-sha> --stat | grep packages/   # empty = safe to revert

# Commit and push the rollback (forward commit, not force-push)
git add apps/adaccounts/ && git commit -m "revert(adaccounts): roll back to last-good"
git push

# Rebuild only that app and redeploy
pnpm --filter @mf2/adaccounts build
# Then assemble and commit to dist repo
```

**Key:** Per-path restore leaves other apps untouched. Never `git checkout <tag>` the whole repo — that reverts every app. See [micro-frontend-governance.md](micro-frontend-governance.md) Layer 5.

---

## Monitoring & Health Checks

### Synthetic Checks (Same-Origin Deployment)

```bash
#!/bin/bash
# health-check.sh — verify same-origin deployed dist

# 1. Shell loads
curl -s -o /dev/null -w "%{http_code}" https://client.smit.team/index.html
# Expected: 200

# 2. Manifest resolves
curl -s https://client.smit.team/mf-manifest.json | jq .
# Expected: valid JSON with BASE_PATH-relative remote URLs

# 3. Remote loads (same origin, relative path)
curl -s -o /dev/null -w "%{http_code}" https://client.smit.team/adaccounts/remoteEntry.js
# Expected: 200

# 4. API Gateway reachable
curl -s -o /dev/null -w "%{http_code}" https://gateway.smit.team/public/health
# Expected: 200
```

### Metrics to Monitor

| Metric | Target | Alert If |
|--------|--------|----------|
| Shell TTFB | < 500ms | > 2s |
| Remote load time | < 1s | > 3s |
| 5xx errors (shell) | 0 | > 0.1% |
| 5xx errors (remotes) | 0 | > 0.1% |
| CDN hit ratio | > 95% | < 80% |
| Auth success rate | > 99% | < 98% |

### Logging

**Shell errors → CloudWatch Logs:**

```javascript
// Browser-side error capture (if implemented Phase 2)
window.addEventListener('error', (e) => {
  sendToCloudWatch({
    timestamp: new Date(),
    error: e.message,
    stack: e.error?.stack,
    url: window.location.href,
  });
});
```

**API errors → Gateway logs:**

```typescript
// api-client.ts
api_get('/...').catch((error) => {
  console.error(`[API] ${error.status}: ${error.data.message}`);
  // Send to logging service
});
```

---

## Performance Optimization

### CDN Cache Configuration

| File | Cache Control | TTL | Reason |
|------|---|---|---|
| `index.html` | public, max-age=3600 | 1 hour | Check for updates (includes version tag) |
| `*.js` (main, vendors, runtime) | public, max-age=31536000, immutable | 1 year | Content hash in filename, never changes |
| `mf-manifest.json` | public, max-age=300 | 5 min | Routes remotes, update frequently |
| `*.json` (other) | public, max-age=3600 | 1 hour | Config, moderate refresh |

### Preconnect Headers

**Shell index.html:**

```html
<head>
  <!-- Preconnect to API Gateway (only external dependency) -->
  <link rel="preconnect" href="https://gateway.smit.team" crossorigin />
</head>
```

**Result:** Browser resolves DNS + TLS to gateway in parallel with shell loading (saves ~100–200ms).
Remotes are same-origin (no preconnect needed); browser resolves them via the already-open connection.

### Critical Path Optimization

```
Timeline:
0ms     ├─ index.html arrives
50ms    ├─ runtime.js + vendors.js start loading (preload in index.html)
150ms   ├─ main.js loads + Vue app initializes
200ms   ├─ Router matches route
250ms   ├─ AuthLayout mounts, auth.initialize() starts
300ms   ├─ checkAuth() call to gateway.smit.team
350ms   ├─ Response received, is_authenticated = true
400ms   ├─ Router resolves current_business, navigates to /app/adaccounts
450ms   ├─ RemoteHost: router guard loads adaccounts/routes + remoteEntry.js
500ms   ├─ remoteEntry.js loaded
550ms   ├─ Adaccounts page mounts (into RemoteHost router-view)
600ms   ├─ First render visible
650ms   └─ Remote data fetch starts

Total: ~650ms to interactive
```

**Techniques:**
- Preconnect links (DNS + TLS early)
- Async script loading (no render-blocking)
- Lazy-remote loading (don't wait for remoteEntry.js)

---

## Troubleshooting Deployment

| Issue | Debug | Fix |
|-------|-------|-----|
| **Manifest 404** | Check dist-repo assembled, shell copied correctly | Re-run `pnpm assemble` or rebuild |
| **Remote 404 (user sees gray box)** | Check remote folder exists in dist-repo, relative path in manifest | Verify `pnpm assemble` included all remotes |
| **Auth fails with CORS error** | Check browser console, Network tab CORS headers | Verify gateway.smit.team CORS policy includes shell origin |
| **Bundle too large (>300KB)** | `rspack build --analyze` or `npm run analyze` | Identify large deps, tree-shake unused code |
| **Slow TTFB (shell loads slowly)** | Network timing, check preconnect headers injected | Verify `BASE_PATH` is correct in build env |
| **Mixed content warning (HTTPS shell + HTTP remote)** | Browser console warning, Network tab | Ensure prod build uses relative paths (not http://localhost) |


---

## Version Management

### Semantic Versioning

```
v{MAJOR}.{MINOR}.{PATCH}

v1.0.0 — Initial release
v1.1.0 — New feature (asset sync, Phase 2)
v1.1.1 — Bug fix
v2.0.0 — Breaking change (API contract change)
```

### Git Tagging

```bash
# After successful deploy
git tag v1.0.0 -m "Phase 1 base platform release"
git push origin v1.0.0

# For rollback reference
git tag v1.0.0-deployed -m "Deployed to production 2026-06-04"
```

### Per-App Deploy Tags (rollback anchors)

Apps deploy independently — a broken `adaccounts` must not block deploying `ads-manager` or `shell`.
Tag each successful production deploy PER APP so a per-path rollback (see Rolling Back) has a
known-good anchor instead of guessing a SHA:

```bash
# build one app only (Turbo: changed + its deps)
pnpm --filter @mf2/adaccounts build      # or: pnpm turbo run build --filter=@mf2/adaccounts

# after that app's deploy succeeds
git tag adaccounts-deploy-$(date +%Y.%m.%d) -m "adaccounts deployed to production"
git push --tags
```

### Remote Versioning (Same-Origin)

Each remote deployed independently to the same-origin dist repo:

```
apps/adaccounts/dist → ../client-adscheck/adaccounts/
apps/ads-manager/dist → ../client-adscheck/ads-manager/

Shell's mf-manifest.json references remotes as BASE_PATH-relative paths
(e.g. /adaccounts/remoteEntry.js, /ads-manager/remoteEntry.js)
```

---

## Post-Deployment Verification

### Checklist

- [ ] Shell loads (https://client.smit.team)
- [ ] Auth flow works (redirects to login if not authenticated)
- [ ] Adaccounts remote loads (navigate to /app/adaccounts)
- [ ] Ads Manager remote accessible (navigate to /app/ads-manager)
- [ ] Icons display (inspect SpriteProvider)
- [ ] Console clean (no errors, no console.log)
- [ ] Bundle size within budget (check Network tab)
- [ ] TTFB < 500ms (DevTools Lighthouse)

### Smoke Test Script

```bash
#!/bin/bash
# smoke-test.sh — Run after deploy

echo "1. Testing shell load..."
curl -s -o /dev/null -w "Status: %{http_code}\n" https://client.smit.team/index.html

echo "2. Testing manifest..."
curl -s https://client.smit.team/mf-manifest.json | jq . || echo "ERROR: Manifest invalid JSON"

echo "3. Testing adaccounts remote (same-origin)..."
curl -s -o /dev/null -w "Status: %{http_code}\n" https://client.smit.team/adaccounts/remoteEntry.js

echo "4. Testing API gateway..."
curl -s -o /dev/null -w "Status: %{http_code}\n" https://gateway.smit.team/public/authentication

echo "All checks complete."
```

---

## Maintenance & Updates

### Monthly Tasks

- [ ] Check for security updates in dependencies
- [ ] Review error logs (if integrated)
- [ ] Test rollback procedure (practice — use `git restore` per app)

### Quarterly Tasks

- [ ] Major dependency upgrades (Vue, Rspack, TypeScript)
- [ ] Bundle size analysis + optimization
- [ ] Performance profiling (Lighthouse, WebPageTest)

---

**Document Version:** 1.1  
**Last Updated:** 2026-06-05  
**Audience:** DevOps, SRE, deployment engineers  
**Next Review:** 2026-07-05
