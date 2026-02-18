import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ComponentRef, EnvironmentInjector, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ViewContainerRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { RequestFlowContext, RequestFlowStep, FlowStepConfig, ServiceType } from '../../models/request-flow-context';
import { RequestFlowConfigService } from '../../services/request-flow-config.service';
import { RequestFlowStateService } from '../../services/request-flow-state.service';
import { FlowStepsIndicatorComponent } from '../flow-steps-indicator/flow-steps-indicator.component';
import { WizardStateService } from '../../../features/wizard/services/wizard-state.service';
import { DraftRequestService } from '../../services/draft-request.service';

/**
 * Componente base abstracto para manejar flujos de solicitud unificados
 * Este componente maneja la navegación y el estado compartido entre diferentes contextos
 */
@Component({
  selector: 'app-base-request-flow',
  standalone: true,
  imports: [CommonModule, FlowStepsIndicatorComponent, RouterLink],
  template: `
    <div class="base-request-flow-container">
      <!-- Indicador de pasos -->
      <app-flow-steps-indicator 
        [steps]="flowSteps" 
        [currentStep]="currentStepIndex"
        [context]="context">
      </app-flow-steps-indicator>
      
      <!-- Contenedor dinámico de pasos -->
      <div class="flow-content">
        <div class="step-wrapper">
          <ng-template #stepHost></ng-template>
        </div>
      </div>
      
      <!-- Botones de navegación -->
      <div class="flow-actions">
        <!-- Botón Cancelar (solo en primer paso de selección de tipo de servicio en panel) -->
        <a 
          *ngIf="!canGoBack() && isServiceTypeSelectionStep() && (this.context === 'panel-client' || this.context === 'panel-partner')"
          routerLink="/panel/my-requests"
          class="btn btn-outline-secondary">
          Cancelar
        </a>
        <button 
          *ngIf="canGoBack() && !isServiceFormStep()" 
          type="button"
          class="btn btn-outline-secondary"
          (click)="previousStep()"
          [disabled]="isLoading">
          <i class="bi bi-arrow-left me-2"></i>
          Anterior
        </button>
        <div *ngIf="(!canGoBack() || isServiceFormStep()) && !isServiceTypeSelectionStep()" class="flex-grow-1"></div>
        <!-- En última sección de Información de la LLC el Siguiente va dentro del paso (mismo diseño que Siguiente Sección) -->
        <button 
          *ngIf="canGoNext() && (!isServiceFormStep() || !isInLastSectionOfServiceForm())" 
          type="button"
          class="btn btn-primary"
          (click)="nextStep()"
          [disabled]="isLoading || !canProceedToNext()">
          Siguiente
          <i class="bi bi-arrow-right ms-2"></i>
        </button>
        <button 
          *ngIf="isLastStep()" 
          type="button"
          class="btn btn-success"
          (click)="finishFlow()"
          [disabled]="isLoading || !canFinish()">
          <i class="bi bi-check-circle me-2"></i>
          Finalizar
        </button>
      </div>
      
      <!-- Mensajes de error/éxito -->
      <div *ngIf="errorMessage" class="alert alert-danger mt-3">
        <i class="bi bi-exclamation-triangle me-2"></i>
        {{ errorMessage }}
      </div>
      <div *ngIf="successMessage && !isServiceFormStep()" class="alert alert-success mt-3">
        <i class="bi bi-check-circle me-2"></i>
        {{ successMessage }}
      </div>
    </div>
  `,
  styleUrls: ['./base-request-flow.component.css']
})
export class BaseRequestFlowComponent implements OnInit, OnDestroy {
  @Input() context!: RequestFlowContext;
  @Input() serviceType: ServiceType | null = null; // Ahora opcional
  
  @Output() flowCompleted = new EventEmitter<any>();
  @Output() flowCancelled = new EventEmitter<void>();
  @Output() serviceTypeChanged = new EventEmitter<ServiceType>(); // Nuevo output
  
  flowSteps: FlowStepConfig[] = [];
  currentStepIndex = 0;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  private currentStepValid = true;

  @ViewChild('stepHost', { read: ViewContainerRef, static: true }) stepHost!: ViewContainerRef;
  private stepComponentRef: ComponentRef<any> | null = null;
  private stepSubscriptions: Subscription[] = [];

  private envInjector = inject(EnvironmentInjector);
  private wizardStateService = inject(WizardStateService, { optional: true });
  private draftRequestService = inject(DraftRequestService, { optional: true });
  
