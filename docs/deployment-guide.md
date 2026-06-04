# Deployment Guide

Complete walkthrough for building, testing, and deploying SMIT Client to production.

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
✓ apps/home typecheck
✓ apps/ads_asset typecheck
✓ packages/shared-store typecheck
✓ packages/shared-ui typecheck
✓ packages/shared-types typecheck
```

### 4. Build All Apps

```bash
# Production build (all 3 apps in parallel)
pnpm build

# Output: apps/shell/dist, apps/home/dist, apps/ads_asset/dist
```

**Environment Setup (before build):**

```bash
# .env.production (or export before pnpm build)
export NODE_ENV=production
export API_GATEWAY_URL=https://gateway.smit.team
export DASHBOARD_URL=https://dashboard.smit.team
export HOME_REMOTE_URL=https://cdn.smit.team/home
export ADS_ASSET_REMOTE_URL=https://cdn.smit.team/ads-asset
```

**Build Output Structure:**

```
apps/shell/dist/
├── index.html (entry point)
├── runtime.js (30KB)
├── mf-runtime.js (45KB)
├── vendors.js (95KB)
├── main.js (95KB)
├── mf-manifest.json (routes remotes to CDN)
└── remoteEntry.js (empty for host)

apps/home/dist/
├── index.html
├── main.js (40KB)
├── runtime.js (30KB)
├── mf-manifest.json
└── remoteEntry.js (exports ./App)

apps/ads_asset/dist/
├── index.html
├── main.js (40KB)
├── runtime.js (30KB)
├── mf-manifest.json
└── remoteEntry.js (exports ./App)
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
# home/ads_asset:       ~40KB each

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

## Artifact Structure

### Shell Manifest (mf-manifest.json)

**Development (apps/shell/dev-proxy-config.ts):**

```json
{
  "home": {
    "url": "http://localhost:3010",
    "remoteEntry": "http://localhost:3010/remoteEntry.js"
  },
  "ads_asset": {
    "url": "http://localhost:3002",
    "remoteEntry": "http://localhost:3002/remoteEntry.js"
  }
}
```

**Production (generated at build time, update before deploy):**

```json
{
  "home": {
    "url": "https://cdn.smit.team/home/v1.0.0",
    "remoteEntry": "https://cdn.smit.team/home/v1.0.0/remoteEntry.js"
  },
  "ads_asset": {
    "url": "https://cdn.smit.team/ads-asset/v1.0.0",
    "remoteEntry": "https://cdn.smit.team/ads-asset/v1.0.0/remoteEntry.js"
  }
}
```

**Key:** URLs must point to correct remote builds. If remote version changes, update manifest.

---

## Deployment Strategy

### Architecture

```
┌─────────────────────────────────────────────────┐
│ CloudFront (CDN Cache Layer)                    │
├─────────────────────────────────────────────────┤
│ Origin 1: shell.smit.team (S3)                 │
│ Origin 2: cdn.smit.team/home (S3)              │
│ Origin 3: cdn.smit.team/ads-asset (S3)         │
└─────────────────────────────────────────────────┘
         │
         │ (User requests)
         ▼
    Browser HTTPS
    https://client.smit.team
         │
         ├─ Load index.html (shell)
         ├─ Load runtime.js + vendors.js + main.js
         ├─ Load mf-manifest.json
         └─ Lazy-load remoteEntry.js (home or ads-asset) on route match
```

### Step 1: Deploy Remotes

Deploy remotes first (home, ads-asset). If shell loads wrong manifest, users still see old remotes (safe).

```bash
# Build remotes
pnpm --filter '@mf2/home' build
pnpm --filter '@mf2/ads-asset' build

# Upload to S3
aws s3 sync apps/home/dist s3://cdn.smit.team/home/v1.0.0 \
  --cache-control "public, max-age=31536000, immutable"
aws s3 sync apps/ads_asset/dist s3://cdn.smit.team/ads-asset/v1.0.0 \
  --cache-control "public, max-age=31536000, immutable"

# Invalidate CloudFront (if needed for fast rollback)
aws cloudfront create-invalidation \
  --distribution-id E1234EXAMPLE \
  --paths "/*"
```

