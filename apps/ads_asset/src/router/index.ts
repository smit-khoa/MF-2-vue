import type { RouteRecordRaw } from 'vue-router';

// Child routes mounted by the shell under `business/:bid/ads-asset`.
// Paths are relative to that parent. Host-side gating (role/feature) wraps this
// branch; routes are registered regardless so matching works, render is gated.
const routes: RouteRecordRaw[] = [
  { path: '', component: () => import('../pages/AdsAssetPage.vue') },
];

export default routes;
