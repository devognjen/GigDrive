import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ChatMessageDto } from './dto/chat-message.dto';
import { TripChatMemberGuard } from './guards/trip-chat-member.guard';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /** Persisted history for a trip chat room (FR-COMM-02). */
  @Get('trips/:id/messages')
  @UseGuards(TripChatMemberGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({
    description: 'Caller is not the driver or a confirmed passenger',
  })
  @ApiNotFoundResponse({ description: 'Unknown trip, or chat is disabled' })
  @ApiOkResponse({ type: [ChatMessageDto] })
  list(@Param('id', ParseUUIDPipe) tripId: string): Promise<ChatMessageDto[]> {
    return this.chatService.listHistory(tripId);
  }
}
