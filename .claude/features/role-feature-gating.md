---
slug: role-feature-gating
remote: shell
route: /app/<remote> (when auth enabled)
roles: [VIEW_ADACCOUNT] (for ads-manager)
feature_flag: asset-manager (for ads-manager)
status: disabled (prototype bypass)
---

## Purpose
Restrict access to a remote branch by role and/or business feature flag, showing a 403 instead of the remote when the user lacks permission. Currently disabled in prototype due to CORS gateway restrictions.

## Flow (deferred, code logic intact but not used at render)
1. Shell route for a gated remote renders RemoteHost with `roles` / `feature` props.
2. RemoteHost computes `allowed` via `auth.hasRole(...)` / `auth.hasFeature(...)`.
3. allowed=false -> 403 panel; allowed=true -> remote loads via error boundary + Suspense.

## Files (MANDATORY — real paths, verified to exist)
- apps/shell/src/components/RemoteHost.vue — error boundary + Suspense + <router-view> (gating logic removed for prototype)
- apps/shell/src/router/index.ts — remote routes at /app/adaccounts, /app/ads-manager (no props: roles/feature)
- packages/shared-store/src/auth-store.ts — hasRole / hasFeature getters (methods still available, not used in prototype)
- packages/shared-types/src/index.ts — BusinessRole type (still loaded by auth, not checked at render)

## APIs used
- none directly (reads roles already loaded by [[auth-flow]] from GET /gate/:bid/me)

## Related
[[auth-flow]] [[remote-loading-recovery]]

## Decisions / Gotchas
- `is_owner` or `is_full_permission` bypasses every role/feature check (super-user).
- `hasFeature` treats presence of the key in `business_features` as enabled (value-agnostic).
- Client gating is UX only; the gateway must independently enforce permissions — never rely on this to protect data.
- Gating lives at the host (shell), not pushed into the remote, so an unauthorized remote chunk is never even loaded.
