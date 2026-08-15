import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VehicleType } from '../common/enums';
import { Trip } from '../trips/entities/trip.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';
import { VehiclesService } from './vehicles.service';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let vehiclesRepository: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let tripsRepository: { countBy: jest.Mock };

  const buildVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
    id: 'vehicle-uuid',
    ownerId: 'owner-uuid',
    type: VehicleType.Car,
    make: 'Škoda',
    model: 'Octavia',
    seats: 3,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    owner: undefined as unknown as Vehicle['owner'],
    ...overrides,
  });

  const createDto: CreateVehicleDto = {
    type: VehicleType.Van,
    make: 'Volkswagen',
    model: 'Multivan',
    seats: 6,
  };

  beforeEach(async () => {
    vehiclesRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn((data: Partial<Vehicle>) => data),
      save: jest.fn((vehicle) => Promise.resolve(vehicle)),
      remove: jest.fn(),
    };
    tripsRepository = { countBy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: getRepositoryToken(Vehicle),
          useValue: vehiclesRepository,
        },
        { provide: getRepositoryToken(Trip), useValue: tripsRepository },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  describe('findAllForOwner', () => {
    it('returns only the vehicles of the given owner', async () => {
      const vehicles = [buildVehicle(), buildVehicle({ id: 'vehicle-2' })];
      vehiclesRepository.find.mockResolvedValue(vehicles);

      const result = await service.findAllForOwner('owner-uuid');

      expect(vehiclesRepository.find).toHaveBeenCalledWith({
        where: { ownerId: 'owner-uuid' },
        order: { createdAt: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'vehicle-uuid',
        ownerId: 'owner-uuid',
        type: VehicleType.Car,
      });
    });
  });

  describe('create', () => {
    it('persists the vehicle for the owner and defaults notes to null', async () => {
      const result = await service.create('owner-uuid', createDto);

      expect(vehiclesRepository.create).toHaveBeenCalledWith({
        ...createDto,
        notes: null,
        ownerId: 'owner-uuid',
      });
      expect(vehiclesRepository.save).toHaveBeenCalled();
      expect(result).toMatchObject({ ...createDto, ownerId: 'owner-uuid' });
    });
  });

  describe('update', () => {
    it('applies a partial update to the vehicle', async () => {
      vehiclesRepository.findOneBy.mockResolvedValue(buildVehicle());

      const result = await service.update('vehicle-uuid', { seats: 4 });

      expect(vehiclesRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'vehicle-uuid', seats: 4 }),
      );
      expect(result.seats).toBe(4);
      expect(result.make).toBe('Škoda');
    });

    it('throws NotFoundException for an unknown vehicle', async () => {
      vehiclesRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('missing-uuid', { seats: 4 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(vehiclesRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes a vehicle that is not referenced by trips', async () => {
      const vehicle = buildVehicle();
      vehiclesRepository.findOneBy.mockResolvedValue(vehicle);
      tripsRepository.countBy.mockResolvedValue(0);

      await service.remove('vehicle-uuid');

      expect(vehiclesRepository.remove).toHaveBeenCalledWith(vehicle);
    });

    it('throws ConflictException when trips reference the vehicle', async () => {
      vehiclesRepository.findOneBy.mockResolvedValue(buildVehicle());
      tripsRepository.countBy.mockResolvedValue(2);

      await expect(service.remove('vehicle-uuid')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(vehiclesRepository.remove).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown vehicle', async () => {
      vehiclesRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove('missing-uuid')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(tripsRepository.countBy).not.toHaveBeenCalled();
      expect(vehiclesRepository.remove).not.toHaveBeenCalled();
    });
  });
});
