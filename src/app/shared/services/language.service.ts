// src/app/services/language.service.ts
import { Injectable } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { filter } from 'rxjs/operators';
import { BrowserService } from './browser.service';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly availableLangs = ['es', 'en'];
  readonly defaultLang = 'es';

  constructor(
    private transloco: TranslocoService,
    private router: Router,
    private browser: BrowserService
  ) {
    // Escuchar navegaciones posteriores (asegura sincronía durante runtime)
    this.router.events
      .pipe(filter((e): e is NavigationStart => e instanceof NavigationStart))
      .subscribe((ev) => {
        const lang = this.getLangFromUrl(ev.url) || null;
        if (lang && lang !== this.transloco.getActiveLang()) {
          this.transloco.setDefaultLang(lang);
          this.transloco.setActiveLang(lang);
        }
      });

    // (Opcional) escucha NavigationEnd si necesitas acciones post-render
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        // lugar para sincronizaciones pos-navegación si las necesitas
      });
  }

  /** Método que forzará la inicialización al bootstrap con APP_INITIALIZER */
  async init(): Promise<void> {
    // Determinar URL inicial de forma robusta (browser o server)
    const win = this.browser.window;
    const initialUrl = win
      ? (win.location.pathname + (win.location.search || ''))
      : this.router.url || '/';

    const initialLang = this.getLangFromUrl(initialUrl) || this.defaultLang;

    // Logs temporales para debug — elimina en producción
    console.log('[LanguageService] init url:', initialUrl, 'detected lang:', initialLang);

    // Aseguramos default + active antes del render
    this.transloco.setDefaultLang(initialLang);
    // setActiveLang puede ser asíncrono en algunos loaders; usamos await por seguridad.
    // Si tu setActiveLang es síncrono no pasa nada con await.
    await this.transloco.setActiveLang(initialLang);
  }

  // getter central
  get currentLang(): string {
    const active = this.transloco.getActiveLang();
    return active || this.getLangFromUrl() || this.defaultLang;
  }

  async setLanguage(lang: string, replaceUrl = true): Promise<boolean> {
    if (!this.availableLangs.includes(lang)) lang = this.defaultLang;
    await this.transloco.setActiveLang(lang);
    this.transloco.setDefaultLang(lang);
    return replaceUrl ? this.replaceLangInUrl(lang) : true;
  }

  navigate(commands: any[], extras: any = {}): Promise<boolean> {
    const lang = this.currentLang || this.defaultLang;
    const normalized = (commands || [])
      .filter((c) => c !== undefined && c !== null)
      .map((c) => (typeof c === 'string' ? c.replace(/^\/+/, '') : c));
    
    // Mapear rutas según el idioma
    const mappedCommands = this.mapCommandsForLanguage(normalized, lang);
    
    // Para español (raíz), no agregar prefijo de idioma
    if (lang === 'es') {
      return this.router.navigate(['/', ...mappedCommands], extras);
    }
    
    // Para inglés, agregar prefijo /en/
    return this.router.navigate(['/', lang, ...mappedCommands], extras);
  }

  /**
   * Mapea comandos de navegación según el idioma
   */
  private mapCommandsForLanguage(commands: any[], lang: string): any[] {
    if (lang === 'en') {
      return commands.map(cmd => {
        if (typeof cmd === 'string') {
          const routeMapping: { [key: string]: string } = {
            'nosotros': 'about-us',
            'contacto': 'contact',
            'planes': 'plans',
            'blog': 'blog',
            'aviso-de-privacidad': 'privacy-policy',
            'terminos-y-condiciones': 'terms-and-conditions',
            'apertura-llc': 'llc-opening',
            'renovar-llc': 'llc-renewal',
            'form-apertura-relay': 'relay-opening-form',
            'abre-tu-llc': 'llc-formation',
            'presentacion': 'presentation',
            'apertura-banco-relay': 'relay-account-opening',
            'agendar': 'schedule',
            'fixcal': 'fixcal',
            'abotax': 'abotax',
            'category': 'category',
            'post': 'post'
          };
          return routeMapping[cmd] || cmd;
        }
        return cmd;
      });
    }
    return commands;
  }

  replaceLangInUrl(lang: string): Promise<boolean> {
    const url = this.router.url || '/';
    console.log('[LanguageService] replaceLangInUrl - Current URL:', url, 'Target lang:', lang);
    
    const tree = this.router.parseUrl(url);
    const primary = tree.root.children['primary'];
    const segs = primary ? primary.segments.map((s) => s.path) : [];
    
    console.log('[LanguageService] URL segments:', segs);
    console.log('[LanguageService] Available langs:', this.availableLangs);
    console.log('[LanguageService] Current lang:', this.currentLang);

    if (segs.length === 0) {
      // Si no hay segmentos, redirigir a la página principal del idioma
      const targetUrl = lang === 'es' ? ['/'] : ['/', lang, 'home'];
      console.log('[LanguageService] No segments, navigating to:', targetUrl);
      return this.router.navigate(targetUrl);
    }

    // Si el primer segmento es un idioma, reemplazarlo
    if (this.availableLangs.includes(segs[0])) {
      // Si solo queda el idioma (sin página específica), agregar página principal
      if (segs.length === 1) {
        const targetUrl = lang === 'es' ? ['/'] : ['/', lang, 'home'];
        console.log('[LanguageService] Only language segment, navigating to:', targetUrl);
        return this.router.navigate(targetUrl);
      } else {
        // Mapear la ruta actual al idioma de destino
        const currentRoute = segs[1];
        const mappedRoute = this.mapRouteForLanguage(currentRoute, lang);
        
        if (lang === 'es') {
          // Para español, usar raíz sin prefijo
          // Si mappedRoute es vacío, solo usar ['/']
          const targetUrl = mappedRoute === '' ? ['/'] : ['/', mappedRoute];
          console.log('[LanguageService] Spanish route, navigating to:', targetUrl);
          return this.router.navigate(targetUrl, {
            queryParams: tree.queryParams,
            fragment: tree.fragment ?? undefined,
          });
        } else {
          // Para inglés, usar prefijo /en/
          const targetUrl = ['/', lang, mappedRoute];
          console.log('[LanguageService] English route, navigating to:', targetUrl);
          return this.router.navigate(targetUrl, {
            queryParams: tree.queryParams,
            fragment: tree.fragment ?? undefined,
          });
        }
      }
    } else {
      // Si no hay idioma en la URL, es una ruta española en la raíz
      const currentRoute = segs[0];
      const mappedRoute = this.mapRouteForLanguage(currentRoute, lang);
      
      if (lang === 'es') {
        // Mantener en la raíz
        const targetUrl = ['/', mappedRoute];
        console.log('[LanguageService] Spanish root route, navigating to:', targetUrl);
        return this.router.navigate(targetUrl, {
          queryParams: tree.queryParams,
          fragment: tree.fragment ?? undefined,
        });
      } else {
        // Agregar prefijo /en/
        const targetUrl = ['/', lang, mappedRoute];
        console.log('[LanguageService] English route from root, navigating to:', targetUrl);
        return this.router.navigate(targetUrl, {
          queryParams: tree.queryParams,
          fragment: tree.fragment ?? undefined,
        });
      }
    }
  }

  /**
   * Mapea una ruta específica al idioma de destino
   */
  private mapRouteForLanguage(route: string, targetLang: string): string {
    if (targetLang === 'es') {
      // Mapear de inglés a español
      const englishToSpanish: { [key: string]: string } = {
        'home': '', // Raíz en español
        'about-us': 'nosotros',
        'contact': 'contacto',
        'plans': 'planes',
        'blog': 'blog',
        'privacy-policy': 'aviso-de-privacidad',
        'terms-and-conditions': 'terminos-y-condiciones',
        'llc-formation': 'abre-tu-llc',
        'presentation': 'presentacion',
        'relay-account-opening': 'apertura-banco-relay',
        'schedule': 'agendar',
        'llc-opening': 'apertura-llc',
        'llc-renewal': 'renovar-llc',
        'relay-opening-form': 'form-apertura-relay',
        'fixcal': 'fixcal',
        'abotax': 'abotax',
        'category': 'category',
        'post': 'post',
        'wizard/llc-opening': 'wizard/llc-apertura',
        'wizard/llc-renewal': 'wizard/llc-renovacion',
        'wizard/bank-account': 'wizard/cuenta-bancaria'
      };
      return englishToSpanish[route] || route;
    } else {
      // Mapear de español a inglés
      const spanishToEnglish: { [key: string]: string } = {
        '': 'home', // Raíz en español mapea a 'home' en inglés
        'inicio': 'home', // Mantener compatibilidad con rutas antiguas
        'nosotros': 'about-us',
        'contacto': 'contact',
        'planes': 'plans',
        'blog': 'blog',
        'aviso-de-privacidad': 'privacy-policy',
        'terminos-y-condiciones': 'terms-and-conditions',
        'abre-tu-llc': 'llc-formation',
        'presentacion': 'presentation',
        'apertura-banco-relay': 'relay-account-opening',
        'agendar': 'schedule',
        'apertura-llc': 'llc-opening',
        'renovar-llc': 'llc-renewal',
        'form-apertura-relay': 'relay-opening-form',
        'fixcal': 'fixcal',
        'abotax': 'abotax',
        'category': 'category',
        'post': 'post',
        'wizard/llc-apertura': 'wizard/llc-opening',
        'wizard/llc-renovacion': 'wizard/llc-renewal',
        'wizard/cuenta-bancaria': 'wizard/bank-account'
      };
      return spanishToEnglish[route] || route;
    }
  }

  getLangFromUrl(url?: string): string | null {
    try {
      const u = url ?? (this.router && this.router.url) ?? '/';
      const tree = this.router.parseUrl(u);
      const primary = tree.root.children['primary'];
      const segs = primary ? primary.segments.map((s) => s.path) : [];
      return segs.length > 0 && this.availableLangs.includes(segs[0])
        ? segs[0]
        : null;
    } catch {
      return null;
    }
  }
}
