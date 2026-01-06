import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ResponsiveImageComponent } from '../../components/responsive-image/responsive-image.component';
import { LangRouterLinkDirective } from '../../../shared/directives/lang-router-link.directive';
import { LanguageService } from '../../../shared/services/language.service';

@Component({
  selector: 'app-sc-footer',
  standalone: true,
  imports: [TranslocoPipe, ResponsiveImageComponent, LangRouterLinkDirective],
  templateUrl: './sc-footer.component.html',
  styleUrl: './sc-footer.component.css',
})
export class ScFooterComponent implements OnInit {
  currentLang = 'es';
  
  // Configuración de imágenes del logo del footer para NgOptimizedImage
  footerLogoImages = {
    mobile: "/assets/footer/img_footer_logo.webp",
    tablet: "/assets/footer/img_footer_logo.webp",
    desktop: "/assets/footer/img_footer_logo.webp",
    fallback: "/assets/footer/img_footer_logo.webp",
    alt: "Start Companies Footer Logo",
    priority: false
  };

  constructor(
    private languageService: LanguageService,
    private translocoService: TranslocoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentLang = this.languageService.currentLang;
    this.translocoService.langChanges$.subscribe((l) => {
      this.currentLang = l;
      this.cdr.markForCheck();
    });
  }

  changeLanguage(lang: string) {
    this.languageService.setLanguage(lang, true).then(() => {
      this.currentLang = lang;
      this.cdr.markForCheck();
    });
  }

  openUrl(url: string) {
    window.open(url, '_blank');
  }
}
