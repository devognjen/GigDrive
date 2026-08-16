import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { Trip } from '../entities/trip.entity';
import { TripOwnershipGuard } from './trip-ownership.guard';

describe('TripOwnershipGuard', () => {
  let guard: TripOwnershipGuard;
  let tripsRepository: { findOneBy: jest.Mock };

  const tripId = '3f6f3c8e-9d5b-4f2e-9a2a-1d3c6f0a2b11';

  const buildContext = (
    user: Pick<User, 'id'> | undefined,
    id: string = tripId,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params: { id } }),
      }),
    }) as ExecutionContext;

  beforeEach(async () => {
    tripsRepository = { findOneBy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripOwnershipGuard,
        { provide: getRepositoryToken(Trip), useValue: tripsRepository },
      ],
    }).compile();

    guard = module.get<TripOwnershipGuard>(TripOwnershipGuard);
  });

  it('allows the driver of the trip', async () => {
    tripsRepository.findOneBy.mockResolvedValue({ driverId: 'driver-uuid' });

    await expect(
      guard.canActivate(buildContext({ id: 'driver-uuid' })),
    ).resolves.toBe(true);
    expect(tripsRepository.findOneBy).toHaveBeenCalledWith({ id: tripId });
  });

  it('denies a user that is not the driver', async () => {
    tripsRepository.findOneBy.mockResolvedValue({ driverId: 'driver-uuid' });

    await expect(
      guard.canActivate(buildContext({ id: 'other-uuid' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects unauthenticated requests', async () => {
    await expect(
      guard.canActivate(buildContext(undefined)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tripsRepository.findOneBy).not.toHaveBeenCalled();
  });

  it('reports an unknown trip as NotFound', async () => {
    tripsRepository.findOneBy.mockResolvedValue(null);

    await expect(
      guard.canActivate(buildContext({ id: 'driver-uuid' })),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reports a malformed id as NotFound without hitting the database', async () => {
    await expect(
      guard.canActivate(buildContext({ id: 'driver-uuid' }, 'not-a-uuid')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tripsRepository.findOneBy).not.toHaveBeenCalled();
  });
});
