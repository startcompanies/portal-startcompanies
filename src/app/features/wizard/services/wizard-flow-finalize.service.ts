import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { WizardApiService } from './wizard-api.service';
import { WizardStateService } from './wizard-state.service';
import { ServiceType } from '../../../shared/models/request-flow-context';

/**
 * Finalización unificada del wizard:
 * - sube firma (opcional) vía apiUrl
 * - actualiza estado a "solicitud-recibida"
 * - limpia estado + tokens
 */
@Injectable({ providedIn: 'root' })
export class WizardFlowFinalizeService {
  constructor(
    private wizardApiService: WizardApiService,
    private wizardStateService: WizardStateService
  ) {}

  async finalize(serviceType: ServiceType, signatureDataUrl?: string | null): Promise<void> {
    const requestId = this.wizardStateService.getRequestId();
    if (!requestId) {
      throw new Error('No se encontró la solicitud. Completa el pago primero.');
    }

    let signatureUrl: string | null = null;
    if (signatureDataUrl) {
      signatureUrl = await this.uploadSignature(signatureDataUrl, requestId, serviceType);
    }

    const updateData: any = {
      type: serviceType,
      status: 'solicitud-recibida',
    };

    if (signatureUrl) {
      updateData.signatureUrl = signatureUrl;
    }

    await firstValueFrom(this.wizardApiService.updateRequest(requestId, updateData));

    // limpiar estado
    this.wizardStateService.clear();
    this.wizardApiService.clearToken();
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

