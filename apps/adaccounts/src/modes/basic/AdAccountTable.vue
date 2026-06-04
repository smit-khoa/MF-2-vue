<script setup lang="ts">
import { useAdAccounts } from '../../composables/use-ad-accounts';
import type { AdAccountStatus } from '../../types/ad-account';

const { accounts, isSelected, toggleSelect, allSelected, toggleSelectAll, selectedCount } =
  useAdAccounts();

const STATUS_META: Record<AdAccountStatus, { label: string; class: string }> = {
  active: { label: 'Đang chạy', class: 'bg-emerald-500/15 text-emerald-300' },
  paused: { label: 'Tạm dừng', class: 'bg-amber-500/15 text-amber-300' },
  disabled: { label: 'Vô hiệu', class: 'bg-white/10 text-white/50' },
};

const formatBudget = (value: number, currency: string) =>
  value === 0 ? '—' : `${value.toLocaleString('vi-VN')} ${currency}`;
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
    <!-- Header bar -->
    <div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
      <h2 class="text-sm font-semibold text-white">Danh sách tài khoản quảng cáo</h2>
      <span class="text-xs text-white/50">Đã chọn {{ selectedCount }}/{{ accounts.length }}</span>
    </div>

    <!-- Scrollable table -->
    <div class="min-h-0 flex-1 overflow-auto">
      <table class="w-full border-collapse text-left text-sm">
        <thead class="sticky top-0 z-10 bg-[#0b1a2e] text-xs uppercase tracking-wide text-white/50">
          <tr>
            <th class="w-10 px-4 py-2.5">
              <input
                type="checkbox"
                class="h-4 w-4 cursor-pointer accent-emerald-500"
                :checked="allSelected"
                @change="toggleSelectAll"
              />
            </th>
            <th class="px-3 py-2.5 font-medium">Tên tài khoản</th>
            <th class="px-3 py-2.5 font-medium">Trạng thái</th>
            <th class="px-3 py-2.5 text-right font-medium">Ngân sách/ngày</th>
            <th class="px-3 py-2.5 font-medium">ID</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="acc in accounts"
            :key="acc.id"
            class="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.04]"
            :class="isSelected(acc.id) ? 'bg-emerald-500/10' : ''"
            @click="toggleSelect(acc.id)"
          >
            <td class="px-4 py-2.5" @click.stop>
              <input
                type="checkbox"
                class="h-4 w-4 cursor-pointer accent-emerald-500"
                :checked="isSelected(acc.id)"
                @change="toggleSelect(acc.id)"
              />
            </td>
            <td class="px-3 py-2.5 font-medium text-white/90">{{ acc.name }}</td>
            <td class="px-3 py-2.5">
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                :class="STATUS_META[acc.status].class"
              >
                {{ STATUS_META[acc.status].label }}
              </span>
            </td>
            <td class="px-3 py-2.5 text-right tabular-nums text-white/80">
              {{ formatBudget(acc.budget, acc.currency) }}
            </td>
            <td class="px-3 py-2.5 font-mono text-xs text-white/40">{{ acc.id }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