  // Propiedades para manejo de borradores
  @Input() draftRequestUuid: string | null = null;
  @Input() initialClientId: number | null = null;
  
  private draftRequestId: number | null = null;
  private autosaveInterval: any = null;
  private autosaveEnabled = false;
  
  constructor(
    protected flowConfigService: RequestFlowConfigService,
    protected flowStateService: RequestFlowStateService
  ) {}
  
  async ngOnInit(): Promise<void> {
    if (!this.context) {
      throw new Error('BaseRequestFlowComponent: context es requerido');
    }
    
    // Si no hay serviceType, el flujo debe incluir el paso de selección
    // Usamos 'apertura-llc' como default temporal solo para obtener la estructura base
    // El paso de selección permitirá elegir el tipo real
    const tempServiceType: ServiceType = this.serviceType || 'apertura-llc';
    this.flowSteps = this.flowConfigService.getFlowConfig(this.context, tempServiceType, this.serviceType === null);
    
    // Cargar borrador si hay UUID
    if (this.draftRequestUuid && this.draftRequestService) {
      await this.loadDraftRequest(this.draftRequestUuid);
    }
    
    // Si hay cliente inicial, guardarlo en el estado
    if (this.initialClientId) {
      this.flowStateService.setStepData(RequestFlowStep.CLIENT_SELECTION, {
        clientId: this.initialClientId
      });
    }
    
    // Inicializar wizard state service si estamos en contexto wizard
    if (this.context === RequestFlowContext.WIZARD && this.wizardStateService && this.serviceType) {
      this.wizardStateService.setServiceType(this.serviceType);
      
      // Restaurar paso guardado si existe
      const savedStep = this.wizardStateService.getCurrentStep();
      if (savedStep > 0 && savedStep < this.flowSteps.length) {
        this.currentStepIndex = savedStep - 1; // -1 porque currentStep es 1-indexed
      }
      
      // Si hay un requestId guardado, significa que el pago ya fue procesado
      if (this.wizardStateService.hasRequest()) {
        const requestId = this.wizardStateService.getRequestId();
        this.flowStateService.setStepData(RequestFlowStep.PAYMENT, {
          paymentProcessed: true,
          requestId: requestId
        });
        this.currentStepValid = true;
      }
    }
    
    this.initializeFlow();
    
    // Sincronizar con WizardStateService después de cargar borrador
    if (this.context === RequestFlowContext.WIZARD && this.wizardStateService && this.draftRequestId) {
      this.syncToWizardStateService();
    }
    
    this.renderCurrentStep();
    
    // Iniciar autosave si estamos en contexto panel y hay borrador
    if (this.context !== RequestFlowContext.WIZARD && this.draftRequestId) {
      this.startAutosave();
    }
  }

  ngOnDestroy(): void {
    this.stopAutosave();
    this.stepSubscriptions.forEach(s => s.unsubscribe());
    this.stepSubscriptions = [];
    this.stepComponentRef?.destroy();
    this.stepComponentRef = null;
  }
  
