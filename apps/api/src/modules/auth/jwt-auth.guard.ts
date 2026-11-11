import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  override handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentification requise pour cette opération.');
    }
    if (user.actorType && user.actorType !== 'USER') {
      throw new UnauthorizedException('Ce jeton ne correspond pas à un compte usager.');
    }
    return user;
  }
}
