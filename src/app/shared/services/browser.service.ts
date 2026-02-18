import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Servicio centralizado para acceso seguro al DOM y APIs del navegador
 * Evita errores de SSR al encapsular todas las verificaciones de plataforma
 * 
 * Uso:
 * constructor(private browser: BrowserService) {}
 * 
 * const doc = this.browser.document;
 * if (!doc) return; // SSR-safe
 * doc.querySelector(...);
 */
@Injectable({ providedIn: 'root' })
export class BrowserService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  /**
   * Verifica si el código se está ejecutando en el navegador
   */
  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Obtiene el objeto window de forma segura (null en SSR)
   */
  get window(): Window | null {
    return this.isBrowser ? window : null;
  }

  /**
   * Obtiene el objeto document de forma segura (null en SSR)
   */
  get document(): Document | null {
    return this.isBrowser ? document : null;
  }

  /**
   * Ejecuta una función solo si estamos en el navegador
   */
  executeInBrowser<T>(fn: () => T): T | null {
    if (!this.isBrowser) return null;
    return fn();
  }

  /**
   * Ejecuta una función solo si estamos en el navegador, con valor por defecto
   */
  executeInBrowserOr<T>(fn: () => T, defaultValue: T): T {
    if (!this.isBrowser) return defaultValue;
    return fn();
  }
}
