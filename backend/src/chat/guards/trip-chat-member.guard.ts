import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Request } from 'express';
import { User } from '../../users/entities/user.entity';
import { ChatService } from '../chat.service';

/**
 * Grants GET /trips/:id/messages only to the trip's driver or a confirmed
 * passenger. Returns 404 when chat is disabled so the rest of the app is
 * unaffected (FR-COMM-02).
 */
@Injectable()
export class TripChatMemberGuard implements CanActivate {
  constructor(private readonly chatService: ChatService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.chatService.isEnabled()) {
      throw new NotFoundException();
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: User }>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException();
    }

    const tripId = String(request.params.id);
    if (!isUUID(tripId)) {
      throw new NotFoundException('Trip not found');
    }

    await this.chatService.assertMember(tripId, user.id);
    return true;
  }
}
