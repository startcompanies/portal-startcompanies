import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

const WIZARD_STATE_KEY = 'wizard_state';

/**
 * Servicio para manejar el estado del wizard
 * Reutilizable para todos los flujos
 * 
 * ESTRATEGIA DE ALMACENAMIENTO:
 * - Datos del formulario y estado: localStorage (mejor UX, permite continuar si se cierra el navegador)
 * - Tokens de autenticación: sessionStorage (más seguro, se borra al cerrar - ver wizard-api.service.ts)
 * 
 * Esto permite que el usuario pueda continuar el wizard si cierra el navegador,
 * pero los tokens sensibles se borran automáticamente al cerrar por seguridad.
 */
@Injectable({
  providedIn: 'root'
})
export class WizardStateService {
  /** Mismo criterio que el backend: carpeta de request solo con UUID real. */
  static isRequestFolderUuid(value: string | null | undefined): boolean {
    const v = (value || '').trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
  }

  private stepData: Map<number, any> = new Map();
  private stepForms = new Map<number, FormGroup>();
  private showNextButtonSubject = new BehaviorSubject<boolean>(true);
  showNextButton$ = this.showNextButtonSubject.asObservable();

  /**
   * Tras `clear()` (wizard terminado o cancelado), bloquea escrituras a localStorage hasta un nuevo
   * trámite (`setServiceType`), para que la UI que sigue montada no repueble `wizard_state` desde el flujo.
   */
  private suppressLocalPersistence = false;
  
  // ID del request creado después del pago
  private requestId: number | null = null;

  /** UUID de la solicitud (`requests.uuid`) para rutas S3 bajo `request/{servicio}/{uuid}/`. */
  private requestUuid: string | null = null;
  
  // Datos del usuario registrado (antes de verificación)
  private registeredUserId: number | null = null;
  private registeredEmail: string | null = null;
  
  // Tipo de servicio del wizard
  private serviceType: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria' | null = null;
  private flowSource: 'wizard' | 'crm-lead' | 'panel' = 'wizard';
  
