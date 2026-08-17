import { IsUUID } from 'class-validator';

/** Payload for joining a trip chat room (WebSocket `join` event). */
export class JoinTripDto {
  @IsUUID()
  tripId: string;
}
