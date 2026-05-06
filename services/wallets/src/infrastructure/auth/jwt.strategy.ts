import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET not configured'); }) as any,
      issuer: process.env.JWT_ISSUER || "http://localhost:8080/realms/crash-game",
      audience: process.env.JWT_AUDIENCE || "account",
    });
  }

  validate(payload: Record<string, unknown>) {
    const realmAccess = payload.realm_access as Record<string, unknown> | undefined;
    const roles = (realmAccess?.["roles"] as string[]) || [];

    return {
      userId: payload.sub as string,
      email: payload.email as string,
      username: payload.preferred_username as string,
      roles,
    };
  }
}
