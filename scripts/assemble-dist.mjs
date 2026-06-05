// Assembles the per-app build outputs into the standalone dist repo as one same-origin
// tree, ready to deploy:
//   <target>/            <- shell dist (index.html, assets, mf-manifest.json)
//   <target>/<segment>/  <- each remote's dist (e.g. ads-manager/)
//   <target>/404.html    <- copy of index.html for SPA deep-link fallback
//
// Target defaults to the sibling dist repo ../client-adscheck (override via argv[2] or
// DIST_TARGET). Mirror semantics: the target's published files are wiped (its .git is
// preserved) then copied fresh, so stale [contenthash] files never accumulate.
//
// Writes DIRECTLY into the deploy repo, so completeness is checked BEFORE anything is
// removed: if shell (host) or any remote dist is missing, the script aborts and leaves
// the target untouched — a half-overwritten deploy repo must never happen.
import { cpSync, existsSync, mkdirSync, rmSync, copyFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, parse, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { remotes } from './remote-segments.mjs';

const CLIENT_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = 'dist'; // per-app build output dir
const appDist = (folder) => join(CLIENT_ROOT, 'apps', folder, DIST);

// Deploy target: standalone dist repo. Default sibling ../client-adscheck.
const argTarget = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : undefined;
const TARGET = resolve(argTarget || process.env.DIST_TARGET || join(CLIENT_ROOT, '..', 'client-adscheck'));

// Refuse a target that is the repo or any ancestor of it — the mirror wipes the target,
// so a stray `.` / `..` / `/` must never reach the delete loop.
if (TARGET === CLIENT_ROOT || CLIENT_ROOT.startsWith(TARGET + sep) || TARGET === parse(TARGET).root) {
  console.error(`✗ assemble aborted: target '${TARGET}' is the repo or an ancestor of it.`);
  console.error('  Pass a dedicated dist-repo path (default ../client-adscheck).');
  process.exit(1);
}

// Completeness check BEFORE touching the target. Shell is the host (tree unservable
// without it); every remote must be built too. Missing dist usually means a partial
// build / `pnpm clean` — abort so the live deploy repo is not left half-updated.
const missing = [];
if (!existsSync(appDist('shell'))) missing.push('shell (host)');
for (const { name, segment } of remotes) {
  if (!existsSync(appDist(segment))) missing.push(`${name} (${segment}/)`);
}
if (missing.length) {
  console.error(`✗ assemble aborted: missing dist for ${missing.join(', ')}.`);
  console.error('  Build every app first (`pnpm build` with no --apps builds all).');
  console.error(`  ${TARGET} left untouched.`);
  process.exit(1);
}

// Mirror: wipe the target's published contents (keep .git) then copy fresh.
if (existsSync(TARGET)) {
  for (const entry of readdirSync(TARGET)) {
    if (entry === '.git') continue; // never touch the dist repo's git history
    rmSync(join(TARGET, entry), { recursive: true, force: true });
  }
} else {
  mkdirSync(TARGET, { recursive: true });
}

cpSync(appDist('shell'), TARGET, { recursive: true });
for (const { segment } of remotes) cpSync(appDist(segment), join(TARGET, segment), { recursive: true });

// SPA deep-link fallback: a Pages-style host serves 404.html for unknown paths.
copyFileSync(join(TARGET, 'index.html'), join(TARGET, '404.html'));

console.log(`✓ assemble: build output mirrored -> ${TARGET}`);
console.log('  Review, commit, and push from the dist repo to deploy.');