  /**
   * Carga un borrador por UUID y restaura el paso actual desde request.currentStep
   * (y currentStepNumber del sub-request si aplica), para que panel y wizard no vuelvan al paso 1.
   */
  private async loadDraftRequest(uuid: string): Promise<void> {
    if (!this.draftRequestService) return;
    
    this.isLoading = true;
    this.errorMessage = null;
    
    try {
      const request = await this.draftRequestService.loadDraftByUuid(uuid);
      if (!request) {
        throw new Error('No se pudo cargar el borrador');
      }
      this.draftRequestId = request.id;
      
      // Sincronizar con WizardStateService si estamos en contexto wizard
      if (this.context === RequestFlowContext.WIZARD && this.wizardStateService) {
        this.syncToWizardStateService();
      }
      
      // Restaurar paso desde la API: request.currentStep es 1-based (paso principal del flujo)
      const apiStep = (request as any).currentStep;
      if (typeof apiStep === 'number' && apiStep >= 1) {
        const desiredIndex = Math.min(apiStep - 1, this.flowSteps.length - 1);
        this.currentStepIndex = Math.max(0, desiredIndex);
      } else {
        // Fallback: inferir paso por datos hidratados (comportamiento anterior)
        const clientSelection = this.flowStateService.getStepData(RequestFlowStep.CLIENT_SELECTION);
        const paymentData = this.flowStateService.getStepData(RequestFlowStep.PAYMENT);
        const serviceData = this.flowStateService.getStepData(RequestFlowStep.SERVICE_FORM);
        
        if (paymentData?.paymentProcessed) {
          const serviceStepIndex = this.flowSteps.findIndex(s => s.step === RequestFlowStep.SERVICE_FORM);
          const confirmationStepIndex = this.flowSteps.findIndex(s => s.step === RequestFlowStep.CONFIRMATION);
          if (serviceStepIndex >= 0 && serviceData && Object.keys(serviceData).length > 0 && confirmationStepIndex >= 0) {
            this.currentStepIndex = confirmationStepIndex;
          } else if (serviceStepIndex >= 0) {
            this.currentStepIndex = serviceStepIndex;
          }
        } else if (serviceData && Object.keys(serviceData).length > 0) {
          const paymentStepIndex = this.flowSteps.findIndex(s => s.step === RequestFlowStep.PAYMENT);
          if (paymentStepIndex >= 0) {
            this.currentStepIndex = paymentStepIndex;
          }
        } else if (clientSelection?.clientId) {
          const serviceStepIndex = this.flowSteps.findIndex(s => s.step === RequestFlowStep.SERVICE_FORM);
          if (serviceStepIndex >= 0) {
            this.currentStepIndex = serviceStepIndex;
          }
        }
      }
      
      // No mostrar mensaje "Borrador cargado exitosamente" en paso Información de la LLC
    } catch (error: any) {
      console.error('[BaseRequestFlowComponent] Error al cargar borrador:', error);
      this.errorMessage = error?.message || 'Error al cargar el borrador';
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * Sincroniza datos de RequestFlowStateService a WizardStateService
   * Para que los componentes del wizard puedan acceder a los datos hidratados
   */
  private syncToWizardStateService(): void {
    if (!this.wizardStateService) return;
    
    // Sincronizar datos de registro
    const registerData = this.flowStateService.getStepData(RequestFlowStep.REGISTER);
    if (registerData && Object.keys(registerData).length > 0) {
      this.wizardStateService.setStepData(1, registerData);
    }
    
    // Sincronizar datos de verificación de email
    const emailVerificationData = this.flowStateService.getStepData(RequestFlowStep.EMAIL_VERIFICATION);
    if (emailVerificationData && Object.keys(emailVerificationData).length > 0) {
      this.wizardStateService.setStepData(2, emailVerificationData);
    }
    
    // Sincronizar datos de selección de estado/plan
    const statePlanData = this.flowStateService.getStepData(RequestFlowStep.PLAN_STATE_SELECTION);
    const stateData = this.flowStateService.getStepData(RequestFlowStep.STATE_SELECTION);
    const planStateData = statePlanData || stateData;
    if (planStateData && Object.keys(planStateData).length > 0) {
      this.wizardStateService.setStepData(2, planStateData); // Paso 2 en wizard
    }
    
    // Sincronizar datos de pago
    const paymentData = this.flowStateService.getStepData(RequestFlowStep.PAYMENT);
    if (paymentData && Object.keys(paymentData).length > 0) {
      this.wizardStateService.setStepData(3, paymentData); // Paso 3 en wizard
      if (paymentData.requestId) {
        this.wizardStateService.setRequestId(paymentData.requestId);
      }
    }
    
    // Sincronizar datos del formulario de servicio (incl. members/owners para el resumen de confirmación)
    let serviceData = this.flowStateService.getStepData(RequestFlowStep.SERVICE_FORM);
    if (serviceData && Object.keys(serviceData).length > 0) {
      serviceData = { ...serviceData };
      if (this.serviceType === 'renovacion-llc' && serviceData.members && !serviceData.owners) {
        serviceData.owners = serviceData.members;
      }
      if (!serviceData.members && serviceData.owners) {
        serviceData.members = serviceData.owners;
      }
      this.wizardStateService.setStepData(4, serviceData); // Paso 4 en wizard
    }
    
    // Sincronizar datos de confirmación
    const confirmationData = this.flowStateService.getStepData(RequestFlowStep.CONFIRMATION);
    if (confirmationData && Object.keys(confirmationData).length > 0) {
      this.wizardStateService.setStepData(5, confirmationData); // Paso 5 en wizard
    }
  }
  
  /**
   * Inicia el autosave periódico
   */
  private startAutosave(): void {
    if (!this.draftRequestService || this.autosaveEnabled) return;
    
    this.autosaveEnabled = true;
    // Autosave cada 1 minuto (no tan seguido)
    this.autosaveInterval = setInterval(() => {
      this.performAutosave();
    }, 60000);
  }
  
  /**
   * Detiene el autosave
   */
  private stopAutosave(): void {
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
      this.autosaveInterval = null;
    }
    this.autosaveEnabled = false;
  }
  
  /**
   * Realiza el autosave del estado actual
   */
  private async performAutosave(): Promise<void> {
    if (!this.draftRequestService || !this.draftRequestId || this.isLoading) return;
    
    try {
      const allData = this.flowStateService.getState();
      const clientSelection = this.flowStateService.getStepData(RequestFlowStep.CLIENT_SELECTION);
      const paymentData = this.flowStateService.getStepData(RequestFlowStep.PAYMENT);
      const serviceData = this.flowStateService.getStepData(RequestFlowStep.SERVICE_FORM);
      const statePlanData = this.flowStateService.getStepData(RequestFlowStep.PLAN_STATE_SELECTION);
      const stateData = this.flowStateService.getStepData(RequestFlowStep.STATE_SELECTION);
      
      // Construir datos para guardar
      const draftData: any = {
        type: this.serviceType,
        currentStep: this.currentStepIndex + 1
      };
      
      if (clientSelection?.clientId) {
        draftData.clientId = clientSelection.clientId;
      }
      
      if (paymentData?.paymentProcessed && paymentData?.requestId) {
        draftData.paymentStatus = 'succeeded';
        draftData.paymentAmount = paymentData.paymentInfo?.amount;
        draftData.paymentMethod = paymentData.paymentInfo?.method;
        draftData.stripeChargeId = paymentData.paymentInfo?.chargeId;
      }
      
      // Agregar datos específicos del servicio (wizard y panel: incluir plan/state o state/llcType para validaciones al recargar)
      if (serviceData) {
        if (this.serviceType === 'apertura-llc') {
          draftData.aperturaLlcData = {
            ...serviceData,
            ...(statePlanData?.plan != null && { plan: statePlanData.plan }),
            ...(statePlanData?.state != null && { incorporationState: statePlanData.state })
          };
        } else if (this.serviceType === 'renovacion-llc') {
          draftData.renovacionLlcData = {
            ...serviceData,
            ...(stateData?.state != null && { state: stateData.state }),
            ...(stateData?.llcType != null && { llcType: stateData.llcType })
          };
        } else if (this.serviceType === 'cuenta-bancaria') {
          draftData.cuentaBancariaData = serviceData;
        }
      }
      
      await this.draftRequestService.saveDraft(this.draftRequestId, draftData);
      console.log('[BaseRequestFlowComponent] Autosave completado');
    } catch (error: any) {
      console.error('[BaseRequestFlowComponent] Error en autosave:', error);
      // No mostrar error al usuario para no interrumpir el flujo
    }
  }
  
  /**
   * Inicializa el flujo específico
   */
  protected initializeFlow(): void {
    // Implementación por defecto - puede ser sobrescrita por servicios específicos
    console.log('[BaseRequestFlowComponent] Inicializando flujo:', this.context, this.serviceType);
  }
  
  /**
   * Navega al siguiente paso
   */
  async nextStep(): Promise<void> {
    const currentStep = this.flowSteps[this.currentStepIndex];
    
    // Validar paso actual
    if (!await this.validateStep(currentStep)) {
      return;
    }
    
    // Guardar estado del paso
    await this.saveStepState(currentStep);
    
    // Avanzar
    if (this.currentStepIndex < this.flowSteps.length - 1) {
      this.currentStepIndex++;
      this.onStepChanged();
      this.renderCurrentStep();
    }
  }
  
  /**
   * Navega al paso anterior
   */
  async previousStep(): Promise<void> {
    if (this.currentStepIndex > 0) {
      // Guardar estado antes de retroceder
      const currentStep = this.flowSteps[this.currentStepIndex];
      await this.saveStepState(currentStep);
      
      this.currentStepIndex--;
      this.onStepChanged();
      this.renderCurrentStep();
    }
  }
  
  /**
   * Valida el paso actual antes de avanzar
   */
  protected async validateStep(step: FlowStepConfig): Promise<boolean> {
    // Implementación por defecto - puede ser extendida por servicios específicos
    // Por defecto, permitir avanzar si el paso no es requerido o si tiene datos
    if (!step.required) {
      return true;
    }
    
    // Validaciones básicas según el tipo de paso
    switch (step.step) {
      case RequestFlowStep.EMAIL_VERIFICATION:
        // En wizard: requiere que esté autenticado (tokens emitidos)
        if (this.context === RequestFlowContext.WIZARD) {
          // La verificación setea auth en WizardApiService, pero aquí validamos por una señal local:
          // si el paso emitió verificationSuccess, currentStepValid se marca true.
          return this.currentStepValid;
        }
        return true;
      case RequestFlowStep.PAYMENT:
        // Requiere que el pago esté procesado (lo actualiza el propio step)
        return this.currentStepValid;
      case RequestFlowStep.SERVICE_FORM:
      case RequestFlowStep.CONFIRMATION:
        // Estos pasos se validan en sus componentes específicos
        return true;
      default:
        // Por defecto, permitir avanzar
        return true;
    }
  }
  
  /**
   * Guarda el estado del paso actual
   */
  protected async saveStepState(step: FlowStepConfig): Promise<void> {
    // Obtener datos del paso actual desde el componente si tiene método getFormData
    let stepData = this.flowStateService.getStepData(step.step);
    if (this.stepComponentRef?.instance) {
      const instance = this.stepComponentRef.instance;
      if (typeof instance.getFormData === 'function') {
        try {
          const formData = instance.getFormData();
          stepData = { ...stepData, ...formData };
          this.flowStateService.setStepData(step.step, stepData);
        } catch (error) {
          console.warn(`[BaseRequestFlowComponent] Error al obtener datos del formulario del paso ${step.step}:`, error);
        }
      }
    }
    
    // Sincronizar con WizardStateService si estamos en contexto wizard
    if (this.context === RequestFlowContext.WIZARD && this.wizardStateService) {
      if (stepData && Object.keys(stepData).length > 0) {
        // Guardar en wizard state service usando el número de orden del paso
        this.wizardStateService.setStepData(step.order, stepData);
        this.wizardStateService.setCurrentStep(this.currentStepIndex + 1);
      }
    }
    
    // Si hay borrador activo y estamos en panel, hacer autosave inmediato
    if (this.draftRequestId && this.draftRequestService && this.context !== RequestFlowContext.WIZARD) {
      // Trigger autosave después de un pequeño delay para evitar múltiples llamadas
      setTimeout(() => {
        this.performAutosave();
      }, 500);
    }
    
    // Los datos ya están guardados por el componente del paso en flowStateService
    console.log(`[BaseRequestFlowComponent] Estado del paso ${step.step} guardado`);
  }
  
  /**
   * Se ejecuta cuando cambia el paso
   */
  protected onStepChanged(): void {
    // Implementación por defecto - limpiar mensajes
    this.errorMessage = null;
    this.successMessage = null;
    this.currentStepValid = true;
  }
  
  /**
   * Obtiene los inputs para pasar al componente del paso
   */
  protected getStepInputs(stepConfig: FlowStepConfig): any {
    const baseInputs = {
      stepNumber: stepConfig.order,
      context: this.context,
      serviceType: this.serviceType || undefined, // Puede ser null
      previousStepNumber: Math.max(stepConfig.order - 1, 1)
    };
    
    // Agregar datos específicos del paso desde el estado
    const stepData = this.flowStateService.getStepData(stepConfig.step);

    // Inputs especiales según el paso
    const extra: any = {};
    
    // Verificación de email (wizard): necesita email y password del registro
    if (stepConfig.step === RequestFlowStep.EMAIL_VERIFICATION && this.context === RequestFlowContext.WIZARD && this.wizardStateService) {
      const step1 = this.wizardStateService.getStepData(1) || {};
      extra.email = step1.email || '';
      extra.password = step1.password || '';
    }
    
    // Payment step: necesita datos del paso anterior (state, plan, amount)
    if (stepConfig.step === RequestFlowStep.PAYMENT) {
      if (this.wizardStateService) {
        // Wizard: obtener datos del wizard state service
        const prevStepData = this.wizardStateService.getStepData(stepConfig.order - 1) || {};
        extra.state = prevStepData.state || '';
        extra.plan = prevStepData.plan || '';
        extra.packId = prevStepData.packId || '';
        extra.priceId = prevStepData.priceId || '';
        // Para cuenta bancaria, puede tener monto fijo
        if (this.serviceType === 'cuenta-bancaria') {
          extra.fixedAmount = 99; // Monto fijo para cuenta bancaria
        }
      } else {
        // Panel: pasar serviceType y requestId si existe
        extra.serviceType = this.serviceType;
        const paymentData = this.flowStateService.getStepData(RequestFlowStep.PAYMENT) || {};
        if (paymentData.requestId) {
          extra.requestId = paymentData.requestId;
        }
      }
    }
    
    // Service form steps: pueden necesitar datos del pago y datos hidratados
    if (stepConfig.step === RequestFlowStep.SERVICE_FORM) {
      const paymentData = this.flowStateService.getStepData(RequestFlowStep.PAYMENT) || {};
      // Pasar requestId si existe (después del pago)
      if (paymentData.requestId) {
        extra.requestId = paymentData.requestId;
      }
      
      // Pasar datos hidratados del servicio si existen
      const serviceData = this.flowStateService.getStepData(RequestFlowStep.SERVICE_FORM);
      if (serviceData && Object.keys(serviceData).length > 0) {
        // Pasar datos específicos según el tipo de servicio
        if (this.serviceType === 'apertura-llc') {
          extra.initialData = serviceData;
        } else if (this.serviceType === 'renovacion-llc') {
          extra.initialData = serviceData;
        } else if (this.serviceType === 'cuenta-bancaria') {
          extra.initialData = serviceData;
        }
      }
    }
    
    return {
      ...baseInputs,
      ...extra,
      ...stepData
    };
  }
  
  /**
   * Verifica si se puede retroceder
   */
  canGoBack(): boolean {
    return this.currentStepIndex > 0;
  }
  
  /**
   * Verifica si se puede avanzar
   */
  canGoNext(): boolean {
    return this.currentStepIndex < this.flowSteps.length - 1;
  }
  
  /**
   * Verifica si es el último paso
   */
  isLastStep(): boolean {
    return this.currentStepIndex === this.flowSteps.length - 1;
  }
  
  /**
   * Verifica si se puede proceder al siguiente paso
   */
  protected canProceedToNext(): boolean {
    return this.currentStepValid;
  }
  
  /**
   * Verifica si el paso actual es la selección de tipo de servicio
   */
  isServiceTypeSelectionStep(): boolean {
    const currentStep = this.flowSteps[this.currentStepIndex];
    return currentStep?.step === RequestFlowStep.SERVICE_TYPE_SELECTION;
  }

  /** True cuando el paso actual es Información de la LLC/servicio (no se muestran Anterior/Siguiente salvo Siguiente en última sección) */
  isServiceFormStep(): boolean {
    const currentStep = this.flowSteps[this.currentStepIndex];
    return currentStep?.step === RequestFlowStep.SERVICE_FORM;
  }

  /** True cuando estamos en la última sección del paso Información de la LLC (mostrar solo botón Siguiente) */
  isInLastSectionOfServiceForm(): boolean {
    if (!this.isServiceFormStep()) return false;
    const serviceData = this.flowStateService.getStepData(RequestFlowStep.SERVICE_FORM);
    const section = serviceData?.currentSection;
    // Apertura LLC y Renovación LLC tienen 3 secciones; la última es la 3
    return section === 3;
  }
  
  /**
   * Verifica si se puede finalizar el flujo
   */
  protected canFinish(): boolean {
    // Por defecto, permitir finalizar
    // Las implementaciones específicas pueden sobrescribir esto
    const current = this.getCurrentStep();
    // En confirmación, el envío se hace desde el componente (submitRequest)
    if (current?.step === RequestFlowStep.CONFIRMATION) {
      return false;
    }
    return true;
  }
  
  /**
   * Finaliza el flujo
   */
  protected async finishFlow(): Promise<void> {
    const lastStep = this.flowSteps[this.flowSteps.length - 1];
    
    if (await this.validateStep(lastStep)) {
      await this.saveStepState(lastStep);
      this.flowCompleted.emit(this.flowStateService.getState());
    }
  }
  
  /**
   * Cancela el flujo
   */
  cancelFlow(): void {
    this.flowCancelled.emit();
  }
  
  /**
   * Obtiene el paso actual
   */
  getCurrentStep(): FlowStepConfig | null {
    return this.flowSteps[this.currentStepIndex] || null;
  }
  
  /**
   * Obtiene el número total de pasos
   */
  getTotalSteps(): number {
    return this.flowSteps.length;
  }

  /**
   * Renderiza el componente del paso actual y conecta outputs conocidos
   */
  private renderCurrentStep(): void {
    if (!this.stepHost) return;

    const stepConfig = this.flowSteps[this.currentStepIndex];
    if (!stepConfig) return;

    // Antes de destruir: si el siguiente paso es Confirmación, guardar datos actuales del paso SERVICE_FORM (incl. members)
    if (stepConfig.step === RequestFlowStep.CONFIRMATION && this.stepComponentRef?.instance) {
      const instance = this.stepComponentRef.instance;
      if (typeof instance.getFormData === 'function') {
        try {
          const formData = instance.getFormData();
          const currentService = this.flowStateService.getStepData(RequestFlowStep.SERVICE_FORM);
          this.flowStateService.setStepData(RequestFlowStep.SERVICE_FORM, { ...currentService, ...formData });
        } catch (e) {
          console.warn('[BaseRequestFlowComponent] Error al capturar datos del formulario antes de Confirmación:', e);
        }
      }
    }

    // limpiar subs anteriores
    this.stepSubscriptions.forEach(s => s.unsubscribe());
    this.stepSubscriptions = [];
    this.stepComponentRef?.destroy();
    this.stepComponentRef = null;

    // Sincronizar flujo → wizard state para que el paso Confirmación muestre el resumen (panel y wizard)
    if (stepConfig.step === RequestFlowStep.CONFIRMATION) {
      this.syncToWizardStateService();
    }

    // Por defecto, bloquear next en pasos que dependen de acción interna
    this.currentStepValid = ![
      RequestFlowStep.REGISTER,
      RequestFlowStep.EMAIL_VERIFICATION,
      RequestFlowStep.PAYMENT,
      RequestFlowStep.SERVICE_TYPE_SELECTION, // También requiere selección
    ].includes(stepConfig.step);

    this.stepHost.clear();
    this.stepComponentRef = this.stepHost.createComponent(stepConfig.component, {
      environmentInjector: this.envInjector,
    });

    const instance: any = this.stepComponentRef.instance;
    const inputs = this.getStepInputs(stepConfig);
    Object.keys(inputs).forEach((k) => {
      try {
        instance[k] = inputs[k];
      } catch (_) {}
    });

    // Conectar outputs comunes si existen
    const subscribeIfEmitter = (prop: string, handler: (v: any) => void) => {
      const emitter = instance?.[prop];
      if (emitter && typeof emitter.subscribe === 'function') {
        this.stepSubscriptions.push(emitter.subscribe(handler));
      }
    };

    // Wizard: registro
    subscribeIfEmitter('userCreated', (evt: any) => {
      // Guardar datos del usuario creado en ambos servicios
      const registerData = {
        userId: evt?.userId,
        email: evt?.email,
        waitingVerification: true
      };
      
      if (this.wizardStateService) {
        const step1Data = this.wizardStateService.getStepData(1) || {};
        this.wizardStateService.setStepData(1, {
          ...step1Data,
          ...registerData
        });
      }
      
      // También guardar en flow state service
      this.flowStateService.setStepData(RequestFlowStep.REGISTER, {
        ...this.flowStateService.getStepData(RequestFlowStep.REGISTER),
        ...registerData
      });
      
      // NO avanzar automáticamente - el usuario debe verificar email primero
      // El componente mostrará el paso de verificación dentro del mismo paso
    });
    
    // Wizard: registro completado (cuando necesita verificación)
    subscribeIfEmitter('registrationCompleted', () => {
      // Esto se emite cuando el registro requiere verificación
      // El componente de registro maneja mostrar la verificación
      // No avanzamos aquí, esperamos verificationSuccess
    });

    // Wizard: verificación email exitosa
    subscribeIfEmitter('verificationSuccess', () => {
      this.currentStepValid = true;
      // Sincronizar con flow state
      this.flowStateService.setStepData(RequestFlowStep.EMAIL_VERIFICATION, {
        verified: true,
        timestamp: Date.now()
      });
      // Avanzar al siguiente paso
      this.nextStep();
    });

    // Pago
    subscribeIfEmitter('paymentAndRequestCreated', (evt: any) => {
      // Guardar en ambos servicios para mantener compatibilidad
      const paymentData = {
        paymentProcessed: true,
        requestId: evt?.requestId,
        paymentInfo: evt?.paymentInfo,
        stripeToken: evt?.paymentInfo?.chargeId || null,
        paymentAmount: evt?.paymentInfo?.amount || 0,
        paymentMethod: evt?.paymentInfo?.method || 'stripe'
      };
      
      // Guardar en flow state service
      this.flowStateService.setStepData(RequestFlowStep.PAYMENT, paymentData);
      
      // Guardar en wizard state service (para compatibilidad con componentes existentes)
      if (this.wizardStateService && evt?.requestId) {
        this.wizardStateService.setRequestId(evt.requestId);
        this.wizardStateService.setStepData(stepConfig.order, {
          ...this.wizardStateService.getStepData(stepConfig.order),
          ...paymentData
        });
      }
      
      this.currentStepValid = true;
      this.successMessage = '¡Pago procesado exitosamente!';
    });
    subscribeIfEmitter('paymentError', (err: any) => {
      this.currentStepValid = false;
      this.errorMessage = err || 'Error al procesar el pago';
    });

    // Panel partner/client: validez del paso
    subscribeIfEmitter('stepValid', (isValid: boolean) => {
      this.currentStepValid = !!isValid;
    });
    
    // Selección de tipo de servicio
    subscribeIfEmitter('serviceTypeSelected', (serviceType: ServiceType) => {
      if (serviceType) {
        this.serviceType = serviceType;
        this.serviceTypeChanged.emit(serviceType);
        
        // Recargar la configuración del flujo con el nuevo serviceType (sin paso de selección)
        const newFlowSteps = this.flowConfigService.getFlowConfig(this.context, serviceType, false);
        
        // Encontrar el índice del paso actual (SERVICE_TYPE_SELECTION)
        const currentStepIndex = this.currentStepIndex;
        const serviceTypeStepIndex = this.flowSteps.findIndex(s => s.step === RequestFlowStep.SERVICE_TYPE_SELECTION);
        
        if (serviceTypeStepIndex >= 0) {
          // Reemplazar los pasos, manteniendo el orden relativo
          // El paso de selección se elimina, y los demás pasos se ajustan
          this.flowSteps = newFlowSteps;
          
          // Avanzar al siguiente paso (que será el primero del flujo real sin selección)
          // Si el paso actual era el de selección (índice 0), ir al siguiente (índice 0 del nuevo flujo)
          // Pero necesitamos mapear correctamente
          this.currentStepIndex = 0;
          this.renderCurrentStep();
        }
      }
    });
    
    // Cliente asociado/seleccionado
    subscribeIfEmitter('clientAssociated', (evt: any) => {
      this.flowStateService.setStepData(RequestFlowStep.CLIENT_ASSOCIATION, {
        clientId: evt?.clientId,
        client: evt?.client
      });
      this.currentStepValid = true;
    });
    
    subscribeIfEmitter('clientSelected', (evt: any) => {
      this.flowStateService.setStepData(RequestFlowStep.CLIENT_SELECTION, {
        clientId: evt?.clientId,
        selectedClient: evt?.client
      });
      this.currentStepValid = true;
    });
    
    subscribeIfEmitter('clientCreated', (evt: any) => {
      this.flowStateService.setStepData(RequestFlowStep.CLIENT_SELECTION, {
        clientId: evt?.clientId,
        selectedClient: evt?.client
      });
      this.currentStepValid = true;
    });
    
    // Service form: cambios de sección
    subscribeIfEmitter('sectionChanged', (section: number) => {
      // Guardar la sección actual
      const currentData = this.flowStateService.getStepData(RequestFlowStep.SERVICE_FORM) || {};
      this.flowStateService.setStepData(RequestFlowStep.SERVICE_FORM, {
        ...currentData,
        currentSection: section
      });
      // Actualizar el borrador al cambiar de sección (panel) para asegurar que se envían bien los datos
      if (this.draftRequestId && this.draftRequestService && this.context !== RequestFlowContext.WIZARD) {
        setTimeout(() => this.performAutosave(), 300);
      }
    });

    // Última sección de Información de la LLC: el paso emite nextStepRequested y avanzamos (botón va dentro del panel)
    subscribeIfEmitter('nextStepRequested', () => {
      this.nextStep();
    });

    // Confirmación: enviar
    subscribeIfEmitter('submitRequest', (evt: any) => {
      const state = this.flowStateService.getState();
      // Incluir draftRequestId para que el panel pueda usarlo si payment.requestId no viene
      this.flowCompleted.emit({
        ...state,
        submit: evt,
        serviceType: this.serviceType,
        context: this.context,
        draftRequestId: this.draftRequestId ?? state?.payment?.requestId ?? undefined,
      });
    });
  }
}
