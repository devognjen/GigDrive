import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingStatus } from '../common/enums';
import { Trip } from '../trips/entities/trip.entity';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatMessage } from './entities/chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messagesRepository: Repository<ChatMessage>,
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly config: ConfigService,
  ) {}

  /** Whether in-app trip chat is enabled (`FEATURE_CHAT`). */
  isEnabled(): boolean {
    return this.config.get<boolean>('features.chat') === true;
  }

  /**
   * True when the user is the trip's driver or a confirmed passenger.
   * Unknown trips return false (callers that need 404 should use assertMember).
   */
  async isMember(tripId: string, userId: string): Promise<boolean> {
    const trip = await this.tripsRepository.findOneBy({ id: tripId });
    if (!trip) {
      return false;
    }
    return this.isTripMember(trip, userId);
  }

  /** Throws 404 for an unknown trip and 403 for a non-member. */
  async assertMember(tripId: string, userId: string): Promise<void> {
    const trip = await this.tripsRepository.findOneBy({ id: tripId });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    if (await this.isTripMember(trip, userId)) {
      return;
    }
    throw new ForbiddenException(
      'Only the driver and confirmed passengers can access this chat',
    );
  }

  async listHistory(tripId: string): Promise<ChatMessageDto[]> {
    if (!this.isEnabled()) {
      throw new NotFoundException();
    }
    const messages = await this.messagesRepository.find({
      where: { tripId },
      relations: { author: true },
      order: { sentAt: 'ASC' },
    });
    return messages.map((message) => this.toDto(message));
  }

  async persistMessage(
    tripId: string,
    authorId: string,
    body: string,
  ): Promise<ChatMessageDto> {
    const message = this.messagesRepository.create({
      tripId,
      authorId,
      body: body.trim(),
    });
    const saved = await this.messagesRepository.save(message);
    return this.toDto(await this.findMessageOrFail(saved.id));
  }

  private async isTripMember(trip: Trip, userId: string): Promise<boolean> {
    if (trip.driverId === userId) {
      return true;
    }
    const booking = await this.bookingsRepository.findOneBy({
      tripId: trip.id,
      passengerId: userId,
      status: BookingStatus.Confirmed,
    });
    return Boolean(booking);
  }

  private async findMessageOrFail(id: string): Promise<ChatMessage> {
    const message = await this.messagesRepository.findOne({
      where: { id },
      relations: { author: true },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }

  private toDto(message: ChatMessage): ChatMessageDto {
    return ChatMessageDto.fromEntity(message, this.authorDisplayName(message));
  }

  private authorDisplayName(message: ChatMessage): string {
    if (!message.author) {
      return 'Unknown member';
    }
    return `${message.author.firstName} ${message.author.lastName}`;
  }
}
