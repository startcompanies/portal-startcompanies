import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoService } from '@jsverse/transloco';

/**
 * Mensajes de error HTTP legibles para el usuario (Transloco).
 */
@Injectable({ providedIn: 'root' })
export class HttpErrorMapperService {
  private transloco = inject(TranslocoService);

  mapHttpError(error: unknown, fallbackKey = 'HTTP.unknown'): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0 || error.error instanceof ProgressEvent) {
        return this.transloco.translate('HTTP.network');
      }
      const body = error.error;
      const msg =
        typeof body === 'string'
          ? body
          : body?.message || body?.error || body?.statusMessage;
      if (typeof msg === 'string' && msg.trim().length > 0 && msg.length < 400) {
        return msg;
      }
      switch (error.status) {
        case 400:
          return this.transloco.translate('HTTP.bad_request');
        case 401:
          return this.transloco.translate('HTTP.unauthorized');
        case 403:
          return this.transloco.translate('HTTP.forbidden');
        case 404:
          return this.transloco.translate('HTTP.not_found');
        case 402:
        case 409:
          return this.transloco.translate('HTTP.payment');
        default:
          if (error.status >= 500) {
            return this.transloco.translate('HTTP.server');
          }
          return this.transloco.translate(fallbackKey);
      }
    }
    if (error && typeof error === 'object' && 'message' in error) {
      const m = String((error as { message?: string }).message || '');
      if (m.trim()) {
        return m;
      }
    }
    return this.transloco.translate(fallbackKey);
  }
}
