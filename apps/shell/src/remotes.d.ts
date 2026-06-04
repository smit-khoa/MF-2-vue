declare module 'home/App' {
  import type { Component } from 'vue';
  const App: Component;
  export default App;
}

declare module 'ads_asset/App' {
  import type { Component } from 'vue';
  const App: Component;
  export default App;
}

declare module 'home/routes' {
  import type { RouteRecordRaw } from 'vue-router';
  const routes: RouteRecordRaw[];
  export default routes;
}

declare module 'ads_asset/routes' {
  import type { RouteRecordRaw } from 'vue-router';
  const routes: RouteRecordRaw[];
  export default routes;
}
