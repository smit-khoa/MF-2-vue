import apps from './owners.json' with { type: 'json' };
// Underscore MF name -> hyphen URL segment. Single source of truth, shared with the
// dist assembly + verification scripts so the served path can never drift from config.
import { toSegment } from '../../scripts/remote-segments.mjs';

export type AppName = keyof typeof apps;

export const app_names = Object.keys(apps) as AppName[];

const is_prod = process.env.NODE_ENV === 'production';
// Normalise to exactly one trailing slash so `${base_path}${segment}` never yields
// `//` or a missing separator regardless of how BASE_PATH was passed.
const base_path = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');

export const app_urls = Object.fromEntries(
  app_names.map((name) => {
    const env_key = `${name.toUpperCase()}_REMOTE_URL`;
    const override = process.env[env_key];
    if (override) return [name, override];
    // Prod serves every app from one origin: reference remotes by BASE_PATH-prefixed
    // relative path so the browser resolves them same-origin, independent of domain.
    if (is_prod) return [name, `${base_path}${toSegment(name)}`];
    // Dev keeps absolute localhost URLs — cross-port HMR needs them.
    const { host, port } = apps[name];
    return [name, `http://${host}:${port}`];
  }),
) as Record<AppName, string>;

export default app_urls;
