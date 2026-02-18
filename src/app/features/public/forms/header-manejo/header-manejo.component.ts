import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';
import { LangRouterLinkDirective } from '../../../../shared/directives/lang-router-link.directive';
import { LanguageService } from '../../../../shared/services/language.service';
import { ScrollService } from '../../../../shared/services/scroll.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header-manejo',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    ResponsiveImageComponent,
    LangRouterLinkDirective,
  ],
  templateUrl: './header-manejo.component.html',
  styleUrl: './header-manejo.component.css',
})
export class HeaderManejoComponent implements OnDestroy {
  isOpen: boolean = false;
  currentRoute: string = '';
  private routerSubscription?: Subscription;

  // Configuración de imágenes del logo para NgOptimizedImage
  // Usar logo gris como en el header principal cuando está en modo scroll
  logoImages = {
    mobile: '/assets/logo-grey-mobile.webp',
    tablet: '/assets/logo-grey-tablet.webp',
    desktop: '/assets/logo-grey-desktop.webp',
    fallback: '/assets/logo-grey.png',
    alt: 'Start Companies Logo',
    priority: true,
  };

  constructor(
    private router: Router,
    private scrollService: ScrollService,
    public translocoService: TranslocoService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.getCurrentRoute();
  }

  /**
   * Obtiene la ruta actual
   */
  private getCurrentRoute(): void {
    // Obtener la ruta inicial
    this.currentRoute = this.router.url;

    // Suscribirse solo a NavigationEnd para evitar múltiples logs
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentRoute = this.router.url;
        // Log removido para evitar spam en consola
      });
  }

  ngOnDestroy(): void {
    // Desuscribirse de los eventos del router
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  /**
   * Verifica si una ruta está activa
   * @param route - La ruta a verificar
   * @returns boolean - true si la ruta está activa
   */
  public isRouteActive(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route);
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  navigateToPlansSection() {
    /*this.router.navigate(['/planes']).then(() => {
      // Damos un pequeño delay para que Angular pinte el DOM
      setTimeout(() => {
        // Aquí puedes agregar la lógica para hacer scroll si es necesario
      }, 50);
    });*/
    // Usamos languageService.navigate para mantener /:lang/planes
    this.languageService.navigate(['planes']).then(() => {
      setTimeout(() => {
        this.scrollService.scrollTo('pricingSection');
      }, 50);
    });
  }
}
