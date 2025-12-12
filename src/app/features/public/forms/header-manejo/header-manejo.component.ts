import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ResponsiveImageComponent } from '../../../../shared/components/responsive-image/responsive-image.component';
import { LangRouterLinkDirective } from '../../../../shared/directives/lang-router-link.directive';
import { LanguageService } from '../../../../shared/services/language.service';
import { ScrollService } from '../../../../shared/services/scroll.service';

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
export class HeaderManejoComponent {
  isOpen: boolean = false;
  currentRoute: string = '';

  currentLang = 'es';

  // Configuración de imágenes del logo para NgOptimizedImage
  logoImages = {
    mobile: '/assets/logo-dark-mobile.png',
    tablet: '/assets/logo-dark-tablet.png',
    desktop: '/assets/logo-dark.png',
    fallback: '/assets/logo-dark.png',
    alt: 'Start Companies Logo',
    priority: true,
  };

  constructor(
    private router: Router,
    private scrollService: ScrollService,
    public translocoService: TranslocoService,
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getCurrentRoute();
    this.currentLang = this.translocoService.getActiveLang();
  }

  /**
   * Obtiene la ruta actual
   */
  private getCurrentRoute(): void {
    // Obtener la ruta inicial
    this.currentRoute = this.router.url;

    // Suscribirse a los cambios de ruta
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
      console.log('Ruta actual:', this.currentRoute);
    });
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

  changeLanguage(lang: string) {
    // usa setLanguage que además reemplaza la URL
    this.languageService.setLanguage(lang, true).then(() => {
      this.currentLang = lang;
      // markForCheck si estás en OnPush o para seguridad visual
      this.cdr.markForCheck();
    });
  }
}
