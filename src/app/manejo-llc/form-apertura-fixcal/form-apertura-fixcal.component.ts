import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoBaseComponent } from '../../shared/components/seo-base/seo-base.component';
import { HeaderManejoComponent } from '../header-manejo/header-manejo.component';
import { ScFooterComponent } from '../../sc-footer/sc-footer.component';
import { ResponsiveImageComponent } from '../../shared/components/responsive-image/responsive-image.component';

@Component({
  selector: 'app-form-apertura-fixcal',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SeoBaseComponent,
    HeaderManejoComponent,
    ScFooterComponent,
    ResponsiveImageComponent
  ],
  templateUrl: './form-apertura-fixcal.component.html',
  styleUrl: './form-apertura-fixcal.component.css'
})
export class FormAperturaFixcalComponent {
  heroImages = {
    mobile: 'assets/hero-bg-mobile.webp',
    tablet: 'assets/hero-bg-tablet.webp',
    desktop: 'assets/hero-bg-desktop.webp',
    fallback: 'assets/hero-bg-desktop.webp',
    alt: 'Imagen de fondo hero',
    priority: false
  };

  openUrl(url: string): void {
    window.open(url, '_blank');
  }
}
