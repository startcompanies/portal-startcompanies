import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ScrollService } from '../../../shared/services/scroll.service';
import { BrowserService } from '../../../shared/services/browser.service';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Router, RouterModule } from '@angular/router';
import { ResponsiveImageComponent } from '../responsive-image/responsive-image.component';
import { BehaviorSubject } from 'rxjs';
import { LanguageService } from '../../../shared/services/language.service';
import { LangRouterLinkDirective } from '../../../shared/directives/lang-router-link.directive';

@Component({
  selector: 'app-sc-header',
  standalone: true,
  imports: [SharedModule, TranslocoPipe, ResponsiveImageComponent, RouterModule, LangRouterLinkDirective],
  templateUrl: './sc-header.component.html',
  styleUrl: './sc-header.component.css',
})
export class ScHeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('navbar', { static: false }) navbar?: ElementRef<HTMLElement>;

  isOpen = false;
  isNavbarShrunk = false;
  currentRoute = '';

  private logoImagesSubject = new BehaviorSubject({
    mobile: '/assets/logo-mobile.webp',
    tablet: '/assets/logo-tablet.webp',
    desktop: '/assets/logo.webp',
    fallback: '/assets/logo.webp',
    alt: 'Start Companies Logo',
    priority: false,
  });

  logoImages$ = this.logoImagesSubject.asObservable();

  get logoImages() {
    return this.logoImagesSubject.value;
  }

  private updateLogoImages(): void {
    const isDarkMode = this.isOpen || this.isNavbarShrunk;

    this.logoImagesSubject.next({
      ...this.logoImages,
      mobile: isDarkMode
        ? '/assets/logo-grey-mobile.webp'
        : '/assets/logo-mobile.webp',
      tablet: isDarkMode
        ? '/assets/logo-grey-tablet.webp'
        : '/assets/logo-tablet.webp',
      desktop: isDarkMode ? '/assets/logo-grey-desktop.webp' : '/assets/logo.webp',
      fallback: isDarkMode ? '/assets/logo-grey.png' : '/assets/logo.webp',
    });

    this.cdr.markForCheck();
  }

  constructor(
    private browser: BrowserService,
    private scrollService: ScrollService,
    public translocoService: TranslocoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    if (this.browser.isBrowser) {
      this.navbarScroll();
    }
    this.getCurrentRoute();
  }

  ngAfterViewInit(): void {
    const win = this.browser.window;
    if (!win) return;
    
    // Registrar listener de scroll manualmente (en lugar de @HostListener para SSR)
    win.addEventListener('scroll', this.onWindowScroll.bind(this));
    
    // Asegurar que el menú esté cerrado después de que la vista se inicialice
    setTimeout(() => {
      this.forceCloseMenu();
    }, 0);
    
    // Prevenir que Bootstrap inicialice automáticamente el collapse
    this.preventBootstrapAutoInit();
    
    // Interceptar eventos de Bootstrap que puedan abrir el menú
    this.interceptBootstrapEvents();
  }

  private interceptBootstrapEvents(): void {
    const doc = this.browser.document;
    if (!doc) return;
    
    const navbarCollapse = doc.getElementById('navbarNav');
    if (!navbarCollapse) return;
    
    // Observar cambios en el DOM para detectar cuando Bootstrap agrega la clase 'show'
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          // Si Bootstrap agregó 'show' sin nuestro permiso, removerlo
          if (target.classList.contains('show') && !this.isOpen) {
            target.classList.remove('show');
            target.classList.remove('collapsing');
            target.style.display = '';
          }
        }
      });
    });
    
    observer.observe(navbarCollapse, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }

  private preventBootstrapAutoInit(): void {
    const doc = this.browser.document;
    if (!doc) return;
    
    // Remover cualquier instancia de Bootstrap Collapse que pueda existir
    const navbarCollapse = doc.getElementById('navbarNav');
    if (navbarCollapse) {
      // Remover cualquier data attribute que Bootstrap pueda usar
      navbarCollapse.removeAttribute('data-bs-parent');
      navbarCollapse.removeAttribute('data-bs-toggle');
      
      // Asegurar que no tenga la clase 'show'
      navbarCollapse.classList.remove('show');
      navbarCollapse.classList.remove('collapsing');
      
      // Forzar el estado cerrado
      navbarCollapse.style.display = '';
    }
  }

  private forceCloseMenu(): void {
    this.isOpen = false;
    this.updateMenuVisibility();
    this.updateLogoImages();
    this.cdr.detectChanges();
  }

  private getCurrentRoute(): void {
    this.currentRoute = this.router.url;

    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
      console.log('Ruta actual:', this.currentRoute);
    });
  }

  public getCurrentRoutePath(): string {
    return this.currentRoute;
  }

  public isRouteActive(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.includes(route);
  }

  onWindowScroll() {
    if (!this.browser.isBrowser) return;
    this.navbarScroll();
    // Cerrar el menú al hacer scroll
    if (this.isOpen) {
      this.closeMenu();
    }
  }

  private navbarScroll(): void {
    const win = this.browser.window;
    if (!win || !this.navbar) return;

    const wasShrunk = this.isNavbarShrunk;
    const currentScrollY = win.scrollY;

    this.isNavbarShrunk = currentScrollY > 100;

    if (wasShrunk !== this.isNavbarShrunk) {
      this.updateLogoImages();
      this.cdr.detectChanges();
    }
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
    this.updateLogoImages();
    this.updateMenuVisibility();
    this.cdr.detectChanges();
  }

  closeMenu(): void {
    this.isOpen = false;
    this.updateMenuVisibility();
    this.updateLogoImages();
    this.cdr.detectChanges();
  }

  private updateMenuVisibility(): void {
    // Prevenir que Bootstrap abra el menú automáticamente
    const doc = this.browser.document;
    if (doc) {
      const navbarCollapse = doc.getElementById('navbarNav');
      if (navbarCollapse) {
        if (this.isOpen) {
          navbarCollapse.classList.add('show');
          navbarCollapse.style.display = 'block';
        } else {
          navbarCollapse.classList.remove('show');
          navbarCollapse.classList.remove('collapsing');
          navbarCollapse.style.display = '';
        }
      }
    }
  }

  ngOnDestroy(): void {
    const win = this.browser.window;
    if (win) {
      win.removeEventListener('scroll', this.onWindowScroll.bind(this));
    }
  }

  navigateToPlansSection() {
    /*this.router.navigate(['/planes']).then(() => {
      setTimeout(() => {
        this.scrollService.scrollTo('pricingSection');
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
