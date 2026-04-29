import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import type { User } from './auth.service';
import {
  BillingAccessState,
  BillingApiSnapshot,
  BillingTrialPolicy,
  BillingViewState,
} from '../../../shared/models/billing-access.model';

const BILLING_BASE = `${environment.apiUrl || 'http://localhost:3000'}/billing`;

function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

function daysLeftUntil(isoDate: string | null): number {
  if (!isoDate) return 0;
  const end = new Date(isoDate).getTime();
  if (!Number.isFinite(end)) return 0;
  const diffMs = end - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function normalizeAccessState(value: unknown): BillingAccessState | null {
  if (typeof value !== 'string') return null;
  switch (value) {
    case 'trial_active':
    case 'trial_expired':
    case 'subscription_active':
    case 'subscription_past_due':
    case 'subscription_canceled':
    case 'no_subscription':
      return value;
    default:
      return null;
  }
}

@Injectable({ providedIn: 'root' })
export class BillingAccessService {
  private readonly stateSubject = new BehaviorSubject<BillingViewState>({
    accessState: 'no_subscription',
    canAccessPanel: false,
    isTrial: false,
    isSubscriptionActive: false,
    trialPolicy: 'new',
    trialStartAt: null,
    trialEndAt: null,
    trialDaysLeft: 0,
    monthlyPriceUsd: environment.billing.monthlyPriceUsd,
    source: 'empty',
  });
  readonly state$ = this.stateSubject.asObservable();
  private loadPromise: Promise<BillingViewState> | null = null;

  constructor(private readonly http: HttpClient) {}

  getSnapshot(): BillingViewState {
    return this.stateSubject.value;
  }

  clear(): void {
    this.loadPromise = null;
    this.stateSubject.next({
      accessState: 'no_subscription',
      canAccessPanel: false,
      isTrial: false,
      isSubscriptionActive: false,
      trialPolicy: 'new',
      trialStartAt: null,
      trialEndAt: null,
      trialDaysLeft: 0,
      monthlyPriceUsd: environment.billing.monthlyPriceUsd,
      source: 'empty',
    });
  }

  async loadForUser(user: User | null): Promise<BillingViewState> {
    if (!user) {
      this.clear();
      return this.stateSubject.value;
    }
    if (this.loadPromise) {
      return this.loadPromise;
    }
    this.loadPromise = this.resolveState(user)
      .then((state) => {
        this.stateSubject.next(state);
        return state;
      })
      .finally(() => {
        this.loadPromise = null;
      });
    return this.loadPromise;
  }

  async createSubscriptionCheckoutSession(): Promise<string> {
    const res = await firstValueFrom(
      this.http
        .post<{ url?: string }>(`${BILLING_BASE}/subscription/checkout-session`, {}, { withCredentials: true })
        .pipe(timeout(10000)),
    );
    if (!res?.url) {
      throw new Error('No se recibió URL de checkout');
    }
    return res.url;
  }

  async createCustomerPortalSession(): Promise<string> {
    const res = await firstValueFrom(
      this.http
        .post<{ url?: string }>(`${BILLING_BASE}/subscription/portal-session`, {}, { withCredentials: true })
        .pipe(timeout(10000)),
    );
    if (!res?.url) {
      throw new Error('No se recibió URL de portal');
    }
    return res.url;
  }

  private async resolveState(user: User): Promise<BillingViewState> {
    const apiState = await firstValueFrom(
      this.http.get<BillingApiSnapshot>(`${BILLING_BASE}/access`, { withCredentials: true }).pipe(
        timeout(7000),
        catchError(() => of(null)),
      ),
    );
    if (apiState) {
      return this.fromApiOrFallback(user, apiState);
    }
    return this.deriveFromUser(user);
  }

  private fromApiOrFallback(user: User, apiState: BillingApiSnapshot): BillingViewState {
    const accessState = normalizeAccessState(apiState.accessState);
    if (!accessState) {
      return this.deriveFromUser(user);
    }
    const trialStartAt = apiState.trialStartAt ?? null;
    const trialEndAt = apiState.trialEndAt ?? null;
    const isTrial = accessState === 'trial_active' || accessState === 'trial_expired';
    return {
      accessState,
      canAccessPanel: accessState === 'trial_active' || accessState === 'subscription_active',
      isTrial,
      isSubscriptionActive: accessState === 'subscription_active',
      trialPolicy: this.resolveTrialPolicy(user.createdAt),
      trialStartAt,
      trialEndAt,
      trialDaysLeft: accessState === 'trial_active' ? daysLeftUntil(trialEndAt) : 0,
      monthlyPriceUsd:
        typeof apiState.monthlyPriceUsd === 'number' && apiState.monthlyPriceUsd > 0
          ? apiState.monthlyPriceUsd
          : environment.billing.monthlyPriceUsd,
      source: 'api',
    };
  }

  private deriveFromUser(user: User): BillingViewState {
    const trialPolicy = this.resolveTrialPolicy(user.createdAt);
    const trialMonths =
      trialPolicy === 'existing'
        ? environment.billing.trialMonthsExisting
        : environment.billing.trialMonthsNew;
    const trialStartAt = user.createdAt ?? new Date().toISOString();
    const trialEndAt = addMonths(trialStartAt, trialMonths);
    const trialDaysLeft = daysLeftUntil(trialEndAt);
    const accessState: BillingAccessState = trialDaysLeft > 0 ? 'trial_active' : 'trial_expired';
    return {
      accessState,
      canAccessPanel: accessState === 'trial_active',
      isTrial: true,
      isSubscriptionActive: false,
      trialPolicy,
      trialStartAt,
      trialEndAt,
      trialDaysLeft,
      monthlyPriceUsd: environment.billing.monthlyPriceUsd,
      source: 'derived',
    };
  }

  private resolveTrialPolicy(createdAt?: string): BillingTrialPolicy {
    if (!createdAt) return 'new';
    const createdTs = new Date(createdAt).getTime();
    const cutoffTs = new Date(environment.billing.accountExistingCutoff).getTime();
    if (!Number.isFinite(createdTs) || !Number.isFinite(cutoffTs)) return 'new';
    return createdTs <= cutoffTs ? 'existing' : 'new';
  }
}
