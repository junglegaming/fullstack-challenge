import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createRemoteJWKSet, jwtVerify } from "jose";

type AuthenticatedRequest = {
  headers: {
    authorization?: string;
  };
  playerId?: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  private getJwks(): ReturnType<typeof createRemoteJWKSet> {
    if (!this.jwks) {
      const issuer = process.env.KEYCLOAK_ISSUER;

      if (!issuer) {
        throw new Error("KEYCLOAK_ISSUER is not configured");
      }

      const jwksUri =
        process.env.KEYCLOAK_JWKS_URI ??
        `${issuer.replace(/\/$/, "")}/protocol/openid-connect/certs`;

      this.jwks = createRemoteJWKSet(new URL(jwksUri));
    }

    return this.jwks;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = authorization.slice("Bearer ".length).trim();
    const issuer = process.env.KEYCLOAK_ISSUER;

    if (!issuer) {
      throw new UnauthorizedException("Authentication is not configured");
    }

    try {
      const { payload } = await jwtVerify(token, this.getJwks(), {
        issuer,
      });

      const playerId = payload.sub;

      if (!playerId) {
        throw new UnauthorizedException("Token does not contain subject");
      }

      request.playerId = playerId;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
