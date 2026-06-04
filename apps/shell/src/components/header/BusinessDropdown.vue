<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@mf2/shared-store';
import { Icon } from '@mf2/shared-ui';
import { useClickOutside } from '../../composables/use-click-outside';
import DropdownPanel from './DropdownPanel.vue';

const auth = useAuthStore();
const isOpen = ref(false);
const root = ref<HTMLElement | null>(null);
useClickOutside(root, () => (isOpen.value = false));

const businessName = (b: Record<string, unknown>) =>
  (b.name as string) || (b.business_name as string) || 'Không tên';

const currentName = computed(() => {
  const c = auth.current_business as Record<string, unknown> | null;
  return (c?.name as string) || (c?.business_name as string) || 'Chọn DN';
});

function select(b: (typeof auth.businesses)[number]) {
  auth.setCurrentBusiness(b);
  isOpen.value = false;
}
</script>

<template>
  <div v-if="auth.businesses.length > 0" ref="root" class="relative">
    <button
      type="button"
      class="flex h-9 max-w-[200px] items-center gap-2 rounded-full border border-white/[0.05] bg-white/[0.02] pl-1.5 pr-2.5 transition-all hover:bg-white/5 active:scale-95"
      @click="isOpen = !isOpen"
    >
      <span
        aria-hidden="true"
        class="flex h-6 w-6 items-center justify-center rounded-full bg-[#22c55e]/20 text-[10px] font-bold text-[#4ade80]"
      >
        {{ currentName.slice(0, 1).toUpperCase() }}
      </span>
      <span class="max-w-[120px] truncate text-[12.5px] font-bold text-white/70">
        {{ currentName }}
      </span>
      <Icon
        name="chevron-down"
        :size="12"
        class="text-white/20 transition-transform duration-200"
        :class="isOpen ? 'rotate-180' : ''"
      />
    </button>
    <DropdownPanel v-if="isOpen" :width="280">
      <div class="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white/30">
        Doanh nghiệp ({{ auth.businesses.length }})
      </div>
      <div class="flex flex-col gap-1 max-h-[320px] overflow-y-auto px-1">
        <button
          v-for="b in auth.businesses"
          :key="b.business_id"
          type="button"
          class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all"
          :class="
            b.business_id === auth.current_business?.business_id
              ? 'bg-[#22c55e]/15 text-white'
              : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
          "
          @click="select(b)"
        >
          <span
            aria-hidden="true"
            class="h-1.5 w-1.5 rounded-full"
            :style="{ background: b.is_owned ? '#22c55e' : '#64748b' }"
          />
          <span class="flex-1 truncate text-[13px] font-bold">{{ businessName(b as any) }}</span>
          <Icon
            v-if="b.business_id === auth.current_business?.business_id"
            name="check"
            :size="16"
            class="text-[#22c55e]"
          />
        </button>
      </div>
    </DropdownPanel>
  </div>
</template>
