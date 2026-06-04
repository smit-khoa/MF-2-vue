import { defineStore } from 'pinia';
import { ref } from 'vue';

export type AdAccountsMode = 'basic' | 'advanced';

// Remote-local store: which UI mode the adaccounts remote renders. Runtime toggle
// (same URL) — basic and advanced share the same business logic in composables,
// only the presentation layer differs.
export const useModeStore = defineStore('adaccounts-mode', () => {
  const mode = ref<AdAccountsMode>('basic');

  const setMode = (value: AdAccountsMode) => {
    mode.value = value;
  };

  const toggle = () => {
    mode.value = mode.value === 'basic' ? 'advanced' : 'basic';
  };

  return { mode, setMode, toggle };
});
