// Verifies `assemble-dist.mjs` produced a complete same-origin tree in the dist repo:
// shell at root, each remote nested under its hyphenated segment, SPA 404 fallback.
// Target defaults to the sibling ../client-adscheck (override via argv[2] or DIST_TARGET).
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { remotes } from './remote-segments.mjs';

const CLIENT_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const argTarget = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : undefined;
const TARGET = resolve(argTarget || process.env.DIST_TARGET || join(CLIENT_ROOT, '..', 'client-adscheck'));

const failures = [];
const must = (rel) => {
  if (!existsSync(join(TARGET, rel))) failures.push(`missing ${rel}`);
};

// Shell at the dist-repo root.
must('index.html');
must('mf-manifest.json');
// SPA deep-link fallback (Pages-style hosts serve 404.html for unknown paths).
must('404.html');
// Each remote nested under its hyphen segment with its own manifest.
for (const { segment } of remotes) must(join(segment, 'mf-manifest.json'));

if (failures.length) {
  console.error(`✗ verify-dist-assembly FAILED (${failures.length}) in ${TARGET}:`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(`✓ verify-dist-assembly PASSED — ${TARGET} complete`);
