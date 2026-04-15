import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/** GTM exclusivo de landings de campaña (Google Ads / YouTube); no va en `index.html`. */
const GTM_ID = 'GTM-N7C63SHM';
const SCRIPT_ID = 'gtm-lp-campaign-n7c63shm';
const NOSCRIPT_ID = 'gtm-lp-campaign-n7c63shm-noscript';

/**
 * Inserta y retira el snippet de Google Tag Manager para landings LP YouTube / Google.
 * Usa el mismo `dataLayer` que el GTM global del sitio (compatible con contenedor estándar).
 */
@Injectable({ providedIn: 'root' })
export class LandingLpGtmService {
  private readonly doc = inject(DOCUMENT);

  /** Carga gtm.js y el iframe noscript si aún no están en el DOM. */
  enable(): void {
    const d = this.doc;
    if (!d.defaultView || d.getElementById(SCRIPT_ID)) {
      return;
    }

    const boot = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`;

    const script = d.createElement('script');
    script.id = SCRIPT_ID;
    script.textContent = boot;
    d.head.appendChild(script);

    const noscript = d.createElement('noscript');
    noscript.id = NOSCRIPT_ID;
    const iframe = d.createElement('iframe');
    iframe.setAttribute('src', `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`);
    iframe.setAttribute('height', '0');
    iframe.setAttribute('width', '0');
    iframe.setAttribute('style', 'display:none;visibility:hidden');
    noscript.appendChild(iframe);
    if (d.body.firstChild) {
      d.body.insertBefore(noscript, d.body.firstChild);
    } else {
      d.body.appendChild(noscript);
    }
  }

  /** Quita script e iframe añadidos por esta LP (al salir de la ruta). */
  disable(): void {
    const d = this.doc;
    d.getElementById(SCRIPT_ID)?.remove();
    d.getElementById(NOSCRIPT_ID)?.remove();
  }
}
