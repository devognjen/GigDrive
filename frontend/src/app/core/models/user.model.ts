/** Authenticated user as returned by the API. */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  emailNotifications: boolean;
}

/** Response of POST /auth/login and POST /auth/register. */
export interface AuthResponse {
  accessToken: string;
  user: User;
}

/** Payload for POST /auth/register. */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

/** Payload for PATCH /users/me (all fields optional). */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  emailNotifications?: boolean;
}

/** Public view of a user as returned by GET /users/:id. */
export interface PublicProfile {
  id: string;
  firstName: string;
  lastName: string;
  averageRating: number | null;
  reviewCount: number;
}
