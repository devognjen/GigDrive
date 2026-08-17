import { EntityManager, ObjectLiteral, Repository } from 'typeorm';
import { SeedData } from './seed-data';

/**
 * Idempotent demo-data insert. Rows are keyed by fixed UUIDs and skipped when
 * already present, so this can run on every boot.
 */
export async function insertIfMissing<T extends ObjectLiteral>(
  repository: Repository<T>,
  id: string,
  entity: T,
  label: string,
  log: (message: string) => void = console.log,
): Promise<boolean> {
  const exists = await repository.existsBy({ id } as never);
  if (exists) {
    log(`  ↷ ${label} already present, skipping`);
    return false;
  }
  await repository.save(entity);
  log(`  ✓ ${label}`);
  return true;
}

/** Applies the demo dataset inside an existing transaction. */
export async function applySeed(
  manager: EntityManager,
  data: SeedData,
  log: (message: string) => void = console.log,
): Promise<void> {
  log('Users:');
  await insertIfMissing(
    manager.getRepository('User'),
    data.driver.id,
    data.driver as never,
    `demo driver ${data.driver.email}`,
    log,
  );
  for (const passenger of data.passengers) {
    await insertIfMissing(
      manager.getRepository('User'),
      passenger.id,
      passenger as never,
      `passenger ${passenger.email}`,
      log,
    );
  }

  log('Vehicles:');
  for (const vehicle of data.vehicles) {
    await insertIfMissing(
      manager.getRepository('Vehicle'),
      vehicle.id,
      vehicle as never,
      `${vehicle.make} ${vehicle.model} (${vehicle.seats} seats)`,
      log,
    );
  }

  log('Concerts:');
  for (const concert of data.concerts) {
    await insertIfMissing(
      manager.getRepository('Concert'),
      concert.id,
      concert as never,
      `${concert.artist} @ ${concert.city}`,
      log,
    );
  }

  log('Trip & bookings:');
  await insertIfMissing(
    manager.getRepository('Trip'),
    data.trip.id,
    data.trip as never,
    `nearly-full trip (${data.trip.maxPassengers - 1}/${data.trip.maxPassengers} seats taken)`,
    log,
  );
  await insertIfMissing(
    manager.getRepository('Trip'),
    data.pastTrip.id,
    data.pastTrip as never,
    `completed past trip (${data.pastTrip.status})`,
    log,
  );
  for (const stop of data.stops) {
    await insertIfMissing(
      manager.getRepository('TripStop'),
      stop.id,
      stop as never,
      `stop ${stop.seq}: ${stop.place}`,
      log,
    );
  }
  for (const booking of data.bookings) {
    await insertIfMissing(
      manager.getRepository('Booking'),
      booking.id,
      booking as never,
      `booking ${booking.seats} seat(s), status ${booking.status}`,
      log,
    );
  }

  log('Reviews:');
  for (const review of data.reviews) {
    await insertIfMissing(
      manager.getRepository('Review'),
      review.id,
      review as never,
      `review ${review.rating}/5 on trip ${review.tripId}`,
      log,
    );
  }

  log('Chat:');
  for (const message of data.chatMessages) {
    await insertIfMissing(
      manager.getRepository('ChatMessage'),
      message.id,
      message as never,
      `chat message on trip ${message.tripId}`,
      log,
    );
  }
}
