import { ConfigService } from '@nestjs/config';
import { SeedService } from './seed.service';

describe('SeedService', () => {
  const createService = (
    onStart: boolean,
    dataSource: { transaction: jest.Mock },
  ) =>
    new SeedService(
      dataSource as never,
      {
        get: jest.fn((key: string) => {
          if (key === 'seed.onStart') {
            return onStart;
          }
          if (key === 'seed.demoPassword') {
            return 'demo1234';
          }
          return undefined;
        }),
      } as unknown as ConfigService,
    );

  it('does not touch the database when seed.onStart is false', async () => {
    const dataSource = { transaction: jest.fn() };
    const service = createService(false, dataSource);

    await service.onApplicationBootstrap();

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('applies demo data when seed.onStart is true', async () => {
    const existsBy = jest.fn().mockResolvedValue(true);
    const dataSource = {
      transaction: jest.fn(
        async (work: (manager: unknown) => Promise<void>) => {
          await work({
            getRepository: () => ({ existsBy, save: jest.fn() }),
          });
        },
      ),
    };
    const service = createService(true, dataSource);

    await service.onApplicationBootstrap();

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(existsBy).toHaveBeenCalled();
  });
});
