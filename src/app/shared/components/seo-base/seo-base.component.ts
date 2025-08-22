import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SeoService, SeoData } from '../../../services/seo.service';

@Component({
  selector: 'app-seo-base',
  template: '', // Componente sin template, solo para funcionalidad
  standalone: true
})
export class SeoBaseComponent implements OnInit, OnDestroy {
  @Input() seoData?: SeoData;
  @Input() routeKey?: string;

  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);

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

    // NUEVO: Leer SEO automáticamente de la configuración de ruta
    this.updateSeoFromRoute();

    // Escuchar cambios de ruta para actualizar SEO automáticamente
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
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
   * NUEVO: Actualiza SEO basándose en la configuración de la ruta actual
   */
  private updateSeoFromRoute(): void {
    // Leer la configuración SEO de la ruta actual
    this.route.data.subscribe(data => {
      if (data && data['seo']) {
        this.seoService.updateFromRoute(data);
      }
    });
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
