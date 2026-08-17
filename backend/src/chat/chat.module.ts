import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Booking } from '../bookings/entities/booking.entity';
import { Trip } from '../trips/entities/trip.entity';
import { UsersModule } from '../users/users.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatMessage } from './entities/chat-message.entity';
import { TripChatMemberGuard } from './guards/trip-chat-member.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage, Trip, Booking]),
    UsersModule,
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, TripChatMemberGuard, ChatGateway],
})
export class ChatModule {}
