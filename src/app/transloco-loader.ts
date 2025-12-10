import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import { Translation, TranslocoLoader } from "@jsverse/transloco";
import { HttpClient } from "@angular/common/http";

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
    private http = inject(HttpClient);

    getTranslation(lang: string) {
        // Usar ruta relativa que funciona tanto en browser como en SSR
        // En SSR, Express puede resolver rutas relativas correctamente desde el directorio browser
        return this.http.get<Translation>(`./assets/i18n/${lang}.json`);
    }
}
