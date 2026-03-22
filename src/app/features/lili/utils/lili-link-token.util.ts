export interface LiliLinkPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  exp?: number;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function encodeLiliLinkToken(payload: LiliLinkPayload): string {
  const json = JSON.stringify(payload);
  return toBase64Url(new TextEncoder().encode(json));
}

export function parseLiliLinkToken(token: string | null | undefined): LiliLinkPayload | null {
  if (!token) {
    return null;
  }

  const payloadSegment = token.split('.').length === 3 ? token.split('.')[1] : token;

  try {
    const decoded = new TextDecoder().decode(fromBase64Url(payloadSegment));
    const parsed = JSON.parse(decoded) as Partial<LiliLinkPayload>;

    if (typeof parsed.email !== 'string' || !parsed.email.trim()) {
      return null;
    }

    return {
      email: parsed.email,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      businessName: parsed.businessName,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export function isLiliLinkExpired(payload: LiliLinkPayload): boolean {
  return typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000;
}
