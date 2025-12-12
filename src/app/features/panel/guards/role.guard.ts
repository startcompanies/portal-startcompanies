import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: ('client' | 'partner' | 'admin')[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/panel/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    const user = authService.getCurrentUser();
    if (user && allowedRoles.includes(user.type)) {
      return true;
    }

    // Redirigir según el tipo de usuario
    if (user?.type === 'admin') {
      router.navigate(['/panel/dashboard']);
    } else if (user?.type === 'partner') {
      router.navigate(['/panel/my-requests']);
    } else {
      router.navigate(['/panel/my-requests']);
    }

    return false;
  };
};
