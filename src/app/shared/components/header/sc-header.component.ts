import {
  Component,
  Input,
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
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { ResponsiveImageComponent } from '../responsive-image/responsive-image.component';
import { BehaviorSubject, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LanguageService } from '../../../shared/services/language.service';
import { LangRouterLinkDirective } from '../../../shared/directives/lang-router-link.directive';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-sc-header',
  standalone: true,
  imports: [SharedModule, TranslocoPipe, ResponsiveImageComponent, RouterModule, LangRouterLinkDirective],
  templateUrl: './sc-header.component.html',
  styleUrl: './sc-header.component.css',
})
export class ScHeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() hideLogin = false;

  /** Mostrar botón de login solo si wizard/panel están habilitados y el padre no lo oculta */
  get showLoginButton(): boolean {
    return environment.wizardAndPanelEnabled && !this.hideLogin;
  }

  @ViewChild('navbar', { static: false }) navbar?: ElementRef<HTMLElement>;

  isOpen = false;
  isNavbarShrunk = false;
  currentRoute = '';

  private routerSubscription?: Subscription;

  /** Logo para fondo oscuro (hero, navbar transparente) */
  private readonly logoLight = {
    mobile: '/assets/logo-mobile.webp',
    tablet: '/assets/logo-tablet.webp',
    desktop: '/assets/logo.webp',
    fallback: '/assets/logo.png',
    alt: 'Start Companies Logo',
    priority: false,
  };
  /** Logo para fondo claro (navbar con scroll) - reemplazo de logo-gray/logo-grey */
  private readonly logoDark = {
    mobile: '/assets/logo-dark-mobile.webp',
    tablet: '/assets/logo-dark-tablet.webp',
    desktop: '/assets/logo-dark.webp',
    fallback: '/assets/logo-dark.png',
    alt: 'Start Companies Logo',
    priority: false,
  };

  private logoImagesSubject = new BehaviorSubject(this.logoLight);

  logoImages$ = this.logoImagesSubject.asObservable();

  get logoImages() {
    return this.logoImagesSubject.value;
  }

  private updateLogoImages(): void {
    const overLightBackground = this.isNavbarShrunk;
    this.logoImagesSubject.next(overLightBackground ? this.logoDark : this.logoLight);
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
    // Evaluar scroll inicial por si la página cargó con scroll > 100 (logo claro vs oscuro)
    this.navbarScroll();
    
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

    // Suscribirse solo a NavigationEnd para evitar múltiples logs
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentRoute = this.router.url;
        // Log removido para evitar spam en consola
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
    // Desuscribirse de los eventos del router
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
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
