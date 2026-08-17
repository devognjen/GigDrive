import { UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ChatService } from './chat.service';
import { JoinTripDto } from './dto/join-trip.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';

const tripRoom = (tripId: string) => `trip:${tripId}`;

function readAuthToken(client: Socket): string | null {
  const auth = client.handshake.auth as unknown;
  if (typeof auth !== 'object' || auth === null || !('token' in auth)) {
    return null;
  }
  const token = auth.token;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

@WebSocketGateway({
  namespace: '/chat',
  path: '/api/socket.io',
  cors: { origin: true },
})
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly connectedUsers = new WeakMap<Socket, User>();
  private readonly joinedTrips = new WeakMap<Socket, string>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    if (!this.chatService.isEnabled()) {
      client.disconnect();
      return;
    }

    const token = readAuthToken(client);
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        client.disconnect();
        return;
      }
      this.connectedUsers.set(client, user);
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinTripDto,
  ): Promise<void> {
    const user = this.requireUser(client);
    await this.requireMember(dto.tripId, user.id);

    const previousTripId = this.joinedTrips.get(client);
    if (previousTripId && previousTripId !== dto.tripId) {
      await client.leave(tripRoom(previousTripId));
    }
    await client.join(tripRoom(dto.tripId));
    this.joinedTrips.set(client, dto.tripId);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendChatMessageDto,
  ): Promise<void> {
    const user = this.requireUser(client);
    const tripId = this.joinedTrips.get(client);
    if (!tripId) {
      throw new WsException('Join a trip room before sending messages');
    }
    await this.requireMember(tripId, user.id);
    const message = await this.chatService.persistMessage(
      tripId,
      user.id,
      dto.body,
    );
    this.server.to(tripRoom(tripId)).emit('message', message);
  }

  private requireUser(client: Socket): User {
    const user = this.connectedUsers.get(client);
    if (!user) {
      throw new WsException('Unauthorized');
    }
    return user;
  }

  private async requireMember(tripId: string, userId: string): Promise<void> {
    try {
      await this.chatService.assertMember(tripId, userId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Cannot access this chat';
      throw new WsException(message);
    }
  }
}
