import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RequestFlowStep } from '../models/request-flow-context';

/**
 * Estado del flujo de solicitud por **alcance** (scope): mismo wizard+tipo+origen = mismo bucket;
 * panel con otro UUID o otro servicio = bucket distinto (misma pestaña SPA).
 */
@Injectable({ providedIn: 'root' })
export class RequestFlowStateService {
  private stateByScope = new Map<string, Record<string, unknown>>();
  private activeScopeKey: string | null = null;

  /** Vista del bucket activo (compatibilidad con getState / state$). */
  private state = new BehaviorSubject<Record<string, unknown>>({});

  state$: Observable<Record<string, unknown>> = this.state.asObservable();

  /**
   * Activa un alcance. Si es la primera vez para esa clave, el bucket empieza vacío.
   * Si la clave ya es la activa, solo re-emite el snapshot actual.
   */
  setActiveScope(scopeKey: string): void {
    if (!scopeKey) {
      return;
    }
    if (this.activeScopeKey === scopeKey) {
      this.emitActiveSnapshot();
      return;
    }
    this.activeScopeKey = scopeKey;
    if (!this.stateByScope.has(scopeKey)) {
      this.stateByScope.set(scopeKey, {});
    }
    this.emitActiveSnapshot();
  }

  getActiveScopeKey(): string | null {
    return this.activeScopeKey;
  }

  /**
   * Elimina buckets cuyo id cumple el predicado (p. ej. todos los wizard al cerrar sesión de flujo).
   */
  purgeScopesWhere(predicate: (scopeKey: string) => boolean): void {
    for (const key of [...this.stateByScope.keys()]) {
      if (predicate(key)) {
        this.stateByScope.delete(key);
      }
    }
    if (this.activeScopeKey && predicate(this.activeScopeKey)) {
      this.activeScopeKey = null;
      this.state.next({});
    } else {
      this.emitActiveSnapshot();
    }
  }

  /** Borra todos los alcances (p. ej. nueva solicitud panel sin borrador). */
  clearAllScopes(): void {
    this.stateByScope.clear();
    this.activeScopeKey = null;
    this.state.next({});
  }

  /**
   * Clona un valor para evitar mutaciones cruzadas.
   */
  private cloneStepPayload<T>(data: T): T {
    if (data === null || data === undefined) {
      return data;
    }
    if (typeof data !== 'object') {
      return data;
    }
    try {
      return JSON.parse(JSON.stringify(data)) as T;
    } catch {
      return Array.isArray(data) ? ([...data] as T) : ({ ...(data as object) } as T);
    }
  }

  private ensureActiveBucket(): Record<string, unknown> {
    if (!this.activeScopeKey) {
      const fallback = '__default__';
      this.activeScopeKey = fallback;
      if (!this.stateByScope.has(fallback)) {
        this.stateByScope.set(fallback, {});
      }
    }
    return this.stateByScope.get(this.activeScopeKey)!;
  }

  private emitActiveSnapshot(): void {
    if (!this.activeScopeKey) {
      this.state.next({});
      return;
    }
    const bucket = this.stateByScope.get(this.activeScopeKey) || {};
    this.state.next({ ...bucket });
  }

  setStepData(step: RequestFlowStep, data: any): void {
    const bucket = this.ensureActiveBucket();
    const nextBucket = {
      ...bucket,
      [step]: this.cloneStepPayload(data),
      lastUpdatedStep: step,
    };
    this.stateByScope.set(this.activeScopeKey!, nextBucket);
    this.state.next({ ...nextBucket });
  }

  getStepData(step: RequestFlowStep): any {
    if (!this.activeScopeKey) {
      return {};
    }
    const bucket = this.stateByScope.get(this.activeScopeKey);
    return bucket?.[step] ?? {};
  }

  getState(): Record<string, unknown> {
    if (!this.activeScopeKey) {
      return {};
    }
    return { ...(this.stateByScope.get(this.activeScopeKey) || {}) };
  }

  updateState(updates: Partial<Record<RequestFlowStep, any>>): void {
    const bucket = this.ensureActiveBucket();
    const nextBucket = { ...bucket, ...updates };
    this.stateByScope.set(this.activeScopeKey!, nextBucket);
    this.state.next({ ...nextBucket });
  }

  /**
   * Vacía solo el bucket del alcance activo.
   */
  clear(): void {
    if (!this.activeScopeKey) {
      this.state.next({});
      return;
    }
    this.stateByScope.set(this.activeScopeKey, {});
    this.state.next({});
  }

  clearStep(step: RequestFlowStep): void {
    if (!this.activeScopeKey) {
      return;
    }
    const bucket = { ...(this.stateByScope.get(this.activeScopeKey) || {}) };
    delete bucket[step];
    this.stateByScope.set(this.activeScopeKey, bucket);
    this.emitActiveSnapshot();
  }
}

