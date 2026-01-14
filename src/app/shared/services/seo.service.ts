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
  ogType?: string;
  canonical?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string;
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
   * Ahora funciona tanto en navegador como en servidor (SSR)
   */
  updateSeoData(data: SeoData): void {
    // Title principal
    this.title.setTitle(data.title);

    // Meta tags básicos
    this.meta.updateTag({ name: 'description', content: data.description });
    this.meta.updateTag({ name: 'keywords', content: data.keywords });

    // Open Graph tags
    this.meta.updateTag({ property: 'og:title', content: data.ogTitle || data.title });
    this.meta.updateTag({ property: 'og:description', content: data.ogDescription || data.description });
    this.meta.updateTag({ property: 'og:image', content: data.ogImage || '/assets/logo.png' });
    
    // Solo en navegador para og:url dinámico
    if (isPlatformBrowser(this.platformId)) {
      this.meta.updateTag({ property: 'og:url', content: data.ogUrl || window.location.href });
    }
    
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:locale', content: 'es_ES' });

    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: data.twitterCard || 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: data.twitterTitle || data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.twitterDescription || data.description });
    this.meta.updateTag({ name: 'twitter:image', content: data.twitterImage || 'https://startcompanies.us/assets/logo.png' });
    
    // Twitter Site (nuevo)
    if (data.twitterSite) {
      this.meta.updateTag({ name: 'twitter:site', content: data.twitterSite });
    }

    // Canonical URL
    if (data.canonical) {
      this.meta.updateTag({ rel: 'canonical', href: data.canonical });
    }
  }

  /**
   * Método NUEVO: Lee SEO de la configuración de ruta
   * Este método se llama automáticamente desde el componente SEO
   */
  updateFromRoute(routeData: any): void {
    if (routeData && routeData.seo) {
      this.updateSeoData(routeData.seo);
    }
  }

  /**
   * Método NUEVO: Actualiza SEO basándose en la ruta actual
   * Útil para navegación programática
   */
  updateSeoForRoute(route: string, seoData: SeoData): void {
    this.updateSeoData(seoData);
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
    // Limpiar meta tags básicos
    this.meta.removeTag('name="description"');
    this.meta.removeTag('name="keywords"');

    // Limpiar Open Graph tags
    this.meta.removeTag('property="og:title"');
    this.meta.removeTag('property="og:description"');
    this.meta.removeTag('property="og:image"');
    this.meta.removeTag('property="og:url"');
    this.meta.removeTag('property="og:type"');
    this.meta.removeTag('property="og:locale"');

    // Limpiar Twitter Card tags
    this.meta.removeTag('name="twitter:card"');
    this.meta.removeTag('name="twitter:title"');
    this.meta.removeTag('name="twitter:description"');
    this.meta.removeTag('name="twitter:image"');
    this.meta.removeTag('name="twitter:site"');

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

  /**
   * Método NUEVO: Verifica si el SEO está configurado correctamente
   */
  isSeoConfigured(): boolean {
    const title = this.getCurrentTitle();
    const description = this.getCurrentDescription();
    return title.length > 0 && description.length > 0;
  }
}
