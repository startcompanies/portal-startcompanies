import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { BrowserService } from './browser.service';
import { environment } from '../../../environments/environment';

export interface MultilingualSeoData {
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
  hreflang?: { [lang: string]: string }; // Para hreflang tags
}

export interface SeoRouteConfig {
  [routeKey: string]: {
    [lang: string]: MultilingualSeoData;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MultilingualSeoService {
  private readonly baseUrl = environment.baseUrl.replace(/\/$/, '');
  private readonly defaultImage = '/assets/logo-dark.webp';

  constructor(
    private meta: Meta,
    private title: Title,
    private transloco: TranslocoService,
    private router: Router,
    private browser: BrowserService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  /**
   * Aplica SEO multilingüe basado en la ruta y idioma actual
   */
  updateSeoForRoute(routeKey: string, customData?: Partial<MultilingualSeoData>): void {
    const currentLang = this.transloco.getActiveLang() || 'es';
    const seoData = this.getSeoDataForRoute(routeKey, currentLang);
    
    if (customData) {
      Object.assign(seoData, customData);
    }

    this.applySeoData(seoData, currentLang);
  }

  /**
   * Aplica SEO con datos personalizados
   */
  updateSeoData(data: MultilingualSeoData, lang?: string): void {
    const currentLang = lang || this.transloco.getActiveLang() || 'es';
    this.applySeoData(data, currentLang);
  }

  /**
   * Obtiene datos SEO para una ruta específica y idioma
   */
  private getSeoDataForRoute(routeKey: string, lang: string): MultilingualSeoData {
    const routeConfig = this.getRouteSeoConfig();
    const routeData = routeConfig[routeKey];
    
    if (!routeData) {
      return this.getDefaultSeoData(lang);
    }

    const langData = routeData[lang];
    if (!langData) {
      // Fallback al español si no existe la traducción
      return routeData['es'] || this.getDefaultSeoData(lang);
    }

    return langData;
  }

  /**
   * Aplica los datos SEO al DOM
   */
  private applySeoData(data: MultilingualSeoData, lang: string): void {
    // Title principal
    this.title.setTitle(data.title);

    // Meta tags básicos
    this.meta.updateTag({ name: 'description', content: data.description });
    this.meta.updateTag({ name: 'keywords', content: data.keywords });
    this.meta.updateTag({ name: 'language', content: this.getLanguageCode(lang) });

    // Open Graph tags
    this.meta.updateTag({ property: 'og:title', content: data.ogTitle || data.title });
    this.meta.updateTag({ property: 'og:description', content: data.ogDescription || data.description });
    this.meta.updateTag({ property: 'og:image', content: data.ogImage || this.defaultImage });
    this.meta.updateTag({ property: 'og:type', content: data.ogType || 'website' });
    this.meta.updateTag({ property: 'og:locale', content: this.getOgLocale(lang) });
    
    // og:url dinámico
    const win = this.browser.window;
    if (win) {
      this.meta.updateTag({ property: 'og:url', content: data.ogUrl || win.location.href });
    }

    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: data.twitterCard || 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: data.twitterTitle || data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.twitterDescription || data.description });
    this.meta.updateTag({ name: 'twitter:image', content: data.twitterImage || this.defaultImage });
    
    if (data.twitterSite) {
      this.meta.updateTag({ name: 'twitter:site', content: data.twitterSite });
    }

    // Canonical URL
    if (data.canonical) {
      this.updateCanonicalLink(data.canonical);
    }

    // Hreflang tags para SEO multilingüe
    this.updateHreflangTags(data.hreflang || this.generateHreflangTags());
  }

  /**
   * Actualiza los tags hreflang para SEO multilingüe
   */
  private updateHreflangTags(hreflangData: { [lang: string]: string }): void {
    // Limpiar hreflang existentes
    const existingHreflang = this.meta.getTags('name="hreflang"');
    existingHreflang.forEach(tag => this.meta.removeTagElement(tag));

    // Agregar nuevos hreflang
    Object.entries(hreflangData).forEach(([lang, url]) => {
      this.meta.addTag({ name: 'hreflang', content: `${lang}:${url}` });
    });
  }

  /**
   * Genera automáticamente los hreflang tags basado en la URL actual
   */
  private generateHreflangTags(): { [lang: string]: string } {
    const currentUrl = this.router.url;
    const hreflang: { [lang: string]: string } = {};

    // Generar URLs para ambos idiomas
    ['es', 'en'].forEach(lang => {
      const url = this.generateUrlForLanguage(currentUrl, lang);
      hreflang[lang] = `${this.baseUrl}${url}`;
    });

    return hreflang;
  }

  /**
   * Genera URL para un idioma específico
   */
  private generateUrlForLanguage(currentUrl: string, targetLang: string): string {
    const segments = currentUrl.split('/').filter(seg => seg.length > 0);
    
    // Si ya tiene idioma, reemplazarlo
    if (segments.length > 0 && ['es', 'en'].includes(segments[0])) {
      segments[0] = targetLang;
    } else {
      // Si no tiene idioma, agregarlo al inicio
      segments.unshift(targetLang);
    }

    return '/' + segments.join('/');
  }

  /**
   * Obtiene el código de idioma para meta tags
   */
  private getLanguageCode(lang: string): string {
    const languageMap: { [key: string]: string } = {
      'es': 'Spanish',
      'en': 'English'
    };
    return languageMap[lang] || 'Spanish';
  }

  /**
   * Obtiene el locale para Open Graph
   */
  private getOgLocale(lang: string): string {
    const localeMap: { [key: string]: string } = {
      'es': 'es_ES',
      'en': 'en_US'
    };
    return localeMap[lang] || 'es_ES';
  }

  /**
   * Configuración SEO por ruta e idioma
   */
  private getRouteSeoConfig(): SeoRouteConfig {
    return {
      'home': {
        'es': {
          title: 'Start Companies - Apertura de Cuentas Bancarias en EE.UU.',
          description: 'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online, sin comisiones y con garantía. Acompañamiento paso a paso.',
          keywords: 'LLC Estados Unidos, cuenta bancaria USA, apertura cuenta bancaria, Relay, Start Companies, servicios financieros',
          ogTitle: 'Start Companies - Cuentas Bancarias para LLC en EE.UU.',
          ogDescription: 'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online y sin comisiones.',
          canonical: `${this.baseUrl}/`
        },
        'en': {
          title: 'Start Companies - US Bank Account Opening Services',
          description: 'We open bank accounts for LLCs in the United States. 100% online service, no fees and with guarantee. Step-by-step support.',
          keywords: 'LLC United States, US bank account, bank account opening, Relay, Start Companies, financial services',
          ogTitle: 'Start Companies - US Bank Account Services',
          ogDescription: 'We open bank accounts for LLCs in the United States. 100% online service with no fees.',
          canonical: `${this.baseUrl}/en/home`
        }
      },
      'inicio': {
        'es': {
          title: 'Start Companies - Apertura de Cuentas Bancarias en EE.UU.',
          description: 'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online, sin comisiones y con garantía. Acompañamiento paso a paso.',
          keywords: 'LLC Estados Unidos, cuenta bancaria USA, apertura cuenta bancaria, Relay, Start Companies, servicios financieros',
          ogTitle: 'Start Companies - Cuentas Bancarias para LLC en EE.UU.',
          ogDescription: 'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online y sin comisiones.',
          canonical: `${this.baseUrl}/`
        },
        'en': {
          title: 'Start Companies - US Bank Account Opening Services',
          description: 'We open bank accounts for LLCs in the United States. 100% online service, no fees and with guarantee. Step-by-step support.',
          keywords: 'LLC United States, US bank account, bank account opening, Relay, Start Companies, financial services',
          ogTitle: 'Start Companies - US Bank Account Services',
          ogDescription: 'We open bank accounts for LLCs in the United States. 100% online service with no fees.',
          canonical: `${this.baseUrl}/en/home`
        }
      },
      'nosotros': {
        'es': {
          title: 'Nosotros - Start Companies | Experiencia en Servicios Financieros',
          description: 'Conoce nuestro equipo y experiencia en servicios financieros para LLC en Estados Unidos. Más de 200 emprendedores confían en nosotros.',
          keywords: 'Start Companies equipo, experiencia servicios financieros, sobre nosotros, confianza emprendedores',
          ogTitle: 'Nosotros - Start Companies',
          ogDescription: 'Conoce nuestro equipo y experiencia en servicios financieros para LLC en Estados Unidos.',
          canonical: `${this.baseUrl}/nosotros`
        },
        'en': {
          title: 'About Us - Start Companies | Financial Services Experience',
          description: 'Meet our team and experience in financial services for LLCs in the United States. More than 200 entrepreneurs trust us.',
          keywords: 'Start Companies team, financial services experience, about us, entrepreneur trust',
          ogTitle: 'About Us - Start Companies',
          ogDescription: 'Meet our team and experience in financial services for LLCs in the United States.',
          canonical: `${this.baseUrl}/en/about-us`
        }
      },
      'contacto': {
        'es': {
          title: 'Contacto - Start Companies | Habla con Nuestros Expertos',
          description: 'Contacta con nuestros expertos en servicios financieros para LLC en Estados Unidos. Soporte personalizado y respuesta rápida.',
          keywords: 'contacto Start Companies, soporte LLC, expertos servicios financieros, ayuda cuenta bancaria',
          ogTitle: 'Contacto - Start Companies',
          ogDescription: 'Contacta con nuestros expertos en servicios financieros para LLC en Estados Unidos.',
          canonical: `${this.baseUrl}/contacto`
        },
        'en': {
          title: 'Contact - Start Companies | Talk to Our Experts',
          description: 'Contact our experts in financial services for LLCs in the United States. Personalized support and quick response.',
          keywords: 'Start Companies contact, LLC support, financial services experts, bank account help',
          ogTitle: 'Contact - Start Companies',
          ogDescription: 'Contact our experts in financial services for LLCs in the United States.',
          canonical: `${this.baseUrl}/en/contact`
        }
      },
      'planes': {
        'es': {
          title: 'Planes y Precios - Start Companies | Servicios para LLC en EE.UU.',
          description: 'Conoce nuestros planes para apertura de LLC y cuentas bancarias en Estados Unidos. Precios transparentes y servicios completos.',
          keywords: 'planes LLC Estados Unidos, precios cuenta bancaria, servicios Start Companies, apertura LLC USA',
          ogTitle: 'Planes y Precios - Start Companies',
          ogDescription: 'Conoce nuestros planes para apertura de LLC y cuentas bancarias en Estados Unidos.',
          canonical: `${this.baseUrl}/planes`
        },
        'en': {
          title: 'Plans and Pricing - Start Companies | US LLC Services',
          description: 'Discover our plans for LLC formation and bank accounts in the United States. Transparent pricing and complete services.',
          keywords: 'US LLC plans, bank account pricing, Start Companies services, LLC formation USA',
          ogTitle: 'Plans and Pricing - Start Companies',
          ogDescription: 'Discover our plans for LLC formation and bank accounts in the United States.',
          canonical: `${this.baseUrl}/en/plans`
        }
      },
      'blog': {
        'es': {
          title: 'Blog - Start Companies | Noticias y Consejos para LLC en EE.UU.',
          description: 'Mantente informado sobre LLC, cuentas bancarias y servicios financieros en Estados Unidos. Consejos y noticias del sector.',
          keywords: 'blog LLC Estados Unidos, consejos cuenta bancaria, noticias financieras, Start Companies blog',
          ogTitle: 'Blog - Start Companies',
          ogDescription: 'Mantente informado sobre LLC, cuentas bancarias y servicios financieros en Estados Unidos.',
          canonical: `${this.baseUrl}/blog`
        },
        'en': {
          title: 'Blog - Start Companies | News and Tips for US LLCs',
          description: 'Stay informed about LLCs, bank accounts and financial services in the United States. Tips and industry news.',
          keywords: 'US LLC blog, bank account tips, financial news, Start Companies blog',
          ogTitle: 'Blog - Start Companies',
          ogDescription: 'Stay informed about LLCs, bank accounts and financial services in the United States.',
          canonical: `${this.baseUrl}/blog` // Redirigir al blog en español
        }
      },
      'apertura-llc': {
        'es': {
          title: 'Apertura de LLC en Estados Unidos - Start Companies',
          description: 'Abrimos tu LLC en Estados Unidos de forma rápida y segura. Servicio completo con acompañamiento paso a paso.',
          keywords: 'apertura LLC Estados Unidos, crear LLC USA, constitución empresa USA, Start Companies',
          ogTitle: 'Apertura de LLC en Estados Unidos - Start Companies',
          ogDescription: 'Abrimos tu LLC en Estados Unidos de forma rápida y segura.',
          canonical: `${this.baseUrl}/apertura-llc`
        },
        'en': {
          title: 'LLC Opening in the United States - Start Companies',
          description: 'We open your LLC in the United States quickly and safely. Complete service with step-by-step support.',
          keywords: 'LLC opening United States, create LLC USA, business formation USA, Start Companies',
          ogTitle: 'LLC Opening in the United States - Start Companies',
          ogDescription: 'We open your LLC in the United States quickly and safely.',
          canonical: `${this.baseUrl}/en/llc-opening`
        }
      },
      'renovar-llc': {
        'es': {
          title: 'Renovación de LLC en Estados Unidos - Start Companies',
          description: 'Renovamos tu LLC en Estados Unidos antes de que expire. Evita multas y mantén tu empresa activa.',
          keywords: 'renovación LLC Estados Unidos, renovar LLC USA, mantener LLC activa, Start Companies',
          ogTitle: 'Renovación de LLC en Estados Unidos - Start Companies',
          ogDescription: 'Renovamos tu LLC en Estados Unidos antes de que expire.',
          canonical: `${this.baseUrl}/renovar-llc`
        },
        'en': {
          title: 'LLC Renewal in the United States - Start Companies',
          description: 'We renew your LLC in the United States before it expires. Avoid penalties and keep your business active.',
          keywords: 'LLC renewal United States, renew LLC USA, keep LLC active, Start Companies',
          ogTitle: 'LLC Renewal in the United States - Start Companies',
          ogDescription: 'We renew your LLC in the United States before it expires.',
          canonical: `${this.baseUrl}/en/llc-renewal`
        }
      }
    };
  }

  /**
   * Datos SEO por defecto
   */
  private getDefaultSeoData(lang: string): MultilingualSeoData {
    const defaultData = {
      title: 'Start Companies - Servicios Financieros para LLC en EE.UU.',
      description: 'Servicios completos para apertura de LLC y cuentas bancarias en Estados Unidos.',
      keywords: 'LLC Estados Unidos, servicios financieros, Start Companies',
      canonical: `${this.baseUrl}/${lang}`
    };

    if (lang === 'en') {
      return {
        ...defaultData,
        title: 'Start Companies - Financial Services for US LLCs',
        description: 'Complete services for LLC formation and bank accounts in the United States.',
        keywords: 'US LLC, financial services, Start Companies'
      };
    }

    return defaultData;
  }

  /**
   * Limpia todos los meta tags personalizados
   */
  clearSeoData(): void {
    // Limpiar meta tags básicos
    this.meta.removeTag('name="description"');
    this.meta.removeTag('name="keywords"');
    this.meta.removeTag('name="language"');

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
    this.removeCanonicalLink();

    // Limpiar hreflang tags
    const existingHreflang = this.meta.getTags('name="hreflang"');
    existingHreflang.forEach(tag => this.meta.removeTagElement(tag));
  }

  private updateCanonicalLink(url: string): void {
    const canonicalSelector = 'link[rel="canonical"]';
    let canonicalLink = this.document.querySelector(
      canonicalSelector
    ) as HTMLLinkElement | null;

    if (!canonicalLink) {
      canonicalLink = this.document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      this.document.head.appendChild(canonicalLink);
    }

    canonicalLink.setAttribute('href', url);
  }

  private removeCanonicalLink(): void {
    const canonicalLink = this.document.querySelector('link[rel="canonical"]');
    canonicalLink?.parentNode?.removeChild(canonicalLink);
  }
}
