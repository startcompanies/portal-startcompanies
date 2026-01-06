import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared/shared.module';
import { TranslocoPipe } from '@jsverse/transloco';
import { WizardStateService } from '../../services/wizard-state.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../panel/services/auth.service';
import { PartnerClientsService } from '../../../panel/services/partner-clients.service';
import { firstValueFrom } from 'rxjs';

/**
 * Componente reutilizable para el paso de registro básico
 * Usado en todos los flujos
 */
@Component({
  selector: 'app-wizard-basic-register-step',
  standalone: true,
  imports: [SharedModule, TranslocoPipe, ReactiveFormsModule],
  templateUrl: './basic-register-step.component.html',
  styleUrls: ['./basic-register-step.component.css']
})
export class WizardBasicRegisterStepComponent implements OnInit, OnDestroy {
  @Input() stepNumber: number = 1;
  @Output() userCreated = new EventEmitter<{ userId: number; clientId: number }>();
  
  form!: FormGroup;
  private formSubscription?: Subscription;
  isLoading = false;
  errorMessage: string | null = null;
  createdUserId: number | null = null;
  createdClientId: number | null = null;
  waitingEmailVerification = false;
  successMessage: string | null = null;

  constructor(
    private wizardStateService: WizardStateService,
    private authService: AuthService,
    private partnerClientsService: PartnerClientsService
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
      fullName: new FormControl(savedData.fullName || ''),
      phone: new FormControl(savedData.phone || ''),
      email: new FormControl(savedData.email || '', [Validators.email]), // Solo valida formato si se completa
      password: new FormControl(savedData.password || ''),
    });
  }

  ngOnInit(): void {
    this.wizardStateService.registerForm(this.stepNumber, this.form);
    // Cargar datos guardados
    const savedData = this.wizardStateService.getStepData(this.stepNumber);
    if (savedData && Object.keys(savedData).length > 0) {
      this.form.patchValue(savedData);
      // Si ya se creó el usuario, restaurar los IDs
      if (savedData.userId && savedData.clientId) {
        this.createdUserId = savedData.userId;
        this.createdClientId = savedData.clientId;
      }
    }

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
      this.wizardStateService.setStepData(this.stepNumber, this.form.value);
    }
  }

  /**
   * Crea el usuario y cliente cuando se completa el formulario
   * Este método se debe llamar antes de avanzar al siguiente paso
   */
  async createUserAndClient(): Promise<boolean> {
    const formValue = this.form.value;
    const { fullName, email, password, phone } = formValue;

    if (!fullName || !email || !password) {
      this.errorMessage = 'Por favor completa todos los campos requeridos (nombre, email, contraseña)';
      return false;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      // 1. Crear usuario (registro)
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const registerData = {
        username: email, // Usar email como username
        email: email,
        password: password,
        first_name: firstName,
        last_name: lastName
      };

      console.log('[WizardBasicRegisterStep] Creando usuario:', registerData);
      const newUser = await firstValueFrom(this.authService.register(registerData));
      this.createdUserId = newUser.id;
      console.log('[WizardBasicRegisterStep] Usuario creado:', newUser);

      // 2. Enviar email de verificación (NO hacer login automático)
      try {
        await firstValueFrom(this.authService.sendVerificationEmail(email));
        console.log('[WizardBasicRegisterStep] Email de verificación enviado');
      } catch (error: any) {
        console.warn('[WizardBasicRegisterStep] Error al enviar email de verificación:', error);
        // Continuar aunque falle el envío del email (puede que el backend lo envíe automáticamente)
      }

      // 3. Crear cliente asociado al usuario
      // Para usuarios tipo 'client', el backend puede crear automáticamente el cliente
      // Si no, crear el cliente usando el servicio
      const clientData = {
        full_name: fullName,
        email: email,
        phone: phone || undefined,
        userId: newUser.id
      };

      let newClient: any = null;
      try {
        // Crear cliente usando el servicio
        newClient = await firstValueFrom(
          this.partnerClientsService.createClient(clientData)
        );
        this.createdClientId = newClient.id;
        console.log('[WizardBasicRegisterStep] Cliente creado:', newClient);
      } catch (error: any) {
        // Si falla porque el cliente ya existe o por otra razón, usar el userId
        console.warn('[WizardBasicRegisterStep] Error al crear cliente:', error);
        // El backend puede haber creado el cliente automáticamente o puede que necesitemos buscarlo
        // Por ahora, usar el userId como referencia
        this.createdClientId = newUser.id;
        newClient = { id: newUser.id }; // Crear objeto temporal para evitar errores
      }

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
        timestamp: Date.now()
      }));

      // Marcar que está esperando verificación
      this.waitingEmailVerification = true;
      this.isLoading = false;
      
      // Retornar false para indicar que necesita verificación
      return false;

    } catch (error: any) {
      console.error('[WizardBasicRegisterStep] Error al crear usuario/cliente:', error);
      this.errorMessage = error?.error?.message || 'Error al crear la cuenta. Por favor, intenta nuevamente.';
      if (error.status === 400 && error.error?.message?.includes('email')) {
        this.errorMessage = 'Ya existe un usuario con este email. Por favor, usa otro email o inicia sesión.';
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
}
