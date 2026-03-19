import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { WizardApiService } from './wizard-api.service';
import { WizardStateService } from './wizard-state.service';
import { ServiceType } from '../../../shared/models/request-flow-context';
import { environment } from '../../../../environments/environment';

/**
 * Finalización unificada del wizard:
 * - Si paymentEnabled=false y no existe requestId, crea el request con todos los datos recogidos
 * - Sube firma (opcional) vía apiUrl
 * - Actualiza estado a "solicitud-recibida"
 * - Limpia estado + tokens
 */
@Injectable({ providedIn: 'root' })
export class WizardFlowFinalizeService {
  constructor(
    private wizardApiService: WizardApiService,
    private wizardStateService: WizardStateService
  ) {}

  async finalize(serviceType: ServiceType, signatureDataUrl?: string | null): Promise<void> {
    let requestId = this.wizardStateService.getRequestId();

    // Cuando paymentEnabled=false el request no se creó en el paso de pago → crearlo ahora
    if (!requestId) {
      if (!environment.paymentEnabled) {
        requestId = await this.createRequestWithoutPayment(serviceType);
      } else {
        throw new Error('No se encontró la solicitud. Completa el pago primero.');
      }
    }

    let signatureUrl: string | null = null;
    if (signatureDataUrl) {
      signatureUrl = await this.uploadSignature(signatureDataUrl, requestId, serviceType);
    }

    // Leer datos del wizard para información adicional del flujo
    const allData = this.wizardStateService.getAllData();
    const step2 = allData?.step2 || {};
    const plan = step2?.plan;

    const updateData: any = {
      type: serviceType,
      status: 'solicitud-recibida',
    };

    if (signatureUrl) {
      updateData.signatureUrl = signatureUrl;
    }

    // Para apertura-llc, propagar el plan en la actualización final
    if (serviceType === 'apertura-llc' && plan) {
      updateData.plan = plan;
      updateData.aperturaLlcData = {
        ...(updateData.aperturaLlcData || {}),
        plan,
      };
    }

    await firstValueFrom(this.wizardApiService.updateRequest(requestId, updateData));

    // Limpiar estado
    this.wizardStateService.clear();
    this.wizardApiService.clearToken();
  }

  /**
   * Crea el request en la API sin pago (cuando paymentEnabled=false).
   * Recoge todos los datos del wizard (estado, plan, formulario de servicio)
   * y los envía en un único POST con status: 'solicitud-recibida' y sin stripeToken.
   */
  private async createRequestWithoutPayment(serviceType: ServiceType): Promise<number> {
    const user = this.wizardApiService.getUser();
    if (!user) {
      throw new Error('Error de autenticación. Por favor vuelve a iniciar sesión.');
    }

    const allData = this.wizardStateService.getAllData();
    const step1 = allData?.step1 || {};   // datos del registro
    const step2 = allData?.step2 || {};   // estado/plan (sincronizado por syncToWizardStateService)
    const step4 = allData?.step4 || {};   // formulario de servicio (sincronizado por syncToWizardStateService)

    // Con paymentEnabled=false guardamos plan y amount para saber cuánto cobrar después
    const amount = Number(step2?.amount) || 0;
    const requestData: any = {
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

    // Datos específicos del servicio con datos del formulario incluidos (plan se envía al crear)
    if (serviceType === 'apertura-llc') {
      const plan = step2.plan || '';
      requestData.plan = plan;
      requestData.aperturaLlcData = {
        incorporationState: step2.state || '',
        plan,
        ...step4,
      };
    } else if (serviceType === 'renovacion-llc') {
      requestData.renovacionLlcData = {
        state: step2.state || '',
        llcType: step2.llcType || '',
        ...step4,
      };
    } else if (serviceType === 'cuenta-bancaria') {
      requestData.cuentaBancariaData = { ...step4 };
    }

    console.log('[WizardFlowFinalizeService] Creando request sin pago:', requestData);

    const response = await firstValueFrom(this.wizardApiService.createRequest(requestData));

    if (!response?.id) {
      throw new Error('No se pudo crear la solicitud. Intenta de nuevo.');
    }

    this.wizardStateService.setRequestId(response.id);
    return response.id;
  }

  private async uploadSignature(signatureDataUrl: string, requestId: number, serviceType: ServiceType): Promise<string | null> {
    try {
      const resp = await fetch(signatureDataUrl);
      const blob = await resp.blob();
      const file = new File([blob], `signature-${requestId}-${Date.now()}.png`, { type: 'image/png' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('servicio', serviceType);
      formData.append('requestUuid', requestId.toString());

      const uploadResponse = await firstValueFrom(
        this.wizardApiService.uploadFile(formData)
      );

      return uploadResponse?.url || null;
    } catch (e) {
      console.error('[WizardFlowFinalizeService] Error al subir firma:', e);
      return null;
    }
  }
}
