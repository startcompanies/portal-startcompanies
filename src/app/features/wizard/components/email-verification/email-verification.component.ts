import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../panel/services/auth.service';
import { WizardStateService } from '../../services/wizard-state.service';
import { firstValueFrom } from 'rxjs';

/**
 * Componente para manejar la verificación de email y continuar el flujo del wizard
 */
@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body text-center">
              <div *ngIf="isVerifying" class="py-4">
                <div class="spinner-border text-primary mb-3" role="status">
                  <span class="visually-hidden">Verificando...</span>
                </div>
                <h4>Verificando tu correo...</h4>
                <p class="text-muted">Por favor espera un momento.</p>
              </div>

              <div *ngIf="verificationSuccess" class="py-4">
                <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
                <h4 class="mt-3">¡Correo verificado exitosamente!</h4>
                <p class="text-muted">Redirigiendo al wizard...</p>
              </div>

              <div *ngIf="verificationError" class="py-4">
                <i class="bi bi-x-circle-fill text-danger" style="font-size: 4rem;"></i>
                <h4 class="mt-3">Error al verificar el correo</h4>
                <p class="text-danger">{{ errorMessage }}</p>
                <button class="btn btn-primary" (click)="goToWizard()">
                  Continuar al wizard de todas formas
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EmailVerificationComponent implements OnInit {
  isVerifying = true;
  verificationSuccess = false;
  verificationError = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private wizardStateService: WizardStateService
  ) {}

  async ngOnInit(): Promise<void> {
    // Obtener token de la URL
    const token = this.route.snapshot.queryParams['token'];
    
    if (!token) {
      this.verificationError = true;
      this.errorMessage = 'No se proporcionó un token de verificación válido.';
      this.isVerifying = false;
      return;
    }

    try {
      // Verificar el email usando el token
      await firstValueFrom(this.authService.verifyEmail(token));
      
      // Si la verificación fue exitosa, restaurar el estado del wizard
      this.restoreWizardState();
      
      this.verificationSuccess = true;
      this.isVerifying = false;

      // Redirigir al wizard después de 2 segundos
      setTimeout(() => {
        this.goToWizard();
      }, 2000);

    } catch (error: any) {
      console.error('Error al verificar email:', error);
      this.verificationError = true;
      this.errorMessage = error?.error?.message || 'Error al verificar el correo. Por favor, intenta nuevamente.';
      this.isVerifying = false;
    }
  }

  /**
   * Restaura el estado del wizard desde localStorage
   */
  private restoreWizardState(): void {
    const savedState = localStorage.getItem('wizard_state_pending_verification');
    
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        
        // Restaurar todos los datos del wizard
        if (state.wizardData) {
          Object.keys(state.wizardData).forEach(stepNumber => {
            this.wizardStateService.setStepData(parseInt(stepNumber), state.wizardData[stepNumber]);
          });
        }

        // Hacer login con las credenciales guardadas
        if (state.email && state.password) {
          firstValueFrom(
            this.authService.login({ email: state.email, password: state.password })
          ).then(() => {
            console.log('[EmailVerification] Login exitoso después de verificación');
          }).catch(error => {
            console.error('[EmailVerification] Error al hacer login:', error);
          });
        }

        // Limpiar el estado guardado
        localStorage.removeItem('wizard_state_pending_verification');
        
      } catch (error) {
        console.error('Error al restaurar estado del wizard:', error);
      }
    }
  }

  /**
   * Redirige al wizard de apertura LLC
   */
  goToWizard(): void {
    // Determinar el idioma actual
    const currentLang = this.router.url.includes('/en/') ? 'en' : 'es';
    const wizardPath = currentLang === 'en' ? '/en/wizard/llc-opening' : '/wizard/llc-apertura';
    
    this.router.navigate([wizardPath]);
  }
}
