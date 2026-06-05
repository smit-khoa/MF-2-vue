# Code Standards & Style Guide

Conventions for writing maintainable, consistent code across the codebase.

## Build & Development Commands

### Via Turborepo (Monorepo-aware)

```bash
pnpm build              # node scripts/build.mjs: pick apps (TTY checkbox menu) → turbo build → assemble into ../client-adscheck
pnpm build --apps adaccounts,shell   # build only those apps (skips the menu)
pnpm assemble [target]  # re-mirror existing build output into the dist repo (default ../client-adscheck)
pnpm typecheck          # turbo run typecheck (all workspaces, enforced in CI)
pnpm dev:shell          # pnpm --filter @mf2/shell dev
pnpm verify:same-origin # assert prod remote URLs are BASE_PATH-relative (no absolute domain)
pnpm verify:dist        # assert ../client-adscheck assembled complete (shell + remotes + 404)
pnpm clean              # pnpm -r exec rm -rf dist (raw, not Turbo)
```

`pnpm build` wraps Turbo via `scripts/build.mjs`: a checkbox app-picker (TTY only; non-TTY/CI
builds all), then `scripts/assemble-dist.mjs` mirrors the per-app `dist/` straight into the
standalone dist repo `../client-adscheck` (shell at root, remotes under hyphen segments, `404.html`).
shell is always built. CI calls `turbo run build` directly, bypassing the wrapper.

**Turbo Optimization:**
- `build` outputs to `dist/**`
- `typecheck` depends on `^typecheck` (workspace deps type-check first)
- CI gates PRs with `--filter=...[origin/main]` (affected-only)
- Shared packages (`@mf2/*`) have no `build` script (export TS source, no build step)

### Key Detail: Env Vars in Build

`turbo.json` `build.env` lists the vars rspack reads at build time:

```json
"build": {
  "outputs": ["dist/**"],
  "env": ["NODE_ENV", "API_GATEWAY_URL", "DASHBOARD_URL", "BASE_PATH",
          "ADACCOUNTS_REMOTE_URL", "ADS_MANAGER_REMOTE_URL"]
}
```

If you make a NEW var build-time consumed, add it here too — otherwise Turbo serves cached
builds even after the var changes. `BASE_PATH` prefixes `output.publicPath` and the relative
remote URLs; `ADACCOUNTS_REMOTE_URL` / `ADS_MANAGER_REMOTE_URL` override a remote's URL when set
(unused by the default same-origin flow, but listed so an override does not serve a stale cache).

---

## File Naming

| Type | Format | Example |
|------|--------|---------|
| Vue components | PascalCase file | AuthLayout.vue, AppHeader.vue |
| Composables | use-{name}.ts | use-click-outside.ts |
| Stores | {domain}-store.ts | auth-store.ts, layout-store.ts |
| Utils/lib | kebab-case | api-client.ts, colors.ts |
| Types | Exported from index | (no separate files) |
| Config | Descriptive kebab-case | dev-proxy-config.ts, rspack.config.ts |
| Tests | spec.ts or .test.ts | auth-store.spec.ts |

**Goal:** LLM tools (grep, find) can understand purpose from filename alone.

---

## TypeScript

### Strict Mode Required

```typescript
// tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

Violations fail `pnpm typecheck`.

### Type Annotations

Always annotate function parameters + return types:

```typescript
// ✓ Good
function setCurrentBusiness(business: Business): void {
  localStorage.setItem(STORAGE_KEY, business.business_id);
}

async function fetchBusinesses(): Promise<Business[]> {
  const data = await api_get<{ data: Business[] }>(...);
  return data.data || [];
}

// ✗ Bad
function setCurrentBusiness(business) { ... }  // implicit any
function fetchBusinesses() { ... }  // implicit any return
```

### Generic Types

Use generics for API responses:

```typescript
// ✓ Good
const data = await api_get<{ user: User }>('/public/authentication');
const roles = await api_get<BusinessRole>('/gate/:bid/me');

// ✗ Bad
const data = await api_get('/public/authentication');  // unknown type
```

### Exported Interfaces

All shared types in `packages/shared-types/src/index.ts`:

```typescript
// ✓ Good
export interface User { ... }
export interface Business { ... }

