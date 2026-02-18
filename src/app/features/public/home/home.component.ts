import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { ScHeaderComponent } from '../../../shared/components/header/sc-header.component';
import { ScFooterComponent } from '../../../shared/components/footer/sc-footer.component';
import { ScrollService } from '../../../shared/services/scroll.service';
import { Subscription } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { SectionsModule } from './sections/sections.module';
import { TestimonialsComponent } from './sections/testimonials/testimonials.component';
import { FaqComponent } from './sections/faq/faq.component';
import { Router } from '@angular/router';
import { BrowserService } from '../../../shared/services/browser.service';
import { MultilingualSeoComponent } from '../../../shared/components/multilingual-seo/multilingual-seo.component';
import { ResponsiveImageComponent } from '../../../shared/components/responsive-image/responsive-image.component';
import { IMAGE_CONFIG, ImageConfig } from '../../../core/config/image-config';
import { LangRouterLinkDirective } from '../../../shared/directives/lang-router-link.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ScHeaderComponent,
    ScFooterComponent,
    TranslocoPipe,
    SectionsModule,
    TestimonialsComponent,
    FaqComponent,
    MultilingualSeoComponent,
    ResponsiveImageComponent,
    LangRouterLinkDirective
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('pricingSection', { static: false })
  pricingSection!: ElementRef<HTMLElement>;

  // Configuración de imágenes responsive
  heroImages: ImageConfig = IMAGE_CONFIG['hero']!;
  pricingImages: ImageConfig = IMAGE_CONFIG['pricing']!;

  private scrollSubscription!: Subscription;

  constructor(
    private scrollService: ScrollService,
    private router: Router,
    private browser: BrowserService
  ) {}

  ngAfterViewInit() {
    this.scrollSubscription = this.scrollService.scrollTarrget$.subscribe(
      (sectionId) => {
        this.scrollToTargetSection(sectionId);
      }
    );

    // Si se entra directamente a /planes, hacer scroll a pricingSection
    if (this.browser.isBrowser && this.router.url === '/planes') {
      const win = this.browser.window;
      if (win) {
        win.requestAnimationFrame(() => this.scrollToTargetSection('pricingSection'));
      }
    }
  }

  ngOnDestroy() {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
  }

  scrollToTargetSection(sectionId: string) {
    const element = this.pricingSection?.nativeElement;
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.warn('pricingSection no es un HTMLElement válido:', element);
    }
  }
}
