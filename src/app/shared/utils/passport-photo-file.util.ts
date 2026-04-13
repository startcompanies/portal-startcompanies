import { FormArray, FormGroup, Validators } from '@angular/forms';

/** MIME permitidos para foto de pasaporte (apertura LLC). */
export const PASSPORT_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const EXT_OK = new Set(['jpg', 'jpeg', 'png', 'webp']);

/**
 * Foto de pasaporte obligatoria solo para el primer miembro en multi;
 * en single el único miembro (índice 0) la lleva obligatoria.
 */
export function isPassportPhotoRequired(
  llcType: string | null | undefined,
  memberIndex: number,
): boolean {
  return (llcType === 'single' || llcType === 'multi') && memberIndex === 0;
}

function extFromName(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name.trim());
  return m ? m[1].toLowerCase() : '';
}

export function isPassportPhotoFile(file: File): boolean {
  const type = (file.type || '').split(';')[0].trim().toLowerCase();
  if (type && (PASSPORT_PHOTO_MIME_TYPES as readonly string[]).includes(type)) {
    return true;
  }
  const ext = extFromName(file.name || '');
  return EXT_OK.has(ext);
}

/** Alinea `Validators.required` en `scannedPassportUrl` según índice y `llcType`. */
export function syncMemberPassportPhotoValidators(
  membersArray: FormArray,
  llcType: string | null | undefined,
): void {
  membersArray.controls.forEach((ctrl, idx) => {
    const c = (ctrl as FormGroup).get('scannedPassportUrl');
    if (!c) {
      return;
    }
    c.setValidators(
      isPassportPhotoRequired(llcType, idx) ? [Validators.required] : null,
    );
    c.updateValueAndValidity({ emitEvent: false });
  });
}
