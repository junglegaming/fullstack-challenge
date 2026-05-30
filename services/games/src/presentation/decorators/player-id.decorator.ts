import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";

export const PlayerId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
    }>();

    const authHeader = request.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid Authorization header");
    }

    const token = authHeader.slice(7);
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new UnauthorizedException("Invalid JWT format");
    }

    let payload: Record<string, unknown>;
    try {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      payload = JSON.parse(
        Buffer.from(base64, "base64").toString("utf8"),
      ) as Record<string, unknown>;
    } catch {
      throw new UnauthorizedException("Failed to decode JWT payload");
    }

    const sub = payload["sub"];
    if (typeof sub !== "string" || !sub) {
      throw new UnauthorizedException("JWT payload missing sub claim");
    }

    return sub;
  },
);
