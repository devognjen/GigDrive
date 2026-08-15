import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { OwnershipGuard } from '../../common/guards/ownership.guard';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../entities/vehicle.entity';

/**
 * Grants access to /vehicles/:id routes only to the vehicle's owner.
 * Unknown (or malformed) ids are reported as 404, a foreign vehicle as 403.
 */
@Injectable()
export class VehicleOwnershipGuard extends OwnershipGuard {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepository: Repository<Vehicle>,
  ) {
    super();
  }

  protected async getOwnerId(
    request: Request & { user?: User },
  ): Promise<string> {
    const id = String(request.params.id);
    // Guards run before pipes, so the ParseUUIDPipe on the handler has not
    // validated the id yet — a malformed id would explode the uuid query.
    if (!isUUID(id)) {
      throw new NotFoundException('Vehicle not found');
    }
    const vehicle = await this.vehiclesRepository.findOneBy({ id });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle.ownerId;
  }
}
