import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  // lista de idiomas soportados — ajústala si agregas más
  readonly availableLangs = ['es', 'en'];
  readonly defaultLang = 'es';

  constructor(private transloco: TranslocoService, private router: Router) {
    // al iniciar, establecer el idioma desde la URL (o el por defecto)
    const initialLang = this.getLangFromUrl();
    this.transloco.setActiveLang(initialLang || this.defaultLang);

    // suscribirse a cambios de ruta para actualizar el idioma activo
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const lang = this.router.url.split('/')[1];
        if (['es', 'en'].includes(lang)) {
          this.transloco.setActiveLang(lang);
        }
      }
    });
  }

  // getter (lectura)
  get currentLang(): string {
    const active = this.transloco.getActiveLang();
    return active || this.getLangFromUrl() || this.defaultLang;
  }

  // cambia el idioma en Transloco y (opcional) reemplaza la URL actual para reflejarlo
  async setLanguage(lang: string, replaceUrl = true): Promise<boolean> {
    if (!this.availableLangs.includes(lang)) {
      lang = this.defaultLang;
    }

    await this.transloco.setActiveLang(lang);

    return replaceUrl ? this.replaceLangInUrl(lang) : true;
  }

  // navega respetando el idioma actual (usa siempre /:lang/... )
  navigate(commands: any[], extras: any = {}): Promise<boolean> {
    const lang = this.currentLang;
    // si commands begins with '/' remove leading slash to avoid ['/', '/foo'] mismatch
    /*const normalized = commands.map((c: any) => {
      typeof c === 'string' && c.startsWith('/') ? c.replace(/^\/+/,'') : c
    });*/
    const normalized = (commands || [])
      .filter((c) => c !== undefined && c !== null) // 🔑 elimina nulos
      .map((c) => (typeof c === 'string' ? c.replace(/^\/+/, '') : c));
    return this.router.navigate(['/', lang, ...normalized], extras);
  }

  // reemplaza el primer segmento de la URL por el idioma (si ya había uno) o lo inserta.
  replaceLangInUrl(lang: string): Promise<boolean> {
    const tree = this.router.parseUrl(this.router.url || '/');
    const primary = tree.root.children['primary'];
    const segs = primary ? primary.segments.map((s) => s.path) : [];

    if (segs.length === 0) {
      // caso: estabas en `/` sin segmentos
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

  // Extra: obtener idioma desde la URL sin modificar nada
  getLangFromUrl(): string | null {
    try {
      const url = this.router.url || '/';
      const tree = this.router.parseUrl(url);
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
