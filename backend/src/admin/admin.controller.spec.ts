import { Test, TestingModule } from '@nestjs/testing';
import { ConcertsService } from '../concerts/concerts.service';
import { ConcertDto } from '../concerts/dto/concert.dto';
import { TripStatus } from '../common/enums';
import { TripDto } from '../trips/dto/trip.dto';
import { TripsService } from '../trips/trips.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let tripsService: { listForAdmin: jest.Mock; cancel: jest.Mock };
  let concertsService: { listForAdmin: jest.Mock; setHidden: jest.Mock };
  let usersService: {
    listForAdmin: jest.Mock;
    disable: jest.Mock;
    enable: jest.Mock;
  };

  const actor = { id: 'admin-id', isAdmin: true } as User;

  beforeEach(async () => {
    tripsService = {
      listForAdmin: jest.fn(),
      cancel: jest.fn(),
    };
    concertsService = {
      listForAdmin: jest.fn(),
      setHidden: jest.fn(),
    };
    usersService = {
      listForAdmin: jest.fn(),
      disable: jest.fn(),
      enable: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: { getStats: jest.fn() } },
        { provide: UsersService, useValue: usersService },
        { provide: ConcertsService, useValue: concertsService },
        { provide: TripsService, useValue: tripsService },
      ],
    }).compile();

    controller = module.get(AdminController);
  });

  it('delegates trip cancel to TripsService.cancel', async () => {
    const cancelled = {
      id: 'trip-id',
      status: TripStatus.Cancelled,
    } as TripDto;
    tripsService.cancel.mockResolvedValue(cancelled);

    await expect(controller.cancelTrip('trip-id')).resolves.toBe(cancelled);
    expect(tripsService.cancel).toHaveBeenCalledWith('trip-id');
  });

  it('delegates concert hide to ConcertsService.setHidden', async () => {
    const hidden = { id: 'c1', hidden: true } as ConcertDto;
    concertsService.setHidden.mockResolvedValue(hidden);

    await expect(controller.hideConcert('c1')).resolves.toBe(hidden);
    expect(concertsService.setHidden).toHaveBeenCalledWith('c1', true);
  });

  it('passes the actor id when disabling a user', async () => {
    const disabled = { id: 'u2', disabledAt: new Date() } as User;
    usersService.disable.mockResolvedValue(disabled);

    const result = await controller.disableUser(actor, 'u2');

    expect(usersService.disable).toHaveBeenCalledWith('u2', 'admin-id');
    expect(result.id).toBe('u2');
    expect(result).not.toHaveProperty('passwordHash');
  });
});
