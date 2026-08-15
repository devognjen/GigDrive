import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from '../trips/entities/trip.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleDto } from './dto/vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepository: Repository<Vehicle>,
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
  ) {}

  /** Lists only the vehicles of the given owner. */
  async findAllForOwner(ownerId: string): Promise<VehicleDto[]> {
    const vehicles = await this.vehiclesRepository.find({
      where: { ownerId },
      order: { createdAt: 'ASC' },
    });
    return vehicles.map((vehicle) => VehicleDto.fromEntity(vehicle));
  }

  async create(ownerId: string, dto: CreateVehicleDto): Promise<VehicleDto> {
    const vehicle = this.vehiclesRepository.create({
      ...dto,
      notes: dto.notes ?? null,
      ownerId,
    });
    return VehicleDto.fromEntity(await this.vehiclesRepository.save(vehicle));
  }

  /**
   * Applies a partial update. Callers must ensure ownership first
   * (see VehicleOwnershipGuard on the controller routes).
   */
  async update(id: string, dto: UpdateVehicleDto): Promise<VehicleDto> {
    const vehicle = await this.findOrFail(id);
    Object.assign(vehicle, dto);
    return VehicleDto.fromEntity(await this.vehiclesRepository.save(vehicle));
  }

  /**
   * Deleting a vehicle referenced by trips is blocked (the trips would be
   * orphaned; the FK is onDelete: 'RESTRICT'), so the request fails with 409.
   */
  async remove(id: string): Promise<void> {
    const vehicle = await this.findOrFail(id);
    const tripCount = await this.tripsRepository.countBy({ vehicleId: id });
    if (tripCount > 0) {
      throw new ConflictException(
        'Vehicle is used by existing trips and cannot be deleted',
      );
    }
    await this.vehiclesRepository.remove(vehicle);
  }

  private async findOrFail(id: string): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepository.findOneBy({ id });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }
}
