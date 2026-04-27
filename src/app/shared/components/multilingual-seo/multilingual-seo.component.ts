import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MultilingualSeoService, MultilingualSeoData } from '../../../shared/services/multilingual-seo.service';
import { TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-multilingual-seo',
  template: '', // Componente sin template, solo para funcionalidad SEO
  standalone: true
})
export class MultilingualSeoComponent implements OnInit, OnDestroy {
  @Input() seoData?: MultilingualSeoData;
  @Input() routeKey?: string;

  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);

  constructor(
    private multilingualSeoService: MultilingualSeoService,
    private router: Router,
    private transloco: TranslocoService
  ) { }

  ngOnInit(): void {
    // Si se proporciona seoData directamente, usarlo
    if (this.seoData) {
      this.multilingualSeoService.updateSeoData(this.seoData);
      return;
    }

    // Actualizar SEO basado en la ruta actual
    this.updateSeoFromRoute();

    // Escuchar cambios de ruta para actualizar SEO automáticamente
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateSeoFromRoute();
    });

    // Escuchar cambios de idioma para actualizar SEO
    this.transloco.langChanges$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateSeoFromRoute();
    });
  }

  ngOnDestroy(): void {
    this.destroy$?.next();
    this.destroy$?.complete();
  }

  /**
   * Actualiza SEO basándose en la configuración de la ruta actual
   */
  private updateSeoFromRoute(): void {
    // Leer la configuración SEO de la ruta actual
    this.route.data.subscribe(data => {
      if (data && data['seo']) {
        // Si hay configuración SEO en la ruta, usarla
        this.multilingualSeoService.updateSeoData(data['seo']);
      } else if (this.routeKey) {
        // Si se especifica routeKey, usar configuración automática
        this.multilingualSeoService.updateSeoForRoute(this.routeKey);
      } else {
        // Determinar routeKey automáticamente desde la URL
        const routeKey = this.extractRouteKeyFromUrl();
        if (routeKey) {
          this.multilingualSeoService.updateSeoForRoute(routeKey);
        }
      }
    });
  }

  /**
   * Extrae el routeKey de la URL actual
   */
  private extractRouteKeyFromUrl(): string | null {
    const url = this.router.url;
    const segments = url.split('/').filter(seg => seg.length > 0);
    
    // Remover el idioma del primer segmento
    if (segments.length > 0 && ['es', 'en'].includes(segments[0])) {
      segments.shift();
    }

    // Mapear rutas a routeKeys
    const routeMapping: { [key: string]: string } = {
      'apertura-llc': 'apertura-llc',
      'renovar-llc': 'renovar-llc',
      'llc-renewal': 'renovar-llc',
      'llc-opening': 'apertura-llc',
    };

    const firstSegment = segments[0] || '';
    return routeMapping[firstSegment] || null;
  }

  /**
   * Método público para actualizar SEO manualmente
   */
  updateSeo(data: MultilingualSeoData): void {
    this.multilingualSeoService.updateSeoData(data);
  }

  /**
   * Método público para actualizar SEO por ruta
   */
  updateSeoForRoute(routeKey: string, customData?: Partial<MultilingualSeoData>): void {
    this.multilingualSeoService.updateSeoForRoute(routeKey, customData);
  }

  /**
   * Método público para limpiar SEO
   */
  clearSeo(): void {
    this.multilingualSeoService.clearSeoData();
  }
}
