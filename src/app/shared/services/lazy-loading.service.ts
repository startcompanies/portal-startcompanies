import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class LazyLoadingService {
  private loadedComponents = new Set<string>();
  private loadingPromises = new Map<string, Promise<any>>();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  /**
   * Carga un componente de forma lazy con cache
   * @param componentPath - Ruta del componente
   * @param componentName - Nombre del componente
   * @returns Promise del componente
   */
  async loadComponent(componentPath: string, componentName: string): Promise<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    // Si ya está cargado, devolver inmediatamente
    if (this.loadedComponents.has(componentName)) {
      return this.loadingPromises.get(componentName);
    }

    // Si ya está cargando, devolver la promesa existente
    if (this.loadingPromises.has(componentName)) {
      return this.loadingPromises.get(componentName);
    }

    // Crear nueva promesa de carga
    const loadingPromise = this.dynamicImport(componentPath, componentName);
    this.loadingPromises.set(componentName, loadingPromise);

    try {
      const component = await loadingPromise;
      this.loadedComponents.add(componentName);
      return component;
    } catch (error) {
      console.error(`Error cargando componente ${componentName}:`, error);
      this.loadingPromises.delete(componentName);
      throw error;
    }
  }

  /**
   * Precarga un componente para uso futuro
   * @param componentPath - Ruta del componente
   * @param componentName - Nombre del componente
   */
  preloadComponent(componentPath: string, componentName: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.loadedComponents.has(componentName) && !this.loadingPromises.has(componentName)) {
      this.loadComponent(componentPath, componentName).catch(() => {
        // Ignorar errores de precarga
      });
    }
  }

  /**
   * Verifica si un componente está cargado
   * @param componentName - Nombre del componente
   * @returns boolean
   */
  isComponentLoaded(componentName: string): boolean {
    return this.loadedComponents.has(componentName);
  }

  /**
   * Obtiene estadísticas de carga
   */
  getLoadingStats() {
    return {
      loaded: this.loadedComponents.size,
      loading: this.loadingPromises.size,
      loadedComponents: Array.from(this.loadedComponents),
      loadingComponents: Array.from(this.loadingPromises.keys())
    };
  }

  private async dynamicImport(componentPath: string, componentName: string): Promise<any> {
    try {
      const module = await import(componentPath);
      return module[componentName];
    } catch (error) {
      console.error(`Error en dynamic import para ${componentName}:`, error);
      throw error;
    }
  }
}
