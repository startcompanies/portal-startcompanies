import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-header-manejo',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './header-manejo.component.html',
  styleUrl: './header-manejo.component.css',
})
export class HeaderManejoComponent {
  isOpen: boolean = false;
  currentRoute: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.getCurrentRoute();
  }

  /**
   * Obtiene la ruta actual
   */
  private getCurrentRoute(): void {
    // Obtener la ruta inicial
    this.currentRoute = this.router.url;

    // Suscribirse a los cambios de ruta
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
      console.log('Ruta actual:', this.currentRoute);
    });
  }

  /**
   * Verifica si una ruta está activa
   * @param route - La ruta a verificar
   * @returns boolean - true si la ruta está activa
   */
  public isRouteActive(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route);
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  navigateToPlansSection() {
    this.router.navigate(['/planes']).then(() => {
      // Damos un pequeño delay para que Angular pinte el DOM
      setTimeout(() => {
        // Aquí puedes agregar la lógica para hacer scroll si es necesario
      }, 50);
    });
  }
}
