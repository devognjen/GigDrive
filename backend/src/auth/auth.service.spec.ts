import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    create: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };

  const buildUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-uuid',
    email: 'ada@example.com',
    passwordHash: bcrypt.hashSync('correct-horse', 10),
    firstName: 'Ada',
    lastName: 'Lovelace',
    phone: null,
    emailNotifications: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const registerDto: RegisterDto = {
    email: 'ada@example.com',
    password: 'correct-horse',
    firstName: 'Ada',
    lastName: 'Lovelace',
  };

  beforeEach(async () => {
    usersService = { findByEmail: jest.fn(), create: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('signed-jwt') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('stores a bcrypt hash, never the plain password', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      let createdData: Partial<User> | undefined;
      usersService.create.mockImplementation((data: Partial<User>) => {
        createdData = data;
        return Promise.resolve(buildUser(data));
      });

      await service.register(registerDto);

      const created = createdData as Partial<User>;
      expect(created.passwordHash).toBeDefined();
      expect(created.passwordHash).not.toBe(registerDto.password);
      await expect(
        bcrypt.compare(registerDto.password, created.passwordHash as string),
      ).resolves.toBe(true);
    });

    it('returns an access token and the sanitized user', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockImplementation((data: Partial<User>) =>
        Promise.resolve(buildUser(data)),
      );

      const result = await service.register(registerDto);

      expect(result.accessToken).toBe('signed-jwt');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-uuid',
        email: registerDto.email,
      });
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('rejects duplicate emails with a ConflictException', async () => {
      usersService.findByEmail.mockResolvedValue(buildUser());

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Email already registered'),
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('returns the user for valid credentials', async () => {
      const user = buildUser();
      usersService.findByEmail.mockResolvedValue(user);

      await expect(
        service.validateUser(user.email, 'correct-horse'),
      ).resolves.toBe(user);
    });

    it('returns null for a wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(buildUser());

      await expect(
        service.validateUser('ada@example.com', 'wrong-password'),
      ).resolves.toBeNull();
    });

    it('returns null for an unknown email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('nobody@example.com', 'correct-horse'),
      ).resolves.toBeNull();
    });
  });

  describe('login', () => {
    it('returns an access token and a user without passwordHash', () => {
      const user = buildUser();

      const result = service.login(user);

      expect(result.accessToken).toBe('signed-jwt');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
      });
      expect(result.user).toEqual({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        emailNotifications: user.emailNotifications,
      });
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });
});
