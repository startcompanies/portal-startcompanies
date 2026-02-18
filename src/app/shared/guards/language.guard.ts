import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LanguageService } from '../services/language.service';

export const languageGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const languageService = inject(LanguageService);

  // segmentos de la URL que pidió el usuario
  const url = state.url.split('/').filter(seg => seg.length > 0);
  const lang = url.length > 0 ? url[0] : null;

  console.log('[LanguageGuard] URL:', state.url, 'Segments:', url, 'Lang:', lang);

  // si el primer segmento ya es idioma válido, todo bien
  if (lang && languageService.availableLangs.includes(lang)) {
    console.log('[LanguageGuard] Valid language detected, allowing access');
    return true;
  }

  // si NO hay idioma → para español (defaultLang) no redirigir, para otros sí
  const targetLang = languageService.defaultLang;
  
  // Si es español (raíz), permitir acceso directo
  if (targetLang === 'es') {
    console.log('[LanguageGuard] Spanish root route, allowing access');
    return true;
  }
  
  // Para otros idiomas, redirigir con prefijo
  console.log('[LanguageGuard] Redirecting to:', `/${targetLang}`, ...url);
  return router.createUrlTree([`/${targetLang}`, ...url]);
};