// ✗ Bad
interface User { ... }  // local, not exported
type Business = { ... };  // use interface for object types
```

Prefer `interface` for object shapes, `type` for unions/literals.

---

## Vue Components

### Script Setup + Composition API (Mandatory)

```vue
<script setup lang="ts">
// Imports first
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@mf2/shared-store';
import SomeComponent from './SomeComponent.vue';

// Define types
interface Props {
  name: string;
  disabled?: boolean;
}

interface Emit {
  (e: 'update:modelValue', value: string): void;
  (e: 'click'): void;
}

// Props + emits
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<Emit>();

// Reactive state
const count = ref(0);
const auth = useAuthStore();
const { user, is_authenticated } = storeToRefs(auth);

// Computed
const doubled = computed(() => count.value * 2);

// Lifecycle
onMounted(() => {
  console.log('mounted');
});

// Methods
function increment() {
  count.value++;
  emit('click');
}
</script>

<template>
  <div>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<style scoped>
button {
  @apply px-4 py-2 bg-blue-500 text-white rounded;
}
</style>
```

**Rules:**
- NO Options API (no data, methods, computed blocks)
- NO this (use refs + functions)
- defineProps + defineEmits for type safety
- storeToRefs for reactive store destructuring
- Scoped CSS mandatory (prevent style leaks)

### Max 150 LOC per File

If component exceeds 150 lines:
1. Extract complex logic to composable
2. Split into smaller sub-components
3. Move template to separate markup file (only if unavoidable)

Example:

```typescript
// Before: AuthLayout.vue (200 LOC, complex guard logic)

// After:
// composables/use-auth-guard.ts (60 LOC, pure logic)
export function useAuthGuard() {
  const evaluateRedirect = () => { ... };
  watch([...], evaluateRedirect);
  return { evaluateRedirect };
}

// AuthLayout.vue (70 LOC, template only)
<script setup lang="ts">
const { evaluateRedirect } = useAuthGuard();
</script>
```

### Props Interface Pattern

```typescript
// ✓ Good: Explicit Props type
interface Props {
  modelValue?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false,
  variant: 'primary',
});

// ✗ Bad: Loose object syntax
const props = defineProps({
  modelValue: String,  // type inference weak
  disabled: Boolean,
});
```

### Event Naming

Emit names: lowercase, hyphenated:

```typescript
// ✓ Good
emit('update:modelValue', newValue);
emit('submit-form');
emit('error-retry');

// ✗ Bad
emit('updateModelValue');  // camelCase in template
emit('submit_form');  // snake_case
```

---

## Pinia Stores

### Setup Store Pattern (Mandatory)

```typescript
// ✓ Good: Setup store
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const is_loading = ref(true);

  // Actions
  async function checkAuth() {
    try {
      const data = await api_get<{ user: User }>('/...');
      user.value = data.user;
    } catch {
      user.value = null;
    }
  }

  // Getters (computed)
  const displayName = computed(() => user.value?.name || 'Guest');

  return {
    user,
    is_loading,
    checkAuth,
    displayName,
  };
});

// ✗ Bad: Options pattern (Vuex-style)
export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null }),
  mutations: { setUser(state, user) { ... } },  // no mutations in Composition
  actions: { ... },
});
```

**Rules:**
- Use setup() function, NOT { state, mutations, actions }
- Return object lists public API (state + actions + getters)
- No private helper functions (extract to utils if needed)
- Module-level guards for initialization (see auth-store.ts example)

### Naming Convention

```typescript
// ✓ Good
const user = ref(null);
const is_authenticated = ref(false);
const fetchBusinesses = async () => { ... };

// ✗ Bad
const _user = ref(null);  // underscore private (not needed in setup)
const isAuthenticated = ref(false);  // inconsistent snake_case
```

Use snake_case for reactive state to match API response fields.

---

## Composables

### Naming: use-{name}.ts

```typescript
// use-click-outside.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useClickOutside(element: Ref<HTMLElement | null>) {
  const isOpen = ref(false);

  function handleClickOutside(event: MouseEvent) {
    if (element.value && !element.value.contains(event.target as Node)) {
      isOpen.value = false;
    }
  }

  onMounted(() => document.addEventListener('click', handleClickOutside));
  onUnmounted(() => document.removeEventListener('click', handleClickOutside));

  return { isOpen };
}

