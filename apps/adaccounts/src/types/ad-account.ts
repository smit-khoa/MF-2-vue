import type { IconName } from '@mf2/shared-ui';

// Domain types local to the adaccounts remote. Promote to @mf2/shared-types only
// when a second app needs them (per repo convention).

export type AdAccountStatus = 'active' | 'paused' | 'disabled';

export interface AdAccount {
  id: string;
  name: string;
  status: AdAccountStatus;
  /** Daily budget in the account's currency minor->major already applied. */
  budget: number;
  currency: string;
}

export interface ToolFunction {
  id: string;
  label: string;
  icon?: IconName;
}

export interface ToolGroup {
  id: string;
  label: string;
  icon?: IconName;
  functions: ToolFunction[];
}
