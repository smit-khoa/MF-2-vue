<script setup lang="ts">
import { Icon } from '@mf2/shared-ui';

// Lightweight demo feedback: shows which function ran on how many accounts.
// Prototype-only — no real action is performed.
defineProps<{ message: string | null }>();
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-3 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-3 opacity-0"
  >
    <div
      v-if="message"
      class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
      role="status"
    >
      <div
        class="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/15 px-4 py-2.5 text-sm font-medium text-emerald-100 shadow-lg backdrop-blur-md"
      >
        <Icon name="check-circle" :size="18" />
        <span>{{ message }}</span>
      </div>
    </div>
  </Transition>
</template>
