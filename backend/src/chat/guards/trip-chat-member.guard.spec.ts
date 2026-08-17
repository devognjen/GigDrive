import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ChatService } from '../chat.service';
import { TripChatMemberGuard } from './trip-chat-member.guard';

describe('TripChatMemberGuard', () => {
  const tripId = '123e4567-e89b-12d3-a456-426614174000';
  const userId = '123e4567-e89b-12d3-a456-426614174002';

  const chatService = {
    isEnabled: jest.fn(),
    assertMember: jest.fn(),
  };

  let guard: TripChatMemberGuard;

  const buildRequest = (
    user: { id: string } | undefined,
    id: string,
  ): Request & { user?: { id: string } } =>
    ({ user, params: { id } }) as Request & { user?: { id: string } };

  const context = (request: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    chatService.isEnabled.mockReturnValue(true);
    chatService.assertMember.mockResolvedValue(undefined);
    guard = new TripChatMemberGuard(chatService as unknown as ChatService);
  });

  it('allows a member when chat is enabled', async () => {
    await expect(
      guard.canActivate(context(buildRequest({ id: userId }, tripId))),
    ).resolves.toBe(true);
    expect(chatService.assertMember).toHaveBeenCalledWith(tripId, userId);
  });

  it('404s when chat is disabled', async () => {
    chatService.isEnabled.mockReturnValue(false);

    await expect(
      guard.canActivate(context(buildRequest({ id: userId }, tripId))),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(chatService.assertMember).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated request', async () => {
    await expect(
      guard.canActivate(context(buildRequest(undefined, tripId))),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('404s on a malformed trip id', async () => {
    await expect(
      guard.canActivate(context(buildRequest({ id: userId }, 'not-a-uuid'))),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates assertMember failures', async () => {
    chatService.assertMember.mockRejectedValue(new ForbiddenException());

    await expect(
      guard.canActivate(context(buildRequest({ id: userId }, tripId))),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
