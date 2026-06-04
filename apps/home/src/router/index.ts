import type { RouteRecordRaw } from 'vue-router';

// Child routes mounted by the shell under `business/:bid/home`.
// Paths are relative to that parent. Components are lazy so the shell's
// RemoteErrorBoundary + Suspense can show fallbacks while the chunk loads.
const routes: RouteRecordRaw[] = [
  { path: '', component: () => import('../pages/HomePage.vue') },
];

export default routes;
