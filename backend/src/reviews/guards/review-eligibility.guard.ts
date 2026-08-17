import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { BookingStatus } from '../../common/enums';
import { Booking } from '../../bookings/entities/booking.entity';
import { Concert } from '../../concerts/entities/concert.entity';
import { Trip } from '../../trips/entities/trip.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Grants POST /trips/:id/reviews only to a confirmed passenger of that trip,
 * and only once the concert date has passed (FR-REV-01).
 */
@Injectable()
export class ReviewEligibilityGuard implements CanActivate {
  constructor(
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(Concert)
    private readonly concertsRepository: Repository<Concert>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: User }>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException();
    }

    const tripId = String(request.params.id);
    if (!isUUID(tripId)) {
      throw new NotFoundException('Trip not found');
    }

    const trip = await this.tripsRepository.findOneBy({ id: tripId });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const concert = await this.concertsRepository.findOneBy({
      id: trip.concertId,
    });
    if (!concert) {
      throw new NotFoundException('Trip not found');
    }
    if (concert.startAt.getTime() >= Date.now()) {
      throw new ForbiddenException(
        'You can only review after the concert date',
      );
    }

    const booking = await this.bookingsRepository.findOneBy({
      tripId,
      passengerId: user.id,
      status: BookingStatus.Confirmed,
    });
    if (!booking) {
      throw new ForbiddenException(
        'Only confirmed passengers can review this trip',
      );
    }
    return true;
  }
}
