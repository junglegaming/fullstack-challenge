import { createParamDecorator, ExecutionContext } from "@nestjs/common";

type AuthenticatedRequest = {
  playerId?: string;
};

export const CurrentPlayer = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const playerId = request.playerId;

    if (!playerId) {
      throw new Error("Player id is missing from request context");
    }

    return playerId;
  },
);
