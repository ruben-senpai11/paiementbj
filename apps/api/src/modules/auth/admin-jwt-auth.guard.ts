import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

const ALLOWED_ADMIN_ROLES = new Set(['SUPERADMIN', 'OPERATOR', 'AUDITOR', 'SUPPORT']);

@Injectable()
export class AdminJwtAuthGuard extends AuthGuard('jwt') {
  override canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  override handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentification administrateur requise.');
    }
    if (user.actorType !== 'ADMIN' || !user.role || !ALLOWED_ADMIN_ROLES.has(user.role)) {
      throw new ForbiddenException(
        'Accès refusé. Privilèges administrateur Paiement BJ requis.'
      );
    }
    return user;
  }
}
