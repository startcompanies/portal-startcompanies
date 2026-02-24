import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RequestFlowStep } from '../models/request-flow-context';

/**
 * Servicio para manejar el estado compartido del flujo de solicitud
 */
@Injectable({ providedIn: 'root' })
export class RequestFlowStateService {
  private state = new BehaviorSubject<any>({});
  
  /**
   * Observable del estado completo
   */
  state$: Observable<any> = this.state.asObservable();
  
  /**
   * Establece datos para un paso específico
   */
  setStepData(step: RequestFlowStep, data: any): void {
    const current = this.state.value;
    this.state.next({ 
      ...current, 
      [step]: data,
      lastUpdatedStep: step
    });
  }
  
  /**
   * Obtiene los datos de un paso específico
   */
  getStepData(step: RequestFlowStep): any {
    return this.state.value[step] || {};
  }
  
  /**
   * Obtiene el estado completo
   */
  getState(): any {
    return this.state.value;
  }
  
  /**
   * Actualiza múltiples pasos a la vez
   */
  updateState(updates: Partial<Record<RequestFlowStep, any>>): void {
    const current = this.state.value;
    this.state.next({ ...current, ...updates });
  }
  
  /**
   * Limpia el estado del flujo
   */
  clear(): void {
    this.state.next({});
  }
  
  /**
   * Limpia los datos de un paso específico
   */
  clearStep(step: RequestFlowStep): void {
    const current = this.state.value;
    const { [step]: removed, ...rest } = current;
    this.state.next(rest);
  }
}
