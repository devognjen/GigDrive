import 'dotenv/config';
import { join } from 'path';
import { DataSource } from 'typeorm';

/**
 * DataSource used by the TypeORM CLI (migrations) and the seed script.
 * Defaults target a PostgreSQL reachable on localhost (e.g. the Dockerized
 * `db` service with its port published); override via .env / environment.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.POSTGRES_USER ?? 'gigdrive',
  password: process.env.POSTGRES_PASSWORD ?? 'gigdrive',
  database: process.env.POSTGRES_DB ?? 'gigdrive',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  synchronize: false,
});
