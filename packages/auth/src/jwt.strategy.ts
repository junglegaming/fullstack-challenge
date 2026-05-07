import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // 1. Extrai o token do Header "Authorization: Bearer <TOKEN>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // 2. Verifica se o token expirou (mantenha false em prod)
      ignoreExpiration: false,

      // 3. O emissor deve ser EXATAMENTE igual ao campo "iss" do jwt.io
      issuer: 'http://localhost:8080/realms/crash-game',

      // 4. ALGORITMO: O seu print confirmou que é RS256
      algorithms: ['RS256'],

      // 5. REMOVIDO: O audience ('account') que estava causando o 401
      
      // 6. Provedor da chave pública do Keycloak
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: 'http://localhost:8080/realms/crash-game/protocol/openid-connect/certs',
      }),
    });
  }

  // Se o token for válido, o Passport chama esta função:
  async validate(payload: any) {
    // Se o payload não tiver o sub, algo está muito errado
    if (!payload.sub) {
      throw new UnauthorizedException('Token inválido: sub ausente');
    }

    // O que você retornar aqui será anexado ao objeto request (req.user)
    return {
      sub: payload.sub,
      username: payload.preferred_username,
      email: payload.email,
    };
  }
}