import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import { BrowserService } from '../../../shared/services/browser.service';
import { PANEL_LANG_STORAGE_KEY, PANEL_USER_PREFERENCES_STORAGE_KEY } from './panel-storage-keys';

export type PanelTheme = 'light' | 'dark' | 'auto';

export interface PanelUserPreferences {
  language: 'es' | 'en';
  theme: PanelTheme;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    requestUpdates: boolean;
    documentUploads: boolean;
  };
}

/**
 * Preferencias de usuario del panel (idioma, tema, zona, notificaciones) sincronizadas con GET/PATCH /panel/settings/preferences.
 */
@Injectable({ providedIn: 'root' })
export class PanelPreferencesService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly transloco = inject(TranslocoService);
  private readonly browser = inject(BrowserService);

  private readonly prefsSubject = new BehaviorSubject<PanelUserPreferences | null>(null);
  readonly preferences$ = this.prefsSubject.asObservable();

  private themeMediaQuery: MediaQueryList | null = null;
  private themeListener: (() => void) | null = null;

  private loadInFlight: Promise<PanelUserPreferences | null> | null = null;

  private get apiUrl(): string {
    return environment.apiUrl || 'http://localhost:3000';
  }

  ngOnDestroy(): void {
    this.detachAutoThemeListener();
  }

  getCurrent(): PanelUserPreferences | null {
    return this.prefsSubject.value;
  }

  isPushEnabled(): boolean {
    const n = this.prefsSubject.value?.notifications;
    return n?.push !== false;
  }

  /**
   * GET preferencias y aplicar idioma + tema + caché local.
   */
  async loadFromApi(): Promise<PanelUserPreferences | null> {
    if (this.loadInFlight) {
      return this.loadInFlight;
    }
    this.loadInFlight = firstValueFrom(
      this.http
        .get<PanelUserPreferences>(`${this.apiUrl}/panel/settings/preferences`, {
          withCredentials: true,
        })
        .pipe(catchError(() => of(null))),
    ).then((body) => {
      if (body) {
        this.applyPreferences(body);
        this.persistLocal(body);
      }
      return body;
    }).finally(() => {
      this.loadInFlight = null;
    });
    return this.loadInFlight;
  }

  /**
   * PATCH parcial o completo; devuelve preferencias actualizadas o null si falla.
   */
  async saveToApi(
    body: Partial<{
      language: 'es' | 'en';
      theme: PanelTheme;
      timezone: string;
      notifications: Partial<PanelUserPreferences['notifications']>;
    }>,
  ): Promise<PanelUserPreferences | null> {
    const updated = await firstValueFrom(
      this.http
        .patch<PanelUserPreferences>(`${this.apiUrl}/panel/settings/preferences`, body, {
          withCredentials: true,
        })
        .pipe(catchError(() => of(null))),
    );
    if (updated) {
      this.applyPreferences(updated);
      this.persistLocal(updated);
    }
    return updated;
  }

  applyPreferences(prefs: PanelUserPreferences): void {
    this.prefsSubject.next(prefs);
    if (prefs.language === 'es' || prefs.language === 'en') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PANEL_LANG_STORAGE_KEY, prefs.language);
      }
      this.transloco.setActiveLang(prefs.language);
    }
    this.applyTheme(prefs.theme);
  }

  persistLocal(prefs: PanelUserPreferences): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(PANEL_USER_PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }

  readLocalFallback(): PanelUserPreferences | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const raw = localStorage.getItem(PANEL_USER_PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as PanelUserPreferences;
    } catch {
      return null;
    }
  }

  applyTheme(theme: PanelTheme | undefined): void {
    const win = this.browser.window;
    if (!win) {
      return;
    }
    const root = win.document.documentElement;
    this.detachAutoThemeListener();
    const t = theme ?? 'light';
    if (t === 'auto') {
      const mq = win.matchMedia('(prefers-color-scheme: dark)');
      this.themeMediaQuery = mq;
      const apply = (): void => {
        root.setAttribute('data-bs-theme', mq.matches ? 'dark' : 'light');
      };
      apply();
      mq.addEventListener('change', apply);
      this.themeListener = (): void => mq.removeEventListener('change', apply);
    } else {
      root.setAttribute('data-bs-theme', t === 'dark' ? 'dark' : 'light');
    }
  }

  private detachAutoThemeListener(): void {
    if (this.themeListener) {
      this.themeListener();
      this.themeListener = null;
    }
    this.themeMediaQuery = null;
  }
}
