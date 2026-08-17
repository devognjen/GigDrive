/** Pricing mode as defined by the API. */
export type PricingMode = 'SHARED_TOTAL' | 'FIXED_PER_SEAT';

/** Currency as defined by the API. */
export type Currency = 'EUR' | 'RSD';

/** Trip status as defined by the API. */
export type TripStatus = 'OPEN' | 'FULL' | 'READY' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

/** A pickup stop along a trip's route. */
export interface TripStop {
  id: string;
  seq: number;
  place: string;
  lat: number | null;
  lng: number | null;
  /** ISO 8601 timestamp or null. */
  plannedTime: string | null;
}

/** Live price band for a trip (worst → best case). */
export interface LivePrice {
  /** Current per-person price (minor units). */
  perPerson: number;
  /** Worst-case per-person price (minor units). */
  lowerBound: number;
  /** Best-case per-person price (minor units). */
  upperBound: number;
}

/** Trip as returned by the API. */
export interface Trip {
  id: string;
  driverId: string;
  driverName: string;
  driverAverageRating: number | null;
  driverReviewCount: number;
  vehicleId: string;
  vehicleType: string;
  concertId: string;
  concertArtist: string;
  concertTitle: string;
  concertCity: string;
  pricingMode: PricingMode;
  totalCost: number;
  currency: Currency;
  minPassengers: number;
  maxPassengers: number;
  /** ISO 8601 timestamp. */
  confirmationDeadline: string;
  /** ISO 8601 timestamp. */
  departureAt: string;
  roundTrip: boolean;
  notes: string | null;
  status: TripStatus;
  confirmedSeats: number;
  seatsLeft: number;
  stops: TripStop[];
  livePrice: LivePrice;
}

/** Payload for creating a trip (stops omit the server-generated id). */
export interface CreateTripRequest {
  vehicleId: string;
  concertId: string;
  pricingMode: PricingMode;
  totalCost: number;
  currency: Currency;
  minPassengers: number;
  maxPassengers: number;
  confirmationDeadline: string;
  departureAt: string;
  roundTrip?: boolean;
  notes?: string;
  stops: CreateTripStop[];
}

/** Stop as submitted when creating/editing a trip. */
export interface CreateTripStop {
  seq: number;
  place: string;
  lat?: number | null;
  lng?: number | null;
  plannedTime?: string | null;
}

/** Filter/sort params for GET /trips. */
export interface TripSearchParams {
  concertId?: string;
  from?: string;
  vehicleType?: string;
  maxPrice?: number;
  minRating?: number;
  seatsMin?: number;
  sort?: 'cheapest' | 'likely';
}
