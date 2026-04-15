import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { WizardApiService } from './wizard-api.service';
import { WizardStateService } from './wizard-state.service';
import { RequestFlowStateService } from '../../../shared/services/request-flow-state.service';
import { RequestFlowStep, ServiceType } from '../../../shared/models/request-flow-context';
import { HttpErrorMapperService } from '../../../shared/services/http-error-mapper.service';

const MAX_SECTION_BY_TYPE: Record<ServiceType, number> = {
  'apertura-llc': 6,
  'renovacion-llc': 6,
  'cuenta-bancaria': 7,
};

/**
 * PATCH al API del wizard con mensajes de error homogéneos.
 * Construye payloads de formulario de servicio reutilizando el mismo merge que el flujo legacy.
 */
@Injectable({ providedIn: 'root' })
export class WizardRequestPersistService {
  private wizardApi = inject(WizardApiService);
  private wizardState = inject(WizardStateService);
  private flowState = inject(RequestFlowStateService);
  private errorMapper = inject(HttpErrorMapperService);

  mapError(error: unknown): string {
    return this.errorMapper.mapHttpError(error);
  }

  async patchRequest(requestId: number, body: Record<string, unknown>): Promise<void> {
    await firstValueFrom(this.wizardApi.updateRequest(requestId, body));
  }

  /** Última sección válida para cierre / validación backend (maxStepsByType). */
  getMaxSectionForType(serviceType: ServiceType): number {
    return MAX_SECTION_BY_TYPE[serviceType] ?? 6;
  }

  /**
   * PATCH de formulario de apertura LLC (sección + members).
   */
  async persistAperturaLlcSection(
    requestId: number,
    currentSection: number,
    aperturaLlcData: Record<string, unknown>,
  ): Promise<void> {
    await this.patchRequest(requestId, {
      type: 'apertura-llc',
      currentStepNumber: currentSection,
      aperturaLlcData,
    });
  }

  /**
   * PATCH de renovación LLC.
   */
  async persistRenovacionLlcSection(
    requestId: number,
    currentSection: number,
    renovacionLlcData: Record<string, unknown>,
  ): Promise<void> {
    await this.patchRequest(requestId, {
      type: 'renovacion-llc',
      currentStepNumber: currentSection,
      renovacionLlcData,
    });
  }

  /**
   * PATCH de cuenta bancaria.
   */
  async persistCuentaBancariaSection(
    requestId: number,
    currentSection: number,
    cuentaBancariaData: Record<string, unknown>,
  ): Promise<void> {
    await this.patchRequest(requestId, {
      type: 'cuenta-bancaria',
      currentStepNumber: currentSection,
      cuentaBancariaData,
    });
  }

  /**
   * Autosave / guardado silencioso del paso de servicio (wizard): mismo merge que performAutosave del panel.
   */
  async persistWizardServiceFormAutosave(serviceType: ServiceType | null): Promise<void> {
    const requestId = this.wizardState.getRequestId();
    if (!requestId || !serviceType) {
      return;
    }
    const all = this.wizardState.getAllData();
    const serviceData = this.flowState.getStepData(RequestFlowStep.SERVICE_FORM);
    const statePlanData = this.flowState.getStepData(RequestFlowStep.PLAN_STATE_SELECTION);
    const stateData = this.flowState.getStepData(RequestFlowStep.STATE_SELECTION);
    const step3 = (all as { step3?: Record<string, unknown> }).step3 || {};
    const step4 = (all as { step4?: Record<string, unknown> }).step4 || {};
    const step5 = (all as { step5?: Record<string, unknown> }).step5 || {};
    const currentSection =
      typeof serviceData?.currentSection === 'number' && serviceData.currentSection >= 1
        ? serviceData.currentSection
        : this.wizardState.getCurrentStepNumber() || 1;

    const body: Record<string, unknown> = {
      type: serviceType,
      currentStep: this.wizardState.getCurrentStep(),
      currentStepNumber: currentSection,
    };

    if (serviceType === 'apertura-llc') {
      if (statePlanData?.plan != null) {
        body['plan'] = statePlanData.plan;
      }
      const step2 = (all as { step2?: Record<string, unknown> }).step2 || {};
      const s2p = step2['plan'];
      const s2s = step2['state'];
      body['aperturaLlcData'] = {
        ...step3,
        ...step4,
        ...serviceData,
        ...(statePlanData?.plan != null && { plan: statePlanData.plan }),
        ...(statePlanData?.state != null && { incorporationState: statePlanData.state }),
        ...(s2p != null && !statePlanData?.plan && { plan: s2p }),
        ...(s2s != null &&
          String(s2s).trim() !== '' &&
          statePlanData?.state == null && { incorporationState: s2s }),
      };
    } else if (serviceType === 'renovacion-llc') {
      body['renovacionLlcData'] = {
        ...step3,
        ...step4,
        ...step5,
        ...serviceData,
        ...(stateData?.state != null && { state: stateData.state }),
        ...(stateData?.llcType != null && { llcType: stateData.llcType }),
      };
    } else if (serviceType === 'cuenta-bancaria') {
      const bankForm = (all as { step2?: Record<string, unknown> }).step2 || {};
      body['cuentaBancariaData'] = { ...bankForm, ...serviceData };
    }

    await this.patchRequest(requestId, body);
  }
}
