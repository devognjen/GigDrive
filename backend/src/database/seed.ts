import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { AppDataSource } from './data-source';
import { applySeed } from './apply-seed';
import { buildSeedData } from './seed-data';

/**
 * Idempotent demo-data seed (see docs/features/01-infrastructure.md).
 * Rows are keyed by fixed UUIDs and skipped when already present, so the
 * script can be re-run safely at any time.
 *
 * Usage: pnpm seed   (or `node dist/database/seed.js` in the container)
 *
 * The NestJS app also runs this on startup unless SEED_ON_START=false.
 */

async function main(): Promise<void> {
  await AppDataSource.initialize();
  console.log(`Seeding ${String(AppDataSource.options.database)} …`);

  const password = process.env.SEED_DEMO_PASSWORD ?? 'demo1234';
  const passwordHash = bcrypt.hashSync(password, 10);
  const data = buildSeedData(new Date(), passwordHash);

  await AppDataSource.transaction((manager) => applySeed(manager, data));

  console.log('Seed complete.');
  await AppDataSource.destroy();
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
