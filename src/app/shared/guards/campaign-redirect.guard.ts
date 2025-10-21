import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CampaignRedirectGuard implements CanActivate {
  
  private readonly campaignRedirects: { [key: string]: string } = {
    'abre-tu-llc': '/abre-tu-llc',
    'presentacion': '/presentacion',
    'apertura-banco-relay': '/apertura-banco-relay',
    'agenda': '/agendar',
    'agendar': '/agendar',
    'apertura-llc': '/apertura-llc',
    'renovar-llc': '/renovar-llc',
    'form-apertura-relay': '/form-apertura-relay',
    'fixcal': '/fixcal',
    'abotax': '/abotax',
    'rescate-relay': '/rescate-relay'
  };

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const url = state.url;
    const urlParts = url.split('?');
    const path = urlParts[0].replace(/^\//, ''); // Remover el / inicial
    const queryString = urlParts[1] || '';

    // Verificar si es una ruta de campaña que necesita redirección
    if (this.campaignRedirects[path]) {
      const targetPath = this.campaignRedirects[path];
      const finalUrl = queryString ? `${targetPath}?${queryString}` : targetPath;
      
      console.log(`[CampaignRedirectGuard] Redirecting ${url} → ${finalUrl}`);
      
      // Redirigir preservando query parameters
      this.router.navigateByUrl(finalUrl);
      return false; // Prevenir la activación de la ruta original
    }

    return true; // Permitir la activación normal
  }
}
