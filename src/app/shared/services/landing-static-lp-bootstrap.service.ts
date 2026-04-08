import { Injectable } from '@angular/core';
import { BrowserService } from './browser.service';

/**
 * Carga Wistia web components, embeds y scripts de interacción para landings estáticas (HTML portado).
 * Evita duplicar player.js / embeds al navegar en SPA.
 */
type CalGlobalFn = (...args: unknown[]) => void;

/** Cal global tras cargar embed.js (index.html): stub + opcionalmente `ns` por namespace. */
type CalWithNs = CalGlobalFn & { ns?: Record<string, CalGlobalFn> };

@Injectable({ providedIn: 'root' })
export class LandingStaticLpBootstrapService {
  private wistiaPlayerPromise: Promise<void> | null = null;
  private readonly embedScriptsLoaded = new Set<string>();
  /** Evita registrar dos veces el mismo listener de Cal si `setupCampaignLp` se repite sobre el mismo host. */
  private readonly calDataLinkWiredHosts = new WeakSet<HTMLElement>();

  constructor(private browser: BrowserService) {}

  /** Meta Pixel: usar FacebookPixelService desde el componente; aquí solo Wistia + Cal + observers. */
  setupCampaignLp(host: HTMLElement): void {
    const doc = this.browser.document;
    const win = this.browser.window;
    if (!doc || !win) {
      return;
    }

    void this.ensureWistiaPlayerJs().then(() => {
      this.loadWistiaEmbedsIn(host);
    });

    /**
     * Cal.com en esta app (coherente con HTML estático y con otras vistas):
     * - `index.html`: carga `embed.js` + `Cal("init", "agenda-organica", …)` + `Cal("init", { origin })` (blog, etc.).
     * - `initAgendaCalEmbed()`: embed inline en contenedor (p. ej. landing-agendar).
     * - Aquí: popup en LPs campaña; el DOM de la ruta Angular se monta después del embed, así que enlazamos
     *   clics a `modal` (y namespace si aplica, como en `blog-post-hero`).
     */
    this.wireCalDataLinkClicks(host);

    this.attachCampaignInteractions(host);
  }

  private wireCalDataLinkClicks(host: HTMLElement): void {
    const win = this.browser.window;
    if (!win) {
      return;
    }
    if (this.calDataLinkWiredHosts.has(host)) {
      return;
    }
    this.calDataLinkWiredHosts.add(host);

    /**
     * El embed registra `document.addEventListener("click", …)` en fase **bubble** y abre modal al
     * detectar `data-cal-link`. Nosotros también llamamos a `Cal('modal')` → dos modales apilados.
     * Listener en **capture** en el host + `stopPropagation`: el evento no llega al bubble de
     * `document`, Cal no duplica; solo queda nuestro modal.
     */
    host.addEventListener(
      'click',
      (ev: MouseEvent) => {
        const t = ev.target;
        if (!(t instanceof Element)) {
          return;
        }
        const trigger = t.closest('[data-cal-link]');
        if (!trigger || !host.contains(trigger)) {
          return;
        }
        ev.preventDefault();
        ev.stopPropagation();

        const calLink = trigger.getAttribute('data-cal-link');
        if (!calLink) {
          return;
        }
        let calOrigin =
          trigger.getAttribute('data-cal-origin')?.trim() || 'https://app.cal.com';
        if (calOrigin === 'https://cal.com') {
          calOrigin = 'https://app.cal.com';
        }
        let config: Record<string, unknown> = { layout: 'month_view', theme: 'light' };
        const rawConfig = trigger.getAttribute('data-cal-config');
        if (rawConfig) {
          try {
            config = { ...config, ...JSON.parse(rawConfig) };
          } catch {
            /* ignore invalid JSON */
          }
        }

        const modalPayload = { calLink, calOrigin, config };
        const CalRoot = (win as unknown as { Cal?: CalWithNs }).Cal;
        if (typeof CalRoot !== 'function') {
          return;
        }
        const ns = trigger.getAttribute('data-cal-namespace')?.trim();
        if (ns && CalRoot.ns?.[ns]) {
          CalRoot.ns[ns]('modal', modalPayload);
        } else {
          CalRoot('modal', modalPayload);
        }
      },
      true
    );
  }

