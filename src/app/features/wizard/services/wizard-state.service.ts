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
  private stepData: Map<number, any> = new Map();
  private stepForms = new Map<number, FormGroup>();
  private showNextButtonSubject = new BehaviorSubject<boolean>(true);
  showNextButton$ = this.showNextButtonSubject.asObservable();
  
  // ID del request creado después del pago
  private requestId: number | null = null;
  
  // Datos del usuario registrado (antes de verificación)
  private registeredUserId: number | null = null;
  private registeredEmail: string | null = null;
  
  // Tipo de servicio del wizard
  private serviceType: 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria' | null = null;
  
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
        this.registeredUserId = data.registeredUserId || null;
        this.registeredEmail = data.registeredEmail || null;
        this.serviceType = data.serviceType || null;
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
    try {
      const stepDataObj: { [key: number]: any } = {};
      this.stepData.forEach((value, key) => {
        stepDataObj[key] = value;
      });

      const data = {
        stepData: stepDataObj,
        requestId: this.requestId,
        registeredUserId: this.registeredUserId,
        registeredEmail: this.registeredEmail,
        serviceType: this.serviceType,
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
    this.registeredUserId = null;
    this.registeredEmail = null;
    this.serviceType = null;
    this.currentStep = 1;
    this.currentStepNumber = 1;
    localStorage.removeItem(WIZARD_STATE_KEY);
  }
  
  /**
   * Establece el ID del request creado
   */
  setRequestId(id: number): void {
    this.requestId = id;
    this.saveToStorage();
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
    this.serviceType = type;
    this.saveToStorage();
  }
  
  /**
   * Obtiene el tipo de servicio
   */
  getServiceType(): 'apertura-llc' | 'renovacion-llc' | 'cuenta-bancaria' | null {
    return this.serviceType;
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
