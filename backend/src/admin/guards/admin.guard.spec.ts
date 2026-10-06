import { ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { User } from '../../users/entities/user.entity';

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  const contextFor = (user: Partial<User> | undefined) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as never;

  it('allows an admin', () => {
    expect(guard.canActivate(contextFor({ isAdmin: true }))).toBe(true);
  });

  it('rejects an authenticated non-admin', () => {
    expect(() => guard.canActivate(contextFor({ isAdmin: false }))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects a missing user', () => {
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
