---
slug: <kebab-case-id>
remote: shell | home | ads_asset
route: /business/:bid/<path>     # or n/a for cross-cutting
roles: []                        # required role codes, [] if none
feature_flag: <key>              # business_features key, or n/a
status: planned | in-progress | done
---

## Purpose
One sentence — what this feature does for the user.

## Flow
Step 1 -> 2 -> 3 (user action -> API -> state -> UI). Keep it the actual sequence.

## Files (MANDATORY — real paths, verified to exist)
- path/to/file.vue — role of this file
- path/to/other.ts — role

## APIs used
- METHOD /endpoint -> ResponseShape   (or "none")

## Related
[[other-slug]] ...

## Decisions / Gotchas
Explain WHY (invariant / race / trade-off). Never reference plan or phase numbers.
