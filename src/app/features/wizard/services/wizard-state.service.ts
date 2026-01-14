import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

/**
 * Servicio para manejar el estado del wizard
 * Reutilizable para todos los flujos
 */
@Injectable({
  providedIn: 'root'
})
export class WizardStateService {
  private stepData: Map<number, any> = new Map();
  private stepForms = new Map<number, FormGroup>();
  private showNextButtonSubject = new BehaviorSubject<boolean>(true);
  showNextButton$ = this.showNextButtonSubject.asObservable();

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
