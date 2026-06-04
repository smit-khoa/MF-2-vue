<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@mf2/shared-ui';
import ToolGroupGrid from './ToolGroupGrid.vue';
import ToolFunctionGrid from './ToolFunctionGrid.vue';
import { useModeStore } from '../../../stores/mode-store';
import { useAdAccounts } from '../../../composables/use-ad-accounts';
import type { DemoActionResult } from '../../../composables/use-tool-actions';

const mode = useModeStore();
const { selectedCount } = useAdAccounts();

// Demo-only toast feedback. Emits up to the basic view which renders the toast.
const emit = defineEmits<{ action: [message: string] }>();

const noSelection = ref(false);

function onAction(result: DemoActionResult) {
  if (result.count === 0) {
    noSelection.value = true;
    setTimeout(() => (noSelection.value = false), 2000);
    return;
  }
  emit('action', `Đã chọn ${result.count} TKQC · ${result.functionLabel}`);
}
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
    <div class="border-b border-white/10 px-4 py-3">
      <h2 class="text-sm font-semibold text-white">Công cụ thao tác</h2>
      <p class="mt-0.5 text-xs text-white/50">Áp dụng cho {{ selectedCount }} TKQC đã chọn</p>
    </div>

    <div class="min-h-0 flex-1 space-y-4 overflow-auto px-4 py-4">
      <ToolGroupGrid />
      <ToolFunctionGrid @action="onAction" />

      <p v-if="noSelection" class="text-center text-xs text-amber-300">
        Vui lòng chọn ít nhất 1 TKQC trước khi thao tác.
      </p>
    </div>

    <div class="border-t border-white/10 p-3">
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500/90 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
        @click="mode.setMode('advanced')"
      >
        <span>Chuyển sang chế độ nâng cao</span>
        <Icon name="arrow-right" :size="16" />
      </button>
    </div>
  </div>
</template>
