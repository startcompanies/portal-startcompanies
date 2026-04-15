import { RequestFlowContext } from '../models/request-flow-context';
import type { ServiceType } from '../models/request-flow-context';

export type WizardFlowSource = 'wizard' | 'crm-lead' | 'panel';

/**
 * Clave estable por trámite (misma pestaña SPA) para aislar RequestFlowStateService.
 *
 * Formato:
 * - Wizard: `wizard|<serviceType>|<flowSource>` (dos rutas wizard distintas = buckets distintos)
 * - Panel: `<panel-client|panel-partner>|draft:<uuid>|new` (sin serviceType: un solo bucket por borrador
 *   o trámite nuevo; el tipo puede cambiar en el mismo flujo sin perder CLIENT_SELECTION, etc.)
 */
export function buildFlowScopeKey(params: {
  context: RequestFlowContext;
  serviceType: ServiceType | null;
  flowSource?: WizardFlowSource;
  draftRequestUuid?: string | null;
}): string {
  if (params.context === RequestFlowContext.WIZARD) {
    const type = params.serviceType ?? 'pending-type';
    const src = params.flowSource ?? 'wizard';
    return `wizard|${type}|${src}`;
  }
  const uuid = params.draftRequestUuid?.trim();
  const draft = uuid ? `draft:${uuid}` : 'new';
  return `${params.context}|${draft}`;
}
