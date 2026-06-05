// Build wrapper: select which apps to build, then assemble the dist repo.
//   node scripts/build.mjs                       -> interactive picker (TTY) / all apps (non-TTY)
//   node scripts/build.mjs --apps adaccounts     -> one app    (--filter=@mf2/adaccounts)
//   node scripts/build.mjs --apps adaccounts,shell
//   node scripts/build.mjs --no-assemble         -> build only, skip the dist-repo assembly
// Shared packages are source-only (bundled into each app via workspace symlink), so
// there is no shared build target to select — turbo `^typecheck` orders types only.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkbox } from '@inquirer/prompts';
import { remoteNames, toSegment } from './remote-segments.mjs';

const CLIENT_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const argv = process.argv.slice(2);

const getFlag = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
};

const appsArg = getFlag('--apps');
const noAssemble = argv.includes('--no-assemble');

// Build target filters, resolved in priority order:
//   1. --apps a,b   -> exactly those apps (flag is an explicit intent; shell NOT forced)
//   2. interactive  -> TTY + no --apps: checkbox over remotes, shell always appended (host
//                      must be in the dist tree). Empty selection still builds shell.
//   3. fallback      -> non-TTY + no --apps (CI / piped): build everything, never block on a prompt.
let filters;
if (appsArg) {
  filters = appsArg.split(',').map((a) => `--filter=@mf2/${a.trim()}`);
} else if (process.stdout.isTTY) {
  let picked;
  try {
    picked = await checkbox({
      message: 'Chọn app build (shell luôn được build kèm):',
      choices: remoteNames.map((name) => ({ name, value: name })),
    });
  } catch {
    // @inquirer throws ExitPromptError on Ctrl-C — exit cleanly without a stack trace.
    process.exit(0);
  }
  // remoteNames carry the MF name (underscore, e.g. ads_manager); the package name uses
  // the hyphen segment (@mf2/ads-manager). Map through toSegment so the turbo filter matches.
  const selected = [...new Set([...picked.map(toSegment), 'shell'])];
  filters = selected.map((a) => `--filter=@mf2/${a}`);
} else {
  filters = ['--filter=./apps/*'];
}

const run = (cmd, args) => {
  const res = spawnSync(cmd, args, { cwd: CLIENT_ROOT, stdio: 'inherit' });
  if (res.status !== 0) process.exit(res.status ?? 1);
};

run('pnpm', ['exec', 'turbo', 'run', 'build', ...filters]);

if (!noAssemble) run('node', [join(CLIENT_ROOT, 'scripts', 'assemble-dist.mjs')]);
