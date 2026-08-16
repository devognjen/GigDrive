import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { OwnershipGuard } from '../../common/guards/ownership.guard';
import { User } from '../../users/entities/user.entity';
import { Trip } from '../../trips/entities/trip.entity';
import { Booking } from '../entities/booking.entity';

/**
 * Grants access to /bookings/:id driver-only actions (accept, reject, paid)
 * exclusively to the driver of the booking's trip.
 *
 * Resolves the owner via the booking → its trip → the trip's driver. Unknown
 * (or malformed) booking/trip ids are reported as 404, a foreign trip as 403.
 */
@Injectable()
export class BookingDriverGuard extends OwnershipGuard {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
  ) {
    super();
  }

  protected async getOwnerId(
    request: Request & { user?: User },
  ): Promise<string> {
    const id = String(request.params.id);
    if (!isUUID(id)) {
      throw new NotFoundException('Booking not found');
    }
    const booking = await this.bookingsRepository.findOneBy({ id });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const trip = await this.tripsRepository.findOneBy({ id: booking.tripId });
    if (!trip) {
      throw new NotFoundException('Booking not found');
    }
    return trip.driverId;
  }
}
