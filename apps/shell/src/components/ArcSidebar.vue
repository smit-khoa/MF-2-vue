<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore, useLayoutStore } from '@mf2/shared-store';
import { Icon, type IconName } from '@mf2/shared-ui';

interface NavItem {
  label: string;
  path: string;
  iconName: IconName;
  roles?: string[];
  feature?: string;
}

// Chỉ wire 2 remote hiện có (home, ads-asset). Các module khác chưa thuộc phạm vi.
const NAV_ITEMS: NavItem[] = [
  { label: 'Trang chủ', path: 'home', iconName: 'home' },
  {
    label: 'Tài sản QC',
    path: 'ads-asset',
    iconName: 'folder',
    roles: ['VIEW_ADACCOUNT'],
    feature: 'asset-manager',
  },
];

const PANEL_W = 256;
const ROW_H = 44;
const ROW_GAP = 4;
const ROW_PAD_X = 14;

const route = useRoute();
const auth = useAuthStore();
const layout = useLayoutStore();

const bid = computed(() => route.params.bid as string | undefined);
const isOpen = computed(() => layout.isSidebarOpen);

const items = computed(() =>
  NAV_ITEMS.map((item) => {
    const role_ok = !item.roles || item.roles.some((r) => auth.hasRole(r));
    const feat_ok = !item.feature || auth.hasFeature(item.feature);
    return { ...item, locked: !(role_ok && feat_ok) };
  })
);

// Đóng sidebar khi đổi route.
watch(
  () => route.path,
  () => layout.setSidebarOpen(false)
);

function rowStyle(i: number) {
  const delay = isOpen.value ? 70 + i * 35 : 0;
  return {
    height: `${ROW_H}px`,
    marginBottom: i < items.value.length - 1 ? `${ROW_GAP}px` : '0',
    transform: isOpen.value ? 'none' : 'translateX(-16px)',
    opacity: isOpen.value ? 1 : 0,
    transition: `opacity 0.4s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.45s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    paddingLeft: `${ROW_PAD_X}px`,
    paddingRight: `${ROW_PAD_X}px`,
  };
}
</script>

<template>
  <div class="pointer-events-none fixed inset-y-0 left-0 z-40">
    <div
      class="pointer-events-auto absolute left-5 top-[76px] origin-top-left overflow-visible rounded-3xl border border-white/[0.08] bg-[#0b1a2e]/70 p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
      :aria-hidden="!isOpen"
      :style="{
        width: `${PANEL_W}px`,
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.97)',
        transition: isOpen
          ? 'opacity 0.35s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.22,1,0.36,1)'
          : 'opacity 0.25s ease, transform 0.28s ease',
        pointerEvents: isOpen ? 'auto' : 'none',
      }"
    >
      <!-- Spine curve accent -->
      <svg
        aria-hidden="true"
        class="pointer-events-none absolute -left-[1px] top-4 bottom-4 h-[calc(100%-2rem)]"
        width="3"
        viewBox="0 0 3 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="arc-spine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#22c55e" stop-opacity="0" />
            <stop offset="40%" stop-color="#22c55e" stop-opacity="0.55" />
            <stop offset="60%" stop-color="#14b8a6" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#14b8a6" stop-opacity="0" />
          </linearGradient>
        </defs>
        <line x1="1.5" y1="0" x2="1.5" y2="100" stroke="url(#arc-spine)" stroke-width="1.5" />
      </svg>

      <nav class="relative flex flex-col">
        <template v-for="(item, i) in items" :key="item.path">
          <!-- Locked (thiếu quyền) -->
          <div
            v-if="item.locked"
            role="button"
            aria-disabled="true"
            :title="`${item.label} — chưa được cấp quyền`"
            class="group relative flex items-center gap-3 rounded-2xl border border-transparent text-white/35"
            :style="{ ...rowStyle(i), cursor: 'not-allowed' }"
          >
            <span class="relative flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.05] bg-white/[0.02] opacity-70">
              <Icon :name="item.iconName" :size="18" />
            </span>
            <span class="flex-1 truncate text-[13px] font-medium">{{ item.label }}</span>
            <span
              aria-hidden="true"
              class="flex h-5 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-1.5 text-[10px] font-medium tracking-wide text-white/40"
            >
              <Icon name="shield" :size="12" />
              KHÓA
            </span>
          </div>

          <!-- Active nav link -->
          <router-link
            v-else
            :to="`/business/${bid}/${item.path}`"
            custom
            v-slot="{ href, navigate, isActive }"
          >
            <a
              :href="href"
              class="group relative flex items-center gap-3 rounded-2xl border transition-[background,border-color,color] duration-200"
              :class="
                isActive
                  ? 'border-[#22c55e]/40 bg-[#22c55e]/12 text-white'
                  : 'border-transparent text-white/70 hover:border-white/[0.1] hover:bg-white/[0.04] hover:text-white'
              "
              :style="rowStyle(i)"
              @click="navigate"
            >
              <span
                aria-hidden="true"
                class="absolute left-1 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.7)] transition-opacity"
                :style="{ opacity: isActive ? 1 : 0 }"
              />
              <span
                class="relative flex h-7 w-7 items-center justify-center rounded-full border transition-colors"
                :class="
                  isActive
                    ? 'border-[#22c55e]/50 bg-[#22c55e]/15'
                    : 'border-white/[0.08] bg-white/[0.03] group-hover:border-white/15 group-hover:bg-white/[0.06]'
                "
              >
                <Icon :name="item.iconName" :size="18" />
              </span>
              <span class="flex-1 truncate text-[13px] font-medium">{{ item.label }}</span>
              <Icon
                name="chevron-right"
                :size="14"
                class="-translate-x-1 text-white/30 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
              />
            </a>
          </router-link>
        </template>
      </nav>
    </div>
  </div>
</template>