// Usage in component
<script setup lang="ts">
const dropdownEl = ref<HTMLElement | null>(null);
const { isOpen } = useClickOutside(dropdownEl);
</script>

<template>
  <div ref="dropdownEl">...</div>
</template>
```

**Rules:**
- Return object with reactive state + methods
- No side effects until onMounted
- Cleanup in onUnmounted
- Generic-friendly for reusability

---

## API Client

### Pattern: api_get / api_post

```typescript
// ✓ Good: Type-safe, error-handled
async function fetchBusinesses() {
  try {
    const data = await api_get<{ data: Business[] }>('/gate/me/businesses', {
      page: '1',
      limit: '100',
    });
    return data.data || [];
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`API error: ${error.status}`, error.data);
    }
    return [];
  }
}

// ✗ Bad: Loose fetch, no error handling
const response = await fetch('/gate/me/businesses');
const data = await response.json();
```

**Rules:**
- Always use `api()` / `api_get` / `api_post` (not `fetch`). Components/pages never call the API directly — go through a remote's `api/` layer or the store.
- Generic type the response shape
- Catch ApiError + handle gracefully
- Query params as object (not URL string)
- Need a custom timeout? `api({ url, timeout_ms })` (default 15s, `0` disables).

### Error Handling

`ApiError.kind` classifies the failure: `http` | `auth` (401) | `network` | `timeout` | `aborted`.
`ApiError.is_transient` is true for `network`/`timeout` — a transient failure must NOT be treated as logged-out.

401 is centralized: api-client invokes a single registered handler (auth-store registers `logout`), so you do NOT handle 401 per call. An `aborted` error means a newer request superseded this one — ignore it, don't clear state.

```typescript
// ✓ Good — react to the classified kind, let 401 be handled centrally
try {
  await fetchBusinessRoles(id, signal);
} catch (error) {
  if (error instanceof ApiError && error.kind === 'aborted') return; // superseded
  // transient vs real failure handled by caller; 401 already triggered logout
}

// ✗ Bad
try {
  await fetchBusinesses();
} catch {
  console.error('error');  // vague, no action
}
```

---

## CSS & Tailwind

### Scoped Styles

```vue
<style scoped>
/* ✓ Good: Scoped, Tailwind utilities */
.button {
  @apply px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600;
}

/* ✗ Bad: Global class (no scope) */
button {
  padding: 1rem;
  background: blue;
}
</style>
```

### Design Tokens

Use color tokens from `shared-ui/lib/colors.ts`:

```typescript
// colors.ts
export const colors = {
  primary: 'oklch(50% 0.2 280)',  // semantic color
  success: 'oklch(70% 0.15 142)',
  error: 'oklch(60% 0.25 20)',
};

// Component
<style scoped>
.error-box {
  color: var(--color-error, oklch(60% 0.25 20));
}
</style>
```

### No Inline Styles

```vue
<!-- ✓ Good: Tailwind classes -->
<div class="flex gap-4 p-4 bg-slate-100 rounded-lg">

<!-- ✗ Bad: Inline style -->
<div style="display: flex; gap: 1rem; padding: 1rem;">
```

---

## Comments

### Document WHY, Not WHAT

```typescript
// ✓ Good: Explains intention
// Module-level guard prevents initialize() from running twice,
// preserving the original contract that first call triggers all API calls.
let initialize_promise: Promise<void> | null = null;

// ✗ Bad: Restates code
// Initialize promise
let initialize_promise: Promise<void> | null = null;
```

### Avoid Plan/Artifact References

```typescript
// ✓ Good: Self-contained rationale
// Credentials included to support cross-domain auth (cookies + headers).
// Dashboard redirect on 401 allows external signin flow.

// ✗ Bad: References plan artifact
// Per F13 advisory-lock fix, serialize concurrent reassigns.
```

### JSDoc for Public APIs

```typescript
/**
 * Fetch businesses owned by current user.
 * 
 * @param limit - Max results per page (default: 100)
 * @returns Array of Business objects, empty if API fails
 */
export async function fetchBusinesses(limit = 100): Promise<Business[]> {
  // ...
}
```

---

## Imports

### Order

```typescript
// 1. Vue + framework imports
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

// 2. External libraries
import { storeToRefs } from 'pinia';

