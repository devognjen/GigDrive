import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

/**
 * Requires an authenticated admin. JWT is already enforced globally;
 * this only checks the privilege overlay.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: User }>();
    if (!request.user?.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
