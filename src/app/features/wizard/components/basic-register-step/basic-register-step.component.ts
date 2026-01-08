import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared/shared.module';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { WizardStateService } from '../../services/wizard-state.service';
import { last, Subscription } from 'rxjs';
import { AuthService } from '../../../panel/services/auth.service';
import { PartnerClientsService } from '../../../panel/services/partner-clients.service';
import { firstValueFrom } from 'rxjs';
import { IntlTelInputComponent } from '../../../../shared/components/intl-tel-input/intl-tel-input.component';
import { GeolocationService } from '../../../../shared/services/geolocation.service';
import { RegisterService } from '../../services/register.service';
import { RegisterData } from '../../services/register.service';
import e from 'express';
/**
 * Componente reutilizable para el paso de registro básico
 * Usado en todos los flujos
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
  @Output() userCreated = new EventEmitter<{ userId: number; clientId: number }>();
  @ViewChild(IntlTelInputComponent) phoneInput?: IntlTelInputComponent;
  @Output() showNextButton = new EventEmitter<boolean>();

  form!: FormGroup;
  formValidation!: FormGroup;
  private formSubscription?: Subscription;
  isLoading = false;
  errorMessage: string | null = null;
  createdUserId: number | null = null;
  createdClientId: number | null = null;
  waitingEmailVerification = false;
  successMessage: string | null = null;
  detectedCountryCode: string = 'us';
  emailVerificationCode: string = '';
  emailCodeError: string | null = null;
  emailVerified: boolean = false;

  constructor(
    private wizardStateService: WizardStateService,
    private authService: AuthService,
    private partnerClientsService: PartnerClientsService,
    private geolocationService: GeolocationService,
    private registerService: RegisterService,
    private transloco: TranslocoService
  ) {
    // Cargar datos guardados si existen
    const savedData = this.wizardStateService.getStepData(this.stepNumber);

    /**
     * CAMPOS OPCIONALES - Se puede navegar sin completar todos los campos
     * - fullName: Nombre completo (opcional)
     * - phone: Teléfono (opcional)
     * - email: Correo electrónico (opcional, pero debe tener formato válido si se completa)
     * - password: Contraseña (opcional)
     * 
     * NOTA: Los campos ya no son obligatorios para navegar entre pasos.
     */
    this.form = new FormGroup({
      firstName: new FormControl(savedData.firstName || '', [Validators.required]),
      lastName: new FormControl(savedData.lastName || '', [Validators.required]),
      phone: new FormControl(savedData.phone || ''),
      email: new FormControl(savedData.email || '', [Validators.email]), // Solo valida formato si se completa
      password: new FormControl(savedData.password || '', [Validators.required]),
    });

    this.formValidation = new FormGroup({
      emailCode: new FormControl('', [Validators.required])
    });
  }

  ngOnInit(): void {
    this.wizardStateService.registerForm(this.stepNumber, this.form);
    // Cargar datos guardados

    if (this.authService.isAuthenticated()) {
      this.emailVerified = true;
      const data = this.authService.getCurrentUser();
      this.form.patchValue({
        firstName: data?.first_name || '',
        lastName: data?.last_name || '',
        email: data?.email || '',
        phone: data?.phone || ''
      });
      this.showNextButton.emit(true);
    }

    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      this.form.patchValue(savedData);
      // Si ya se creó el usuario, restaurar los IDs
      if (savedData.userId && savedData.clientId) {
        this.createdUserId = savedData.userId;
        this.createdClientId = savedData.clientId;
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

      // NO crear automáticamente - el usuario debe hacer clic explícitamente o avanzar al siguiente paso
      // La creación se hará cuando se intente avanzar al siguiente paso
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
      console.log('[WizardBasicRegisterStep] Formulario válido, guardando datos en el estado del wizard');
      this.wizardStateService.setStepData(this.stepNumber, this.form.value);
    }
  }

  /**
   * Crea el usuario y cliente cuando se completa el formulario
   * Este método se debe llamar antes de avanzar al siguiente paso
   */
  async createUserAndClient(): Promise<boolean> {
    const formValue = this.form.value;
    const { firstName, lastName, email, password, phone } = formValue;

    if (!firstName || !lastName || !email || !password) {
      this.errorMessage = this.transloco.translate('WIZARD.basic_register.fill_all_required');
      return false;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      const registerData: RegisterData = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        phone: phone
      };

      console.log('[WizardBasicRegisterStep] Creando usuario:', registerData);
      const newUser = await firstValueFrom(this.registerService.register(registerData));
      console.log('[WizardBasicRegisterStep] Usuario creado:', newUser);

      this.userCreated.emit({ userId: newUser.id, clientId: this.createdClientId! });

      // Guardar IDs en el estado del wizard
      this.wizardStateService.setStepData(this.stepNumber, {
        ...formValue,
        userId: newUser.id,
        clientId: this.createdClientId,
        email: email,
        password: password, // Guardar temporalmente para login después de verificación
        waitingVerification: true // Marcar que está esperando verificación
      });

      // Guardar estado completo del wizard en localStorage para recuperarlo después de verificación
      const wizardState = this.wizardStateService.getAllData();
      localStorage.setItem('wizard_state_pending_verification', JSON.stringify({
        wizardData: wizardState,
        email: email,
        password: password,
        userId: newUser.id,
        clientId: this.createdClientId,
        phone: phone,
        timestamp: Date.now()
      }));

      // Marcar que está esperando verificación
      this.waitingEmailVerification = true;
      this.isLoading = false;

      // Retornar false para indicar que necesita verificación
      return false;

    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Error al crear la cuenta. Por favor, intenta nuevamente.';

      if (error.error.statusCode == 400 && this.errorMessage?.includes('inicia sesión')) {
        this.errorMessage = this.transloco.translate('WIZARD.basic_register.email_exists');
      } else if (error.error.statusCode == 400 && this.errorMessage?.includes('confirmar')) {
        this.errorMessage = this.transloco.translate('WIZARD.basic_register.email_exists_validate');
        this.waitingEmailVerification = true;
        this.isLoading = false;

      }
      this.isLoading = false;
      return false;
    }
  }

  /**
   * Reenvía el email de verificación
   */
  async resendVerificationEmail(): Promise<void> {
    const email = this.form.get('email')?.value;
    if (!email) {
      this.errorMessage = 'No se encontró el email. Por favor, completa el formulario.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      await firstValueFrom(this.authService.sendVerificationEmail(email));
      this.successMessage = 'Email de verificación reenviado. Por favor, revisa tu bandeja de entrada.';
      setTimeout(() => {
        this.successMessage = null;
      }, 5000);
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Error al reenviar el email. Por favor, intenta nuevamente.';
    } finally {
      this.isLoading = false;
    }
  }

  async verifyEmailCode(): Promise<boolean> {
    const email = this.form.get('email')?.value;
    const code = this.formValidation.get('emailCode')?.value;
    if (!email) {
      this.errorMessage = 'No se encontró el email. Por favor, completa el formulario.';
      return false;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      const response = await firstValueFrom(this.registerService.verifyEmail({ email, confirmationToken: code }));

      if (!response.accessToken) {
        this.errorMessage = 'Código de verificación inválido. Por favor, intenta nuevamente.';
        this.isLoading = false;
        return false;
      }

      this.waitingEmailVerification = false;
      this.showNextButton.emit(true);
      this.emailVerified = true;
      this.isLoading = false;
      return true;

    } catch (error: any) {
      console.error('[WizardBasicRegisterStep] Error al verificar email:', error);
      this.errorMessage = error?.error?.message || 'Error al verificar el email. Por favor, intenta nuevamente.';
      this.isLoading = false;
      return false;
    }
  }
}
