import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '../../users/entities/user.entity';

/**
 * Base class for resource-ownership guards (used by features 04–06, e.g.
 * only the driver may edit their trip). Subclasses resolve the owner id of
 * the targeted resource; access is denied when it differs from the
 * authenticated user.
 */
export abstract class OwnershipGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: User }>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException();
    }
    if ((await this.getOwnerId(request)) !== user.id) {
      throw new ForbiddenException();
    }
    return true;
  }

  protected abstract getOwnerId(
    request: Request & { user?: User },
  ): string | Promise<string>;
}
