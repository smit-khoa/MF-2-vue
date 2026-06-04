<script setup lang="ts">
import { ref } from 'vue';
import AdAccountTable from './AdAccountTable.vue';
import ToolPanel from './tool-panel/ToolPanel.vue';
import DemoActionToast from '../../components/DemoActionToast.vue';

const toastMessage = ref<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | undefined;

function showToast(message: string) {
  toastMessage.value = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastMessage.value = null), 2600);
}
</script>

<template>
  <div class="h-full p-4">
    <!-- Table 3/4 (left) + tool panel 1/4 (right) -->
    <div class="grid h-full grid-cols-4 gap-4">
      <div class="col-span-3 min-h-0">
        <AdAccountTable />
      </div>
      <div class="col-span-1 min-h-0">
        <ToolPanel @action="showToast" />
      </div>
    </div>

    <DemoActionToast :message="toastMessage" />
  </div>
</template>