  private ensureWistiaPlayerJs(): Promise<void> {
    const doc = this.browser.document;
    if (!doc) {
      return Promise.resolve();
    }
    if (doc.querySelector('script[src*="fast.wistia.com/player.js"]')) {
      return Promise.resolve();
    }
    if (this.wistiaPlayerPromise) {
      return this.wistiaPlayerPromise;
    }
    this.wistiaPlayerPromise = new Promise((resolve) => {
      const s = doc.createElement('script');
      s.src = 'https://fast.wistia.com/player.js';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => resolve();
      doc.head.appendChild(s);
    });
    return this.wistiaPlayerPromise;
  }

  private loadWistiaEmbedsIn(host: HTMLElement): void {
    const doc = this.browser.document;
    if (!doc) {
      return;
    }
    host.querySelectorAll('wistia-player[media-id]').forEach((el) => {
      const id = el.getAttribute('media-id');
      if (!id || this.embedScriptsLoaded.has(id)) {
        return;
      }
      this.embedScriptsLoaded.add(id);
      const embed = doc.createElement('script');
      embed.src = `https://fast.wistia.com/embed/${id}.js`;
      embed.async = true;
      embed.type = 'module';
      embed.onerror = () => undefined;
      doc.head.appendChild(embed);
    });
  }

  /**
   * Embed inline Cal.com (páginas agenda / quiero-mi-llc).
   * Misma secuencia que el widget previo en landing-agendar.
   */
  initAgendaCalEmbed(containerId: string, calLink: string, namespace: string): void {
    const doc = this.browser.document;
    if (!doc || doc.getElementById(`cal-agenda-embed-${namespace}`)) {
      return;
    }
    const script = doc.createElement('script');
    script.id = `cal-agenda-embed-${namespace}`;
    script.type = 'text/javascript';
    script.text = `
(function (C, A, L) {
  let p = function (a, ar) { a.q.push(ar); };
  let d = C.document;
  C.Cal = C.Cal || function () {
    let cal = C.Cal;
    let ar = arguments;
    if (!cal.loaded) {
      cal.ns = {};
      cal.q = cal.q || [];
      d.head.appendChild(d.createElement("script")).src = A;
      cal.loaded = true;
    }
    if (ar[0] === L) {
      const api = function () { p(api, arguments); };
      const namespace = ar[1];
      api.q = [];
      if(typeof namespace === "string"){
        cal.ns[namespace] = cal.ns[namespace] || api;
        p(cal.ns[namespace], ar);
        p(cal, ["initNamespace", namespace]);
      } else p(cal, ar);
      return;
    }
    p(cal, ar);
  };
})(window, "https://app.cal.com/embed/embed.js", "init");

Cal.config = Cal.config || {};
Cal.config.forwardQueryParams = true;

Cal("init", "${namespace}", {origin:"https://app.cal.com"});

Cal.ns.${namespace}("inline", {
  elementOrSelector:"#${containerId}",
  config: {"layout":"month_view","theme":"light"},
  calLink: "${calLink}"
});

Cal.ns.${namespace}("ui", {
  "theme":"light",
  "cssVarsPerTheme":{
    "light":{"cal-brand":"#006AFE"},
    "dark":{"cal-brand":"#fafafa"}
  },
  "hideEventTypeDetails":false,
  "layout":"month_view"
});
`.trim();
    doc.head.appendChild(script);
  }

