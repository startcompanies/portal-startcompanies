import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { BillingAccessService } from '../../services/billing-access.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../../../environments/environment';
import { BillingViewState } from '../../../../shared/models/billing-access.model';

@Component({
  selector: 'app-subscription-paywall',
  standalone: true,
  imports: [CommonModule, TranslocoPipe],
  templateUrl: './subscription-paywall.component.html',
  styleUrl: './subscription-paywall.component.css',
})
export class SubscriptionPaywallComponent implements OnInit {
  protected readonly environment = environment;
  protected returnUrl: string | null = null;
  protected state!: BillingViewState;
  protected isStartingCheckout = false;
  protected isOpeningPortal = false;
  protected checkoutError: string | null = null;

  constructor(
    private readonly billing: BillingAccessService,
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    this.state = this.billing.getSnapshot();
    await this.auth.loadUser();
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const checkoutStatus = this.route.snapshot.queryParamMap.get('checkout');
    const user = this.auth.getCurrentUser();
    this.state = await this.billing.loadForUser(user);

    if (checkoutStatus === 'success' && user) {
      for (let i = 0; i < 4; i += 1) {
        if (this.state.accessState === 'subscription_active') {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
        this.state = await this.billing.loadForUser(user);
      }
    }

    if (this.state.canAccessPanel && checkoutStatus === 'success') {
      await this.router.navigate([this.returnUrl || '/panel/home'], { replaceUrl: true });
    }
  }

  goToPublicHome(): void {
    window.location.assign(`${environment.baseUrl}/`);
  }

  async startSubscriptionCheckout(): Promise<void> {
    this.checkoutError = null;
    this.isStartingCheckout = true;
    try {
      const checkoutUrl = await this.billing.createSubscriptionCheckoutSession();
      window.location.assign(checkoutUrl);
    } catch {
      this.checkoutError = 'No se pudo iniciar el checkout. Intenta de nuevo.';
      this.isStartingCheckout = false;
    }
  }

  async openCustomerPortal(): Promise<void> {
    this.checkoutError = null;
    this.isOpeningPortal = true;
    try {
      const portalUrl = await this.billing.createCustomerPortalSession();
      window.location.assign(portalUrl);
    } catch {
      this.checkoutError = 'No se pudo abrir el portal de suscripción. Intenta de nuevo.';
      this.isOpeningPortal = false;
    }
  }
}
