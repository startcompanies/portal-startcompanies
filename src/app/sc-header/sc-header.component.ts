import { Component, HostListener, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { SharedModule } from '../shared/shared/shared.module';
import { isPlatformBrowser } from '@angular/common';
import { ScrollService } from '../services/scroll.service';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

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
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private scrollService: ScrollService,
    public translocoService: TranslocoService
  ) { }

  ngOnInit(): void {    
    if (isPlatformBrowser(this.platformId)) {
      this.navbarScroll();
    }
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