  private attachCampaignInteractions(host: HTMLElement): void {
    const win = this.browser.window;
    const g = globalThis;
    if (!win || !g.IntersectionObserver) {
      return;
    }

    const obs = new g.IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    host.querySelectorAll('.fu').forEach((el) => obs.observe(el));

    const stickyBar = host.querySelector('.sticky-bar');
    const heroCta = host.querySelector('.cta-group .btn-gold');
    if (stickyBar && heroCta) {
      const stickyObs = new g.IntersectionObserver(
        (entries: IntersectionObserverEntry[]) => {
          const entry = entries[0];
          if (entry) {
            stickyBar.classList.toggle('visible', !entry.isIntersecting);
          }
        },
        { threshold: 0 }
      );
      stickyObs.observe(heroCta);
    }

    const pasoObs = new g.IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            pasoObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    host.querySelectorAll('.paso').forEach((el) => pasoObs.observe(el));

    const anObs = new g.IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        const entry = entries[0];
        if (entry?.isIntersecting && entry.target instanceof HTMLElement) {
          entry.target.querySelectorAll('.analisis-item').forEach((item, i) => {
            win.setTimeout(() => item.classList.add('visible'), i * 300);
          });
          anObs.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );
    host.querySelectorAll('.analisis-card').forEach((el) => anObs.observe(el));

    const animateValue = (
      el: HTMLElement,
      prefix: string,
      start: number,
      end: number,
      suffix: string,
      duration: number
    ) => {
      const range = end - start;
      const startTime = win.performance.now();
      const step = (ts: number) => {
        const progress = Math.min((ts - startTime) / duration, 1);
        const current = Math.floor(start + range * progress);
        el.textContent =
          prefix +
          (current >= 1000 ? current.toLocaleString('en-US') : String(current)) +
          suffix;
        if (progress < 1) {
          win.requestAnimationFrame(step);
        }
      };
      win.requestAnimationFrame(step);
    };

    const ctrObs = new g.IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || !(entry.target instanceof HTMLElement)) {
          return;
        }
        entry.target.querySelectorAll('.hcount').forEach((item, i) => {
          win.setTimeout(() => {
            item.classList.add('visible');
            const val = item.querySelector('.hcount-val');
            if (!(val instanceof HTMLElement)) {
              return;
            }
            const txt = val.textContent?.trim() ?? '';
            if (txt.includes('1,000')) {
              animateValue(val, '+', 0, 1000, '', 1400);
            } else if (txt.includes('4.9')) {
              animateValue(val, '', 0, 49, '/5★', 1200);
            } else if (txt.includes('100')) {
              animateValue(val, '', 0, 100, '%', 1000);
            }
          }, i * 200);
        });
        ctrObs.unobserve(entry.target);
      },
      { threshold: 0.3 }
    );
    host.querySelectorAll('.hero-counters').forEach((el) => ctrObs.observe(el));

    const cntObs = new g.IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((e) => {
          if (!e.isIntersecting || !(e.target instanceof HTMLElement)) {
            return;
          }
          const el = e.target;
          const target = +(el.dataset['count'] ?? '0');
          const suffix = el.dataset['suffix'] ?? '';
          let cur = 0;
          const inc = target / 80;
          const t = win.setInterval(() => {
            cur += inc;
            if (cur >= target) {
              el.textContent = String(target) + suffix;
              win.clearInterval(t);
            } else {
              el.textContent = String(Math.floor(cur)) + suffix;
            }
          }, 45);
          cntObs.unobserve(el);
        });
      },
      { threshold: 0.6 }
    );
    host.querySelectorAll('.stat-val[data-count]').forEach((el) =>
      cntObs.observe(el)
    );

    const notifData = [
      { name: 'Carlos D.', country: 'Colombia 🇨🇴', action: 'acaba de agendar su consulta' },
      { name: 'Andrea M.', country: 'Argentina 🇦🇷', action: 'abrió su LLC esta semana' },
      { name: 'Rodrigo V.', country: 'México 🇲🇽', action: 'acaba de agendar su consulta' },
      { name: 'Valentina L.', country: 'Perú 🇵🇪', action: 'completó su apertura de LLC' },
      { name: 'Santiago R.', country: 'Uruguay 🇺🇾', action: 'acaba de agendar su consulta' },
    ];
    let nIdx = 0;
    const showNotif = () => {
      const n = notifData[nIdx++ % notifData.length];
      const el = host.querySelector('.notif');
      if (!el) {
        return;
      }
      const txt = el.querySelector('.notif-txt');
      if (txt instanceof HTMLElement) {
        txt.innerHTML = `<strong>${n.name} · ${n.country}</strong>${n.action}`;
      }
      el.classList.add('show');
      win.setTimeout(() => {
        el.classList.remove('show');
        win.setTimeout(showNotif, 7000);
      }, 4500);
    };
    win.setTimeout(showNotif, 4000);
  }
}
