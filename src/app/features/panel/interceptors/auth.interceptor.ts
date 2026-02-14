import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint =
    req.url.includes('/auth/signin') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/me');

  const cloned = req.clone({ withCredentials: true });

  if (req.url.includes('/panel/requests')) {
    console.log('[AuthInterceptor] Request URL:', req.url);
    console.log('[AuthInterceptor] Method:', req.method);
  }

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthEndpoint) {
        return throwError(() => error);
      }

      const isZohoEndpoint = req.url.includes('/zoho-sync/') || req.url.includes('/orgTk/');
      if (isZohoEndpoint) {
        return throwError(() => error);
      }

      return authService.refresh().pipe(
        switchMap(() => next(cloned)),
        catchError(() => {
          authService.logout();
          router.navigate(['/panel/login']);
          return throwError(() => error);
        })
      );
    })
  );
};
