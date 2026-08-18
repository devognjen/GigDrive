import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency, PricingMode, TripStatus } from '../../common/enums';
import { Trip } from '../entities/trip.entity';
import { TripStop } from '../entities/trip-stop.entity';
import { LivePrice } from '../pricing.service';

export class TripStopOutputDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  seq: number;

  @ApiProperty()
  place: string;

  @ApiPropertyOptional({ nullable: true })
  lat: number | null;

  @ApiPropertyOptional({ nullable: true })
  lng: number | null;

  @ApiPropertyOptional({ nullable: true })
  plannedTime: Date | null;

  static fromEntity(stop: TripStop): TripStopOutputDto {
    const dto = new TripStopOutputDto();
    dto.id = stop.id;
    dto.seq = stop.seq;
    dto.place = stop.place;
    dto.lat = stop.lat;
    dto.lng = stop.lng;
    dto.plannedTime = stop.plannedTime;
    return dto;
  }
}

/**
 * API representation of a trip, including the live per-person price (FR-TRIP-04).
 */
export class TripDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  driverId: string;

  @ApiProperty()
  driverName: string;

  @ApiProperty({ nullable: true })
  driverAverageRating: number | null;

  @ApiProperty()
  driverReviewCount: number;

  @ApiProperty()
  vehicleId: string;

  @ApiProperty()
  vehicleType: string;

  @ApiProperty()
  concertId: string;

  @ApiProperty()
  concertArtist: string;

  @ApiProperty()
  concertTitle: string;

  @ApiProperty()
  concertCity: string;

  @ApiProperty({ nullable: true })
  concertImageUrl: string | null;

  @ApiProperty({ enum: PricingMode })
  pricingMode: PricingMode;

  @ApiProperty()
  totalCost: number;

  @ApiProperty({ enum: Currency })
  currency: Currency;

  @ApiProperty()
  minPassengers: number;

  @ApiProperty()
  maxPassengers: number;

  @ApiProperty()
  confirmationDeadline: Date;

  @ApiProperty()
  departureAt: Date;

  @ApiProperty()
  roundTrip: boolean;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiProperty({ enum: TripStatus })
  status: TripStatus;

  @ApiProperty()
  confirmedSeats: number;

  @ApiProperty({ description: 'Seats still available to book' })
  seatsLeft: number;

  @ApiProperty({ type: TripStopOutputDto, isArray: true })
  stops: TripStopOutputDto[];

  @ApiProperty()
  livePrice: LivePrice;

  static fromEntity(
    trip: Trip,
    confirmedSeats: number,
    livePrice: LivePrice,
    stops: TripStop[],
    driverName: string,
    driverAverageRating: number | null,
    driverReviewCount: number,
  ): TripDto {
    const dto = new TripDto();
    dto.id = trip.id;
    dto.driverId = trip.driverId;
    dto.driverName = driverName;
    dto.driverAverageRating = driverAverageRating;
    dto.driverReviewCount = driverReviewCount;
    dto.vehicleId = trip.vehicleId;
    dto.vehicleType = trip.vehicle?.type ?? '';
    dto.concertId = trip.concertId;
    dto.concertArtist = trip.concert?.artist ?? '';
    dto.concertTitle = trip.concert?.title ?? '';
    dto.concertCity = trip.concert?.city ?? '';
    dto.concertImageUrl = trip.concert?.imageUrl ?? null;
    dto.pricingMode = trip.pricingMode;
    dto.totalCost = trip.totalCost;
    dto.currency = trip.currency;
    dto.minPassengers = trip.minPassengers;
    dto.maxPassengers = trip.maxPassengers;
    dto.confirmationDeadline = trip.confirmationDeadline;
    dto.departureAt = trip.departureAt;
    dto.roundTrip = trip.roundTrip;
    dto.notes = trip.notes;
    dto.status = trip.status;
    dto.confirmedSeats = confirmedSeats;
    dto.seatsLeft = Math.max(trip.maxPassengers - confirmedSeats, 0);
    dto.stops = stops.map((stop) => TripStopOutputDto.fromEntity(stop));
    dto.livePrice = livePrice;
    return dto;
  }
}
