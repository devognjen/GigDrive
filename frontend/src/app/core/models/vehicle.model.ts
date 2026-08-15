/** Vehicle type as defined by the API. */
export type VehicleType = 'CAR' | 'VAN' | 'MINIBUS';

/** Vehicle as returned by the API. */
export interface Vehicle {
  id: string;
  ownerId: string;
  type: VehicleType;
  make: string;
  model: string;
  /** Total passenger seats offered for trips (excludes the driver). */
  seats: number;
  notes: string | null;
}

/** Payload for POST /vehicles and PATCH /vehicles/:id. */
export interface VehicleRequest {
  type: VehicleType;
  make: string;
  model: string;
  seats: number;
  notes?: string;
}
