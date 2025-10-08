import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CampaignRedirectGuard implements CanActivate {
  
  private readonly campaignRedirects: { [key: string]: string } = {
    'abre-tu-llc': '/es/abre-tu-llc',
    'presentacion': '/es/presentacion',
    'apertura-banco-relay': '/es/apertura-banco-relay',
    'agenda': '/es/agendar',
    'agendar': '/es/agendar',
    'apertura-llc': '/es/apertura-llc',
    'renovar-llc': '/es/renovar-llc',
    'form-apertura-relay': '/es/form-apertura-relay',
    'fixcal': '/es/fixcal',
    'abotax': '/es/abotax',
    'rescate-relay': '/es/rescate-relay'
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
