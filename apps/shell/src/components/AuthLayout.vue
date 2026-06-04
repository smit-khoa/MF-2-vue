<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@mf2/shared-store';

const auth = useAuthStore();
const { is_loading, is_authenticated, businesses, auth_error } = storeToRefs(auth);
const route = useRoute();
const router = useRouter();

// Chặn gọi logout()/replace lặp lại sau khi đã trigger điều hướng full-page.
let redirecting = false;

onMounted(() => {
  auth.initialize();
});

// Sau khi auth resolve: chưa đăng nhập → logout (redirect dashboard).
// Có/không doanh nghiệp sở hữu → điều hướng introduction tương ứng.
function evaluateRedirect() {
  if (is_loading.value || redirecting) return;

  // Transient init failure (network/timeout): show retry instead of logging the user out.
  if (auth_error.value) return;

  if (!is_authenticated.value) {
    redirecting = true;
    auth.logout();
    return;
  }

  const has_owned = businesses.value.some((b) => b.is_owned);

  // Chưa có doanh nghiệp sở hữu → màn khởi tạo.
  if (!has_owned) {
    if (route.path !== '/introduction') router.replace('/introduction');
    return;
  }

  // Có doanh nghiệp sở hữu nhưng đang ở introduction → về root.
  if (route.path === '/introduction') {
    router.replace('/');
    return;
  }

  // Root catch-all: đưa vào business home nếu có current_business,
  // ngược lại về introduction (không bao giờ kẹt màn trắng ở '/').
  if (route.path === '/') {
    const current = auth.current_business;
    router.replace(current ? `/business/${current.business_id}/home` : '/introduction');
  }
}

watch([is_loading, is_authenticated, businesses, () => route.path], evaluateRedirect, {
  immediate: true,
});

function retryInit() {
  auth.initialize();
}
</script>

<template>
  <template v-if="!is_loading">
    <div
      v-if="auth_error"
      class="flex h-[100dvh] flex-col items-center justify-center gap-4 text-white"
    >
      <p class="text-white/70">Không kết nối được máy chủ.</p>
      <button
        type="button"
        class="rounded bg-[#22c55e] px-4 py-2 text-sm font-semibold text-[#0a1628] hover:bg-[#16a34a]"
        @click="retryInit"
      >
        Thử lại
      </button>
    </div>
    <router-view v-else />
  </template>
</template>
