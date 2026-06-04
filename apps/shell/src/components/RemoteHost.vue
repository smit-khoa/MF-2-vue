<script setup lang="ts">
import { RemoteErrorBoundary, RemoteLoadingFallback } from '@mf2/shared-ui';

// Host layout for a remote branch: catches remote load errors, shows a Suspense
// fallback, and renders the remote's child routes via <router-view>. Child routes
// are injected by the shell router from the remote's exposed `./routes`
// (see router/remote-routes.ts).
defineProps<{
  name: string;
}>();
</script>

<template>
  <RemoteErrorBoundary :name="name" v-slot="{ retryKey }">
    <!-- retryKey remounts the subtree (reloads the remote) when the user hits Retry. -->
    <Suspense :key="retryKey">
      <router-view />
      <template #fallback>
        <RemoteLoadingFallback :name="name" />
      </template>
    </Suspense>
  </RemoteErrorBoundary>
</template>
