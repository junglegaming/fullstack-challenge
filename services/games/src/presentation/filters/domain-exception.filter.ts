import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { DomainError } from "../../domain/errors/domain.error";

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = this.resolveStatus(exception);

    response.status(status).json({
      statusCode: status,
      code: exception.code,
      message: exception.message,
    });
  }

  private resolveStatus(exception: DomainError): number {
    switch (exception.code) {
      case "DUPLICATE_BET":
      case "BET_NOT_ALLOWED":
      case "CASH_OUT_NOT_ALLOWED":
        return HttpStatus.CONFLICT;
      case "BET_NOT_FOUND":
      case "ROUND_NOT_FINISHED":
        return HttpStatus.NOT_FOUND;
      case "INVALID_BET_AMOUNT":
      case "INVALID_MONEY_AMOUNT":
        return HttpStatus.BAD_REQUEST;
      default:
        return HttpStatus.UNPROCESSABLE_ENTITY;
    }
  }
}
