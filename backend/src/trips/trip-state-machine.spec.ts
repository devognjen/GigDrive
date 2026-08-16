import { ConflictException } from '@nestjs/common';
import { TripStatus } from '../common/enums';
import { TripStateMachine, TripStateContext } from './trip-state-machine';

const baseContext: TripStateContext = {
  status: TripStatus.Open,
  confirmedSeats: 0,
  minPassengers: 4,
  maxPassengers: 8,
  confirmationDeadline: new Date('2026-09-01T00:00:00Z'),
  departureAt: new Date('2026-09-10T00:00:00Z'),
};

describe('TripStateMachine', () => {
  let machine: TripStateMachine;

  beforeEach(() => {
    machine = new TripStateMachine();
  });

  describe('hasMinReached', () => {
    it('is true once confirmed seats hit the minimum', () => {
      expect(
        machine.hasMinReached({ confirmedSeats: 3, minPassengers: 4 }),
      ).toBe(false);
      expect(
        machine.hasMinReached({ confirmedSeats: 4, minPassengers: 4 }),
      ).toBe(true);
      expect(
        machine.hasMinReached({ confirmedSeats: 5, minPassengers: 4 }),
      ).toBe(true);
    });
  });

  describe('isFull', () => {
    it('is true only when every seat is confirmed', () => {
      expect(machine.isFull({ confirmedSeats: 7, maxPassengers: 8 })).toBe(
        false,
      );
      expect(machine.isFull({ confirmedSeats: 8, maxPassengers: 8 })).toBe(
        true,
      );
      expect(machine.isFull({ confirmedSeats: 9, maxPassengers: 8 })).toBe(
        true,
      );
    });
  });

  describe('assertEditable', () => {
    it('allows editing an OPEN trip', () => {
      expect(() => machine.assertEditable(TripStatus.Open)).not.toThrow();
    });

    it.each([
      TripStatus.Full,
      TripStatus.Ready,
      TripStatus.Confirmed,
      TripStatus.Completed,
      TripStatus.Cancelled,
    ])('rejects editing a %s trip', (status) => {
      expect(() => machine.assertEditable(status)).toThrow(ConflictException);
    });
  });

  describe('assertCancellable', () => {
    it('allows cancelling unsettled trips', () => {
      expect(() => machine.assertCancellable(TripStatus.Open)).not.toThrow();
      expect(() => machine.assertCancellable(TripStatus.Ready)).not.toThrow();
      expect(() =>
        machine.assertCancellable(TripStatus.Confirmed),
      ).not.toThrow();
      expect(() => machine.assertCancellable(TripStatus.Full)).not.toThrow();
    });

    it.each([TripStatus.Completed, TripStatus.Cancelled])(
      'rejects cancelling a %s trip',
      (status) => {
        expect(() => machine.assertCancellable(status)).toThrow(
          ConflictException,
        );
      },
    );
  });

  describe('assertConfirmable', () => {
    it('allows confirming a READY trip', () => {
      expect(() =>
        machine.assertConfirmable({ ...baseContext, status: TripStatus.Ready }),
      ).not.toThrow();
    });

    it.each([
      TripStatus.Open,
      TripStatus.Full,
      TripStatus.Confirmed,
      TripStatus.Completed,
      TripStatus.Cancelled,
    ])('rejects confirming a %s trip', (status) => {
      expect(() =>
        machine.assertConfirmable({ ...baseContext, status }),
      ).toThrow(ConflictException);
    });
  });

  describe('deriveStatus', () => {
    it('goes OPEN → READY once the minimum is reached', () => {
      expect(machine.deriveStatus({ ...baseContext, confirmedSeats: 4 })).toBe(
        TripStatus.Ready,
      );
    });

    it('goes OPEN → FULL once every seat is taken', () => {
      expect(machine.deriveStatus({ ...baseContext, confirmedSeats: 8 })).toBe(
        TripStatus.Full,
      );
    });

    it('drops FULL → OPEN when a booking is cancelled below the minimum', () => {
      expect(
        machine.deriveStatus({
          ...baseContext,
          status: TripStatus.Full,
          confirmedSeats: 3,
        }),
      ).toBe(TripStatus.Open);
    });

    it('drops FULL → READY when a booking is cancelled above the minimum', () => {
      expect(
        machine.deriveStatus({
          ...baseContext,
          status: TripStatus.Full,
          confirmedSeats: 5,
        }),
      ).toBe(TripStatus.Ready);
    });

    it('leaves terminal statuses untouched', () => {
      expect(
        machine.deriveStatus({ ...baseContext, status: TripStatus.Confirmed }),
      ).toBe(TripStatus.Confirmed);
      expect(
        machine.deriveStatus({ ...baseContext, status: TripStatus.Completed }),
      ).toBe(TripStatus.Completed);
      expect(
        machine.deriveStatus({ ...baseContext, status: TripStatus.Cancelled }),
      ).toBe(TripStatus.Cancelled);
    });
  });
});
