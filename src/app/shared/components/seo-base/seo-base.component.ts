import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SeoService, SeoData } from '../../../services/seo.service';
import { getSeoConfig, getHomeSeoConfig } from '../../../config/seo.config';

@Component({
  selector: 'app-seo-base',
  template: '', // Componente sin template, solo para funcionalidad
  standalone: true
})
export class SeoBaseComponent implements OnInit, OnDestroy {
  @Input() seoData?: SeoData;
  @Input() routeKey?: string;

  private destroy$ = new Subject<void>();

  constructor(
    private seoService: SeoService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Si se proporciona seoData directamente, usarlo
    if (this.seoData) {
      this.seoService.updateSeoData(this.seoData);
      return;
    }

    // Si se proporciona routeKey, buscar en la configuración
    if (this.routeKey) {
      const config = getSeoConfig(this.routeKey);
      if (config) {
        this.seoService.updateSeoData(config);
        return;
      }
    }

    // Si no hay configuración específica, usar la configuración por defecto
    this.seoService.updateSeoData(getHomeSeoConfig());

    // Escuchar cambios de ruta para actualizar SEO automáticamente
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      this.updateSeoForRoute(event.url);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Actualiza los meta tags SEO basándose en la ruta actual
   */
  private updateSeoForRoute(url: string): void {
    // Extraer la ruta de la URL
    const route = this.extractRouteFromUrl(url);
    
    // Buscar configuración SEO para esta ruta
    const config = getSeoConfig(route);
    
    if (config) {
      this.seoService.updateSeoData(config);
    } else {
      // Si no hay configuración específica, usar la configuración por defecto
      this.seoService.updateSeoData(getHomeSeoConfig());
    }
  }

  /**
   * Extrae la clave de ruta de la URL
   */
  private extractRouteFromUrl(url: string): string {
    // Remover parámetros de query y fragmentos
    const cleanUrl = url.split('?')[0].split('#')[0];
    
    // Obtener el último segmento de la ruta
    const segments = cleanUrl.split('/').filter(segment => segment);
    
    if (segments.length === 0) {
      return 'home';
    }
    
    return segments[segments.length - 1];
  }

  /**
   * Método público para actualizar SEO manualmente
   */
  updateSeo(data: SeoData): void {
    this.seoService.updateSeoData(data);
  }

  /**
   * Método público para limpiar SEO
   */
  clearSeo(): void {
    this.seoService.clearSeoData();
  }
}