// 3. Local packages (@mf2/*)
import { useAuthStore } from '@mf2/shared-store';
import { Button, Card } from '@mf2/shared-ui';

// 4. Local files (absolute path via @/)
import { api_get } from '@/lib/api';
import AuthLayout from './AuthLayout.vue';
```

### Absolute Paths

Use `@/` alias (configured in tsconfig.base.json):

```typescript
// ✓ Good
import { useClickOutside } from '@/composables/use-click-outside';

// ✗ Bad
import { useClickOutside } from '../../../composables/use-click-outside';
```

---

## Error Handling

### No console.log in Production Code

```typescript
// ✓ Good: Silent failure in production, logged in dev
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info', { user, business });
}

// Errors logged via error boundary
<script setup lang="ts">
onErrorCaptured((error) => {
  console.error('Component error:', error);
  return false;  // Don't propagate
});
</script>

// ✗ Bad: console.log everywhere
console.log('User:', user);
console.log('Loading...');
```

### Throw vs Return Error

```typescript
// ✓ Good: Throw in async, caller decides retry
export async function fetchBusinesses(): Promise<Business[]> {
  const data = await api_get<{ data: Business[] }>('/...');
  if (!data.data) throw new Error('No businesses returned');
  return data.data;
}

// Caller
try {
  await fetchBusinesses();
} catch (error) {
  // Retry or fallback
}

// ✗ Bad: Return error object (ambiguous)
export async function fetchBusinesses(): Promise<Business[] | null> {
  try { ... } catch { return null; }  // Caller must check for null
}
```

---

## Testing (Future Standard)

When tests are added (Phase 2+):

```typescript
// Vitest + happy-dom for unit tests
describe('useAuthStore', () => {
  it('should initialize and fetch businesses', async () => {
    const auth = useAuthStore();
    await auth.initialize();
    expect(auth.businesses).toHaveLength(1);
  });

  it('should logout and clear state', () => {
    const auth = useAuthStore();
    auth.logout();
    expect(auth.is_authenticated).toBe(false);
  });
});

// Playwright for e2e tests
test('should redirect unauthenticated user to dashboard', async ({ page }) => {
  await page.goto('https://dev.smit.team:8301');
  // Page should redirect to dashboard
  expect(page.url()).toContain('dashboard');
});
```

---

## Micro-frontend Discipline (Shared Packages)

**Read [docs/micro-frontend-governance.md](./micro-frontend-governance.md) for full rationale.**

When editing `packages/shared-*`:

1. **Additive only** — never break existing API
   - ✓ Add optional fields (`field?: type`)
   - ✓ Add params with defaults
   - ✓ Add new functions/components/store members
   - ✗ Rename/remove public API that another app uses

2. **PR-split required** — never mix `packages/shared-*` with `apps/*` in one PR
   - Shared change PR #1 (merge first)
   - App change PR #2 (built on #1)
   - Reason: isolates broken app PRs, enables per-path revert, keeps app commits clean of `packages/`

3. **CODEOWNERS enforced** — tech-lead review required on `packages/shared-*` changes (GitHub branch protection)

4. **CI gate blocks main** — broken shared code cannot merge (Turbo affected-graph catches all dependents)

---

## Commit Messages

### Conventional Commits

```
feat: add password reset flow
fix: prevent duplicate auth initialize calls
docs: update auth flow diagram in README
refactor: extract remote loading logic to composable
test: add useAuthStore initialization tests
chore: upgrade vue to 3.5.1
```

**Format:** `{type}: {description}` (lowercase, imperative)

**Types:** feat, fix, docs, refactor, test, chore, perf, ci, style, build

No plan artifact references (F13, audit-A4, etc.) in commit messages.

---

## Pre-commit / Pre-push Checklist

- [ ] `pnpm typecheck` passes (no TS errors)
- [ ] No console.log left (except dev-guarded)
- [ ] Tests pass (when available)
- [ ] Import order correct (Vue → external → @mf2/* → @/)
- [ ] Component < 150 LOC (or composable extracted)
- [ ] Props + emits typed
- [ ] No inline styles (use Tailwind @apply)
- [ ] Comments explain WHY, not WHAT
- [ ] No plan/artifact references in code

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-04  
**Status:** Active, enforced in code review
