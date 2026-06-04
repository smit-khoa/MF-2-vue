import type { RouteRecordRaw } from 'vue-router';

// Child routes mounted by the shell under `business/:bid/adaccounts`.
// Paths are relative to that parent. Components are lazy so the shell's
// RemoteErrorBoundary + Suspense can show fallbacks while the chunk loads.
const routes: RouteRecordRaw[] = [
  { path: '', component: () => import('../pages/AdAccountsPage.vue') },
];

export default routes;
