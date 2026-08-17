import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { BookingStatus } from '../../common/enums';
import { ReviewEligibilityGuard } from './review-eligibility.guard';

describe('ReviewEligibilityGuard', () => {
  const tripId = '123e4567-e89b-12d3-a456-426614174000';
  const concertId = '123e4567-e89b-12d3-a456-426614174001';
  const passengerId = '123e4567-e89b-12d3-a456-426614174002';

  const tripsRepository = { findOneBy: jest.fn() };
  const bookingsRepository = { findOneBy: jest.fn() };
  const concertsRepository = { findOneBy: jest.fn() };

  let guard: ReviewEligibilityGuard;

  const buildRequest = (
    user: { id: string } | undefined,
    id: string,
  ): Request & { user?: { id: string } } =>
    ({ user, params: { id } }) as Request & { user?: { id: string } };

  const context = (request: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  const pastConcert = {
    id: concertId,
    startAt: new Date('2020-01-01T00:00:00Z'),
  };
  const futureConcert = {
    id: concertId,
    startAt: new Date(Date.now() + 86_400_000),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new ReviewEligibilityGuard(
      tripsRepository as never,
      bookingsRepository as never,
      concertsRepository as never,
    );
    tripsRepository.findOneBy.mockResolvedValue({ id: tripId, concertId });
    concertsRepository.findOneBy.mockResolvedValue(pastConcert);
    bookingsRepository.findOneBy.mockResolvedValue({
      tripId,
      passengerId,
      status: BookingStatus.Confirmed,
    });
  });

  it('allows a confirmed passenger after the concert date', async () => {
    await expect(
      guard.canActivate(context(buildRequest({ id: passengerId }, tripId))),
    ).resolves.toBe(true);
  });

  it('rejects an unauthenticated request', async () => {
    await expect(
      guard.canActivate(context(buildRequest(undefined, tripId))),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('404s on a malformed trip id', async () => {
    await expect(
      guard.canActivate(
        context(buildRequest({ id: passengerId }, 'not-a-uuid')),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('404s on an unknown trip', async () => {
    tripsRepository.findOneBy.mockResolvedValue(null);
    await expect(
      guard.canActivate(context(buildRequest({ id: passengerId }, tripId))),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('forbids a review before the concert date', async () => {
    concertsRepository.findOneBy.mockResolvedValue(futureConcert);
    await expect(
      guard.canActivate(context(buildRequest({ id: passengerId }, tripId))),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forbids a passenger without a confirmed booking', async () => {
    bookingsRepository.findOneBy.mockResolvedValue(null);
    await expect(
      guard.canActivate(context(buildRequest({ id: passengerId }, tripId))),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(bookingsRepository.findOneBy).toHaveBeenCalledWith({
      tripId,
      passengerId,
      status: BookingStatus.Confirmed,
    });
  });
});
