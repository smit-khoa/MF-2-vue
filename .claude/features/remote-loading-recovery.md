---
slug: remote-loading-recovery
remote: shell
route: /app/<remote> (all remote branches: adaccounts, ads-manager)
roles: []
feature_flag: n/a
status: done
---

## Purpose
Load Module Federation remotes lazily, show a loading fallback during fetch, and recover gracefully (with manual retry) when a remote chunk fails to load.

## Flow
1. Shell navigates into a remote branch -> router guard registers the remote's child routes (./routes) once.
2. RemoteHost wraps the remote render in RemoteErrorBoundary + Suspense.
3. While the remote chunk loads -> RemoteLoadingFallback shown.
4. Remote JS error -> onErrorCaptured stops propagation, shows error panel with Retry.
5. Retry increments retryKey -> Suspense subtree remounts -> remote reloads.

## Files (MANDATORY — real paths, verified to exist)
- apps/shell/src/components/RemoteHost.vue — error boundary + Suspense + <router-view> for remote child routes
- apps/shell/src/router/remote-routes.ts — installRemoteRoutes: lazy addRoute per remote, idempotent, deep-link safe
- packages/shared-ui/src/components/RemoteErrorBoundary.vue — onErrorCaptured, retryKey slot prop
- packages/shared-ui/src/components/RemoteLoadingFallback.vue — Suspense #fallback content
- apps/shell/src/remotes.d.ts — module declarations for `<remote>/App` and `<remote>/routes`
- apps/{shell,adaccounts,ads-manager}/rspack.config.ts — `lazyCompilation: false` (see gotcha below)

## APIs used
- none (loads remote chunks via MF mf-manifest.json, not the gateway)

## Related
[[role-feature-gating]] [[auth-flow]]

## Decisions / Gotchas
- Remote routes are registered via a global `beforeEach` guard (not parent `beforeEnter`): a deep-link to a not-yet-registered child path falls into NotFound, which `beforeEnter` would miss. Match is by URL segment, then the navigation is re-resolved.
- `registered` Set guarantees addRoute runs once per remote even across repeated back/forward navigation (no duplicate routes).
- retryKey is the recovery primitive: bumping it remounts the Suspense subtree, which re-runs the remote loader.
- rspack `lazyCompilation` MUST stay disabled (top-level config, NOT `experiments.lazyCompilation`). Its web default `{ imports: true }` defers compiling dynamic imports until a runtime trigger request. MF remotes load as dynamic imports across origins (HTTPS shell → HTTP localhost remote); the cross-origin compile trigger never completes, so `import()` hangs and the remote sits on RemoteLoadingFallback forever (no error → error boundary never fires). Symptom: page stuck on loading spinner, all network 200, chunks named `*lazy-compilation-proxy*`.
