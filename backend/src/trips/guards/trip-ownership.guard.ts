import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { OwnershipGuard } from '../../common/guards/ownership.guard';
import { User } from '../../users/entities/user.entity';
import { Trip } from '../entities/trip.entity';

/**
 * Grants access to /trips/:id mutation routes only to the trip's driver.
 * Unknown (or malformed) ids are reported as 404, a foreign trip as 403.
 */
@Injectable()
export class TripOwnershipGuard extends OwnershipGuard {
  constructor(
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
  ) {
    super();
  }

  protected async getOwnerId(
    request: Request & { user?: User },
  ): Promise<string> {
    const id = String(request.params.id);
    // Guards run before pipes, so validate the uuid here as well.
    if (!isUUID(id)) {
      throw new NotFoundException('Trip not found');
    }
    const trip = await this.tripsRepository.findOneBy({ id });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    return trip.driverId;
  }
}
