import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  const buildUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-uuid',
    email: 'ada@example.com',
    passwordHash: 'hash',
    firstName: 'Ada',
    lastName: 'Lovelace',
    phone: '+43 664 1234567',
    emailNotifications: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    repository = {
      findOneBy: jest.fn(),
      create: jest.fn((data: Partial<User>) => data),
      save: jest.fn((user: User) => Promise.resolve(user)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findByEmail', () => {
    it('looks the user up by email', async () => {
      const user = buildUser();
      repository.findOneBy.mockResolvedValue(user);

      await expect(service.findByEmail(user.email)).resolves.toBe(user);
      expect(repository.findOneBy).toHaveBeenCalledWith({
        email: user.email,
      });
    });
  });

  describe('findById', () => {
    it('returns null for an unknown id', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.findById('missing')).resolves.toBeNull();
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 'missing' });
    });
  });

  describe('updateProfile', () => {
    it('changes only the provided fields', async () => {
      const user = buildUser();
      repository.findOneBy.mockResolvedValue(user);

      const updated = await service.updateProfile(user.id, {
        firstName: 'Augusta',
      });

      expect(updated.firstName).toBe('Augusta');
      expect(updated.lastName).toBe('Lovelace');
      expect(updated.phone).toBe('+43 664 1234567');
      expect(updated.emailNotifications).toBe(true);
      expect(repository.save).toHaveBeenCalledWith(user);
    });

    it('clears the phone when explicitly set to null', async () => {
      const user = buildUser();
      repository.findOneBy.mockResolvedValue(user);

      const updated = await service.updateProfile(user.id, { phone: null });

      expect(updated.phone).toBeNull();
      expect(updated.firstName).toBe('Ada');
    });

    it('updates emailNotifications when provided', async () => {
      const user = buildUser();
      repository.findOneBy.mockResolvedValue(user);

      const updated = await service.updateProfile(user.id, {
        emailNotifications: false,
      });

      expect(updated.emailNotifications).toBe(false);
    });

    it('throws NotFoundException for an unknown user', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateProfile('missing', { firstName: 'Augusta' }),
      ).rejects.toThrow(new NotFoundException('User not found'));
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('getPublicProfile', () => {
    it('returns the public shape with an empty ratings state', async () => {
      repository.findOneBy.mockResolvedValue(buildUser());

      const profile = await service.getPublicProfile('user-uuid');

      expect(profile).toEqual({
        id: 'user-uuid',
        firstName: 'Ada',
        lastName: 'Lovelace',
        averageRating: null,
        reviewCount: 0,
      });
      expect(profile).not.toHaveProperty('email');
      expect(profile).not.toHaveProperty('passwordHash');
    });

    it('throws NotFoundException for an unknown user', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.getPublicProfile('missing')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });
});
