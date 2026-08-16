import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { OwnershipGuard } from '../../common/guards/ownership.guard';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../entities/booking.entity';

/**
 * Grants access to /bookings/:id passenger-only actions (cancel) exclusively
 * to the passenger who made the booking. Unknown (or malformed) ids are
 * reported as 404, a foreign booking as 403.
 */
@Injectable()
export class BookingPassengerGuard extends OwnershipGuard {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
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
    return booking.passengerId;
  }
}
