declare module 'adaccounts/App' {
  import type { Component } from 'vue';
  const App: Component;
  export default App;
}

declare module 'ads_manager/App' {
  import type { Component } from 'vue';
  const App: Component;
  export default App;
}

declare module 'adaccounts/routes' {
  import type { RouteRecordRaw } from 'vue-router';
  const routes: RouteRecordRaw[];
  export default routes;
}

declare module 'ads_manager/routes' {
  import type { RouteRecordRaw } from 'vue-router';
  const routes: RouteRecordRaw[];
  export default routes;
}
