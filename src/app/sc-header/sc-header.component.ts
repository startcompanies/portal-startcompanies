import { Component, HostListener, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { SharedModule } from '../shared/shared/shared.module';
import { isPlatformBrowser } from '@angular/common';
import { ScrollService } from '../services/scroll.service';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-sc-header',
  standalone: true,
  imports: [SharedModule, TranslocoPipe],
  templateUrl: './sc-header.component.html',
  styleUrl: './sc-header.component.css',
})
export class ScHeaderComponent implements OnInit {
  isOpen: boolean = false;
  isNavbarShrunk: boolean = false;
  currentLang: string = 'es';
  currentRoute: string = '';
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private scrollService: ScrollService,
    public translocoService: TranslocoService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

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

    if (window.scrollY > scrollThreshold) {
      this.isNavbarShrunk = true;
    } else {
      this.isNavbarShrunk = false;
    }
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  /**
   * Navigate to a section
   * @param sectionId - The id of the section to navigate to
   */
  navigateToSection(sectionId: string) {
    this.scrollService.scrollTo(sectionId);
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
