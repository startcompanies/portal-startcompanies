// src/app/services/language.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly availableLangs = ['es', 'en'];
  readonly defaultLang = 'es';

  constructor(
    private transloco: TranslocoService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
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
    const initialUrl =
      isPlatformBrowser(this.platformId) && typeof window !== 'undefined'
        ? (window.location.pathname + (window.location.search || ''))
        : this.router.url || '/';

    const initialLang = this.getLangFromUrl(initialUrl) || this.defaultLang;

    // Logs temporales para debug — elimina en producción
    // console.log('[LanguageService] init url:', initialUrl, 'detected lang:', initialLang);

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
    return this.router.navigate(['/', lang, ...normalized], extras);
  }

  replaceLangInUrl(lang: string): Promise<boolean> {
    const url = this.router.url || '/';
    const tree = this.router.parseUrl(url);
    const primary = tree.root.children['primary'];
    const segs = primary ? primary.segments.map((s) => s.path) : [];

    if (segs.length === 0) {
      return this.router.navigate(['/', lang]);
    }

    if (this.availableLangs.includes(segs[0])) {
      segs[0] = lang;
    } else {
      segs.unshift(lang);
    }

    return this.router.navigate(['/', ...segs], {
      queryParams: tree.queryParams,
      fragment: tree.fragment ?? undefined,
    });
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
