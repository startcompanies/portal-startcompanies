import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { BillingAccessService } from '../services/billing-access.service';

export const billingGuard: CanActivateFn = async (_route, state) => {
  const authService = inject(AuthService);
  const billing = inject(BillingAccessService);
  const router = inject(Router);

  if (state.url.startsWith('/panel/subscription')) {
    return true;
  }

  await authService.loadUser();
  const user = authService.getCurrentUser();
  if (!user) {
    void router.navigate(['/panel/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const billingState = await billing.loadForUser(user);
  if (billingState.canAccessPanel) {
    return true;
  }

  void router.navigate(['/panel/subscription'], {
    queryParams: { returnUrl: state.url },
  });
  return false;
};
