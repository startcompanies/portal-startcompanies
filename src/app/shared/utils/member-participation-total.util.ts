import { FormArray, FormGroup } from '@angular/forms';

/** Tolerancia para comparar suma con 100 (entradas decimales). */
const EPS = 0.01;

export type ParticipationPercentField = 'percentageOfParticipation' | 'participationPercentage';

/**
 * Suma los porcentajes de participación de cada fila en un FormArray (miembros/propietarios).
 */
export function sumFormArrayParticipationPercent(
  formArray: FormArray | null | undefined,
  field: ParticipationPercentField
): number {
  if (!formArray?.length) {
    return 0;
  }
  let sum = 0;
  for (const ctrl of formArray.controls) {
    const g = ctrl as FormGroup;
    const raw = g.get(field)?.value;
    const v = Number(raw);
    sum += Number.isFinite(v) ? v : 0;
  }
  return Math.round(sum * 100) / 100;
}

/**
 * En modo multimember, la suma de % debe ser exactamente 100%.
 */
export function isMultiMemberParticipationTotal100(
  formArray: FormArray | null | undefined,
  field: ParticipationPercentField
): boolean {
  return Math.abs(sumFormArrayParticipationPercent(formArray, field) - 100) < EPS;
}
