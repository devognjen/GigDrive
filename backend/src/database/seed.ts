import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { EntityManager, ObjectLiteral, Repository } from 'typeorm';
import { AppDataSource } from './data-source';
import { buildSeedData, SeedData } from './seed-data';

/**
 * Idempotent demo-data seed (see docs/features/01-infrastructure.md).
 * Rows are keyed by fixed UUIDs and skipped when already present, so the
 * script can be re-run safely at any time.
 *
 * Usage: pnpm seed   (or `node dist/database/seed.js` in the container)
 */

async function insertIfMissing<T extends ObjectLiteral>(
  repository: Repository<T>,
  id: string,
  entity: T,
  label: string,
): Promise<boolean> {
  const exists = await repository.existsBy({ id } as never);
  if (exists) {
    console.log(`  ↷ ${label} already present, skipping`);
    return false;
  }
  await repository.save(entity);
  console.log(`  ✓ ${label}`);
  return true;
}

async function seed(manager: EntityManager, data: SeedData): Promise<void> {
  console.log('Users:');
  await insertIfMissing(
    manager.getRepository('User'),
    data.driver.id,
    data.driver as never,
    `demo driver ${data.driver.email}`,
  );
  for (const passenger of data.passengers) {
    await insertIfMissing(
      manager.getRepository('User'),
      passenger.id,
      passenger as never,
      `passenger ${passenger.email}`,
    );
  }

  console.log('Vehicles:');
  for (const vehicle of data.vehicles) {
    await insertIfMissing(
      manager.getRepository('Vehicle'),
      vehicle.id,
      vehicle as never,
      `${vehicle.make} ${vehicle.model} (${vehicle.seats} seats)`,
    );
  }

  console.log('Concerts:');
  for (const concert of data.concerts) {
    await insertIfMissing(
      manager.getRepository('Concert'),
      concert.id,
      concert as never,
      `${concert.artist} @ ${concert.city}`,
    );
  }

  console.log('Trip & bookings:');
  await insertIfMissing(
    manager.getRepository('Trip'),
    data.trip.id,
    data.trip as never,
    `nearly-full trip (${data.trip.maxPassengers - 1}/${data.trip.maxPassengers} seats taken)`,
  );
  for (const stop of data.stops) {
    await insertIfMissing(
      manager.getRepository('TripStop'),
      stop.id,
      stop as never,
      `stop ${stop.seq}: ${stop.place}`,
    );
  }
  for (const booking of data.bookings) {
    await insertIfMissing(
      manager.getRepository('Booking'),
      booking.id,
      booking as never,
      `booking ${booking.seats} seat(s), status ${booking.status}`,
    );
  }
}

async function main(): Promise<void> {
  await AppDataSource.initialize();
  console.log(`Seeding ${String(AppDataSource.options.database)} …`);

  const password = process.env.SEED_DEMO_PASSWORD ?? 'demo1234';
  const passwordHash = bcrypt.hashSync(password, 10);
  const data = buildSeedData(new Date(), passwordHash);

  await AppDataSource.transaction((manager) => seed(manager, data));

  console.log('Seed complete.');
  await AppDataSource.destroy();
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