**Cache Headers:**
- `index.html`: `public, max-age=3600` (1 hour, checks for updates frequently)
- `*.js`: `public, max-age=31536000, immutable` (1 year, content-addressed)
- `mf-manifest.json`: `public, max-age=300` (5 min, always check for new remotes)

### Step 2: Update Shell Manifest

Before deploying shell, update mf-manifest.json with production remote URLs:

```bash
# apps/shell/src/mf-manifest.json (or generated at build time)
{
  "home": {
    "url": "https://cdn.smit.team/home/v1.0.0",
    "remoteEntry": "https://cdn.smit.team/home/v1.0.0/remoteEntry.js"
  },
  "ads_asset": {
    "url": "https://cdn.smit.team/ads-asset/v1.0.0",
    "remoteEntry": "https://cdn.smit.team/ads-asset/v1.0.0/remoteEntry.js"
  }
}
```

### Step 3: Deploy Shell

```bash
# Build shell (with updated manifest)
pnpm --filter '@mf2/shell' build

# Upload to S3
aws s3 sync apps/shell/dist s3://shell.smit.team/v1.0.0 \
  --cache-control "public, max-age=3600"  # Short TTL for quick updates

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id E5678EXAMPLE \
  --paths "/*"
```

### Step 4: Verify Deployment

```bash
# Test in staging
curl -I https://staging.client.smit.team/index.html
# Should return 200 OK

# Load in browser
# https://staging.client.smit.team
# ✓ Page loads
# ✓ Auth flow works (calls real gateway.smit.team)
# ✓ Remote loads (network tab shows remoteEntry.js)

# Check manifest
curl https://staging.client.smit.team/mf-manifest.json
# Should return JSON with correct remote URLs
```

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

### Runtime (Shell Manifest)

Embedded in `mf-manifest.json` at build time:

```json
{
  "home": { "url": "https://cdn.smit.team/home/v1.0.0" },
  "ads_asset": { "url": "https://cdn.smit.team/ads-asset/v1.0.0" }
}
```

### Client-Side (remotes can access)

Remotes inherit auth-store from shell (shared singleton Pinia):

```typescript
// Inside home remote
const auth = useAuthStore();
const apiUrl = __API_GATEWAY_URL__;  // Same as shell
```

---

## Rolling Back

### Quick Rollback (Last 24h)

CloudFront cache still holds previous version:

```bash
# Invalidate current version
aws cloudfront create-invalidation \
  --distribution-id E1234EXAMPLE \
  --paths "/*"

# Wait 5–10 min for cache invalidation
# Users will be served previous version from origin (S3)
```

### Full Rollback (Deploy Previous Version)

If current version has critical bug:

```bash
# Check recent deployments
aws s3 ls s3://shell.smit.team/

# Deploy previous version tag
aws s3 sync s3://shell.smit.team/v1.0.0-previous s3://shell.smit.team/ \
  --delete

# Or re-deploy ONE app from Git — per-path, never whole-repo checkout.
# Roll back only apps/home to a last-good tag; shell + ads_asset stay at HEAD.
git restore --source=home-deploy-2026.06.04 -- apps/home/
# safety: confirm the bad commit did not also touch shared (see micro-frontend-governance.md Layer 5)
git show <bad-sha> --stat | grep packages/   # empty = clean to revert
git add apps/home/ && git commit -m "revert(home): roll back to last-good"
pnpm --filter @mf2/home build  # rebuild only that app, then deploy its dist/
```

> Do NOT `git checkout <tag>` the whole repo to roll back one remote — that drags every app back in time. Restore per-path. See [micro-frontend-governance.md](micro-frontend-governance.md) Layer 5.

---

## Monitoring & Health Checks

### Synthetic Checks

```bash
#!/bin/bash
# health-check.sh

# 1. Shell loads
curl -s -o /dev/null -w "%{http_code}" https://client.smit.team/index.html
# Expected: 200

# 2. Manifest resolves
curl -s https://client.smit.team/mf-manifest.json | jq .
# Expected: valid JSON with remote URLs

# 3. Remote loads
curl -s -o /dev/null -w "%{http_code}" https://cdn.smit.team/home/v1.0.0/remoteEntry.js
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
  <!-- Preconnect to remote CDN -->
  <link rel="preconnect" href="https://cdn.smit.team" crossorigin />
  <!-- Preconnect to API Gateway -->
  <link rel="preconnect" href="https://gateway.smit.team" crossorigin />
</head>
```

