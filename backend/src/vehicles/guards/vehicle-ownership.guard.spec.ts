import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { VehicleOwnershipGuard } from './vehicle-ownership.guard';

describe('VehicleOwnershipGuard', () => {
  let guard: VehicleOwnershipGuard;
  let vehiclesRepository: { findOneBy: jest.Mock };

  const vehicleId = '3f6f3c8e-9d5b-4f2e-9a2a-1d3c6f0a2b11';

  const buildContext = (
    user: Pick<User, 'id'> | undefined,
    id: string = vehicleId,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params: { id } }),
      }),
    }) as ExecutionContext;

  beforeEach(async () => {
    vehiclesRepository = { findOneBy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleOwnershipGuard,
        {
          provide: getRepositoryToken(Vehicle),
          useValue: vehiclesRepository,
        },
      ],
    }).compile();

    guard = module.get<VehicleOwnershipGuard>(VehicleOwnershipGuard);
  });

  it('allows the owner of the vehicle', async () => {
    vehiclesRepository.findOneBy.mockResolvedValue({ ownerId: 'owner-uuid' });

    await expect(
      guard.canActivate(buildContext({ id: 'owner-uuid' })),
    ).resolves.toBe(true);
    expect(vehiclesRepository.findOneBy).toHaveBeenCalledWith({
      id: vehicleId,
    });
  });

  it('denies a user that does not own the vehicle', async () => {
    vehiclesRepository.findOneBy.mockResolvedValue({ ownerId: 'owner-uuid' });

    await expect(
      guard.canActivate(buildContext({ id: 'other-uuid' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects unauthenticated requests', async () => {
    await expect(
      guard.canActivate(buildContext(undefined)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(vehiclesRepository.findOneBy).not.toHaveBeenCalled();
  });

  it('reports an unknown vehicle as NotFound', async () => {
    vehiclesRepository.findOneBy.mockResolvedValue(null);

    await expect(
      guard.canActivate(buildContext({ id: 'owner-uuid' })),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reports a malformed id as NotFound without hitting the database', async () => {
    await expect(
      guard.canActivate(buildContext({ id: 'owner-uuid' }, 'not-a-uuid')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(vehiclesRepository.findOneBy).not.toHaveBeenCalled();
  });
});
