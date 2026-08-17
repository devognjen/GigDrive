import { ApiProperty } from '@nestjs/swagger';
import { ChatMessage } from '../entities/chat-message.entity';

/** API representation of a persisted trip-chat message. */
export class ChatMessageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tripId: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty({ description: 'Display name of the author' })
  authorName: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  sentAt: Date;

  static fromEntity(message: ChatMessage, authorName: string): ChatMessageDto {
    const dto = new ChatMessageDto();
    dto.id = message.id;
    dto.tripId = message.tripId;
    dto.authorId = message.authorId;
    dto.authorName = authorName;
    dto.body = message.body;
    dto.sentAt = message.sentAt;
    return dto;
  }
}
