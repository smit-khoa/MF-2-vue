import apps from './owners.json' with { type: 'json' };

export type AppName = keyof typeof apps;

export const app_names = Object.keys(apps) as AppName[];

export const app_urls = Object.fromEntries(
  app_names.map((name) => {
    const env_key = `${name.toUpperCase()}_REMOTE_URL`;
    const { host, port } = apps[name];
    return [name, process.env[env_key] || `http://${host}:${port}`];
  }),
) as Record<AppName, string>;

export default app_urls;
