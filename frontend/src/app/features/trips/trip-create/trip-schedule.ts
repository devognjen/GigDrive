import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { toLocalInput } from '../../../core/utils/local-datetime';

const DEPARTURE_LEAD_MS = 3 * 60 * 60 * 1000;
const DEADLINE_LEAD_MS = 24 * 60 * 60 * 1000;
const FALLBACK_DEADLINE_LEAD_MS = 60 * 60 * 1000;

/**
 * Suggested deadline (1 day before departure) and departure (3 hours before
 * the concert). Returns null when the concert is too soon for a valid order.
 */
export function suggestSchedule(
  concertStartIso: string,
  now = new Date(),
): { confirmationDeadline: string; departureAt: string } | null {
  const concertStart = new Date(concertStartIso);
  const departure = new Date(concertStart.getTime() - DEPARTURE_LEAD_MS);
  if (departure.getTime() <= now.getTime()) {
    return null;
  }
  let deadline = new Date(departure.getTime() - DEADLINE_LEAD_MS);
  if (deadline.getTime() <= now.getTime()) {
    deadline = new Date(now.getTime() + FALLBACK_DEADLINE_LEAD_MS);
  }
  if (deadline.getTime() >= departure.getTime()) {
    return null;
  }
  return {
    confirmationDeadline: toLocalInput(deadline),
    departureAt: toLocalInput(departure),
  };
}

/**
 * Form-level check: confirmationDeadline < departureAt ≤ concert start.
 * Concert start is optional so the deadline/departure order still applies
 * before a concert is chosen.
 */
export function scheduleOrderValidator(concertStartIso: () => string | null): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const deadline = group.get('confirmationDeadline')?.value as string | undefined;
    const departure = group.get('departureAt')?.value as string | undefined;
    if (!deadline || !departure) {
      return null;
    }
    const deadlineMs = new Date(deadline).getTime();
    const departureMs = new Date(departure).getTime();
    const errors: ValidationErrors = {};
    if (deadlineMs >= departureMs) {
      errors['deadlineAfterDeparture'] = true;
    }
    const concertStart = concertStartIso();
    if (concertStart) {
      const concertMs = new Date(concertStart).getTime();
      if (deadlineMs >= concertMs) {
        errors['deadlineAfterConcert'] = true;
      }
      if (departureMs > concertMs) {
        errors['departureAfterConcert'] = true;
      }
    }
    return Object.keys(errors).length > 0 ? errors : null;
  };
}
