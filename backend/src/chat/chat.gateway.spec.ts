import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let chatService: {
    isEnabled: jest.Mock;
    assertMember: jest.Mock;
    persistMessage: jest.Mock;
  };
  let jwtService: { verifyAsync: jest.Mock };
  let usersService: { findById: jest.Mock };

  const user = {
    id: 'user-uuid',
    firstName: 'Demo',
    lastName: 'Driver',
  };
  const tripId = '123e4567-e89b-12d3-a456-426614174000';

  const buildClient = (auth: { token?: string } = { token: 'jwt' }) => {
    const client = {
      handshake: { auth },
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    return { client: client as unknown as Socket, raw: client };
  };

  beforeEach(async () => {
    chatService = {
      isEnabled: jest.fn().mockReturnValue(true),
      assertMember: jest.fn().mockResolvedValue(undefined),
      persistMessage: jest.fn(),
    };
    jwtService = { verifyAsync: jest.fn().mockResolvedValue({ sub: user.id }) };
    usersService = { findById: jest.fn().mockResolvedValue(user) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: ChatService, useValue: chatService },
        { provide: JwtService, useValue: jwtService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    gateway = module.get(ChatGateway);
  });

  describe('handleConnection', () => {
    it('disconnects when chat is disabled', async () => {
      chatService.isEnabled.mockReturnValue(false);
      const { client, raw } = buildClient();

      await gateway.handleConnection(client);

      expect(raw.disconnect).toHaveBeenCalled();
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('disconnects when the handshake has no token', async () => {
      const { client, raw } = buildClient({});

      await gateway.handleConnection(client);

      expect(raw.disconnect).toHaveBeenCalled();
    });

    it('keeps the socket open when the JWT is valid', async () => {
      const { client, raw } = buildClient();

      await gateway.handleConnection(client);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('jwt');
      expect(raw.disconnect).not.toHaveBeenCalled();
    });

    it('disconnects when the JWT is invalid', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('bad token'));
      const { client, raw } = buildClient();

      await gateway.handleConnection(client);

      expect(raw.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleJoin', () => {
    it('joins the trip room for a member', async () => {
      const { client, raw } = buildClient();
      await gateway.handleConnection(client);

      await gateway.handleJoin(client, { tripId });

      expect(chatService.assertMember).toHaveBeenCalledWith(tripId, user.id);
      expect(raw.join).toHaveBeenCalledWith(`trip:${tripId}`);
    });

    it('rejects a non-member', async () => {
      chatService.assertMember.mockRejectedValue(
        new ForbiddenException(
          'Only the driver and confirmed passengers can access this chat',
        ),
      );
      const { client, raw } = buildClient();
      await gateway.handleConnection(client);

      await expect(
        gateway.handleJoin(client, { tripId }),
      ).rejects.toBeInstanceOf(WsException);
      expect(raw.join).not.toHaveBeenCalled();
    });

    it('rejects an unknown trip', async () => {
      chatService.assertMember.mockRejectedValue(
        new NotFoundException('Trip not found'),
      );
      const { client, raw } = buildClient();
      await gateway.handleConnection(client);

      await expect(
        gateway.handleJoin(client, { tripId }),
      ).rejects.toBeInstanceOf(WsException);
      expect(raw.join).not.toHaveBeenCalled();
    });
  });

  describe('handleMessage', () => {
    it('persists then broadcasts to the trip room', async () => {
      const dto = {
        id: 'msg-1',
        tripId,
        authorId: user.id,
        authorName: 'Demo Driver',
        body: 'Hello crew',
        sentAt: new Date('2026-08-01T12:00:00Z'),
      };
      chatService.persistMessage.mockResolvedValue(dto);

      const emit = jest.fn();
      const to = jest.fn().mockReturnValue({ emit });
      gateway.server = { to } as never;

      const { client } = buildClient();
      await gateway.handleConnection(client);
      await gateway.handleJoin(client, { tripId });

      await gateway.handleMessage(client, { body: 'Hello crew' });

      expect(chatService.persistMessage).toHaveBeenCalledWith(
        tripId,
        user.id,
        'Hello crew',
      );
      expect(to).toHaveBeenCalledWith(`trip:${tripId}`);
      expect(emit).toHaveBeenCalledWith('message', dto);
    });

    it('rejects a send before join', async () => {
      const { client } = buildClient();
      await gateway.handleConnection(client);

      await expect(
        gateway.handleMessage(client, { body: 'Hello' }),
      ).rejects.toBeInstanceOf(WsException);
      expect(chatService.persistMessage).not.toHaveBeenCalled();
    });
  });
});
