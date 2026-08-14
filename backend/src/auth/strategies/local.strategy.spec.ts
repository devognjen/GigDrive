import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../../users/entities/user.entity';
import { AuthService } from '../auth.service';
import { LocalStrategy } from './local.strategy';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: { validateUser: jest.Mock };

  const user: User = {
    id: 'user-uuid',
    email: 'ada@example.com',
    passwordHash: 'hash',
    firstName: 'Ada',
    lastName: 'Lovelace',
    phone: null,
    emailNotifications: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    authService = { validateUser: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
  });

  it('returns the user for valid credentials', async () => {
    authService.validateUser.mockResolvedValue(user);

    await expect(
      strategy.validate('ada@example.com', 'correct-horse'),
    ).resolves.toBe(user);
    expect(authService.validateUser).toHaveBeenCalledWith(
      'ada@example.com',
      'correct-horse',
    );
  });

  it('throws a generic UnauthorizedException for invalid credentials', async () => {
    authService.validateUser.mockResolvedValue(null);

    await expect(
      strategy.validate('ada@example.com', 'wrong-password'),
    ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
  });
});
