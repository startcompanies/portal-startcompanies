import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, Subscription, take } from 'rxjs';
import { ImagePreloaderComponent } from '../shared/components/image-preloader/image-preloader.component';
import { WhatsappFloatComponent } from '../shared/components/whatsapp-float/whatsapp-float.component';
import { CarouselSwipeService } from '../shared/services/carousel-swipe.service';
import { FacebookPixelService } from '../shared/services/facebook-pixel.service';
import { AuthService } from '../features/panel/services/auth.service';
import { BrowserService } from '../shared/services/browser.service';

/** Rutas que son Landing Pages (LP): el pixel lo gestiona cada LP, no el flujo global. */
const LANDING_PATHS = new Set([
  'abre-tu-llc', 'presentacion', 'evaluar-caso', 'asesoria-llc', 'llc-7-dias',
  'apertura-banco-relay', 'agenda', 'agendar', 'rescate-relay',
  'llc-formation', 'presentation', 'evaluate-case', 'llc-consultation', 'llc-7-days',
  'relay-account-opening', 'schedule'
]);

function isLandingPageUrl(url: string): boolean {
  const segments = url.replace(/^\//, '').split('/').filter(Boolean);
  if (segments.length === 0) return false;
  const first = segments[0];
  if (first === 'en' && segments.length > 1) {
    return LANDING_PATHS.has(segments[1]);
  }
  return LANDING_PATHS.has(first);
}

function isPanelUrl(url: string): boolean {
  return url.startsWith('/panel');
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ImagePreloaderComponent, WhatsappFloatComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'portal-startcompanies';
  private routerSubscription: Subscription | null = null;

  private readonly carouselSwipeService = inject(CarouselSwipeService);
  private readonly router = inject(Router);
  private readonly facebookPixelService = inject(FacebookPixelService);
  private readonly authService = inject(AuthService);
  private readonly browser = inject(BrowserService);

  ngOnInit(): void {
    this.carouselSwipeService.init();

    /**
     * Elimina el #app-boot-splash del index.html cuando /auth/me resuelve.
     * El splash solo está visible en rutas /panel (el script inline del index.html
     * lo activa condicionalmente según location.pathname al parsear el HTML).
     */
    this.authService.authReady$.pipe(
      filter(Boolean),
      take(1),
    ).subscribe(() => {
      const el = this.browser.window?.document?.getElementById('app-boot-splash');
      if (el) {
        el.style.transition = 'opacity .2s ease';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 220);
      }
    });

    this.routerSubscription = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      const url = e.urlAfterRedirects?.split('?')[0] ?? '';
      if (isPanelUrl(url) || isLandingPageUrl(url)) {
        return;
      }
      this.facebookPixelService.initializePixel('llc', { skipAutoPageView: true });
      this.facebookPixelService.trackEvent('PageView');
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }
}
