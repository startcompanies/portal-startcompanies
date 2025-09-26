import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LanguageService } from '../../services/language.service';

export const languageGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const languageService = inject(LanguageService);

  // segmentos de la URL que pidió el usuario
  const url = state.url.split('/').filter(seg => seg.length > 0);
  const lang = url.length > 0 ? url[0] : null;

  // si el primer segmento ya es idioma válido, todo bien
  if (lang && languageService.availableLangs.includes(lang)) {
    return true;
  }

  // si NO hay idioma → redirigir a defaultLang
  const targetLang = languageService.defaultLang;
  return router.createUrlTree([`/${targetLang}`, ...url]);
};
