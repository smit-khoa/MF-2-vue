<script setup lang="ts">
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@mf2/shared-store';
import BackgroundAtmosphere from './BackgroundAtmosphere.vue';
import AppHeader from './AppHeader.vue';
import ArcSidebar from './ArcSidebar.vue';

const route = useRoute();
const auth = useAuthStore();

// Sync URL bid với store (giữ semantics bản React: re-run khi businesses load sau deep-link).
watch(
  [() => route.params.bid, () => auth.businesses],
  ([bid]) => {
    if (typeof bid === 'string' && bid !== auth.current_business?.business_id) {
      const biz = auth.businesses.find((b) => b.business_id === bid);
      if (biz) auth.setCurrentBusiness(biz);
    }
  },
  { immediate: true }
);
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
