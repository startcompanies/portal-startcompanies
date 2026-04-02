import { AsyncPipe } from '@angular/common';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, Subscription, combineLatest, map, startWith } from 'rxjs';
import { ImagePreloaderComponent } from '../shared/components/image-preloader/image-preloader.component';
import { WhatsappFloatComponent } from '../shared/components/whatsapp-float/whatsapp-float.component';
import { LanguageService } from '../shared/services/language.service';
import { CarouselSwipeService } from '../shared/services/carousel-swipe.service';
import { FacebookPixelService } from '../shared/services/facebook-pixel.service';
import { AuthService } from '../features/panel/services/auth.service';

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
  imports: [RouterOutlet, ImagePreloaderComponent, WhatsappFloatComponent, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'portal-startcompanies';
  private routerSubscription: Subscription | null = null;

  private readonly languageService = inject(LanguageService);
  private readonly carouselSwipeService = inject(CarouselSwipeService);
  private readonly router = inject(Router);
  private readonly facebookPixelService = inject(FacebookPixelService);
  private readonly authService = inject(AuthService);

  /** Pantalla completa en /panel hasta resolver la primera /auth/me (evita flash login en F5). */
  readonly panelAuthSplash$ = combineLatest([
    this.authService.authReady$,
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => isPanelUrl(e.urlAfterRedirects?.split('?')[0] ?? '')),
      startWith(isPanelUrl(this.router.url.split('?')[0] ?? '')),
    ),
  ]).pipe(map(([ready, panel]) => panel && !ready));

  get initialTranslationsReady$() {
    return this.languageService.initialTranslationsReady$;
  }

  ngOnInit(): void {
    this.carouselSwipeService.init();
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
