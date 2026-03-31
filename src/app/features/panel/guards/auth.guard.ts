import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.loadUser();

  if (authService.isAuthenticated()) {
    return true;
  }

  void router.navigate(['/panel/login'], { queryParams: { returnUrl: state.url } });
  return false;
};










