import { User } from '../core/models/user.model';

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    email: 'ada@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    phone: null,
    emailNotifications: true,
    isAdmin: false,
    ...overrides,
  };
}
