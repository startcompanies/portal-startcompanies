/** Trim + minúsculas para login y flujos de auth contra el mismo correo en BD. */
export function normalizeAuthEmailInput(email: string | undefined | null): string {
  if (email == null || typeof email !== 'string') {
    return '';
  }
  return email.trim().toLowerCase();
}
