import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { WizardApiService } from './wizard-api.service';
import { WizardStateService } from './wizard-state.service';
import { RequestFlowStep, ServiceType } from '../../../shared/models/request-flow-context';
import { RequestFlowStateService } from '../../../shared/services/request-flow-state.service';
import { GeolocationService } from '../../../shared/services/geolocation.service';

/**
 * Finalización unificada del wizard:
 * - Si no existe requestId, crea el request con todos los datos recogidos
 * - Sube firma (opcional) vía apiUrl
 * - Actualiza estado a "solicitud-recibida"
 * - Tras éxito, el contenedor debe llamar a clearWizardSession para no dejar datos en localStorage ni estado en memoria.
 */
@Injectable({ providedIn: 'root' })
export class WizardFlowFinalizeService {
  constructor(
    private wizardApiService: WizardApiService,
    private wizardStateService: WizardStateService,
    private requestFlowState: RequestFlowStateService,
    private geolocationService: GeolocationService
  ) {}

  async finalize(
    serviceType: ServiceType,
    signatureDataUrl?: string | null,
    preUploadedSignatureUrl?: string | null
  ): Promise<void> {
    let requestId = this.wizardStateService.getRequestId();

    // Si no se creó request en pasos previos, crearlo ahora.
    if (!requestId) {
      requestId = await this.createRequestWithoutPayment(serviceType);
    }

    let signatureUrl: string | null = preUploadedSignatureUrl ?? null;
    if (!signatureUrl && signatureDataUrl) {
      signatureUrl = await this.uploadSignature(signatureDataUrl, requestId, serviceType);
      if (!signatureUrl) {
        throw new Error(
          'No se pudo subir la firma. Comprueba tu conexión e inténtalo de nuevo. Si el problema continúa, tu sesión puede haber expirado (vuelve a verificar tu email).'
        );
      }
    }

    const updateData: any = {
      type: serviceType,
      status: 'solicitud-recibida',
    };

    if (signatureUrl) {
      updateData.signatureUrl = signatureUrl;
    }

    // Para apertura-llc, propagar el plan (p. ej. /apertura/lead: el paso 2 del wizard puede ser email, no estado/plan)
    if (serviceType === 'apertura-llc') {
      const plan = this.resolveAperturaPlanCode();
      if (plan) {
        updateData.plan = plan;
        updateData.aperturaLlcData = {
          ...(updateData.aperturaLlcData || {}),
          plan,
        };
      }
    }

    await firstValueFrom(this.wizardApiService.updateRequest(requestId, updateData));
  }

  /**
   * Borra estado del wizard (localStorage), token de sesión wizard, estado del flujo de solicitud (singleton)
   * y caché de país por IP para un trámite nuevo sin datos residuales.
   */
  clearWizardSession(): void {
    this.wizardStateService.clear();
    this.wizardApiService.clearToken();
    this.requestFlowState.clear();
    this.geolocationService.clearCache();
  }

  /**
   * Crea el request en la API sin pago.
   * Recoge todos los datos del wizard (estado, plan, formulario de servicio)
   * y los envía en un único POST con status: 'solicitud-recibida' y sin stripeToken.
   */
  private async createRequestWithoutPayment(serviceType: ServiceType): Promise<number> {
    const user = this.wizardApiService.getUser();
    if (!user) {
      throw new Error('Error de autenticación. Por favor vuelve a iniciar sesión.');
    }

    const allData = this.wizardStateService.getAllData();
    const step1 = allData?.step1 || {};
    const step2 = allData?.step2 || {};
    const step3 = allData?.step3 || {};
    const step4 = allData?.step4 || {};

    const flowPlanState = this.requestFlowState.getStepData(RequestFlowStep.PLAN_STATE_SELECTION);
    const flowStateOnly = this.requestFlowState.getStepData(RequestFlowStep.STATE_SELECTION);
    const flowServiceForm = this.requestFlowState.getStepData(RequestFlowStep.SERVICE_FORM);

    const planStateMerged = { ...flowStateOnly, ...flowPlanState };
    const serviceFormMerged = { ...step3, ...step4, ...flowServiceForm };

    const amount =
      Number(planStateMerged.amount ?? step2.amount ?? serviceFormMerged.amount) || 0;

    const requestData: any = {
      source: this.wizardStateService.getFlowSource(),
      type: serviceType,
      status: 'solicitud-recibida',
      paymentMethod: null,
      paymentAmount: amount,
      clientData: {
        firstName: step1.firstName || user.firstName || '',
        lastName: step1.lastName || user.lastName || '',
        email: step1.email || user.email || '',
        phone: step1.phone || user.phone || '',
        password: step1.password || '',
      },
    };

    if (serviceType === 'apertura-llc') {
      const plan =
        planStateMerged.plan ||
        (serviceFormMerged as any).plan ||
        step2.plan ||
        '';
      const incorporationState =
        planStateMerged.state ||
        (serviceFormMerged as any).incorporationState ||
        step2.state ||
        '';

      requestData.plan = plan;
      requestData.aperturaLlcData = {
        ...serviceFormMerged,
        incorporationState,
        plan,
      };
    } else if (serviceType === 'renovacion-llc') {
      const state =
        planStateMerged.state ||
        (serviceFormMerged as any).state ||
        step2.state ||
        '';
      const llcType =
        planStateMerged.llcType ||
        (serviceFormMerged as any).llcType ||
        step2.llcType ||
        '';
      requestData.renovacionLlcData = {
        ...serviceFormMerged,
        state,
        llcType,
      };
    } else if (serviceType === 'cuenta-bancaria') {
      requestData.cuentaBancariaData = { ...serviceFormMerged };
    }

    console.log('[WizardFlowFinalizeService] Creando request sin pago:', requestData);

    const response = await firstValueFrom(this.wizardApiService.createRequest(requestData));

    if (!response?.id) {
      throw new Error('No se pudo crear la solicitud. Intenta de nuevo.');
    }

    this.wizardStateService.setRequestId(response.id);
    return response.id;
  }

  /**
   * Resuelve el código de plan (Entrepreneur / Elite / Premium) para apertura-llc
   * cuando el paso 2 del WizardState no es estado/plan (p. ej. lead con email en paso 2).
   */
  private resolveAperturaPlanCode(): string {
    const allData = this.wizardStateService.getAllData();
    const step2 = allData?.step2 || {};
    const step3 = allData?.step3 || {};
    const step4 = allData?.step4 || {};
    const flowPlan = this.requestFlowState.getStepData(RequestFlowStep.PLAN_STATE_SELECTION);
    const flowSt = this.requestFlowState.getStepData(RequestFlowStep.STATE_SELECTION);
    const flowSvc = this.requestFlowState.getStepData(RequestFlowStep.SERVICE_FORM);
    const mergedPlanState = { ...flowSt, ...flowPlan };
    const mergedService = { ...step3, ...step4, ...flowSvc };
    return (
      mergedPlanState.plan ||
      (mergedService as any).plan ||
      step2.plan ||
      ''
    );
  }

  private async uploadSignature(signatureDataUrl: string, requestId: number, serviceType: ServiceType): Promise<string | null> {
    return this.wizardApiService.uploadSignaturePngFromDataUrl(signatureDataUrl, requestId, serviceType);
  }
}
