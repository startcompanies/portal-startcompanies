import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ImagePreloaderComponent } from '../shared/components/image-preloader/image-preloader.component';
import { WhatsappFloatComponent } from '../shared/components/whatsapp-float/whatsapp-float.component';
import { AuthService } from '../features/panel/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ImagePreloaderComponent, WhatsappFloatComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'portal-startcompanies';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Verificar si hay parámetros SSO en la URL
    this.checkSsoParams();
  }

  /**
   * Verifica si hay parámetros SSO en la URL y realiza el login automático
   */
  private checkSsoParams(): void {
    // Verificar si ya hay un token guardado
    const existingToken = this.authService.getToken();
    if (existingToken) {
      return; // Ya está autenticado
    }

    // Obtener parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const token = urlParams.get('token');
    const customerId = urlParams.get('customerId');
    const phone = urlParams.get('phone');

    if (email && token) {
      // Validar formato de email
      if (!this.isValidEmail(email)) {
        this.handleSsoError('Email inválido');
        return;
      }

      // Realizar login automático
      this.performSsoLogin(email, token, customerId || undefined, phone || undefined);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Realiza el login SSO
   */
  private performSsoLogin(
    email: string,
    token: string,
    customerId?: string,
    phone?: string
  ): void {
    console.log('Iniciando autenticación SSO con Zoho CRM...');

    this.authService.ssoAuth(email, token, customerId, phone).subscribe({
      next: (res: any) => {
        if (res.accessToken) {
          console.log('Autenticación SSO exitosa');
          
          // Limpiar parámetros de la URL y redirigir
          this.redirectAfterSsoLogin();
        } else {
          this.handleSsoError('No se recibió un token de acceso válido');
        }
      },
      error: (error: any) => {
        let errorMessage = 'Error al autenticar con Zoho CRM';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        console.error('Error en autenticación SSO:', error);
        this.handleSsoError(errorMessage);
      },
    });
  }

  /**
   * Redirige después de un login SSO exitoso
   */
  private redirectAfterSsoLogin(): void {
    // Limpiar parámetros SSO de la URL
    const url = new URL(window.location.href);
    url.searchParams.delete('email');
    url.searchParams.delete('token');
    url.searchParams.delete('customerId');
    url.searchParams.delete('phone');

    window.history.replaceState({}, '', url.pathname + (url.search || ''));

    // Redirigir a la página principal del panel
    this.router.navigate(['/panel']);
  }

  /**
   * Maneja errores en el login SSO
   */
  private handleSsoError(message: string): void {
    console.error('Error de autenticación SSO:', message);
    
    // Limpiar parámetros de la URL
    const url = new URL(window.location.href);
    url.searchParams.delete('email');
    url.searchParams.delete('token');
    url.searchParams.delete('customerId');
    url.searchParams.delete('phone');
    window.history.replaceState({}, '', url.pathname);

    // Redirigir al login normal
    this.router.navigate(['/panel/login']);
  }
}
