import { Concert } from '../core/models/concert.model';

/** Shared concert used by picker and trip-create tests. */
export function buildConcert(overrides: Partial<Concert> = {}): Concert {
  return {
    id: 'c1',
    externalId: null,
    userSubmitted: true,
    artist: 'Metallica',
    title: 'M72 World Tour',
    venue: 'Stade de France',
    city: 'Paris',
    country: 'France',
    lat: null,
    lng: null,
    startAt: '2026-09-01T18:00:00.000Z',
    imageUrl: null,
    genre: 'Metal',
    ticketUrl: null,
    ...overrides,
  };
}
