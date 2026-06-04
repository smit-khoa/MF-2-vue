import { computed, ref } from 'vue';
import { TOOL_GROUPS } from '../data/mock-tool-groups';
import type { AdAccount, ToolFunction } from '../types/ad-account';

export interface DemoActionResult {
  functionLabel: string;
  count: number;
}

// Module-scoped so the group grid and function grid agree on the active group.
const activeGroupId = ref<string | null>(null);

export function useToolActions() {
  const groups = TOOL_GROUPS;

  const selectGroup = (id: string) => {
    activeGroupId.value = activeGroupId.value === id ? null : id;
  };

  const activeGroup = computed(
    () => groups.find((g) => g.id === activeGroupId.value) ?? null
  );

  // Prototype: no real side effect — return a payload the view shows as a toast.
  const runFunction = (fn: ToolFunction, selected: AdAccount[]): DemoActionResult => ({
    functionLabel: fn.label,
    count: selected.length,
  });

  return { groups, activeGroupId, selectGroup, activeGroup, runFunction };
}
