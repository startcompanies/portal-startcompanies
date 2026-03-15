import { Injectable } from '@angular/core';
import { BrowserService } from './browser.service';

/**
 * Servicio centralizado para compartir contenido en redes sociales.
 * Extraído del God Component blog-post-v2.component.ts para reutilización.
 */
@Injectable({ providedIn: 'root' })
export class SocialShareService {
  constructor(private browser: BrowserService) {}

  getCurrentUrl(): string {
    const win = this.browser.window;
    return win ? win.location.href : '';
  }

  shareOnWhatsApp(url: string, title: string): void {
    const win = this.browser.window;
    if (!win) return;
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(title);
    win.open(`https://wa.me/?text=${encodedText}%20${encodedUrl}`, '_blank');
  }

  shareOnLinkedIn(url: string): void {
    const win = this.browser.window;
    if (!win) return;
    const encodedUrl = encodeURIComponent(url);
    win.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
  }

  shareOnFacebook(url: string): void {
    const win = this.browser.window;
    if (!win) return;
    const encodedUrl = encodeURIComponent(url);
    win.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
  }

  async shareNative(url: string, title: string, text: string): Promise<void> {
    const win = this.browser.window;
    if (!win) return;

    if (win.navigator.share) {
      try {
        await win.navigator.share({ title, text, url });
      } catch {
        this.copyToClipboard(url);
      }
    } else {
      this.copyToClipboard(url);
    }
  }

  private copyToClipboard(url: string): void {
    const win = this.browser.window;
    if (!win) return;

    win.navigator.clipboard
      .writeText(url)
      .then(() => {
        alert('Enlace copiado al portapapeles');
      })
      .catch(() => {});
  }
}
