import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FeaturesController } from './features.controller';

describe('FeaturesController', () => {
  let controller: FeaturesController;
  let config: { get: jest.Mock };

  beforeEach(async () => {
    config = { get: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeaturesController],
      providers: [{ provide: ConfigService, useValue: config }],
    }).compile();

    controller = module.get(FeaturesController);
  });

  it('reports chat as enabled when the flag is true', () => {
    config.get.mockReturnValue(true);

    expect(controller.list()).toEqual({ chat: true });
    expect(config.get).toHaveBeenCalledWith('features.chat');
  });

  it('reports chat as disabled when the flag is false', () => {
    config.get.mockReturnValue(false);

    expect(controller.list()).toEqual({ chat: false });
  });
});
