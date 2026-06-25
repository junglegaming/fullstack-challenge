import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import {
  BetAmountOutOfRangeError,
  BetNotCashableError,
  BetOutsideBettingPhaseError,
  CashOutOutsideRunningPhaseError,
  DuplicateBetError,
  GameDomainError,
  InvalidMoneyError,
  InvalidRoundTransitionError,
  NoActiveBetError,
  NoActiveRoundError,
} from "../../domain/errors/game.errors";

@Catch(GameDomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(error: GameDomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = this.statusFor(error);

    if (status >= 500) {
      this.logger.error(error.message);
    }

    response.status(status).json({
      statusCode: status,
      error: error.name,
      message: error.message,
    });
  }

  private statusFor(error: GameDomainError): number {

    if (
      error instanceof BetAmountOutOfRangeError ||
      error instanceof InvalidMoneyError
    ) {
      return HttpStatus.BAD_REQUEST;
    }

    if (
      error instanceof DuplicateBetError ||
      error instanceof BetOutsideBettingPhaseError ||
      error instanceof CashOutOutsideRunningPhaseError ||
      error instanceof NoActiveBetError ||
      error instanceof BetNotCashableError ||
      error instanceof InvalidRoundTransitionError
    ) {
      return HttpStatus.CONFLICT;
    }

    if (error instanceof NoActiveRoundError) {
      return HttpStatus.SERVICE_UNAVAILABLE;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
