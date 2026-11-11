import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtAccessSecret } from '../../common/jwt-config';

export interface AuthenticatedPrincipal {
  id: string;
  phone?: string;
  email?: string;
  identityLevel?: string;
  actorType: 'USER' | 'ADMIN';
  role?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtAccessSecret(),
    });
  }

  async validate(payload: {
    sub: string;
    phone?: string;
    email?: string;
    level?: string;
    actorType?: 'USER' | 'ADMIN';
    role?: string;
  }): Promise<AuthenticatedPrincipal> {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Jeton de session invalide.');
    }
    return {
      id: payload.sub,
      phone: payload.phone,
      email: payload.email,
      identityLevel: payload.level,
      actorType: payload.actorType || 'USER',
      role: payload.role,
    };
  }
}
