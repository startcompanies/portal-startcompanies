import { Injectable, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { initializeBootstrapComponents } from '../bootstrap-imports';

@Injectable({
  providedIn: 'root'
})
export class BootstrapInitService implements AfterViewInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Inicializar Bootstrap después de que el DOM esté listo
      setTimeout(() => {
        initializeBootstrapComponents();
      }, 100);
    }
  }
}
