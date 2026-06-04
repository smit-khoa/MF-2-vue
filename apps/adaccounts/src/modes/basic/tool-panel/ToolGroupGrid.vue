<script setup lang="ts">
import { Icon } from '@mf2/shared-ui';
import { useToolActions } from '../../../composables/use-tool-actions';

const { groups, activeGroupId, selectGroup } = useToolActions();
</script>

<template>
  <div>
    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
      Nhóm chức năng
    </h3>
    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="group in groups"
        :key="group.id"
        type="button"
        class="flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-colors"
        :class="
          activeGroupId === group.id
            ? 'border-emerald-400/40 bg-emerald-500/15 text-white'
            : 'border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]'
        "
        @click="selectGroup(group.id)"
      >
        <Icon v-if="group.icon" :name="group.icon" :size="20" />
        <span class="text-xs font-medium">{{ group.label }}</span>
      </button>
    </div>
  </div>
</template>
