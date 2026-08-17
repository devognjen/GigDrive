import { Booking } from '../bookings/entities/booking.entity';
import {
  BookingStatus,
  Currency,
  PricingMode,
  TripStatus,
  VehicleType,
} from '../common/enums';
import { Concert } from '../concerts/entities/concert.entity';
import { Review } from '../reviews/entities/review.entity';
import { Trip } from '../trips/entities/trip.entity';
import { TripStop } from '../trips/entities/trip-stop.entity';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';

/**
 * Pure builders for the demo dataset. Dates are computed relative to `now`
 * so the demo stays valid (concerts in the future) whenever it is seeded.
 * Fixed UUIDs keep re-runs idempotent.
 */

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;

const daysFromNow = (now: Date, days: number, utcHour: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  date.setUTCHours(utcHour, 0, 0, 0);
  return date;
};

export interface SeedData {
  driver: User;
  passengers: User[];
  vehicles: Vehicle[];
  concerts: Concert[];
  trip: Trip;
  pastTrip: Trip;
  stops: TripStop[];
  bookings: Booking[];
  reviews: Review[];
}

export function buildSeedData(now: Date, passwordHash: string): SeedData {
  const driver = Object.assign(new User(), {
    id: uuid(1),
    email: 'driver@gigdrive.demo',
    passwordHash,
    firstName: 'Demo',
    lastName: 'Driver',
    phone: '+381641234567',
    emailNotifications: true,
  });

  const passengers = ['Ana', 'Marko', 'Jelena'].map((firstName, i) =>
    Object.assign(new User(), {
      id: uuid(10 + i),
      email: `${firstName.toLowerCase()}@gigdrive.demo`,
      passwordHash,
      firstName,
      lastName: 'Passenger',
      phone: null,
      emailNotifications: true,
    }),
  );

  const vehicles = [
    Object.assign(new Vehicle(), {
      id: uuid(100),
      ownerId: driver.id,
      type: VehicleType.Car,
      make: 'Volkswagen',
      model: 'Golf 7',
      seats: 3,
      notes: null,
    }),
    Object.assign(new Vehicle(), {
      id: uuid(101),
      ownerId: driver.id,
      type: VehicleType.Van,
      make: 'Ford',
      model: 'Transit Custom',
      seats: 7,
      notes: 'Roof box, plenty of room for gear.',
    }),
  ];

  const concerts = [
    Object.assign(new Concert(), {
      id: uuid(1000),
      externalId: 'tm-demo-nick-cave-2026',
      userSubmitted: false,
      artist: 'Nick Cave & The Bad Seeds',
      title: 'Nick Cave & The Bad Seeds — Live in Belgrade',
      venue: 'Štark Arena',
      city: 'Belgrade',
      country: 'Serbia',
      lat: 44.8141,
      lng: 20.4212,
      startAt: daysFromNow(now, 45, 19),
      imageUrl: null,
      genre: 'Rock',
      ticketUrl: null,
    }),
    Object.assign(new Concert(), {
      id: uuid(1001),
      externalId: 'tm-demo-arctic-monkeys-2026',
      userSubmitted: false,
      artist: 'Arctic Monkeys',
      title: 'Arctic Monkeys — Budapest Park',
      venue: 'Budapest Park',
      city: 'Budapest',
      country: 'Hungary',
      lat: 47.4764,
      lng: 19.0593,
      startAt: daysFromNow(now, 60, 19),
      imageUrl: null,
      genre: 'Indie',
      ticketUrl: null,
    }),
    Object.assign(new Concert(), {
      id: uuid(1002),
      externalId: 'tm-demo-rammstein-2026',
      userSubmitted: false,
      artist: 'Rammstein',
      title: 'Rammstein — Europe Stadium Tour',
      venue: 'Ernst-Happel-Stadion',
      city: 'Vienna',
      country: 'Austria',
      lat: 48.2072,
      lng: 16.4208,
      startAt: daysFromNow(now, 75, 18),
      imageUrl: null,
      genre: 'Metal',
      ticketUrl: null,
    }),
    Object.assign(new Concert(), {
      id: uuid(1003),
      externalId: 'tm-demo-the-cure-2026',
      userSubmitted: false,
      artist: 'The Cure',
      title: 'The Cure — Songs of a Lost World',
      venue: 'Arena Zagreb',
      city: 'Zagreb',
      country: 'Croatia',
      lat: 45.7719,
      lng: 15.9419,
      startAt: daysFromNow(now, 90, 19),
      imageUrl: null,
      genre: 'Alternative',
      ticketUrl: null,
    }),
    Object.assign(new Concert(), {
      id: uuid(1004),
      externalId: 'tm-demo-gojira-2026',
      userSubmitted: false,
      artist: 'Gojira',
      title: 'Gojira — Fortitude',
      venue: 'Exit Festival',
      city: 'Novi Sad',
      country: 'Serbia',
      lat: 45.2542,
      lng: 19.8617,
      startAt: daysFromNow(now, -30, 19),
      imageUrl: null,
      genre: 'Metal',
      ticketUrl: null,
    }),
  ];

  const [headlineConcert] = concerts;
  const pastConcert = concerts[4];
  const van = vehicles[1];
  const car = vehicles[0];

  // Nearly-full trip: 6 of 7 seats confirmed → one seat left.
  const trip = Object.assign(new Trip(), {
    id: uuid(2000),
    driverId: driver.id,
    vehicleId: van.id,
    concertId: headlineConcert.id,
    pricingMode: PricingMode.SharedTotal,
    totalCost: 12000, // 120.00 EUR in minor units
    currency: Currency.Eur,
    minPassengers: 4,
    maxPassengers: van.seats,
    confirmationDeadline: daysFromNow(now, 38, 11),
    departureAt: daysFromNow(now, 45, 14),
    roundTrip: true,
    notes: 'Leaving after the encore, short breaks on the way back.',
    status: TripStatus.Open,
  });

  const stops = [
    Object.assign(new TripStop(), {
      id: uuid(3000),
      tripId: trip.id,
      seq: 1,
      place: 'Novi Sad — Železnička stanica',
      lat: 45.2649,
      lng: 19.8296,
      plannedTime: daysFromNow(now, 45, 14),
    }),
    Object.assign(new TripStop(), {
      id: uuid(3001),
      tripId: trip.id,
      seq: 2,
      place: 'Stara Pazova — rest stop',
      lat: 44.985,
      lng: 20.1608,
      plannedTime: daysFromNow(now, 45, 15),
    }),
    Object.assign(new TripStop(), {
      id: uuid(3002),
      tripId: uuid(2001),
      seq: 1,
      place: 'Belgrade — Slavija',
      lat: 44.8026,
      lng: 20.4662,
      plannedTime: daysFromNow(now, -30, 14),
    }),
  ];

  const bookings = [
    { passenger: passengers[0], seats: 2, paid: true },
    { passenger: passengers[1], seats: 2, paid: true },
    { passenger: passengers[2], seats: 2, paid: false },
  ].map(({ passenger, seats, paid }, i) =>
    Object.assign(new Booking(), {
      id: uuid(4000 + i),
      tripId: trip.id,
      passengerId: passenger.id,
      seats,
      status: BookingStatus.Confirmed,
      paid,
      decidedAt: daysFromNow(now, -1, 12),
    }),
  );

  // Completed past trip so the demo driver has a rating (FR-REV-02).
  const pastTrip = Object.assign(new Trip(), {
    id: uuid(2001),
    driverId: driver.id,
    vehicleId: car.id,
    concertId: pastConcert.id,
    pricingMode: PricingMode.SharedTotal,
    totalCost: 6000,
    currency: Currency.Eur,
    minPassengers: 2,
    maxPassengers: car.seats,
    confirmationDeadline: daysFromNow(now, -37, 11),
    departureAt: daysFromNow(now, -30, 14),
    roundTrip: true,
    notes: 'Back the same night.',
    status: TripStatus.Completed,
  });

  const pastBookings = [
    { passenger: passengers[0], seats: 1, paid: true },
    { passenger: passengers[1], seats: 1, paid: true },
  ].map(({ passenger, seats, paid }, i) =>
    Object.assign(new Booking(), {
      id: uuid(4010 + i),
      tripId: pastTrip.id,
      passengerId: passenger.id,
      seats,
      status: BookingStatus.Confirmed,
      paid,
      decidedAt: daysFromNow(now, -32, 12),
    }),
  );

  const reviews = [
    Object.assign(new Review(), {
      id: uuid(5000),
      tripId: pastTrip.id,
      authorId: passengers[0].id,
      rating: 5,
      comment: 'On time, great playlist, would ride again.',
      createdAt: daysFromNow(now, -29, 10),
    }),
    Object.assign(new Review(), {
      id: uuid(5001),
      tripId: pastTrip.id,
      authorId: passengers[1].id,
      rating: 4,
      comment: 'Smooth drive, a bit tight on luggage space.',
      createdAt: daysFromNow(now, -29, 11),
    }),
  ];

  return {
    driver,
    passengers,
    vehicles,
    concerts,
    trip,
    pastTrip,
    stops,
    bookings: [...bookings, ...pastBookings],
    reviews,
  };
}
