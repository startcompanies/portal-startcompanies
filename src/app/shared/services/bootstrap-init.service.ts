import { Injectable, AfterViewInit } from '@angular/core';
import { initializeBootstrapComponents } from '../bootstrap-imports';
import { BrowserService } from './browser.service';

@Injectable({
  providedIn: 'root'
})
export class BootstrapInitService implements AfterViewInit {
  constructor(private browser: BrowserService) {}

  ngAfterViewInit(): void {
    const doc = this.browser.document;
    if (doc) {
      // Inicializar Bootstrap después de que el DOM esté listo
      const win = this.browser.window;
      if (win) {
        win.setTimeout(() => {
          initializeBootstrapComponents(doc);
        }, 100);
      }
    }
  }
}
