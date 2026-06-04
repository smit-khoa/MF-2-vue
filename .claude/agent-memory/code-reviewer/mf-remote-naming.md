---
name: mf-remote-naming
description: How shell wires MF2 remotes — the chain that must stay consistent, and the underscore-vs-hyphen footgun
metadata:
  type: project
---

Shell MF remote wiring single source of truth: `apps/shell/owners.json` (key → host/port).
`dev-proxy-config.ts` derives `app_names` (the keys) + `app_urls`; `rspack.config.ts` builds
`mf_remotes = { key: "key@url/mf-manifest.json" }`. So the **owners.json key === the remote's MF
`name`** (rspack `ModuleFederationPlugin.name` + `output.uniqueName`) === the string used in
`import('key/routes')` in `remote-routes.ts` and in `remotes.d.ts` module declarations.

**Why:** if owners.json key ≠ remote MF name, the manifest URL resolves but the container global
name mismatches → runtime "remote not found". All four must match exactly.

**How to apply:** when reviewing a remote rename, grep the new name across: owners.json, rspack
`name`/`uniqueName`/`publicPath` port, remotes.d.ts, remote-routes.ts `import()`, router parent
`name`/`props.name`. The env override key is `${KEY.toUpperCase()}_REMOTE_URL` — if used at build
time it must be in `turbo.json` `build.env` or Turbo serves stale cached builds.

**Footgun (current state, verified 2026-06-05):** the three identifiers for one remote can legitimately
differ in separator:
- MF name / owners key / `import()` path: `ads_manager` (underscore)
- URL segment + router path + sidebar nav path: `ads-manager` (hyphen)
- npm package: `@mf2/ads-manager` (hyphen)
`RemoteHost` `props.name` is only a display label for error/loading UI — it does NOT build the MF
import, so hyphen there is harmless. The import path comes from the hardcoded `import('ads_manager/routes')`
in remote-routes.ts, which is what must match the MF name. `adaccounts` uses one token everywhere so it
sidesteps the issue.
