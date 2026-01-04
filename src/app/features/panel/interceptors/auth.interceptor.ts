import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  
  // Agregar token a las peticiones si existe
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es error 401 y no es una petición de refresh
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        // NO cerrar sesión si el error viene de endpoints de Zoho
        // Estos errores son de configuración de Zoho, no de autenticación del usuario
        const isZohoEndpoint = req.url.includes('/zoho-sync/') || req.url.includes('/orgTk/');
        
        if (isZohoEndpoint) {
          // Para endpoints de Zoho, solo propagar el error sin cerrar sesión
          return throwError(() => error);
        }

        const refreshToken = localStorage.getItem('refreshToken');
        const isSsoLogin = localStorage.getItem('isSsoLogin') === 'true';

        if (refreshToken && isSsoLogin) {
          // Usar refresh SSO
          return authService.refreshSso(refreshToken).pipe(
            switchMap((response: any) => {
              // Reintentar la petición original con el nuevo token
              const clonedRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.accessToken}`
                }
              });
              return next(clonedRequest);
            }),
            catchError((refreshError) => {
              // Si el refresh falla, redirigir al login
              localStorage.clear();
              authService.logout();
              router.navigate(['/panel/login']);
              return throwError(() => refreshError);
            })
          );
        } else {
          // No hay refresh token o no es SSO, cerrar sesión normalmente
          authService.logout();
          router.navigate(['/panel/login']);
        }
      }
      return throwError(() => error);
    })
  );
};








