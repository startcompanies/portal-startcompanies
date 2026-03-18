import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import { Translation, TranslocoLoader } from "@jsverse/transloco";
import { HttpClient } from "@angular/common/http";
import { isPlatformBrowser } from "@angular/common";
import { Observable, of, from } from "rxjs";
import { catchError } from "rxjs/operators";
import { BrowserService } from "./shared/services/browser.service";

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
    private http = inject(HttpClient);
    private platformId = inject(PLATFORM_ID);
    private browser = inject(BrowserService);

    getTranslation(lang: string): Observable<Translation> {
        if (!this.browser.isBrowser) {
            // SSR: cargar con import() dinámico (require no existe en el bundle ESM del servidor)
            return from(
                (async (): Promise<Translation> => {
                    try {
                        const fs = await import('node:fs');
                        const path = await import('node:path');
                        const distRoot = path.join(process.cwd(), 'dist/portal-startcompanies');
                        const candidates = [
                            path.join(distRoot, 'browser/assets/i18n', `${lang}.json`),
                            path.join(distRoot, 'assets/i18n', `${lang}.json`),
                        ];
                        for (const translationPath of candidates) {
                            if (fs.existsSync(translationPath)) {
                                const content = fs.readFileSync(translationPath, 'utf8');
                                return JSON.parse(content) as Translation;
                            }
                        }
                        return {};
                    } catch (err) {
                        console.error(`Error loading translation for ${lang} in SSR:`, err);
                        return {};
                    }
                })()
            );
        }
        return this.http.get<Translation>(`./assets/i18n/${lang}.json`).pipe(
            catchError((err) => {
                console.error(`Error loading translation for ${lang} via HTTP:`, err);
                return of({} as Translation);
            })
        );
    }
}
