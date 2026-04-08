import { Injectable } from '@angular/core';
import { BrowserService } from './browser.service';

/**
 * Carga Wistia web components, embeds y scripts de interacción para landings estáticas (HTML portado).
 * Evita duplicar player.js / embeds al navegar en SPA.
 */
@Injectable({ providedIn: 'root' })
export class LandingStaticLpBootstrapService {
  private wistiaPlayerPromise: Promise<void> | null = null;
  private readonly embedScriptsLoaded = new Set<string>();

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

    this.injectCalCampaignBootstrap();

    this.attachCampaignInteractions(host);
  }

  /** Cal.com como en el HTML estático (data-cal-link en CTAs). */
  private injectCalCampaignBootstrap(): void {
    const doc = this.browser.document;
    if (!doc || doc.getElementById('cal-campaign-bootstrap')) {
      return;
    }
    const s = doc.createElement('script');
    s.id = 'cal-campaign-bootstrap';
    s.type = 'text/javascript';
    s.text =
      '(function(C,A,L){let p=function(a,ar){a.q.push(ar)};let d=C.document;C.Cal=C.Cal||function(){let cal=C.Cal;let ar=arguments;if(!cal.loaded){cal.ns={};cal.q=cal.q||[];d.head.appendChild(d.createElement("script")).src=A;cal.loaded=true}if(ar[0]===L){const api=function(){p(api,arguments)};const namespace=ar[1];api.q=[];if(typeof namespace==="string"){cal.ns[namespace]=api;p(cal,["initNamespace",namespace])}else p(cal,ar);return}p(cal,ar)}})(window,"https://app.cal.com/embed/embed.js","init");\n' +
      'Cal("init",{origin:"https://cal.com"});';
    doc.head.appendChild(s);
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
