---
slug: auth-flow
remote: shell
route: n/a (gates the whole protected tree under /)
roles: []
feature_flag: n/a
status: done
---

## Purpose
Authenticate the user against the API gateway on app load, hydrate businesses/roles, and route them to the right place (signin redirect, introduction, or business home).

## Flow
1. AuthLayout mounts -> calls `auth.initialize()`.
2. `checkAuth()` GET /public/authentication (cookie-based, credentials:include).
3. Not authenticated -> `logout()` redirects to dashboard signin.
4. Transient network/timeout error -> `auth_error=true`, AuthLayout shows a Retry button (does NOT log the user out).
5. Authenticated -> `fetchBusinesses()`; restore saved business from localStorage or pick first; load roles + onboarding.
6. AuthLayout redirects: no owned business -> /introduction; at / -> /app -> /app/adaccounts.

**Prototype note:** AuthLayout is currently mounted but not used in prototype routing (bypass for CORS gateway restrictions). Kept in codebase for future auth enablement.

## Files (MANDATORY — real paths, verified to exist)
- apps/shell/src/components/AuthLayout.vue — mounts initialize, redirect logic, transient-error retry UI
- packages/shared-store/src/auth-store.ts — useAuthStore: initialize/checkAuth/fetchBusinesses, auth_error, retryable initialize_promise
- packages/shared-store/src/api-client.ts — api(): timeout, error classification, centralized 401 handler
- packages/shared-types/src/index.ts — User, Business, OnboardingProgress

## APIs used
- GET /public/authentication -> { user: User }
- GET /gate/me/businesses -> { data: Business[] }
- GET /gate/:bid/me -> BusinessRole
- POST /gate/:bid/feature-onboarding-progress -> { success, features, earned_trial_days }

## Related
[[role-feature-gating]] [[remote-loading-recovery]]

## Decisions / Gotchas
- `initialize_promise` is module-level and reset to null on failure so a retry can re-run; a successful run keeps it cached to dedupe concurrent callers.
- A transient ApiError (network/timeout) is rethrown by checkAuth instead of being treated as logged-out — otherwise a flaky connection would bounce the user to signin.
- 401 is centralized in api-client via a registered handler (auth-store registers `logout`); fires exactly once even under a burst of concurrent 401s. api-client must NOT import auth-store (cycle).
- Gating here is client-side UX only — the gateway is the real security boundary.
