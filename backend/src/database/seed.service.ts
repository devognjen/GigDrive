import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { applySeed } from './apply-seed';
import { buildSeedData } from './seed-data';

/**
 * Runs the idempotent demo seed after migrations so concert search has cached
 * rows even when Ticketmaster is unconfigured or rejecting the API key.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.config.get<boolean>('seed.onStart')) {
      return;
    }
    const password = this.config.get<string>('seed.demoPassword') ?? 'demo1234';
    const passwordHash = bcrypt.hashSync(password, 10);
    const data = buildSeedData(new Date(), passwordHash);
    this.logger.log('Seeding demo data…');
    await this.dataSource.transaction((manager) =>
      applySeed(manager, data, (message) => this.logger.log(message)),
    );
    this.logger.log('Demo data seed complete');
  }
}
