<script setup lang="ts">
import { Icon } from '@mf2/shared-ui';
import { useToolActions, type DemoActionResult } from '../../../composables/use-tool-actions';
import { useAdAccounts } from '../../../composables/use-ad-accounts';

const emit = defineEmits<{ action: [result: DemoActionResult] }>();

const { activeGroup, runFunction } = useToolActions();
const { selectedAccounts } = useAdAccounts();

function onRun(functionId: string) {
  const fn = activeGroup.value?.functions.find((f) => f.id === functionId);
  if (!fn) return;
  emit('action', runFunction(fn, selectedAccounts.value));
}
</script>

<template>
  <div>
    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Chức năng</h3>

    <p
      v-if="!activeGroup"
      class="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-white/40"
    >
      Chọn một nhóm chức năng ở trên để xem các thao tác.
    </p>

    <div v-else class="grid grid-cols-2 gap-2">
      <button
        v-for="fn in activeGroup.functions"
        :key="fn.id"
        type="button"
        class="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-xs font-medium text-white/80 transition-colors hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-white"
        @click="onRun(fn.id)"
      >
        <Icon v-if="fn.icon" :name="fn.icon" :size="16" />
        <span>{{ fn.label }}</span>
      </button>
    </div>
  </div>
</template>
