import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Payload for posting a chat message (WebSocket `message` event). */
export class SendChatMessageDto {
  @ApiProperty({ example: 'See you at the station.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body: string;
}
