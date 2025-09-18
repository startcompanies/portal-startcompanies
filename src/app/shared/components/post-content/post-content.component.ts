import { Component, Input, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-post-content',
  imports: [CommonModule],
  standalone: true,
  template: `<div *ngIf="isBrowser" [innerHTML]="sanitizedHtml"></div>`
})
export class PostContentComponent {
  @Input() html: string = '';
  sanitizedHtml: string = '';
  isBrowser = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.sanitizeHtml();
    }
  }

  ngOnChanges() {
    if (this.isBrowser) {
      this.sanitizeHtml();
    }
  }

  private sanitizeHtml() {
    // Limpieza mínima para evitar errores y mejorar presentación
    let content = this.html || '';
    content = content.replace(/\\n/g, ''); // eliminar escapes de newline
    content = content.replace(/<p>\s*<\/p>/g, ''); // eliminar párrafos vacíos
    content = content.replace(/<a\s+href="([^"]*)"/g, (match, href) => {
      // abrir enlaces externos en nueva pestaña
      if (!href.startsWith('/')) {
        return `<a href="${href}" target="_blank" rel="noopener noreferrer"`;
      }
      return match;
    });
    this.sanitizedHtml = content;
  }
}
