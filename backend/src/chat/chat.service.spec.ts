import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingStatus } from '../common/enums';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { ChatService } from './chat.service';
import { ChatMessage } from './entities/chat-message.entity';

describe('ChatService', () => {
  let service: ChatService;
  let messagesRepository: Record<string, jest.Mock>;
  let tripsRepository: Record<string, jest.Mock>;
  let bookingsRepository: Record<string, jest.Mock>;
  let config: { get: jest.Mock };

  const tripId = 'trip-uuid';
  const driverId = 'driver-uuid';
  const passengerId = 'passenger-uuid';
  const strangerId = 'stranger-uuid';

  const author = {
    id: driverId,
    firstName: 'Demo',
    lastName: 'Driver',
  } as User;

  const trip = { id: tripId, driverId } as Trip;

  const buildMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage =>
    ({
      id: 'msg-uuid',
      tripId,
      authorId: driverId,
      author,
      body: 'See you at the station.',
      sentAt: new Date('2026-08-01T12:00:00Z'),
      ...overrides,
    }) as ChatMessage;

  beforeEach(async () => {
    messagesRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((data: Partial<ChatMessage>) => ({
        ...buildMessage(),
        ...data,
      })),
      save: jest.fn((message: ChatMessage) => Promise.resolve(message)),
    };
    tripsRepository = { findOneBy: jest.fn() };
    bookingsRepository = { findOneBy: jest.fn() };
    config = { get: jest.fn().mockReturnValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(ChatMessage),
          useValue: messagesRepository,
        },
        { provide: getRepositoryToken(Trip), useValue: tripsRepository },
        { provide: getRepositoryToken(Booking), useValue: bookingsRepository },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(ChatService);
  });

  describe('isEnabled', () => {
    it('is true when FEATURE_CHAT is on', () => {
      expect(service.isEnabled()).toBe(true);
    });

    it('is false when FEATURE_CHAT is off', () => {
      config.get.mockReturnValue(false);
      expect(service.isEnabled()).toBe(false);
    });
  });

  describe('membership', () => {
    beforeEach(() => {
      tripsRepository.findOneBy.mockResolvedValue(trip);
      bookingsRepository.findOneBy.mockResolvedValue(null);
    });

    it('treats the driver as a member', async () => {
      await expect(service.isMember(tripId, driverId)).resolves.toBe(true);
      await expect(
        service.assertMember(tripId, driverId),
      ).resolves.toBeUndefined();
      expect(bookingsRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('treats a confirmed passenger as a member', async () => {
      bookingsRepository.findOneBy.mockResolvedValue({
        tripId,
        passengerId,
        status: BookingStatus.Confirmed,
      });

      await expect(service.isMember(tripId, passengerId)).resolves.toBe(true);
      expect(bookingsRepository.findOneBy).toHaveBeenCalledWith({
        tripId,
        passengerId,
        status: BookingStatus.Confirmed,
      });
    });

    it('rejects a pending passenger', async () => {
      bookingsRepository.findOneBy.mockResolvedValue(null);

      await expect(service.isMember(tripId, passengerId)).resolves.toBe(false);
      await expect(
        service.assertMember(tripId, passengerId),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects a stranger', async () => {
      await expect(service.isMember(tripId, strangerId)).resolves.toBe(false);
      await expect(
        service.assertMember(tripId, strangerId),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('404s when asserting membership on an unknown trip', async () => {
      tripsRepository.findOneBy.mockResolvedValue(null);

      await expect(service.isMember(tripId, driverId)).resolves.toBe(false);
      await expect(
        service.assertMember(tripId, driverId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('listHistory', () => {
    it('returns messages oldest first', async () => {
      const older = buildMessage({
        id: 'm1',
        sentAt: new Date('2026-08-01T10:00:00Z'),
      });
      const newer = buildMessage({
        id: 'm2',
        body: 'On my way',
        sentAt: new Date('2026-08-01T11:00:00Z'),
      });
      messagesRepository.find.mockResolvedValue([older, newer]);

      const result = await service.listHistory(tripId);

      expect(messagesRepository.find).toHaveBeenCalledWith({
        where: { tripId },
        relations: { author: true },
        order: { sentAt: 'ASC' },
      });
      expect(result.map((message) => message.id)).toEqual(['m1', 'm2']);
      expect(result[0]).toMatchObject({
        authorName: 'Demo Driver',
        body: 'See you at the station.',
      });
    });

    it('404s when chat is disabled', async () => {
      config.get.mockReturnValue(false);

      await expect(service.listHistory(tripId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(messagesRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('persistMessage', () => {
    it('trims the body, saves, and returns the public shape', async () => {
      const saved = buildMessage({ body: 'See you at the station.' });
      messagesRepository.save.mockResolvedValue(saved);
      messagesRepository.findOne.mockResolvedValue(saved);

      const result = await service.persistMessage(
        tripId,
        driverId,
        '  See you at the station.  ',
      );

      expect(messagesRepository.create).toHaveBeenCalledWith({
        tripId,
        authorId: driverId,
        body: 'See you at the station.',
      });
      expect(result).toMatchObject({
        tripId,
        authorId: driverId,
        authorName: 'Demo Driver',
        body: 'See you at the station.',
      });
    });
  });
});
