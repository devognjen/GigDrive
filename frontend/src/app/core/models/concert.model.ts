/** Concert as returned by the API. */
export interface Concert {
  id: string;
  externalId: string | null;
  userSubmitted: boolean;
  artist: string;
  title: string;
  venue: string;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
  /** ISO 8601 timestamp. */
  startAt: string;
  imageUrl: string | null;
  genre: string | null;
  ticketUrl: string | null;
}

/** Trip linked to a concert, as embedded in the concert details response. */
export interface ConcertTrip {
  id: string;
  status: 'OPEN' | 'FULL' | 'READY' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  /** ISO 8601 timestamp. */
  departureAt: string;
  minPassengers: number;
  maxPassengers: number;
  driverId: string;
  driverName: string;
}

/** Response of GET /concerts/:id. */
export interface ConcertDetails {
  concert: Concert;
  trips: ConcertTrip[];
}

/** Payload for POST /concerts. */
export interface CreateConcertRequest {
  artist: string;
  title: string;
  venue: string;
  city: string;
  country: string;
  /** ISO 8601 timestamp. */
  startAt: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
  genre?: string;
  ticketUrl?: string;
}

/** Query params for GET /concerts/search (all optional, page is 0-based). */
export interface ConcertSearchParams {
  q?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  genre?: string;
  page?: number;
}