**Result:** Browser resolves DNS + TLS in parallel with shell loading (saves ~200ms).

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
400ms   ├─ Router resolves current_business, navigates to /business/:bid/home
450ms   ├─ RemoteHost: router guard loads home/routes + remoteEntry.js
500ms   ├─ remoteEntry.js loaded
550ms   ├─ Home page mounts (into RemoteHost router-view)
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
| **Manifest 404** | Check S3 object exists, CloudFront origin path | Upload mf-manifest.json to root dist/ |
| **Remote 404 (user sees gray box)** | Check remote S3 URL in manifest, CloudFront CDN | Update manifest with correct remote URL |
| **Auth fails with CORS error** | Check browser console, Network tab CORS headers | Verify gateway.smit.team CORS policy includes shell origin |
| **Bundle too large (>300KB)** | `rspack build --analyze` or `npm run analyze` | Identify large deps, tree-shake unused code |
| **Slow TTFB (shell loads slowly)** | CloudFront cache hit ratio, S3 latency | Invalidate cache, check S3 region |
| **Mixed content warning (HTTPS shell + HTTP remote)** | Browser console warning, Network tab | Deploy remotes to HTTPS CDN (no localhost) |

---

## Disaster Recovery

### Plan A: Fast Rollback

If critical bug found after deploy:

```bash
# 1. Check current version
curl https://client.smit.team/index.html | grep version
# Output: v1.0.0

# 2. Rollback to previous
aws s3 cp s3://shell.smit.team/v0.9.9/index.html s3://shell.smit.team/index.html
aws cloudfront create-invalidation --distribution-id E1234 --paths "/*"

# 3. Verify
curl https://client.smit.team/index.html | grep version
# Output: v0.9.9
```

### Plan B: Canary Deployment

Deploy to subset of users first:

```bash
# Route 10% of traffic to new version via CloudFront weighted distribution
# Monitor 5xx errors for 30 min
# If OK, gradually increase to 100%
# If error, rollback to 0%
```

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

Apps deploy independently — a broken `home` must not block deploying `ads_asset` or `shell`.
Tag each successful production deploy PER APP so a per-path rollback (see Rolling Back) has a
known-good anchor instead of guessing a SHA:

```bash
# build one app only (Turbo: changed + its deps)
pnpm --filter @mf2/home build      # or: pnpm turbo run build --filter=@mf2/home

# after that app's deploy succeeds
git tag home-deploy-$(date +%Y.%m.%d) -m "home deployed to production"
git push --tags
```

### Remote Versioning

Each remote deployed independently:

```
apps/home/dist → s3://cdn.smit.team/home/v1.0.0
apps/ads_asset/dist → s3://cdn.smit.team/ads-asset/v1.0.0

Update shell manifest to reference correct versions
```

---

## Post-Deployment Verification

### Checklist

- [ ] Shell loads (https://client.smit.team)
- [ ] Auth flow works (redirects to login if not authenticated)
- [ ] Home remote loads (navigate to /business/:bid/home)
- [ ] Ads Asset remote blocked (403 if no VIEW_ADACCOUNT role)
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

echo "3. Testing home remote..."
curl -s -o /dev/null -w "Status: %{http_code}\n" https://cdn.smit.team/home/v1.0.0/remoteEntry.js

echo "4. Testing API gateway..."
curl -s -o /dev/null -w "Status: %{http_code}\n" https://gateway.smit.team/public/authentication

echo "5. Checking bundle size..."
aws s3 ls s3://shell.smit.team/ --recursive --human-readable | grep -E "\.js$"

echo "All checks complete."
```

---

## Maintenance & Updates

### Monthly Tasks

- [ ] Review CloudFront cache hit ratio
- [ ] Check for security updates in dependencies
- [ ] Review error logs (Sentry, CloudWatch)
- [ ] Test rollback procedure (practice)

### Quarterly Tasks

- [ ] Major dependency upgrades (Vue, Rspack, TypeScript)
- [ ] Bundle size analysis + optimization
- [ ] Performance profiling (Lighthouse, WebPageTest)

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-04  
**Audience:** DevOps, SRE, deployment engineers  
**Next Review:** 2026-07-04 (after Phase 2 release)
