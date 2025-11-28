import {
  Component,
  HostListener,
  Inject,
  OnInit,
  PLATFORM_ID,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';
import { LangRouterLinkDirective } from '../../shared/directives/lang-router-link.directive';
import { isPlatformBrowser } from '@angular/common';
import { ScrollService } from '../../services/scroll.service';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-blog-header-v2',
  standalone: true,
  imports: [CommonModule, ResponsiveImageComponent, LangRouterLinkDirective, TranslocoPipe, RouterModule],
  templateUrl: './blog-header-v2.component.html',
  styleUrl: './blog-header-v2.component.css'
})
export class BlogHeaderV2Component implements OnInit {
  @ViewChild('navbar', { static: false }) navbar?: ElementRef<HTMLElement>;

  isOpen = false;
  isNavbarShrunk = false;
  currentLang = 'es';
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
        ? '/assets/logo-dark-mobile.webp'
        : '/assets/logo-mobile.webp',
      tablet: isDarkMode
        ? '/assets/logo-dark-tablet.webp'
        : '/assets/logo-tablet.webp',
      desktop: isDarkMode ? '/assets/logo-dark.webp' : '/assets/logo.webp',
      fallback: isDarkMode ? '/assets/logo-dark.webp' : '/assets/logo.webp',
    });

    this.cdr.markForCheck();
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private scrollService: ScrollService,
    public translocoService: TranslocoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.navbarScroll();
    }
    this.getCurrentRoute();
    this.currentLang = this.languageService.currentLang;
    this.translocoService.langChanges$.subscribe((l) => {
      this.currentLang = l;
      this.cdr.markForCheck();
    });
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

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.navbarScroll();
    }
  }

  private navbarScroll(): void {
    if (!isPlatformBrowser(this.platformId) || !this.navbar) return;

    const wasShrunk = this.isNavbarShrunk;
    const currentScrollY = window.scrollY;

    this.isNavbarShrunk = currentScrollY > 100;

    if (wasShrunk !== this.isNavbarShrunk) {
      this.updateLogoImages();
      this.cdr.detectChanges();
    }
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
    this.updateLogoImages();
    this.cdr.detectChanges();
  }

  navigateToPlansSection() {
    this.languageService.navigate(['planes']).then(() => {
      setTimeout(() => {
        this.scrollService.scrollTo('pricingSection');
      }, 50);
    });
  }

  changeLanguage(lang: string) {
    this.languageService.setLanguage(lang, true).then(() => {
      this.currentLang = lang;
      this.cdr.markForCheck();
    });
  }
}
