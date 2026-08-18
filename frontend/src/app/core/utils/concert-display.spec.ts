import { concertInitial, concertTitleDiffers } from './concert-display';

describe('concertTitleDiffers', () => {
  it('hides a title that repeats the artist', () => {
    expect(concertTitleDiffers('Gojira', 'Gojira')).toBe(false);
  });

  it('shows a distinct title', () => {
    expect(concertTitleDiffers('Metallica', 'M72 World Tour')).toBe(true);
  });
});

describe('concertInitial', () => {
  it('returns the first letter uppercased', () => {
    expect(concertInitial('gojira')).toBe('G');
  });

  it('returns a fallback for a blank name', () => {
    expect(concertInitial('  ')).toBe('?');
  });
});
