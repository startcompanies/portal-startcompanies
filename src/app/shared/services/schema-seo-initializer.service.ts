import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../../core/config/app.config.constants';

/**
 * Inyecta/actualiza JSON-LD (Organization, WebSite) y canonical con environment.baseUrl
 * para que las URLs sean dinámicas según el entorno (dev, staging, prod).
 */
@Injectable({ providedIn: 'root' })
export class SchemaSeoInitializerService {
  private readonly baseUrl = environment.baseUrl.replace(/\/$/, '');

  constructor(@Inject(DOCUMENT) private document: Document) {}

  run(): void {
    this.updateCanonical();
    this.updateOrganizationSchema();
    this.updateWebSiteSchema();
  }

  private updateCanonical(): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', `${this.baseUrl}/`);
  }

  private updateOrganizationSchema(): void {
    const script = this.document.getElementById('organization-schema') as HTMLScriptElement | null;
    if (!script) return;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Start Companies',
      url: this.baseUrl,
      description:
        'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online, sin comisiones y con garantía.',
      logo: `${this.baseUrl}/assets/logo-dark.webp`,
      sameAs: [
        'https://www.facebook.com/startcompanies',
        'https://x.com/startcompaniess',
        'https://www.linkedin.com/company/startcompanies',
        'https://www.instagram.com/startcompanies/',
        'https://www.youtube.com/@AdministracionStartCompanies',
        'https://www.tiktok.com/@startcompanies',
        'https://es.trustpilot.com/review/www.startcompanies.us',
      ],
      address: {
        '@type': 'PostalAddress',
        streetAddress: '1209 Mountain Road Pl NE, STE N',
        addressLocality: 'Albuquerque',
        addressRegion: 'NM',
        postalCode: '87110',
        addressCountry: 'US',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: APP_CONFIG.contact.phone,
        contactType: 'customer service',
        email: APP_CONFIG.contact.email,
        availableLanguage: ['Spanish', 'English'],
      },
      foundingDate: '2020',
      areaServed: 'Worldwide',
      serviceType: 'LLC Formation and Banking Services',
    };
    script.textContent = JSON.stringify(schema);
  }

  private updateWebSiteSchema(): void {
    const script = this.document.getElementById('website-schema') as HTMLScriptElement | null;
    if (!script) return;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Start Companies',
      alternateName: 'Start Companies',
      description:
        'Abrimos cuentas bancarias para LLC en Estados Unidos. Servicio 100% online, sin comisiones y con garantía.',
      url: this.baseUrl,
    };
    script.textContent = JSON.stringify(schema);
  }
}
