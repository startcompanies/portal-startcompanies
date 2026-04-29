export type BillingAccessState =
  | 'trial_active'
  | 'trial_expired'
  | 'subscription_active'
  | 'subscription_past_due'
  | 'subscription_canceled'
  | 'no_subscription';

export type BillingTrialPolicy = 'existing' | 'new';

export interface BillingApiSnapshot {
  accessState?: BillingAccessState | string | null;
  trialStartAt?: string | null;
  trialEndAt?: string | null;
  subscriptionStatus?: string | null;
  monthlyPriceUsd?: number | null;
}

export interface BillingViewState {
  accessState: BillingAccessState;
  canAccessPanel: boolean;
  isTrial: boolean;
  isSubscriptionActive: boolean;
  trialPolicy: BillingTrialPolicy;
  trialStartAt: string | null;
  trialEndAt: string | null;
  trialDaysLeft: number;
  monthlyPriceUsd: number;
  source: 'api' | 'derived' | 'empty';
}
