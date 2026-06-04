<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@mf2/shared-store';
import { Icon } from '@mf2/shared-ui';

const auth = useAuthStore();

const label = computed(() => {
  const onboarding = auth.onboarding;
  const in_trial =
    onboarding &&
    onboarding.earned_trial_days > 0 &&
    onboarding.earned_trial_days < onboarding.total_trial_days;
  const plan_name = auth.roles?.business_plan?.name;
  if (in_trial) {
    return `${onboarding!.earned_trial_days}/${onboarding!.total_trial_days}d`;
  }
  return plan_name
    ? plan_name.charAt(0).toUpperCase() + plan_name.slice(1)
    : 'Free';
});
</script>

<template>
  <div
    class="flex h-9 items-center gap-2 rounded-full border border-white/[0.05] bg-white/[0.02] pl-2 pr-3 transition-colors hover:bg-white/[0.05]"
    title="Gói cước hiện tại"
  >
    <span
      aria-hidden="true"
      class="flex h-5 w-5 items-center justify-center rounded-full bg-linear-to-br from-[#22c55e] to-[#14b8a6] text-[#0a1628]"
    >
      <Icon name="zap" :size="12" class="fill-current stroke-none" />
    </span>
    <span class="text-[12px] font-bold text-white/80">{{ label }}</span>
  </div>
</template>
