<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@mf2/shared-store';
import { RemoteErrorBoundary, RemoteLoadingFallback } from '@mf2/shared-ui';

// Host layout for a remote branch: gates by role/feature, catches remote load
// errors, shows a Suspense fallback, and renders the remote's child routes via
// <router-view>. Child routes are injected by the shell router from the remote's
// exposed `./routes` (see router/remote-routes.ts).
const props = defineProps<{
  name: string;
  roles?: string[];
  feature?: string;
}>();

const auth = useAuthStore();

const allowed = computed(() => {
  if (props.roles && !props.roles.some((r) => auth.hasRole(r))) return false;
  if (props.feature && !auth.hasFeature(props.feature)) return false;
  return true;
});
</script>

<template>
  <div v-if="!allowed" class="flex h-full items-center justify-center py-20">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-400">403</h1>
      <p class="mt-2 text-gray-500">Bạn không có quyền truy cập tính năng này.</p>
    </div>
  </div>
  <RemoteErrorBoundary v-else :name="name" v-slot="{ retryKey }">
    <!-- retryKey remounts the subtree (reloads the remote) when the user hits Retry. -->
    <Suspense :key="retryKey">
      <router-view />
      <template #fallback>
        <RemoteLoadingFallback :name="name" />
      </template>
    </Suspense>
  </RemoteErrorBoundary>
</template>
