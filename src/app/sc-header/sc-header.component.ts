import {
  Component,
  HostListener,
  Inject,
  OnInit,
  PLATFORM_ID,
  ChangeDetectorRef,
} from '@angular/core';
import { SharedModule } from '../shared/shared/shared.module';
import { isPlatformBrowser } from '@angular/common';
import { ScrollService } from '../services/scroll.service';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Router, ActivatedRoute } from '@angular/router';
import { ResponsiveImageComponent } from '../shared/components/responsive-image/responsive-image.component';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-sc-header',
  standalone: true,
  imports: [SharedModule, TranslocoPipe, ResponsiveImageComponent],
  templateUrl: './sc-header.component.html',
  styleUrl: './sc-header.component.css',
})
export class ScHeaderComponent implements OnInit {
  isOpen: boolean = false;
  isNavbarShrunk: boolean = false;
  currentLang: string = 'es';
  currentRoute: string = '';

  // Usar BehaviorSubject para forzar detección de cambios
  private logoImagesSubject = new BehaviorSubject({
    mobile: "/assets/logo-mobile.webp",
    tablet: "/assets/logo-tablet.webp",
    desktop: "/assets/logo.webp",
    fallback: "/assets/logo.webp",
    alt: "Start Companies Logo",
    priority: false
  });

  // Exponer como observable para el template
  logoImages$ = this.logoImagesSubject.asObservable();

  // Getter para compatibilidad
  get logoImages() {
    return this.logoImagesSubject.value;
  }

  /**
   * Actualiza las imágenes del logo según el estado del navbar
   */
  private updateLogoImages(): void {
    const isDarkMode = this.isOpen || this.isNavbarShrunk;
    
    // Usar BehaviorSubject para forzar detección de cambios
    this.logoImagesSubject.next({
      ...this.logoImages,
      mobile: isDarkMode ? "/assets/logo-dark-mobile.webp" : "/assets/logo-mobile.webp",
      tablet: isDarkMode ? "/assets/logo-dark-tablet.webp" : "/assets/logo-tablet.webp",
      desktop: isDarkMode ? "/assets/logo-dark.webp" : "/assets/logo.webp",
      fallback: isDarkMode ? "/assets/logo-dark.webp" : "/assets/logo.webp",
    });
    
    // Forzar detección de cambios como respaldo
    this.cdr.markForCheck();
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private scrollService: ScrollService,
    public translocoService: TranslocoService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.navbarScroll();
    }
    this.getCurrentRoute();
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
   * Obtiene la ruta actual (método público)
   * @returns string - La ruta actual
   */
  public getCurrentRoutePath(): string {
    return this.currentRoute;
  }

  /**
   * Verifica si una ruta está activa
   * @param route - La ruta a verificar
   * @returns boolean - true si la ruta está activa
   */
  public isRouteActive(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.navbarScroll();
    }
  }

  private navbarScroll(): void {
    const navbar = document.querySelector('.navbar');
    if (!navbar) {
      return;
    }

    const scrollThreshold = 100;
    const wasShrunk = this.isNavbarShrunk;
    const currentScrollY = window.scrollY;

    if (currentScrollY > scrollThreshold) {
      this.isNavbarShrunk = true;
    } else {
      this.isNavbarShrunk = false;
    }

    // Actualizar logo si cambió el estado
    if (wasShrunk !== this.isNavbarShrunk) {
      this.updateLogoImages();
      // Forzar detección de cambios
      this.cdr.detectChanges();
    }
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
    // Actualizar logo cuando cambie el estado del menú
    this.updateLogoImages();
    // Forzar detección de cambios
    this.cdr.detectChanges();
  }

  /**
   * Navigate to a section
   * @param sectionId - The id of the section to navigate to
   */
  /*navigateToSection(sectionId: string) {
    this.scrollService.scrollTo(sectionId);
  }*/
  navigateToPlansSection() {
    this.router.navigate(['/planes']).then(() => {
      // Damos un pequeño delay para que Angular pinte el DOM
      setTimeout(() => {
        this.scrollService.scrollTo('pricingSection');
      }, 50);
    });
  }

  /**
   * Change the language
   * @param lang - The language to change to
   */
  changeLanguage(lang: string) {
    this.translocoService.setActiveLang(lang);
    this.translocoService.setDefaultLang(lang);
    this.currentLang = lang;
  }
}
