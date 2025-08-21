import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

export interface SeoData {
  title: string;
  description: string;
  keywords: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {

  constructor(
    private meta: Meta,
    private title: Title,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  /**
   * Aplica todos los meta tags de SEO para una página
   */
  updateSeoData(data: SeoData): void {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Solo ejecutar en el navegador
    }

    // Title principal
    this.title.setTitle(data.title);

    // Meta tags básicos
    this.meta.updateTag({ name: 'description', content: data.description });
    this.meta.updateTag({ name: 'keywords', content: data.keywords });

    // Open Graph tags
    this.meta.updateTag({ property: 'og:title', content: data.ogTitle || data.title });
    this.meta.updateTag({ property: 'og:description', content: data.ogDescription || data.description });
    this.meta.updateTag({ property: 'og:image', content: data.ogImage || '/assets/logo.png' });
    this.meta.updateTag({ property: 'og:url', content: data.ogUrl || window.location.href });
    this.meta.updateTag({ property: 'og:type', content: 'website' });

    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: data.twitterCard || 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: data.twitterTitle || data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.twitterDescription || data.description });
    this.meta.updateTag({ name: 'twitter:image', content: data.twitterImage || '/assets/logo.png' });

    // Canonical URL
    if (data.canonicalUrl) {
      this.meta.updateTag({ rel: 'canonical', href: data.canonicalUrl });
    }
  }

  /**
   * Aplica meta tags básicos (title, description, keywords)
   */
  updateBasicSeo(title: string, description: string, keywords: string): void {
    this.updateSeoData({ title, description, keywords });
  }

  /**
   * Limpia todos los meta tags personalizados
   */
  clearSeoData(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Limpiar meta tags básicos
    this.meta.removeTag('name="description"');
    this.meta.removeTag('name="keywords"');

    // Limpiar Open Graph tags
    this.meta.removeTag('property="og:title"');
    this.meta.removeTag('property="og:description"');
    this.meta.removeTag('property="og:image"');
    this.meta.removeTag('property="og:url"');
    this.meta.removeTag('property="og:type"');

    // Limpiar Twitter Card tags
    this.meta.removeTag('name="twitter:card"');
    this.meta.removeTag('name="twitter:title"');
    this.meta.removeTag('name="twitter:description"');
    this.meta.removeTag('name="twitter:image"');

    // Limpiar canonical URL
    this.meta.removeTag('rel="canonical"');
  }

  /**
   * Obtiene el título actual de la página
   */
  getCurrentTitle(): string {
    return this.title.getTitle();
  }

  /**
   * Obtiene la descripción actual de la página
   */
  getCurrentDescription(): string {
    const metaTag = this.meta.getTag('name="description"');
    return metaTag ? metaTag.content || '' : '';
  }
}
