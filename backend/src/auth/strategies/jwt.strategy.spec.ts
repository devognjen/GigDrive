import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import { JwtPayload, JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: { findById: jest.Mock };

  const payload: JwtPayload = { sub: 'user-uuid', email: 'ada@example.com' };

  const user: User = {
    id: payload.sub,
    email: payload.email,
    passwordHash: 'hash',
    firstName: 'Ada',
    lastName: 'Lovelace',
    phone: null,
    emailNotifications: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    usersService = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('test-secret') },
        },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('returns the user referenced by the token payload', async () => {
    usersService.findById.mockResolvedValue(user);

    await expect(strategy.validate(payload)).resolves.toBe(user);
    expect(usersService.findById).toHaveBeenCalledWith(payload.sub);
  });

  it('throws UnauthorizedException when the user no longer exists', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
