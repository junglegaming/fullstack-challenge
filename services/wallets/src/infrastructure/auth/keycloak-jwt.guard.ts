import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTVerifyGetKey,
} from "jose";
import type { Request } from "express";
import type { AuthenticatedUser } from "./authenticated-user";

@Injectable()
export class KeycloakJwtGuard implements CanActivate {
  private readonly logger = new Logger(KeycloakJwtGuard.name);
  private readonly jwks: JWTVerifyGetKey;

  private readonly issuers: string[];

  constructor(config: ConfigService) {

    this.issuers = config
      .getOrThrow<string>("KEYCLOAK_ISSUER")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    this.jwks = createRemoteJWKSet(
      new URL(config.getOrThrow<string>("KEYCLOAK_JWKS_URI")),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    try {

      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuers,
      });

      const user: AuthenticatedUser = {
        playerId: String(payload.sub),
        username:
          (payload["preferred_username"] as string | undefined) ??
          String(payload.sub),
      };

      (request as Request & { user: AuthenticatedUser }).user = user;
      return true;
    } catch (error) {
      this.logger.debug(`JWT verification failed: ${String(error)}`);
      throw new UnauthorizedException("Invalid token");
    }
  }

  private extractToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return null;
    }
    return header.slice("Bearer ".length).trim();
  }
}
