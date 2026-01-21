import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WizardStateService } from '../../services/wizard-state.service';
import { WizardApiService } from '../../services/wizard-api.service';
import { firstValueFrom } from 'rxjs';

/**
 * Componente para manejar la verificación de email con código de 6 dígitos
 * Usado en el flujo del wizard después del registro
 */
@Component({
  selector: 'app-wizard-email-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="email-verification-container">
      <div class="verification-card">
        <div class="text-center mb-4">
          <i class="bi bi-envelope-check" style="font-size: 3rem; color: var(--primary-color, #0d6efd);"></i>
          <h4 class="mt-3">Verifica tu correo electrónico</h4>
          <p class="text-muted">
            Hemos enviado un código de 6 dígitos a <strong>{{ email }}</strong>
          </p>
        </div>

        <div class="verification-code-input mb-4">
          <label class="form-label">Código de verificación</label>
          <div class="d-flex justify-content-center gap-2">
            <input 
              *ngFor="let digit of codeDigits; let i = index"
              type="text" 
              class="form-control text-center code-digit"
              maxlength="1"
              [value]="codeDigits[i]"
              (input)="onDigitInput($event, i)"
              (keydown)="onKeyDown($event, i)"
              (paste)="onPaste($event)"
              [id]="'digit-' + i"
              inputmode="numeric"
              pattern="[0-9]*"
            />
          </div>
        </div>

        <div *ngIf="errorMessage" class="alert alert-danger">
          <i class="bi bi-exclamation-circle me-2"></i>
          {{ errorMessage }}
        </div>

        <div *ngIf="successMessage" class="alert alert-success">
          <i class="bi bi-check-circle me-2"></i>
          {{ successMessage }}
        </div>

        <div class="d-grid gap-2">
          <button 
            class="btn btn-primary" 
            (click)="verifyCode()"
            [disabled]="isVerifying || !isCodeComplete()"
          >
            <span *ngIf="!isVerifying">
              <i class="bi bi-check-lg me-2"></i>
              Verificar código
            </span>
            <span *ngIf="isVerifying">
              <span class="spinner-border spinner-border-sm me-2"></span>
              Verificando...
            </span>
          </button>
        </div>

        <div class="text-center mt-3">
          <p class="text-muted small mb-2">¿No recibiste el código?</p>
          <button 
            class="btn btn-link btn-sm" 
            (click)="resendCode()"
            [disabled]="isResending"
          >
            <span *ngIf="!isResending">
              <i class="bi bi-arrow-clockwise me-1"></i>
              Reenviar código
            </span>
            <span *ngIf="isResending">
              <span class="spinner-border spinner-border-sm me-1"></span>
              Reenviando...
            </span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .email-verification-container {
      max-width: 400px;
      margin: 0 auto;
    }
    .verification-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .code-digit {
      width: 50px;
      height: 50px;
      font-size: 1.5rem;
      font-weight: bold;
      border-radius: 8px;
    }
    .code-digit:focus {
      border-color: var(--primary-color, #0d6efd);
      box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
    }
  `]
})
export class WizardEmailVerificationComponent implements OnInit {
  @Input() email: string = '';
  @Input() password: string = '';
  @Output() verificationSuccess = new EventEmitter<void>();
  @Output() resendRequested = new EventEmitter<void>();

  codeDigits: string[] = ['', '', '', '', '', ''];
  isVerifying = false;
  isResending = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private wizardStateService: WizardStateService,
    private wizardApiService: WizardApiService
  ) {}

  ngOnInit(): void {
    // Enfocar el primer input
    setTimeout(() => {
      const firstInput = document.getElementById('digit-0');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  /**
   * Maneja el input de cada dígito
   */
  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Solo permitir números
    if (!/^\d*$/.test(value)) {
      this.codeDigits[index] = '';
      input.value = '';
      return;
    }

    // Obtener solo el último carácter si se ingresó más de uno (por paste o autocompletado)
    if (value.length > 1) {
      value = value.slice(-1);
    }

    // Actualizar el dígito en el array
    this.codeDigits[index] = value;
    input.value = value;

    // Mover al siguiente input si se ingresó un dígito
    if (value && index < 5) {
      setTimeout(() => {
        const nextInput = document.getElementById(`digit-${index + 1}`);
        if (nextInput) {
          nextInput.focus();
        }
      }, 0);
    }

    // Si se completó el código, verificar automáticamente
    if (this.isCodeComplete()) {
      setTimeout(() => this.verifyCode(), 100);
    }
  }

  /**
   * Maneja las teclas especiales (backspace, flechas)
   */
  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    
    if (event.key === 'Backspace') {
      // Si hay contenido, limpiarlo primero
      if (this.codeDigits[index]) {
        this.codeDigits[index] = '';
        input.value = '';
        event.preventDefault();
        return;
      }
      // Si está vacío, mover al anterior
      if (index > 0) {
        const prevInput = document.getElementById(`digit-${index - 1}`) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
          prevInput.select();
        }
        event.preventDefault();
      }
    }
    
    if (event.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
        (prevInput as HTMLInputElement).select();
      }
      event.preventDefault();
    }
    
    if (event.key === 'ArrowRight' && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
        (nextInput as HTMLInputElement).select();
      }
      event.preventDefault();
    }
    
    // Prevenir que se ingresen caracteres no numéricos
    if (event.key.length === 1 && !/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Maneja el pegado de código completo
   */
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');
    
    digits.forEach((digit, index) => {
      if (index < 6) {
        this.codeDigits[index] = digit;
      }
    });

    // Enfocar el último input completado o el siguiente vacío
    const nextEmptyIndex = this.codeDigits.findIndex(d => !d);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    const input = document.getElementById(`digit-${focusIndex}`);
    if (input) {
      input.focus();
    }

    // Si se completó el código, verificar automáticamente
    if (this.isCodeComplete()) {
      setTimeout(() => this.verifyCode(), 100);
    }
  }

  /**
   * Verifica si el código está completo
   */
  isCodeComplete(): boolean {
    return this.codeDigits.every(d => d !== '');
  }

  /**
   * Obtiene el código completo como string
   */
  getCode(): string {
    return this.codeDigits.join('');
  }

  /**
   * Verifica el código de confirmación
   */
  async verifyCode(): Promise<void> {
    if (!this.isCodeComplete()) {
      this.errorMessage = 'Por favor, ingresa el código completo de 6 dígitos.';
      return;
    }

    this.isVerifying = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const code = this.getCode();
      console.log('[EmailVerification] Verificando código para:', this.email);
      
      const response = await firstValueFrom(this.wizardApiService.confirmEmail({
        email: this.email,
        confirmationToken: code
      }));

      console.log('[EmailVerification] Verificación exitosa:', response);
      this.successMessage = '¡Email verificado exitosamente!';
      
      // Emitir evento de éxito
      setTimeout(() => {
        this.verificationSuccess.emit();
      }, 1000);

    } catch (error: any) {
      console.error('[EmailVerification] Error al verificar:', error);
      this.errorMessage = error?.error?.message || 'Código incorrecto. Por favor, intenta nuevamente.';
      // Limpiar el código para reintentar
      this.codeDigits = ['', '', '', '', '', ''];
      setTimeout(() => {
        const firstInput = document.getElementById('digit-0');
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    } finally {
      this.isVerifying = false;
    }
  }

  /**
   * Reenvía el código de verificación
   */
  async resendCode(): Promise<void> {
    if (!this.email) {
      this.errorMessage = 'No se encontró el email. Por favor, vuelve al paso anterior.';
      return;
    }

    this.isResending = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Emitir evento para que el componente padre maneje el reenvío
    // El componente padre debe llamar a registerStep.resendVerificationEmail()
    // y luego notificar el resultado usando notifyResendResult()
    this.resendRequested.emit();
  }

  /**
   * Método público para que el componente padre notifique el resultado del reenvío
   * @param success - true si el reenvío fue exitoso, false si falló
   * @param message - Mensaje opcional a mostrar
   */
  notifyResendResult(success: boolean, message?: string): void {
    this.isResending = false;
    
    if (success) {
      this.successMessage = message || 'Código reenviado. Por favor, revisa tu bandeja de entrada.';
      this.errorMessage = '';
      setTimeout(() => {
        this.successMessage = '';
      }, 5000);
    } else {
      this.errorMessage = message || 'Error al reenviar el código. Por favor, intenta nuevamente.';
      this.successMessage = '';
    }
  }
}

