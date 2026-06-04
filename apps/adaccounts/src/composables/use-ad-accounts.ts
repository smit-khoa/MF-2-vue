import { computed, ref } from 'vue';
import { MOCK_AD_ACCOUNTS } from '../data/mock-ad-accounts';
import type { AdAccount } from '../types/ad-account';

// Module-scoped state so the table and the tool panel share ONE selection set.
// State intentionally persists across navigation (the remote is an MF singleton),
// so leaving and returning to this app keeps the user's selection.
// Swap MOCK_AD_ACCOUNTS for an API call here later — the returned shape is stable.
const accounts = ref<AdAccount[]>(MOCK_AD_ACCOUNTS);
const selectedIds = ref<Set<string>>(new Set());

export function useAdAccounts() {
  const isSelected = (id: string) => selectedIds.value.has(id);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectedIds.value = next;
  };

  const allSelected = computed(
    () => accounts.value.length > 0 && selectedIds.value.size === accounts.value.length
  );

  const toggleSelectAll = () => {
    selectedIds.value = allSelected.value
      ? new Set()
      : new Set(accounts.value.map((a) => a.id));
  };

  const selectedCount = computed(() => selectedIds.value.size);

  const selectedAccounts = computed(() =>
    accounts.value.filter((a) => selectedIds.value.has(a.id))
  );

  return {
    accounts,
    selectedIds,
    isSelected,
    toggleSelect,
    allSelected,
    toggleSelectAll,
    selectedCount,
    selectedAccounts,
  };
}
