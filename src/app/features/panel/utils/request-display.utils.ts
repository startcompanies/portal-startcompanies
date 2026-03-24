import { Request } from '../services/requests.service';

/** Nombre mostrable del cliente en una solicitud (partner / listados). */
export function getClientNameFromRequest(request: Request | null | undefined): string {
  if (!request) return '';

  if (request.client) {
    const firstName = request.client.first_name || '';
    const lastName = request.client.last_name || '';
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return request.client.username || request.client.email || '';
  }

  const clientData = (request as unknown as { clientData?: Record<string, unknown> }).clientData;
  if (clientData && typeof clientData === 'object') {
    const firstName = String(clientData['firstName'] ?? clientData['first_name'] ?? '');
    const lastName = String(clientData['lastName'] ?? clientData['last_name'] ?? '');
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    const em = clientData['email'];
    if (typeof em === 'string') return em;
  }

  return '';
}

/** Texto de etapa para listados (dashboard, tarjetas). */
export function getRequestStageLabel(request: Request): string {
  const stage = request.stage?.trim();
  if (stage) return stage;
  const dealStage = request.zohoDeal?.Stage;
  if (typeof dealStage === 'string' && dealStage.trim()) return dealStage.trim();
  const n = request.currentStep;
  if (typeof n === 'number' && n > 0) return `Paso ${n}`;
  return '—';
}
