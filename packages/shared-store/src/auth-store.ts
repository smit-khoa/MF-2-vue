import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  User,
  Business,
  BusinessRole,
  OnboardingProgress,
} from "@mf2/shared-types";
import { api, ApiError, setUnauthorizedHandler } from "./api-client";

declare const __DASHBOARD_URL__: string;
const DASHBOARD_URL =
  typeof __DASHBOARD_URL__ !== "undefined"
    ? __DASHBOARD_URL__
    : "https://dashboard.smit.vn";
const STORAGE_KEY = "mf2_current_business";

// Module-level guard ngăn initialize() chạy trùng (giữ semantics bản gốc).
let initialize_promise: Promise<void> | null = null;

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const businesses = ref<Business[]>([]);
  const current_business = ref<Business | null>(null);
  const roles = ref<BusinessRole | null>(null);
  const onboarding = ref<OnboardingProgress | null>(null);
  const is_loading = ref(true);
  const is_authenticated = ref(false);
  // Set when auth init fails for a transient reason (network/timeout). Lets the UI
  // offer a retry instead of redirecting to login as if the user were logged out.
  const auth_error = ref(false);

  // Aborts the previous business switch so a slow stale response can't overwrite the
  // roles/onboarding of the business the user just switched to.
  let business_switch_controller: AbortController | null = null;

  async function checkAuth() {
    try {
      const data = await api<{ user: User }>({ url: "/public/authentication" });
      user.value = data.user;
      is_authenticated.value = true;
    } catch (err) {
      // A transient outage is NOT a logged-out state — rethrow so initialize() can
      // surface a retryable error instead of bouncing the user to the signin page.
      if (err instanceof ApiError && err.is_transient) throw err;
      user.value = null;
      is_authenticated.value = false;
    }
  }

  async function fetchBusinesses() {
    try {
      const data = await api<{ data: Business[] }>({
        url: "/gate/me/businesses",
        params: { page: "1", limit: "100", business_type: "2" },
      });
      businesses.value = data.data || [];
    } catch {
      businesses.value = [];
    }
  }

  async function fetchBusinessRoles(business_id: string, signal?: AbortSignal) {
    try {
      // API trả thẳng object (không wrap `.data`)
      const data = await api<BusinessRole & { success?: boolean }>({
        url: `/gate/${business_id}/me`,
        signal,
      });
      roles.value = data;
    } catch (err) {
      // An aborted request means a newer switch superseded this one — leave its state alone.
      if (err instanceof ApiError && err.kind === "aborted") return;
      roles.value = null;
    }
  }

  async function fetchOnboardingProgress(
    business_id: string,
    signal?: AbortSignal
  ) {
    try {
      const data = await api<{
        success: boolean;
        features: OnboardingProgress["features"];
        earned_trial_days: number;
      }>({
        url: `/gate/${business_id}/feature-onboarding-progress`,
        method: "POST",
        data: {},
        signal,
      });
      if (data.success) {
        const features = data.features || [];
        const total_trial_days =
          1 + features.reduce((sum, f) => sum + (f.reward_days || 0), 0);
        onboarding.value = {
          features,
          earned_trial_days: data.earned_trial_days || 0,
          total_trial_days,
        };
      }
    } catch (err) {
      if (err instanceof ApiError && err.kind === "aborted") return;
      onboarding.value = null;
    }
  }

  function setCurrentBusiness(business: Business) {
    localStorage.setItem(STORAGE_KEY, business.business_id);
    current_business.value = business;
    roles.value = null;
    onboarding.value = null;
    // Cancel any in-flight requests from a previous switch before starting new ones.
    business_switch_controller?.abort();
    const controller = new AbortController();
    business_switch_controller = controller;
    void fetchBusinessRoles(business.business_id, controller.signal);
    void fetchOnboardingProgress(business.business_id, controller.signal);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    initialize_promise = null;
    user.value = null;
    businesses.value = [];
    current_business.value = null;
    roles.value = null;
    onboarding.value = null;
    is_authenticated.value = false;
    window.location.href = `${DASHBOARD_URL}/signin?referer=${encodeURIComponent(
      window.location.href
    )}`;
  }

  // Getter trả function để gọi reactive: store.hasRole('X')
  const hasRole = computed(() => (role: string) => {
    if (!roles.value) return false;
    if (roles.value.is_full_permission || roles.value.is_owner) return true;
    return roles.value.roles?.includes(role) ?? false;
  });

  const hasFeature = computed(() => (key: string) => {
    if (!roles.value) return false;
    if (roles.value.is_full_permission || roles.value.is_owner) return true;
    return roles.value.business_features?.[key] != null;
  });

  async function initialize() {
    // Return the already-settled-or-pending guard. It never rejects (failures are
    // swallowed below), so concurrent callers from multiple mounts can't get an
    // unhandled rejection.
    if (initialize_promise) return initialize_promise;
    auth_error.value = false;

    const run = (async () => {
      is_loading.value = true;
      try {
        await checkAuth();
        if (!is_authenticated.value) return;

        await fetchBusinesses();

        // Restore saved business or pick first
        const saved_id = localStorage.getItem(STORAGE_KEY);
        const saved_business = businesses.value.find(
          (b) => b.business_id === saved_id
        );
        const target = saved_business || businesses.value[0];

        if (target) {
          current_business.value = target;
          localStorage.setItem(STORAGE_KEY, target.business_id);
          // Route the initial load through the switch controller so a fast switch to
          // another business can abort it — otherwise a late initial response could
          // overwrite the freshly switched business's roles/onboarding.
          business_switch_controller?.abort();
          const controller = new AbortController();
          business_switch_controller = controller;
          await Promise.all([
            fetchBusinessRoles(target.business_id, controller.signal),
            fetchOnboardingProgress(target.business_id, controller.signal),
          ]);
        }
      } catch (err) {
        // Transient failure: flag it so the UI can offer a retry. Clear the cached
        // promise so a later initialize() re-runs instead of replaying the failure.
        if (err instanceof ApiError && err.is_transient) auth_error.value = true;
        initialize_promise = null;
      } finally {
        is_loading.value = false;
      }
    })();

    initialize_promise = run;
    return run;
  }

  // Centralized 401: any expired-session response triggers exactly one logout.
  setUnauthorizedHandler(() => logout());

  return {
    user,
    businesses,
    current_business,
    roles,
    onboarding,
    is_loading,
    is_authenticated,
    auth_error,
    checkAuth,
    fetchBusinesses,
    fetchBusinessRoles,
    fetchOnboardingProgress,
    setCurrentBusiness,
    logout,
    hasRole,
    hasFeature,
    initialize,
  };
});
