import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared/shared.module';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { WizardStateService } from '../../services/wizard-state.service';
import { WizardApiService } from '../../services/wizard-api.service';
import { Subscription } from 'rxjs';
import { firstValueFrom, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { IntlTelInputComponent } from '../../../../shared/components/intl-tel-input/intl-tel-input.component';
import { GeolocationService } from '../../../../shared/services/geolocation.service';

/**
 * Componente reutilizable para el paso de registro básico
 * Usado en todos los flujos del wizard
 * Usa el endpoint /wizard/requests/register para crear usuarios
 */
@Component({
  selector: 'app-wizard-basic-register-step',
  standalone: true,
  imports: [SharedModule, TranslocoPipe, ReactiveFormsModule, IntlTelInputComponent],
  templateUrl: './basic-register-step.component.html',
  styleUrls: ['./basic-register-step.component.css']
})
export class WizardBasicRegisterStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 1;
  @Output() userCreated = new EventEmitter<{ userId: number; email: string }>();
  @Output() registrationCompleted = new EventEmitter<void>();
  @ViewChild(IntlTelInputComponent) phoneInput?: IntlTelInputComponent;
  
  form!: FormGroup;
  private formSubscription?: Subscription;
  isLoading = false;
  errorMessage: string | null = null;
  registeredUserId: number | null = null;
  registeredEmail: string | null = null;
  waitingEmailVerification = false;
  successMessage: string | null = null;
  detectedCountryCode: string = 'us';
  
  // Control de visibilidad de contraseña
  showPassword = false;
  
  // Indicador de seguridad de contraseña
  passwordStrength: 'weak' | 'medium' | 'strong' | null = null;
  passwordStrengthText = '';
  passwordStrengthClass = '';

  constructor(
    private wizardStateService: WizardStateService,
    private wizardApiService: WizardApiService,
    private geolocationService: GeolocationService,
    private transloco: TranslocoService
  ) {
    // Cargar datos guardados si existen
    const savedData = this.wizardStateService.getStepData(this.stepNumber);

    /**
     * CAMPOS OPCIONALES - Se puede navegar sin completar todos los campos
     * - fullName: Nombre completo (opcional)
     * - phone: Teléfono (opcional)
     * - email: Correo electrónico (opcional, pero debe tener formato válido si se completa)
     * - password: Contraseña (mínimo 8 caracteres)
     * 
     * NOTA: Los campos ya no son obligatorios para navegar entre pasos.
     */
    this.form = new FormGroup({
      fullName: new FormControl(savedData.fullName || '', [Validators.required]),
      phone: new FormControl(savedData.phone || ''),
      email: new FormControl(
        savedData.email || '',
        [Validators.required, Validators.email],
        [this.emailAvailabilityValidator()]
      ),
      password: new FormControl(savedData.password || '', [Validators.required, Validators.minLength(8)]),
    });
  }

  /**
   * Validador asíncrono para verificar disponibilidad de email
   * Usa debounce de 500ms para evitar demasiadas peticiones
   * NO bloquea si el email existe pero no está verificado (permitirá reenviar código)
   */
  private emailAvailabilityValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      // Si el campo está vacío o no tiene formato válido, no validar
      if (!control.value || control.value.trim() === '') {
        return of(null);
      }

      // Validar formato de email primero
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(control.value)) {
        return of(null); // Dejar que Validators.email maneje esto
      }

      // Debounce de 500ms antes de hacer la petición
      return timer(500).pipe(
        switchMap(() => {
          return this.wizardApiService.checkEmailAvailability(control.value).pipe(
            map((response) => {
              if (response.available) {
                return null; // Email disponible, no hay error
              } else {
                // Si el email no está verificado, permitir continuar (se reenviará el código)
                if (response.emailVerified === false) {
                  return null; // No bloquear, permitir continuar para reenviar código
                }
                // Email ya registrado y confirmado, bloquear
                return { emailTaken: { message: response.message } };
              }
            }),
            catchError((error) => {
              // En caso de error, no bloquear el formulario
              console.error('[EmailValidator] Error al verificar email:', error);
              return of(null);
            })
          );
        })
      );
    };
  }
  
  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  
  /**
   * Calcula la fortaleza de la contraseña
   */
  calculatePasswordStrength(password: string): void {
    if (!password || password.length === 0) {
      this.passwordStrength = null;
      this.passwordStrengthText = '';
      this.passwordStrengthClass = '';
      return;
    }
    
    let score = 0;
    
    // Longitud mínima
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Contiene minúsculas
    if (/[a-z]/.test(password)) score++;
    
    // Contiene mayúsculas
    if (/[A-Z]/.test(password)) score++;
    
    // Contiene números
    if (/[0-9]/.test(password)) score++;
    
    // Contiene caracteres especiales
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    // Determinar nivel
    if (password.length < 8) {
      this.passwordStrength = 'weak';
      this.passwordStrengthText = this.transloco.translate('WIZARD.basic_register.strength_very_weak');
      this.passwordStrengthClass = 'text-danger';
    } else if (score <= 3) {
      this.passwordStrength = 'weak';
      this.passwordStrengthText = this.transloco.translate('WIZARD.basic_register.strength_weak');
      this.passwordStrengthClass = 'text-danger';
    } else if (score <= 5) {
      this.passwordStrength = 'medium';
      this.passwordStrengthText = this.transloco.translate('WIZARD.basic_register.strength_medium');
      this.passwordStrengthClass = 'text-warning';
    } else {
      this.passwordStrength = 'strong';
      this.passwordStrengthText = this.transloco.translate('WIZARD.basic_register.strength_strong');
      this.passwordStrengthClass = 'text-success';
    }
  }

  ngOnInit(): void {
    this.wizardStateService.registerForm(this.stepNumber, this.form);
    // Cargar datos guardados
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      this.form.patchValue(savedData);
      // Si ya se registró el usuario, restaurar el estado
      if (savedData.userId && savedData.email) {
        this.registeredUserId = savedData.userId;
        this.registeredEmail = savedData.email;
        // Si está esperando verificación, mostrar el mensaje
        if (savedData.waitingVerification) {
          this.waitingEmailVerification = true;
        }
      }
    }

    // Verificar si el usuario ya está autenticado en el wizard
    if (this.wizardApiService.isAuthenticated()) {
      const user = this.wizardApiService.getUser();
      if (user) {
        this.registeredUserId = user.id;
        this.registeredEmail = user.email;
        this.waitingEmailVerification = false;
        // Poblar el formulario con datos del usuario autenticado para que la validación pase
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        if (!this.form.get('email')?.value) {
          this.form.patchValue({ email: user.email || '', fullName });
          // La contraseña no se restaura por seguridad; usar un placeholder para satisfacer required
          if (!this.form.get('password')?.value) {
            this.form.get('password')?.clearValidators();
            this.form.get('password')?.updateValueAndValidity();
          }
        }
        // Emitir evento de registro completado
        this.registrationCompleted.emit();
      }
    }

    // Obtener país por IP y establecerlo en el input de teléfono
    this.geolocationService.getCountryCodeByIP().subscribe(countryCode => {
      this.detectedCountryCode = countryCode;
      // Actualizar el país en el input después de que se inicialice
      setTimeout(() => {
        if (this.phoneInput) {
          this.phoneInput.setCountry(countryCode);
        }
      }, 500);
    });

    // Guardar datos cuando el formulario cambia
    this.formSubscription = this.form.valueChanges.subscribe(() => {
      this.saveStepData();
    });
  }

  ngOnDestroy(): void {
    this.wizardStateService.unregisterForm(this.stepNumber);
    this.formSubscription?.unsubscribe();
    this.saveStepData();
  }

  /**
   * Guarda los datos del paso
   */
  private saveStepData(): void {
    if (this.form.valid) {
      this.wizardStateService.setStepData(this.stepNumber, this.form.value);
    }
  }

  /**
   * Registra el usuario usando el endpoint del wizard
   * POST /wizard/requests/register
   * Este método se debe llamar antes de avanzar al siguiente paso
   */
  async registerUser(): Promise<boolean> {
    // Si ya está autenticado, permitir avanzar
    if (this.wizardApiService.isAuthenticated()) {
      return true;
    }

    // Si ya se registró y está esperando verificación, no volver a registrar
    if (this.waitingEmailVerification && this.registeredUserId) {
      return false; // Necesita verificar el email primero
    }

    const formValue = this.form.value;
    const { fullName, email, password, phone } = formValue;

    if (!fullName || !email || !password) {
      this.errorMessage = 'Por favor completa todos los campos requeridos (nombre, email, contraseña)';
      return false;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      // Separar nombre completo en firstName y lastName
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const registerData = {
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        password
      };

      console.log('[WizardBasicRegisterStep] Registrando usuario con wizard API:', email);
      const response = await firstValueFrom(this.wizardApiService.register(registerData));
      
      this.registeredUserId = response.id;
      this.registeredEmail = email;
      console.log('[WizardBasicRegisterStep] Usuario registrado o código reenviado:', response);

      // Guardar datos en el estado del wizard
      this.wizardStateService.setStepData(this.stepNumber, {
        ...formValue,
        userId: response.id,
        email: email,
        firstName,
        lastName,
        waitingVerification: true
      });

      // Marcar que está esperando verificación
      this.waitingEmailVerification = true;
      // El mensaje puede indicar que se reenvió el código o que se registró nuevo usuario
      this.successMessage = response.message || 'Código de verificación enviado. Por favor, revisa tu correo para confirmar tu cuenta.';
      this.errorMessage = null; // Limpiar cualquier error previo
      this.isLoading = false;
      
      // Emitir evento de usuario creado
      this.userCreated.emit({ userId: response.id, email });
      
      // Retornar false para indicar que necesita verificación
      return false;

    } catch (error: any) {
      console.error('[WizardBasicRegisterStep] Error al registrar usuario:', error);
      this.errorMessage = error?.error?.message || 'Error al crear la cuenta. Por favor, intenta nuevamente.';
      if (error.status === 400 && error.error?.message?.includes('email')) {
        this.errorMessage = error.error.message;
      }
      this.isLoading = false;
      return false;
    }
  }

  /**
   * Verifica si el usuario puede avanzar al siguiente paso
   * Retorna true si está autenticado o si el formulario está completo para registro
   */
  canProceed(): boolean {
    // Si ya está autenticado, puede avanzar
    if (this.wizardApiService.isAuthenticated()) {
      return true;
    }
    // Si está esperando verificación, no puede avanzar
    if (this.waitingEmailVerification) {
      return false;
    }
    // Si el formulario es válido, puede intentar registrarse
    return this.form.valid;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isUserAuthenticated(): boolean {
    return this.wizardApiService.isAuthenticated();
  }

  /**
   * Reenvía el email de verificación volviendo a llamar al registro
   * El backend del wizard reenvía el código si el usuario ya existe pero no está verificado
   */
  async resendVerificationEmail(): Promise<void> {
    const formValue = this.form.value;
    const { fullName, email, password, phone } = formValue;
    
    if (!email || !password) {
      this.errorMessage = 'No se encontró el email o contraseña. Por favor, completa el formulario.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      const nameParts = (fullName || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Volver a llamar al registro - el backend reenviará el código
      await firstValueFrom(this.wizardApiService.register({
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        password
      }));
      
      this.successMessage = 'Código de verificación reenviado. Por favor, revisa tu bandeja de entrada.';
      setTimeout(() => {
        this.successMessage = null;
      }, 5000);
    } catch (error: any) {
      // Si el error indica que el email ya está verificado, es bueno
      if (error?.error?.message?.includes('confirmado')) {
        this.successMessage = 'Tu email ya está confirmado. Puedes continuar.';
        this.waitingEmailVerification = false;
      } else {
        this.errorMessage = error?.error?.message || 'Error al reenviar el código. Por favor, intenta nuevamente.';
      }
    } finally {
      this.isLoading = false;
    }
  }
}
