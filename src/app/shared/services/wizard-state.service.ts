import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

/**
 * Servicio para manejar el estado del wizard
 * Reemplaza FormWizardService de ngx-form-wizard
 */
@Injectable({
  providedIn: 'root'
})
export class WizardStateService {
  private stepData: Map<number, any> = new Map();

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
}
