import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { isLiliLinkExpired, parseLiliLinkToken } from '../utils/lili-link-token.util';

export const liliAuthGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const token = route.queryParams['t'];
  const payload = parseLiliLinkToken(token);

  if (!payload) {
    router.navigate(['/']);
    return false;
  }

  if (isLiliLinkExpired(payload)) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
