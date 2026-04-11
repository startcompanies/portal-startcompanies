import {
  AbstractControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

/** Coincide con `public-web-url.util.ts` en la API (incl. FQDN con punto en hostname). */
export const PUBLIC_WEB_URL_ERROR_KEY = 'publicWebUrl';

function isAcceptablePublicWebHostname(hostname: string): boolean {
  const h = (hostname || '').toLowerCase();
  if (!h) return false;
  if (h === 'localhost' || h.endsWith('.localhost')) return false;
  if (h === '127.0.0.1' || h === '0.0.0.0' || h === '::1') return false;

  const ipv4Parts = h.split('.');
  if (ipv4Parts.length === 4 && ipv4Parts.every((p) => /^\d{1,3}$/.test(p))) {
    const a = parseInt(ipv4Parts[0], 10);
    const b = parseInt(ipv4Parts[1], 10);
    if (a === 10) return false;
    if (a === 127) return false;
    if (a === 192 && b === 168) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 169 && b === 254) return false;
  }

  return true;
}

/**
 * Hostname con al menos un punto (FQDN mínimo; evita `https://hello`).
 * Casos tipo IPv6 sin punto quedan fuera del uso previsto (sitio / red social).
 */
export function looksLikePublicFqdnHostname(hostname: string): boolean {
  const h = (hostname || '').trim().toLowerCase();
  if (!h) return false;
  return h.includes('.');
}

/**
 * Normaliza a https o devuelve '' si no es válido (misma regla que el backend).
 */
export function normalizePublicHttpsWebUrlClient(
  raw: string | null | undefined,
): string {
  const t = (raw ?? '').trim();
  if (!t) return '';

  const tl = t.toLowerCase();
  if (
    tl.startsWith('javascript:') ||
    tl.startsWith('data:') ||
    tl.startsWith('vbscript:')
  ) {
    return '';
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) {
    const proto = t.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
    if (proto !== 'http' && proto !== 'https') {
      return '';
    }
  }

  let ustr = t.replace(/^http:\/\//i, 'https://');
  if (!/^https:\/\//i.test(ustr)) {
    ustr = `https://${ustr}`;
  }
  ustr = ustr.replace(/^http:\/\//i, 'https://');

  try {
    const parsed = new URL(ustr);
    if (parsed.protocol !== 'https:') return '';
    if (!parsed.hostname) return '';
    if (!looksLikePublicFqdnHostname(parsed.hostname)) return '';
    if (!isAcceptablePublicWebHostname(parsed.hostname)) return '';
    return parsed.href;
  } catch {
    return '';
  }
}

/** Validador opcional: vacío es válido. */
export function optionalPublicWebUrlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v == null) return null;
    if (typeof v !== 'string') {
      return { [PUBLIC_WEB_URL_ERROR_KEY]: true };
    }
    const trimmed = v.trim();
    if (!trimmed) return null;
    const n = normalizePublicHttpsWebUrlClient(trimmed);
    if (!n) {
      return { [PUBLIC_WEB_URL_ERROR_KEY]: true };
    }
    return null;
  };
}

/** En blur: reescribe el control con la URL normalizada si aplica. */
export function patchControlWithNormalizedPublicUrl(
  control: AbstractControl | null,
): void {
  if (!control || control.disabled) return;
  const v = control.value;
  if (v == null || typeof v !== 'string') return;
  const trimmed = v.trim();
  if (!trimmed) return;
  const n = normalizePublicHttpsWebUrlClient(trimmed);
  if (n && n !== control.value) {
    control.setValue(n, { emitEvent: true });
  }
}

/** Campo URL opcional: vacío es OK; con texto debe estar `valid` según validadores del control. */
export function isOptionalPublicWebUrlControlOk(
  control: AbstractControl | null | undefined,
): boolean {
  if (!control) return true;
  if (control.disabled) return true;
  const v = control.value;
  if (v == null || typeof v !== 'string' || !v.trim()) return true;
  return !!control.valid;
}

/**
 * Antes de validar avance de sección: normaliza URLs públicas opcionales y refresca validez.
 */
export function patchOptionalPublicUrlControlsByName(
  form: FormGroup | null | undefined,
  controlNames: readonly string[],
): void {
  if (!form) return;
  for (const name of controlNames) {
    const c = form.get(name);
    patchControlWithNormalizedPublicUrl(c);
    c?.updateValueAndValidity({ emitEvent: false });
  }
}
