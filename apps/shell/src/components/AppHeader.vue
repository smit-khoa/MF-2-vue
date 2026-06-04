<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useLayoutStore } from '@mf2/shared-store';
import { SmitLogo } from '@mf2/shared-ui';
import PlanPill from './header/PlanPill.vue';
import NotificationsButton from './header/NotificationsButton.vue';
import BusinessDropdown from './header/BusinessDropdown.vue';
import UserDropdown from './header/UserDropdown.vue';

const route = useRoute();
const layout = useLayoutStore();

const bid = computed(() => route.params.bid as string | undefined);

const routeTitle = computed(() => {
  const p = route.path;
  if (p.includes('/ads-asset')) return 'Quản lý tài sản';
  if (p.includes('/home')) return '';
  return '';
});

const title = computed(() => layout.title || routeTitle.value);
const isSidebarOpen = computed(() => layout.isSidebarOpen);
</script>

<template>
  <header
    class="pointer-events-none fixed left-0 right-0 top-0 z-30 flex h-20 items-center justify-between px-5"
  >
    <div class="pointer-events-auto flex items-center gap-3">
      <!-- Sidebar trigger + logo -->
      <div
        class="flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.05] p-1 shadow-[0_14px_40px_-10px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      >
        <router-link
          :to="bid ? `/business/${bid}/home` : '/'"
          class="group flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-white/[0.05]"
          aria-label="Về Trang chủ"
        >
          <SmitLogo :width="22" :height="17" />
          <span class="text-[13px] font-semibold tracking-tight text-white/90 whitespace-nowrap">
            SMIT AGENCY
          </span>
        </router-link>
        <span class="h-5 w-px bg-white/10" />
        <button
          type="button"
          class="relative flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/[0.07]"
          @mousedown.stop
          @click="layout.setSidebarOpen(!isSidebarOpen)"
        >
          <span
            aria-hidden="true"
            class="relative flex h-3.5 w-[18px] flex-col items-center justify-center gap-[3px]"
          >
            <span
              class="block h-[1.5px] w-full origin-center rounded-full bg-current transition-all duration-500"
              :style="{ transform: isSidebarOpen ? 'translateY(4.5px) rotate(45deg)' : 'none' }"
            />
            <span
              class="block h-[1.5px] w-[70%] origin-center rounded-full bg-current transition-all duration-300"
              :style="{
                opacity: isSidebarOpen ? 0 : 1,
                transform: isSidebarOpen ? 'translateX(-5px)' : 'none',
              }"
            />
            <span
              class="block h-[1.5px] w-full origin-center rounded-full bg-current transition-all duration-500"
              :style="{ transform: isSidebarOpen ? 'translateY(-4.5px) rotate(-45deg)' : 'none' }"
            />
          </span>
        </button>
      </div>

      <!-- Dynamic title -->
      <div v-if="title" class="flex items-center gap-3 ml-2">
        <div
          class="h-6 w-[2px] bg-gradient-to-b from-[#22c55e] to-transparent rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"
        />
        <h2 class="text-[18px] font-bold tracking-tight text-white/90 uppercase whitespace-nowrap">
          {{ title }}
        </h2>
      </div>
    </div>

    <div
      class="pointer-events-auto flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#0b1421]/60 p-1 backdrop-blur-2xl shadow-[0_8px_32px_-10px_rgba(0,0,0,0.5)] transition-all"
    >
      <PlanPill />
      <div class="h-4 w-px bg-white/10 mx-1" />
      <NotificationsButton />
      <BusinessDropdown />
      <UserDropdown />
    </div>
  </header>
</template>
