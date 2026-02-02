import { Injectable } from '@angular/core';
import { RequestsService, Request as PanelRequest } from '../../features/panel/services/requests.service';
import { RequestFlowStateService } from './request-flow-state.service';
import { RequestFlowStep } from '../models/request-flow-context';
import { firstValueFrom } from 'rxjs';

/**
 * Servicio para manejar borradores de solicitudes
 * Centraliza la lógica de carga, guardado y hidratación de borradores
 */
@Injectable({ providedIn: 'root' })
export class DraftRequestService {
  constructor(
    private requestsService: RequestsService,
    private flowStateService: RequestFlowStateService
  ) {}

  /**
   * Carga un borrador por UUID y lo hidrata en el estado del flujo
   */
  async loadDraftByUuid(uuid: string): Promise<PanelRequest | null> {
    try {
      const request = await this.requestsService.getRequestByUuid(uuid);
      
      // Verificar que esté en estado pendiente
      if (request.status !== 'pendiente') {
        throw new Error('Esta solicitud ya fue enviada. No se puede editar.');
      }

      // Hidratar el estado del flujo con los datos del borrador
      this.hydrateFlowStateFromRequest(request);
      
      return request;
    } catch (error: any) {
      console.error('[DraftRequestService] Error al cargar borrador:', error);
      throw error;
    }
  }

  /**
   * Hidrata el estado del flujo con los datos de una solicitud
   */
  private hydrateFlowStateFromRequest(request: PanelRequest): void {
    // Guardar información básica
    this.flowStateService.setStepData(RequestFlowStep.CLIENT_SELECTION, {
      clientId: request.clientId,
      selectedClient: (request as any).client,
      draftRequestId: request.id,
      draftRequestUuid: request.uuid
    });

    // Si hay datos de pago procesado
    if (request.paymentStatus === 'succeeded' || request.stripeChargeId) {
      this.flowStateService.setStepData(RequestFlowStep.PAYMENT, {
        paymentProcessed: true,
        requestId: request.id,
        paymentInfo: {
          amount: request.paymentAmount,
          method: request.paymentMethod,
          chargeId: request.stripeChargeId,
          status: request.paymentStatus
        }
      });
    }

    // Hidratar datos específicos del servicio según el tipo
    let serviceFormData: any = {};
    
    if (request.type === 'apertura-llc' && request.aperturaLlcRequest) {
      serviceFormData = {
        ...request.aperturaLlcRequest,
        currentSection: this.inferServiceSection(request, 'apertura-llc')
      };
    } else if (request.type === 'renovacion-llc' && request.renovacionLlcRequest) {
      serviceFormData = {
        ...request.renovacionLlcRequest,
        currentSection: this.inferServiceSection(request, 'renovacion-llc')
      };
    } else if (request.type === 'cuenta-bancaria' && request.cuentaBancariaRequest) {
      serviceFormData = {
        ...request.cuentaBancariaRequest,
        currentSection: this.inferServiceSection(request, 'cuenta-bancaria')
      };
    }

    // Agregar miembros si existen
    if (request.members && request.members.length > 0) {
      serviceFormData.members = request.members;
    }
    
    // Guardar datos del servicio si hay información
    if (Object.keys(serviceFormData).length > 0) {
      this.flowStateService.setStepData(RequestFlowStep.SERVICE_FORM, serviceFormData);
    }
  }

  /**
   * Infiere la sección actual del servicio basándose en los datos disponibles
   */
  private inferServiceSection(request: PanelRequest, serviceType: string): number {
    if (serviceType === 'apertura-llc' && request.aperturaLlcRequest) {
      const a: any = request.aperturaLlcRequest;
      const hasBankSection =
        !!a.serviceBillUrl ||
        !!a.bankStatementUrl ||
        !!a.periodicIncome10k ||
        !!a.bankAccountLinkedEmail ||
        !!a.bankAccountLinkedPhone ||
        !!a.projectOrCompanyUrl;
      if (hasBankSection) return 3;
      const hasMembers = Array.isArray(request.members) && request.members.length > 0;
      if (hasMembers) return 2;
      return 1;
    }

    const hasMembers = Array.isArray(request.members) && request.members.length > 0;
    if (hasMembers) return 2;
    return 1;
  }

  /**
   * Guarda un borrador (autosave)
   */
  async saveDraft(requestId: number, data: any): Promise<PanelRequest> {
    try {
      return await this.requestsService.updateRequest(requestId, {
        ...data,
        status: 'pendiente' // Asegurar que siga siendo borrador
      });
    } catch (error: any) {
      console.error('[DraftRequestService] Error al guardar borrador:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo borrador
   */
  async createDraft(data: any): Promise<PanelRequest> {
    try {
      return await this.requestsService.createRequest({
        ...data,
        status: 'pendiente'
      });
    } catch (error: any) {
      console.error('[DraftRequestService] Error al crear borrador:', error);
      throw error;
    }
  }
}
