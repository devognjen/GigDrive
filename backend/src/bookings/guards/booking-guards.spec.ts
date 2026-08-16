import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { Booking } from '../entities/booking.entity';
import { BookingDriverGuard } from './booking-driver.guard';
import { BookingPassengerGuard } from './booking-passenger.guard';

describe('Booking guards', () => {
  const tripId = '123e4567-e89b-12d3-a456-426614174000';
  const bookingId = '123e4567-e89b-12d3-a456-426614174001';
  const driverId = '123e4567-e89b-12d3-a456-426614174002';
  const passengerId = '123e4567-e89b-12d3-a456-426614174003';

  const buildRequest = (user: { id: string }, id: string): Request & { user: { id: string } } =>
    ({ user, params: { id } }) as Request & { user: { id: string } };

  const context = (request: unknown): ExecutionContext =>
    ({ switchToHttp: () => ({ getRequest: () => request }) }) as unknown as ExecutionContext;

  describe('BookingDriverGuard', () => {
    let guard: BookingDriverGuard;
    const bookingsRepository = { findOneBy: jest.fn() };
    const tripsRepository = { findOneBy: jest.fn() };

    beforeEach(() => {
      guard = new BookingDriverGuard(bookingsRepository as never, tripsRepository as never);
    });

    it('allows the trip driver', async () => {
      bookingsRepository.findOneBy.mockResolvedValue({ tripId } as Booking);
      tripsRepository.findOneBy.mockResolvedValue({ driverId });

      await expect(
        guard.canActivate(context(buildRequest({ id: driverId }, bookingId))),
      ).resolves.toBe(true);
    });

    it('forbids a non-driver', async () => {
      bookingsRepository.findOneBy.mockResolvedValue({ tripId } as Booking);
      tripsRepository.findOneBy.mockResolvedValue({ driverId });

      await expect(
        guard.canActivate(context(buildRequest({ id: 'ffffffff-ffff-ffff-ffff-ffffffffffff' }, bookingId))),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('404s on an unknown booking', async () => {
      bookingsRepository.findOneBy.mockResolvedValue(null);
      await expect(
        guard.canActivate(context(buildRequest({ id: driverId }, bookingId))),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('BookingPassengerGuard', () => {
    let guard: BookingPassengerGuard;
    const bookingsRepository = { findOneBy: jest.fn() };

    beforeEach(() => {
      guard = new BookingPassengerGuard(bookingsRepository as never);
    });

    it('allows the owning passenger', async () => {
      bookingsRepository.findOneBy.mockResolvedValue({ passengerId } as Booking);

      await expect(
        guard.canActivate(context(buildRequest({ id: passengerId }, bookingId))),
      ).resolves.toBe(true);
    });

    it('forbids a non-owner', async () => {
      bookingsRepository.findOneBy.mockResolvedValue({ passengerId } as Booking);

      await expect(
        guard.canActivate(context(buildRequest({ id: 'ffffffff-ffff-ffff-ffff-ffffffffffff' }, bookingId))),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('404s on an unknown booking', async () => {
      bookingsRepository.findOneBy.mockResolvedValue(null);
      await expect(
        guard.canActivate(context(buildRequest({ id: passengerId }, bookingId))),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
