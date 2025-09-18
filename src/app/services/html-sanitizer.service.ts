// src/app/services/html-sanitizer.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

@Injectable({ providedIn: 'root' })
export class HtmlSanitizerService {
  private purify: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformServer(this.platformId)) {
      const { window } = new JSDOM('<!doctype html><html><body></body></html>');
      this.purify = createDOMPurify(window as any);
    } else if ((window as any).DOMPurify) {
      this.purify = (window as any).DOMPurify;
    }
  }

  sanitize(html: string): string {
    if (!this.purify) {
      // fallback simple: eliminar scripts
      return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    }

    return this.purify.sanitize(html, {
      ALLOWED_TAGS: [
        'a', 'b', 'i', 'p', 'br', 'ul', 'ol', 'li',
        'img', 'h1','h2','h3','h4','h5','h6',
        'blockquote','pre','code'
      ],
      ALLOWED_ATTR: ['href','src','alt','title','target','rel'],
    });
  }
}
