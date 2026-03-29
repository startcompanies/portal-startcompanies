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
          <i
            class="bi bi-envelope-check"
            style="font-size: 3rem; color: #006afe;"
          ></i>
          <h4 class="mt-3">Verifica tu correo electrónico</h4>
          <p class="text-muted">
            Hemos enviado un código de 6 dígitos a <strong>{{ email }}</strong>
          </p>
        </div>

        <div class="verification-code-input mb-4">
          <label class="form-label">Código de verificación</label>
          <div class="d-flex justify-content-center gap-2">
            <input
              *ngFor="
                let digit of codeDigits;
                let i = index;
                trackBy: trackByIndex
              "
              type="text"
              class="form-control text-center code-digit"
              maxlength="1"
              [(ngModel)]="codeDigits[i]"
              (input)="onDigitInput($event, i)"
              (keydown)="onKeyDown($event, i)"
              (paste)="onPaste($event, i)"
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

        <p *ngIf="!isVerifying" class="text-muted small text-center mb-2">
          El código se verifica automáticamente al ingresar o pegar los 6 dígitos.
        </p>
        <div *ngIf="isVerifying" class="text-center py-2 mb-2">
          <span class="spinner-border spinner-border-sm text-primary me-2" role="status" aria-live="polite"></span>
          <span class="text-muted small">Verificando código…</span>
        </div>

        <div class="text-center mt-3">
          <p class="text-muted small mb-2">¿No recibiste el código?</p>
          <button
            class="btn btn-outline-secondary btn-sm"
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
  styles: [
    `
      .email-verification-container {
        max-width: 400px;
        margin: 0 auto;
      }
      .verification-card {
        padding: 0;
        background: transparent;
        border: none;
        box-shadow: none;
      }
      .code-digit {
        width: 50px;
        height: 50px;
        font-size: 1.5rem;
        font-weight: bold;
        border-radius: 8px;
      }
      .code-digit:focus {
        border-color: #006afe;
        box-shadow: 0 0 0 0.2rem rgba(2, 202, 227, 0.25);
      }
      /* Botón Verificar - btn-primary */
      .verification-card .btn-primary {
        background-color: #006afe;
        border-color: #006afe;
        color: #ffffff;
        min-width: 120px;
      }
      .verification-card .btn-primary:hover {
        background-color: #02b8d0;
        border-color: #02b8d0;
        color: #ffffff;
      }
      .verification-card .btn-primary:focus {
        background-color: #006afe;
        border-color: #006afe;
        color: #ffffff;
        box-shadow: 0 0 0 0.2rem rgba(2, 202, 227, 0.25);
      }
      .verification-card .btn-primary:disabled {
        background-color: #006afe;
        border-color: #006afe;
        opacity: 0.6;
        color: #ffffff;
      }
      /* Botón Reenviar - btn-outline-secondary */
      .verification-card .btn-outline-secondary {
        background-color: #ffffff;
        border-color: #006afe;
        color: #006afe;
      }
      .verification-card .btn-outline-secondary:hover {
        background-color: #f8f9fa;
        border-color: #02b8d0;
        color: #02b8d0;
      }
      .verification-card .btn-outline-secondary:focus {
        background-color: #ffffff;
        border-color: #006afe;
        color: #006afe;
        box-shadow: 0 0 0 0.2rem rgba(2, 202, 227, 0.25);
      }
      .verification-card .btn-outline-secondary:disabled {
        background-color: #ffffff;
        border-color: #006afe;
        color: #006afe;
        opacity: 0.6;
      }
    `,
  ],
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
    private wizardApiService: WizardApiService,
  ) {}

  ngOnInit(): void {
    void this.maybeSkipIfEmailAlreadyVerified();
  }

  /**
   * crm-lead puede tener token sin email verificado; no se salta el paso en base.
   * Si el backend ya tiene el email como verificado (p. ej. usuario que vuelve), avanzar sin pedir código.
   */
  private async maybeSkipIfEmailAlreadyVerified(): Promise<void> {
    const email = (this.email || this.wizardStateService.getStepData(1)?.email || '').trim();
    if (!email || !this.wizardApiService.isAuthenticated()) {
      this.focusFirstDigit();
      return;
    }
    try {
      const res = await firstValueFrom(this.wizardApiService.checkEmailAvailability(email));
      if (res.emailVerified === true) {
        this.verificationSuccess.emit();
        return;
      }
    } catch {
      // Continuar con verificación manual
    }
    this.focusFirstDigit();
  }

  private focusFirstDigit(): void {
    setTimeout(() => {
      const firstInput = document.getElementById('digit-0');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  /**
   * TrackBy function para mejorar el rendimiento del ngFor
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Maneja el input de cada dígito
   */
  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.trim();

    // Solo permitir números
    if (!/^\d*$/.test(value)) {
      this.codeDigits[index] = '';
      input.value = '';
      return;
    }

    // Si el valor está vacío, limpiar y salir
    if (value === '') {
      this.codeDigits[index] = '';
      return;
    }

    // Obtener solo el último carácter si se ingresó más de uno
    if (value.length > 1) {
      value = value.slice(-1);
    }

    // Actualizar el dígito en el array
    this.codeDigits[index] = value;
    input.value = value;

    // Mover al siguiente input si se ingresó un dígito
    if (value && index < 5) {
      setTimeout(() => {
        const nextInput = document.getElementById(
          `digit-${index + 1}`,
        ) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }, 10);
    }

    // Si se completó el código, verificar automáticamente
    if (this.isCodeComplete()) {
      setTimeout(() => this.verifyCode(), 100);
    }
  }

  /**
   * Maneja las teclas especiales (backspace, flechas, delete)
   */
  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    // Manejar Backspace
    if (event.key === 'Backspace') {
      // Si hay contenido, limpiarlo
      if (this.codeDigits[index] || input.value) {
        this.codeDigits[index] = '';
        input.value = '';
        event.preventDefault();
        return;
      }
      // Si está vacío, mover al anterior y limpiarlo
      if (index > 0) {
        event.preventDefault();
        const prevInput = document.getElementById(
          `digit-${index - 1}`,
        ) as HTMLInputElement;
        if (prevInput) {
          this.codeDigits[index - 1] = '';
          prevInput.value = '';
          prevInput.focus();
          prevInput.select();
        }
      }
      return;
    }

    // Manejar Delete
    if (event.key === 'Delete') {
      this.codeDigits[index] = '';
      input.value = '';
      event.preventDefault();
      return;
    }

    // Manejar flecha izquierda
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      const prevInput = document.getElementById(
        `digit-${index - 1}`,
      ) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
      return;
    }

    // Manejar flecha derecha
    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      const nextInput = document.getElementById(
        `digit-${index + 1}`,
      ) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
      return;
    }

    // Prevenir que se ingresen caracteres no numéricos (excepto teclas de control)
    if (
      event.key.length === 1 &&
      !/^\d$/.test(event.key) &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
    }
  }

  /**
   * Maneja el pegado de código completo
   */
  onPaste(event: ClipboardEvent, currentIndex: number): void {
    event.preventDefault();
    event.stopPropagation();

    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');

    if (digits.length === 0) {
      return;
    }

    // Limpiar todos los inputs primero
    this.codeDigits = ['', '', '', '', '', ''];

    // Llenar los inputs con los dígitos pegados
    digits.forEach((digit, index) => {
      if (index < 6 && /^\d$/.test(digit)) {
        this.codeDigits[index] = digit;
        // Actualizar el valor del input visualmente
        const input = document.getElementById(
          `digit-${index}`,
        ) as HTMLInputElement;
        if (input) {
          input.value = digit;
        }
      }
    });

    // Enfocar el último input completado o el siguiente vacío
    const nextEmptyIndex = this.codeDigits.findIndex((d) => !d);
    const focusIndex =
      nextEmptyIndex === -1 ? Math.min(5, digits.length - 1) : nextEmptyIndex;

    setTimeout(() => {
      const input = document.getElementById(
        `digit-${focusIndex}`,
      ) as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 10);

    // Si se completó el código, verificar automáticamente
    if (this.isCodeComplete()) {
      setTimeout(() => this.verifyCode(), 100);
    }
  }

  /**
   * Verifica si el código está completo
   */
  isCodeComplete(): boolean {
    return this.codeDigits.every((d) => d !== '');
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
    if (this.isVerifying) {
      return;
    }
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

      const response = await firstValueFrom(
        this.wizardApiService.confirmEmail({
          email: this.email,
          confirmationToken: code,
        }),
      );

      console.log('[EmailVerification] Verificación exitosa:', response);
      this.successMessage = '¡Email verificado exitosamente!';

      // Emitir evento de éxito
      setTimeout(() => {
        this.verificationSuccess.emit();
      }, 1000);
    } catch (error: any) {
      console.error('[EmailVerification] Error al verificar:', error);
      this.errorMessage =
        error?.error?.message ||
        'Código incorrecto. Por favor, intenta nuevamente.';
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
      this.errorMessage =
        'No se encontró el email. Por favor, vuelve al paso anterior.';
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
      this.successMessage =
        message || 'Código reenviado. Por favor, revisa tu bandeja de entrada.';
      this.errorMessage = '';
      setTimeout(() => {
        this.successMessage = '';
      }, 5000);
    } else {
      this.errorMessage =
        message ||
        'Error al reenviar el código. Por favor, intenta nuevamente.';
      this.successMessage = '';
    }
  }
}
