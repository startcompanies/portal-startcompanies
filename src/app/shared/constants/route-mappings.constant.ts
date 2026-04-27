/**
 * Mapeo centralizado de rutas ES <-> EN.
 * Si agregas una ruta nueva, actualiza SOLO este archivo.
 */
export const ROUTE_MAPPINGS_ES_TO_EN: Record<string, string> = {
  'apertura-llc': 'llc-opening',
  'renovar-llc': 'llc-renewal',
  'wizard/cuenta-bancaria': 'wizard/bank-account',
};

export const ROUTE_MAPPINGS_EN_TO_ES: Record<string, string> = {
  'llc-opening': 'apertura-llc',
  'llc-renewal': 'renovar-llc',
  'wizard/bank-account': 'wizard/cuenta-bancaria',
};
