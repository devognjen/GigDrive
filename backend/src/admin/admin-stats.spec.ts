import { BookingStatus, TripStatus } from '../common/enums';
import { tallyByStatus } from './admin-stats';

describe('tallyByStatus', () => {
  it('fills missing statuses with zero and maps group-by rows', () => {
    const result = tallyByStatus(
      [
        { status: TripStatus.Open, count: '3' },
        { status: TripStatus.Cancelled, count: 1 },
      ],
      Object.values(TripStatus),
    );

    expect(result.OPEN).toBe(3);
    expect(result.CANCELLED).toBe(1);
    expect(result.FULL).toBe(0);
    expect(result.COMPLETED).toBe(0);
  });

  it('tallies booking statuses the same way', () => {
    const result = tallyByStatus(
      [{ status: BookingStatus.Confirmed, count: '7' }],
      Object.values(BookingStatus),
    );

    expect(result.CONFIRMED).toBe(7);
    expect(result.PENDING).toBe(0);
  });
});
