// Auth & User types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  phone_verified?: boolean;
}

export interface Business {
  business_id: string;
  name: string;
  timezone: string;
  is_agency: boolean;
  is_owned: boolean;
}

/**
 * Response shape từ `/gate/:business_id/me`.
 * - `roles`: danh sách role/permission (VIEW_*, ACTION_*, DELETE_*...)
 * - `business_features`: object keyed theo feature key, presence = enabled
 * - `is_full_permission` | `is_owner`: super-user bypass mọi check
 */
export interface BusinessRole {
  roles: string[];
  business_features: Record<string, unknown>;
  is_owner: boolean;
  is_full_permission: boolean;
  business_plan?: {
    name: string;
    currency?: string;
  };
  asset_role?: string;
  smit_shield_status?: boolean;
  /** Facebook OAuth config từ backend — dùng cho FB.init + FB.login */
  config?: {
    app_id: string;
    config_id: string;
    version?: string;
  };
}

export interface OnboardingFeature {
  feature: string;
  active: boolean;
  reward_days: number;
  is_have_permission: boolean;
}

export interface OnboardingProgress {
  features: OnboardingFeature[];
  earned_trial_days: number;
  total_trial_days: number;
}

// Remote app status
export type RemoteStatus = 'idle' | 'loading' | 'ready' | 'error';
