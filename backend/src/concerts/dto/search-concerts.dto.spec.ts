import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SearchConcertsDto } from './search-concerts.dto';

describe('SearchConcertsDto', () => {
  it('accepts an empty query and defaults page to 0', async () => {
    const dto = plainToInstance(SearchConcertsDto, {});

    expect(dto.page).toBe(0);
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('accepts a fully populated query', async () => {
    const dto = plainToInstance(SearchConcertsDto, {
      q: 'Rammstein',
      city: 'Vienna',
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
      genre: 'Metal',
      page: 1,
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('coerces the page query param from string to number', async () => {
    const dto = plainToInstance(SearchConcertsDto, { page: '2' });

    expect(dto.page).toBe(2);
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects a negative page', async () => {
    const dto = plainToInstance(SearchConcertsDto, { page: -1 });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('page');
  });

  it('rejects a non-integer page', async () => {
    const dto = plainToInstance(SearchConcertsDto, { page: 1.5 });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('page');
  });

  it('rejects malformed dates', async () => {
    const dto = plainToInstance(SearchConcertsDto, {
      dateFrom: 'not-a-date',
      dateTo: '2026-13-40',
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property).sort()).toEqual([
      'dateFrom',
      'dateTo',
    ]);
  });
});