  // Paso actual del wizard (para persistencia)
  private currentStep: number = 1;
  private currentStepNumber: number = 1;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Carga el estado desde localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(WIZARD_STATE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Restaurar datos de pasos
        if (data.stepData) {
          Object.entries(data.stepData).forEach(([key, value]) => {
            this.stepData.set(parseInt(key, 10), value);
          });
        }
        
        // Restaurar otros estados
        this.requestId = data.requestId || null;
        this.requestUuid =
          data.requestUuid && WizardStateService.isRequestFolderUuid(data.requestUuid)
            ? String(data.requestUuid).trim().toLowerCase()
            : null;
        this.registeredUserId = data.registeredUserId || null;
        this.registeredEmail = data.registeredEmail || null;
        this.serviceType = data.serviceType || null;
        this.flowSource = data.flowSource || 'wizard';
        this.currentStep = data.currentStep || 1;
        this.currentStepNumber = data.currentStepNumber || 1;
        
        console.log('[WizardState] Estado restaurado desde localStorage:', {
          requestId: this.requestId,
          serviceType: this.serviceType,
          currentStep: this.currentStep,
          currentStepNumber: this.currentStepNumber
        });
      }
    } catch (error) {
      console.error('[WizardState] Error al cargar estado desde localStorage:', error);
    }
  }

  /**
   * Guarda el estado en localStorage
   */
  private saveToStorage(): void {
    if (this.suppressLocalPersistence) {
      return;
    }
    try {
      const stepDataObj: { [key: number]: any } = {};
      this.stepData.forEach((value, key) => {
        stepDataObj[key] = value;
      });

      const data = {
        stepData: stepDataObj,
        requestId: this.requestId,
        requestUuid: this.requestUuid,
        registeredUserId: this.registeredUserId,
        registeredEmail: this.registeredEmail,
        serviceType: this.serviceType,
        flowSource: this.flowSource,
        currentStep: this.currentStep,
        currentStepNumber: this.currentStepNumber
      };

      localStorage.setItem(WIZARD_STATE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[WizardState] Error al guardar estado en localStorage:', error);
    }
  }

  registerForm(stepNumber: number, form: FormGroup): void {
    this.stepForms.set(stepNumber, form);
  }

  unregisterForm(stepNumber: number): void {
    this.stepForms.delete(stepNumber);
  }

  /**
   * Guarda los datos de un paso
   */
  setStepData(stepNumber: number, data: any): void {
    this.stepData.set(stepNumber, data);
    this.saveToStorage();
  }

  /**
   * Obtiene los datos de un paso
   */
  getStepData(stepNumber: number): any {
    return this.stepData.get(stepNumber) || {};
  }

  /**
   * Obtiene todos los datos del wizard
   */
  getAllData(): any {
    const allData: any = {};
    this.stepData.forEach((data, stepNumber) => {
      allData[`step${stepNumber}`] = data;
    });
    return allData;
  }

  /**
   * Localiza datos persistidos del paso de pago.
   * Pueden estar en otra clave si hubo pasos intermedios (p. ej. verificación en 2 y pago guardado en 4).
   */
  /**
   * Claves en stepData para renovación LLC.
   * Si el paso 2 guardó solo la verificación de email, estado/pago/info se desplazan a 3/4/5 y la revisión a 6.
   */
  getRenovacionStorageLayout(): {
    stateStep: number;
    paymentStep: number;
    infoStep: number;
    reviewStep: number;
  } {
    const d2 = this.getStepData(2);
    const d3 = this.getStepData(3);
    const d4 = this.getStepData(4);

    const step2IsEmailVerification =
      d2?.verified === true && !d2?.state && !d2?.llcType;

    const paymentOn4 =
      d4?.stripePaymentProcessed === true ||
      d4?.transferenciaProcessed === true ||
      d4?.paymentMethod === 'stripe' ||
      d4?.paymentMethod === 'transferencia';

    // Verificación en 2 → selección de estado debe usar 3 (no pisar el bucket de email)
    if (step2IsEmailVerification) {
      return { stateStep: 3, paymentStep: 4, infoStep: 5, reviewStep: 6 };
    }

    // Legado / localStorage sin verified en 2 pero estado en 3 y pago en 4
    if (d3?.state && d3?.llcType && paymentOn4 && !d2?.state) {
      return { stateStep: 3, paymentStep: 4, infoStep: 5, reviewStep: 6 };
    }

    return { stateStep: 2, paymentStep: 3, infoStep: 4, reviewStep: 5 };
  }

  findPersistedPaymentData(): any {
    const all = this.getAllData();
    const keys = Object.keys(all).sort((a, b) => {
      const num = (k: string) => {
        const m = /^step(\d+)$/.exec(k);
        return m ? parseInt(m[1], 10) : 0;
      };
      return num(a) - num(b);
    });
    let fallback: any = null;
    for (const k of keys) {
      const s = all[k];
      if (!s || typeof s !== 'object') continue;
      const looksLikePayment =
        'paymentMethod' in s ||
        'stripePaymentProcessed' in s ||
        'stripePaymentToken' in s ||
        'transferenciaProcessed' in s ||
        (typeof s.paymentProofUrl === 'string' && s.paymentProofUrl.trim().length > 0);
      if (!looksLikePayment) continue;
      if (fallback == null) fallback = s;
      if (s.stripePaymentProcessed === true || s.transferenciaProcessed === true) {
        return s;
      }
    }
    return fallback ?? {};
  }

  /**
   * Obtiene los datos de los pasos anteriores
   */
  getPreviousSteps(currentStep: number): any[] {
    const previousSteps: any[] = [];
    for (let i = 1; i < currentStep; i++) {
      const data = this.getStepData(i);
      if (data && Object.keys(data).length > 0) {
        previousSteps.push({ id: i, data });
      }
    }
    return previousSteps;
  }

  /**
   * Limpia todos los datos del wizard
   */
  clear(): void {
    this.stepData.clear();
    this.requestId = null;
    this.requestUuid = null;
    this.registeredUserId = null;
    this.registeredEmail = null;
    this.serviceType = null;
    this.flowSource = 'wizard';
    this.currentStep = 1;
    this.currentStepNumber = 1;
    localStorage.removeItem(WIZARD_STATE_KEY);
    this.suppressLocalPersistence = true;
  }
  
  /**
   * Establece el ID del request creado.
   * @param uuid Opcional: UUID de la solicitud. Si se omite el segundo argumento, no se modifica `requestUuid`.
   *             Pasar `null` limpia el UUID guardado.
   */
  setRequestId(id: number, uuid?: string | null): void {
    this.requestId = id;
    if (uuid !== undefined) {
      this.requestUuid =
        uuid && WizardStateService.isRequestFolderUuid(uuid) ? uuid.trim().toLowerCase() : null;
    }
    this.saveToStorage();
  }

  getRequestUuid(): string | null {
    return this.requestUuid;
  }
  
  /**
   * Obtiene el ID del request
   */
  getRequestId(): number | null {
    return this.requestId;
  }
  
  /**
   * Verifica si ya existe un request creado
   */
  hasRequest(): boolean {
    return this.requestId !== null;
  }
  
  /**
   * Establece los datos del usuario registrado
   */
  setRegisteredUser(userId: number, email: string): void {
    this.registeredUserId = userId;
    this.registeredEmail = email;
    this.saveToStorage();
  }
  
  /**
   * Obtiene el ID del usuario registrado
   */
  getRegisteredUserId(): number | null {
    return this.registeredUserId;
  }
  
  /**
   * Obtiene el email del usuario registrado
   */
  getRegisteredEmail(): string | null {
    return this.registeredEmail;
  }
  
  /**
   * Establece el tipo de servicio
   */
  setServiceType(type: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria'): void {
    this.suppressLocalPersistence = false;
    this.serviceType = type;
    this.saveToStorage();
  }
  
  /**
   * Obtiene el tipo de servicio
   */
  getServiceType(): 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria' | null {
    return this.serviceType;
  }

  setFlowSource(source: 'wizard' | 'crm-lead' | 'panel'): void {
    this.flowSource = source;
    if (!this.suppressLocalPersistence) {
      this.saveToStorage();
    }
  }

  getFlowSource(): 'wizard' | 'crm-lead' | 'panel' {
    return this.flowSource || 'wizard';
  }

  /**
   * Establece el paso actual del wizard (UI step)
   */
  setCurrentStep(step: number): void {
    this.currentStep = step;
    this.saveToStorage();
  }

  /**
   * Obtiene el paso actual del wizard (UI step)
   */
  getCurrentStep(): number {
    return this.currentStep;
  }

  /**
   * Establece el número de paso/sección dentro del formulario
   */
  setCurrentStepNumber(stepNumber: number): void {
    this.currentStepNumber = stepNumber;
    this.saveToStorage();
  }

  /**
   * Obtiene el número de paso/sección dentro del formulario
   */
  getCurrentStepNumber(): number {
    return this.currentStepNumber;
  }

  /**
   * Obtiene los datos de un formulario
   */
  getFormData(form: FormGroup): any {
    if (!form) return {};
    return form.value;
  }

  /**
   * Obtiene el formulario registrado de un paso
   */
  getForm(stepNumber: number): FormGroup | undefined {
    return this.stepForms.get(stepNumber);
  }

  hideNextButton() {
    this.showNextButtonSubject.next(false);
  }

  showNextButton() {
    this.showNextButtonSubject.next(true);
  }
}
