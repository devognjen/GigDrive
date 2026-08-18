import { FormControl, FormGroup } from '@angular/forms';

import { toLocalInput } from '../../../core/utils/local-datetime';
import { scheduleOrderValidator, suggestSchedule } from './trip-schedule';

describe('trip-schedule', () => {
  describe('suggestSchedule', () => {
    it('puts departure 3 hours before the concert and the deadline a day before that', () => {
      const now = new Date('2026-08-01T00:00:00');
      const suggested = suggestSchedule('2026-09-01T18:00:00', now);

      expect(suggested).toEqual({
        confirmationDeadline: toLocalInput(new Date('2026-08-31T15:00:00')),
        departureAt: toLocalInput(new Date('2026-09-01T15:00:00')),
      });
    });

    it('returns null when the concert is too soon to leave 3 hours early', () => {
      const now = new Date('2026-09-01T16:00:00');
      expect(suggestSchedule('2026-09-01T18:00:00', now)).toBeNull();
    });

    it('falls back to an hour from now when the 1-day deadline would be in the past', () => {
      const now = new Date('2026-09-01T10:00:00');
      const suggested = suggestSchedule('2026-09-01T18:00:00', now);

      expect(suggested).toEqual({
        confirmationDeadline: toLocalInput(new Date('2026-09-01T11:00:00')),
        departureAt: toLocalInput(new Date('2026-09-01T15:00:00')),
      });
    });
  });

  describe('scheduleOrderValidator', () => {
    function group(deadline: string, departure: string, concertStart: string | null) {
      return new FormGroup(
        {
          confirmationDeadline: new FormControl(deadline, { nonNullable: true }),
          departureAt: new FormControl(departure, { nonNullable: true }),
        },
        { validators: [scheduleOrderValidator(() => concertStart)] },
      );
    }

    it('accepts deadline before departure on or before the concert', () => {
      const form = group('2026-08-31T12:00', '2026-09-01T15:00', '2026-09-01T18:00:00');
      expect(form.valid).toBe(true);
    });

    it('rejects a deadline on or after departure', () => {
      const form = group('2026-09-01T15:00', '2026-09-01T15:00', null);
      expect(form.hasError('deadlineAfterDeparture')).toBe(true);
    });

    it('rejects a deadline on or after the concert', () => {
      const form = group('2026-09-01T18:00', '2026-09-01T19:00', '2026-09-01T18:00:00');
      expect(form.hasError('deadlineAfterConcert')).toBe(true);
    });

    it('rejects a departure after the concert', () => {
      const form = group('2026-09-01T12:00', '2026-09-01T19:00', '2026-09-01T18:00:00');
      expect(form.hasError('departureAfterConcert')).toBe(true);
    });
  });
});
