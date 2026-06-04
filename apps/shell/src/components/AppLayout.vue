<script setup lang="ts">
import BackgroundAtmosphere from './BackgroundAtmosphere.vue';
import AppHeader from './AppHeader.vue';
import ArcSidebar from './ArcSidebar.vue';

// Prototype layout: no auth, no business context. Renders the app chrome
// (background + header + sidebar) around the remote routes mounted under /app.
</script>

<template>
  <div class="relative h-[100dvh] overflow-hidden text-white flex flex-col">
    <BackgroundAtmosphere />
    <AppHeader />
    <ArcSidebar />
    <main
      class="relative z-10 flex-1 min-h-0 px-4 pt-[80px] pb-4 flex flex-col overflow-hidden"
      :style="{ animation: 'content-fade 0.5s ease-out both' }"
    >
      <div class="flex-1 min-h-0">
        <router-view />
      </div>
    </main>
  </div>
</template>
