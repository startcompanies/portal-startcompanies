import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FacebookPixelService } from '../../../../shared/services/facebook-pixel.service';
import { LandingStaticLpBootstrapService } from '../../../../shared/services/landing-static-lp-bootstrap.service';
import { BrowserService } from '../../../../shared/services/browser.service';

export interface AgendaCalEmbedConfig {
  containerId: string;
  namespace: string;
  calLink: string;
}

@Component({
  selector: 'app-landing-agendar',
  standalone: true,
  templateUrl: './landing-agendar.component.html',
  styleUrl: './landing-agendar.component.css',
})
export class LandingAgendarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('root', { static: false }) rootRef!: ElementRef<HTMLElement>;

  readonly calEmbed: AgendaCalEmbedConfig;

  constructor(
    private facebookPixelService: FacebookPixelService,
    private bootstrap: LandingStaticLpBootstrapService,
    private browser: BrowserService,
    private route: ActivatedRoute
  ) {
    const fromRoute = this.route.snapshot.data['agendaCal'] as
      | AgendaCalEmbedConfig
      | undefined;
    this.calEmbed =
      fromRoute ?? {
        containerId: 'my-cal-inline-agendaorganica',
        namespace: 'agendaorganica',
        calLink: 'startcompanies-businessenusa/agenda-organica',
      };
  }

  ngOnInit(): void {
    if (this.browser.isBrowser) {
      document.body.classList.add('lp-campaign-page');
    }
    this.facebookPixelService.initializePixel('llc');
    this.facebookPixelService.trackViewContent('Agendar consulta', 'LLC Services');
    this.route.queryParams.subscribe(() => {
      if (this.browser.isBrowser) {
        this.updateUrlForCalCom();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.browser.isBrowser) {
      document.body.classList.remove('lp-campaign-page');
    }
  }

  /**
   * Scroll al embed de Cal (evita `href="#id"` con `<base href="/">`, que navega a `/#id` = home).
   */
  scrollToCalendarEmbed(event: Event, highlightUrgencyCard = false): void {
    event.preventDefault();
    if (highlightUrgencyCard) {
      const t = event.currentTarget as HTMLElement | null;
      const scard = t?.closest('.scard');
      if (scard instanceof HTMLElement) {
        scard.style.outline = '2px solid rgba(0,106,254,0.5)';
      }
    }
    const doc = this.browser.document;
    if (!doc) {
      return;
    }
    const el = doc.getElementById('calendly-container');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  ngAfterViewInit(): void {
    if (!this.browser.isBrowser) {
      return;
    }
    setTimeout(() => {
      this.bootstrap.initAgendaCalEmbed(
        this.calEmbed.containerId,
        this.calEmbed.calLink,
        this.calEmbed.namespace
      );
      const host = this.rootRef?.nativeElement;
      if (host) {
        this.attachAgendarAnimations(host);
      }
    }, 0);
  }

  private updateUrlForCalCom(): void {
    const win = this.browser.window;
    if (!win) {
      return;
    }
    const params = this.route.snapshot.queryParams;
    const firstName = params['firstname'] ?? '';
    const lastName = params['lastname'] ?? '';
    const fullName = `${firstName} ${lastName}`.trim();
    const email = params['email'] ?? '';
    const crm = params['crm'] ?? '';
    if (!fullName && !email && !crm) {
      return;
    }
    const url = new URL(win.location.href);
    if (fullName) {
      url.searchParams.set('name', fullName);
    }
    if (email) {
      url.searchParams.set('email', email);
    }
    if (crm) {
      url.searchParams.set('idcrm', crm);
    }
    win.history.replaceState({}, '', url.toString());
  }

  private attachAgendarAnimations(host: HTMLElement): void {
    const win = this.browser.window;
    if (!win) {
      return;
    }

    const animateCounter = (
      el: HTMLElement,
      target: number,
      duration: number,
      decimals: boolean,
      resetVal: string
    ) => {
      if ((el as unknown as { _animating?: boolean })._animating) {
        return;
      }
      (el as unknown as { _animating: boolean })._animating = true;
      const startTime = win.performance.now();
      const update = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;
        if (decimals) {
          el.textContent = current.toFixed(1);
        } else {
          const rounded = Math.floor(current);
          el.textContent = rounded >= 1000 ? '1,000' : String(rounded);
        }
        if (progress < 1) {
          win.requestAnimationFrame(update);
        } else {
          el.textContent = decimals
            ? target.toFixed(1)
            : target >= 1000
              ? '1,000'
              : String(target);
          (el as unknown as { _animating: boolean })._animating = false;
        }
      };
      win.requestAnimationFrame(update);
    };

    const setupCounter = (
      boxId: string,
      elId: string,
      target: number,
      duration: number,
      decimals: boolean,
      resetVal: string
    ) => {
      const el = host.querySelector(`#${elId}`) as HTMLElement | null;
      const box = host.querySelector(`#${boxId}`) as HTMLElement | null;
      if (!el || !box) {
        return;
      }
      win.setTimeout(() => animateCounter(el, target, duration, decimals, resetVal), 300);
      box.addEventListener('mouseenter', () => {
        el.textContent = resetVal;
        (el as unknown as { _animating?: boolean })._animating = false;
        animateCounter(el, target, duration, decimals, resetVal);
      });
      box.addEventListener('click', () => {
        el.textContent = resetVal;
        (el as unknown as { _animating?: boolean })._animating = false;
        animateCounter(el, target, duration, decimals, resetVal);
      });
    };

    setupCounter('llc-count-box', 'llc-counter', 1000, 2000, false, '0');
    setupCounter('tp-count-box', 'tp-counter', 4.9, 1600, true, '0.0');
    setupCounter('rev-count-box', 'rev-counter', 200, 1800, false, '0');
    setupCounter('days-count-box', 'days-counter', 7, 1000, false, '1');
    setupCounter('remote-count-box', 'remote-counter', 100, 1400, false, '0');

    const bar = host.querySelector('#slots-bar-fill') as HTMLElement | null;
    const label = host.querySelector('#slots-label-count') as HTMLElement | null;
    const dots = host.querySelector('#slots-dots') as HTMLElement | null;
    if (!bar || !label || !dots) {
      return;
    }
    const TOTAL = 14;
    const TAKEN = 10;
    dots.innerHTML = '';
    for (let i = 0; i < TOTAL; i++) {
      const d = win.document.createElement('div');
      d.className = 'slot-dot avail';
      d.id = `sdot-${i}`;
      dots.appendChild(d);
    }
    bar.style.transition = 'none';
    bar.style.width = '0%';
    label.textContent = `0 / ${TOTAL}`;
    let filled = 0;
    const step = () => {
      if (filled >= TAKEN) {
        return;
      }
      const dot = host.querySelector(`#sdot-${filled}`);
      if (dot) {
        dot.classList.remove('avail');
        dot.classList.add('taken');
      }
      filled++;
      const pct = Math.round((filled / TOTAL) * 100);
      bar.style.transition = 'width 0.1s ease';
      bar.style.width = `${pct}%`;
      label.textContent = `${filled} / ${TOTAL}`;
      win.setTimeout(step, 130);
    };
    win.setTimeout(step, 700);
  }
}
