import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PanelPreferencesService } from './panel-preferences.service';
import { PANEL_LANG_STORAGE_KEY } from './panel-storage-keys';

const STORAGE_KEY_MODAL_SHOWN = 'panel_lang_modal_shown';

/** Re-export para compatibilidad con imports existentes. */
export { PANEL_LANG_STORAGE_KEY } from './panel-storage-keys';

export type PanelLang = 'es' | 'en';

export interface UserPreferencesResponse {
  language: 'es' | 'en';
  theme?: string;
  timezone?: string;
  notifications?: Record<string, boolean>;
}

/**
 * Servicio de idioma del panel.
 * Lee/guarda la preferencia en localStorage y opcionalmente en la API (GET/PATCH preferencias).
 * Por defecto español. El modal de primera vez se muestra cuando no hay idioma configurado.
 */
@Injectable({ providedIn: 'root' })
export class PanelLanguageService {
  private readonly transloco = inject(TranslocoService);
  private readonly http = inject(HttpClient);
  private readonly panelPreferences = inject(PanelPreferencesService);

  private get apiUrl(): string {
    return environment.apiUrl || 'http://localhost:3000';
  }

  /** Idioma por defecto del panel */
  readonly defaultLang: PanelLang = 'es';

  /**
   * Obtiene el idioma preferido del panel desde localStorage.
   * Si no hay valor guardado, devuelve el idioma por defecto (es).
   */
  getPreferredLang(): PanelLang {
    if (typeof localStorage === 'undefined') {
      return this.defaultLang;
    }
    const stored = localStorage.getItem(PANEL_LANG_STORAGE_KEY);
    if (stored === 'es' || stored === 'en') {
      return stored;
    }
    return this.defaultLang;
  }

  /**
   * Guarda la preferencia de idioma en localStorage, aplica Transloco y opcionalmente en la API.
   */
  setPreferredLang(lang: PanelLang, options?: { skipApi?: boolean }): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(PANEL_LANG_STORAGE_KEY, lang);
    this.transloco.setActiveLang(lang);
    if (!options?.skipApi) {
      this.savePreferencesToApi(lang).catch(() => {});
    }
  }

  /**
   * Aplica el idioma guardado a Transloco (llamar al entrar al panel).
   */
  applyStoredLanguage(): void {
    const lang = this.getPreferredLang();
    this.transloco.setActiveLang(lang);
  }

  /**
   * Carga preferencias desde la API y, si hay idioma, lo aplica y guarda en localStorage.
   * Útil al entrar al panel para sincronizar con otro dispositivo.
   * @returns Promise que se resuelve cuando terminó la carga (éxito o fallo).
   */
  loadPreferencesFromApi(): Promise<void> {
    if (typeof localStorage === 'undefined') {
      return Promise.resolve();
    }
    return this.panelPreferences.loadFromApi().then(() => {}).catch(() => {});
  }

  /**
   * Envía el idioma a la API (PATCH preferencias). Se llama al guardar desde modal o Settings.
   */
  savePreferencesToApi(lang: PanelLang): Promise<void> {
    return firstValueFrom(
      this.http
        .patch<UserPreferencesResponse>(
          `${this.apiUrl}/panel/settings/preferences`,
          { language: lang },
          { withCredentials: true },
        )
        .pipe(catchError(() => of(null))),
    ).then(() => {}).catch(() => {});
  }

  /**
   * Indica si debe mostrarse el modal de elección de idioma (idioma no configurado).
   * Se muestra cuando no hay preferencia guardada en localStorage (ni desde API ni elegida por el usuario).
   */
  shouldShowLanguageModal(): boolean {
    if (typeof localStorage === 'undefined') {
      return false;
    }
    const shown = localStorage.getItem(STORAGE_KEY_MODAL_SHOWN);
    if (shown === 'true') {
      return false;
    }
    const lang = localStorage.getItem(PANEL_LANG_STORAGE_KEY);
    return lang !== 'es' && lang !== 'en';
  }

  /**
   * Marca que el modal de idioma ya fue mostrado (para no volver a mostrarlo).
   */
  setLanguageModalShown(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(STORAGE_KEY_MODAL_SHOWN, 'true');
  }

  /**
   * Al elegir idioma en el modal: guardar, aplicar, marcar modal como mostrado y persistir en API.
   */
  chooseLanguage(lang: PanelLang): void {
    this.setPreferredLang(lang);
    this.setLanguageModalShown();
  }
}
