import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import AppLayout from '../components/AppLayout.vue';
import RemoteHost from '../components/RemoteHost.vue';
import NotFound from '../components/NotFound.vue';
import { installRemoteRoutes } from './remote-routes';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/app' },
  {
    path: '/app',
    component: AppLayout,
    children: [
      { path: '', redirect: '/app/adaccounts' },
      // Remote branches: named so the shell can addRoute children loaded from each
      // remote's exposed `./routes`. RemoteHost provides error boundary + Suspense;
      // the remote's own child routes render into its <router-view>.
      {
        path: 'adaccounts',
        name: 'remote-adaccounts',
        component: RemoteHost,
        props: { name: 'adaccounts' },
      },
      {
        path: 'ads-manager',
        name: 'remote-ads-manager',
        component: RemoteHost,
        props: { name: 'ads-manager' },
      },
      { path: ':pathMatch(.*)*', component: NotFound },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

installRemoteRoutes(router);
