/**
 * Devuelve ISO válido para DatePipe, o null si no hay fecha parseable.
 * Evita NG02100 (InvalidPipeArgument) con valores vacíos o no parseables desde la API.
 */
export function parseCreatedAtIso(value: unknown): string | null {
  if (value == null || value === '') return null;
  const d = new Date(value as string | number | Date);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
