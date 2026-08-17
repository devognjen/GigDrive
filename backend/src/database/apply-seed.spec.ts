import { applySeed, insertIfMissing } from './apply-seed';
import { buildSeedData } from './seed-data';

describe('applySeed', () => {
  it('skips rows that already exist and inserts the rest', async () => {
    const existsBy = jest
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValue(false);
    const save = jest.fn().mockResolvedValue(undefined);
    const repository = { existsBy, save };
    const manager = {
      getRepository: jest.fn().mockReturnValue(repository),
    };
    const log = jest.fn();
    const data = buildSeedData(new Date('2026-08-17T12:00:00Z'), 'hash');

    await applySeed(manager as never, data, log);

    expect(existsBy).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('already present'),
    );
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Concerts:'));
  });

  it('insertIfMissing returns false when the row exists', async () => {
    const repository = {
      existsBy: jest.fn().mockResolvedValue(true),
      save: jest.fn(),
    };

    const inserted = await insertIfMissing(
      repository as never,
      'id',
      { id: 'id' },
      'label',
    );

    expect(inserted).toBe(false);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
