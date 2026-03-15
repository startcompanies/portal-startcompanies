import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import { Translation, TranslocoLoader } from "@jsverse/transloco";
import { HttpClient } from "@angular/common/http";
import { isPlatformBrowser } from "@angular/common";
import { Observable, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { BrowserService } from "./shared/services/browser.service";

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
    private http = inject(HttpClient);
    private platformId = inject(PLATFORM_ID);
    private browser = inject(BrowserService);

    getTranslation(lang: string): Observable<Translation> {
        // En SSR, leer desde el sistema de archivos
        if (!isPlatformBrowser(this.platformId)) {
            try {
                // Importante: evitar `require('fs')` / `require('path')` estático, porque rompe el build de navegador.
                // Esto solo se ejecuta en SSR, pero el bundler intenta resolver esos módulos si el require es estático.
                const req = (0, eval)('require') as NodeRequire;
                const fs = req('fs');
                const path = req('path');
                // Ruta al archivo de traducciones en el servidor
                const translationPath = path.join(process.cwd(), 'dist/portal-startcompanies/browser/assets/i18n', `${lang}.json`);
                
                if (fs.existsSync(translationPath)) {
                    const translationContent = fs.readFileSync(translationPath, 'utf8');
                    const translation = JSON.parse(translationContent);
                    return of(translation);
                } else {
                    console.warn(`Translation file not found: ${translationPath}`);
                    return of({});
                }
            } catch (error) {
                console.error(`Error loading translation for ${lang} in SSR:`, error);
                return of({});
            }
        }
        
        // En el navegador, usar HTTP con manejo de errores
        return this.http.get<Translation>(`./assets/i18n/${lang}.json`).pipe(
            catchError((err) => {
                console.error(`Error loading translation for ${lang} via HTTP:`, err);
                return of({} as Translation);
            })
        );
    }
}
