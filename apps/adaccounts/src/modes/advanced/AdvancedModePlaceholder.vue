<script setup lang="ts">
import { Icon } from '@mf2/shared-ui';
import { useModeStore } from '../../stores/mode-store';

const mode = useModeStore();
</script>

<template>
  <div class="flex h-full items-center justify-center p-4">
    <div class="max-w-md text-center">
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
        <Icon name="bolt" :size="28" class="text-emerald-300" />
      </div>
      <h1 class="mt-4 text-xl font-bold text-white">Chế độ nâng cao</h1>
      <p class="mt-2 text-sm text-white/50">
        Chế độ nâng cao đang được phát triển. Bao gồm tự động hóa (automation) cho các thao tác TKQC.
      </p>
      <button
        type="button"
        class="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.08]"
        @click="mode.setMode('basic')"
      >
        <Icon name="arrow-left" :size="16" />
        <span>Quay lại chế độ cơ bản</span>
      </button>
    </div>
  </div>
</template>
