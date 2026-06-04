<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useModeStore } from '../stores/mode-store';
import BasicModeView from '../modes/basic/BasicModeView.vue';
import AdvancedModePlaceholder from '../modes/advanced/AdvancedModePlaceholder.vue';
// Federated chunk carries Tailwind utilities (no preflight) so classes render
// correctly when this page is mounted inside the host.
import '../remote-styles.css';

// Mode is a runtime toggle (same URL): basic and advanced share the same business
// logic in composables, only the presentation layer differs.
const { mode } = storeToRefs(useModeStore());
</script>

<template>
  <BasicModeView v-if="mode === 'basic'" />
  <AdvancedModePlaceholder v-else />
</template>
