import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import AuthLayout from '../components/AuthLayout.vue';
import BusinessLayout from '../components/BusinessLayout.vue';
import RemoteHost from '../components/RemoteHost.vue';
import NotFound from '../components/NotFound.vue';
import CreateBusiness from '../pages/CreateBusiness.vue';
import QuickLogin from '../pages/QuickLogin.vue';
import { installRemoteRoutes } from './remote-routes';

const routes: RouteRecordRaw[] = [
  // Public route — no auth required
  { path: '/quick-login', component: QuickLogin },

  // Protected tree — AuthLayout gates auth + introduction redirects
  {
    path: '/',
    component: AuthLayout,
    children: [
      { path: 'introduction', component: CreateBusiness },
      {
        path: 'business/:bid',
        component: BusinessLayout,
        children: [
          { path: '', redirect: (to) => `/business/${to.params.bid}/home` },
          // Remote branches: named so the shell can addRoute children loaded from each
          // remote's exposed `./routes`. RemoteHost provides gating + error boundary +
          // Suspense; the remote's own child routes render into its <router-view>.
          {
            path: 'home',
            name: 'remote-home',
            component: RemoteHost,
            props: { name: 'home' },
          },
          {
            path: 'ads-asset',
            name: 'remote-ads-asset',
            component: RemoteHost,
            props: { name: 'ads-asset', roles: ['VIEW_ADACCOUNT'], feature: 'asset-manager' },
          },
          { path: ':pathMatch(.*)*', component: NotFound },
        ],
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

installRemoteRoutes(router);
