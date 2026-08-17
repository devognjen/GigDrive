import { HttpErrorResponse } from '@angular/common/http';

/** Maps an HTTP error to a readable, action-specific message. */
export function mutationError(verb: string, error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 409) {
      return `Could not ${verb}: no seats left for this trip.`;
    }
    if (error.status === 403) {
      return `Could not ${verb}: you are not allowed to perform this action.`;
    }
    if (error.status === 404) {
      return `Could not ${verb}: the booking no longer exists.`;
    }
  }
  return `Could not ${verb}.`;
}
