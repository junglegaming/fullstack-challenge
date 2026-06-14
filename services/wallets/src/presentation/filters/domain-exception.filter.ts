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
      case "WALLET_ALREADY_EXISTS":
        return HttpStatus.CONFLICT;
      case "WALLET_NOT_FOUND":
        return HttpStatus.NOT_FOUND;
      case "INVALID_MONEY_AMOUNT":
        return HttpStatus.BAD_REQUEST;
      default:
        return HttpStatus.UNPROCESSABLE_ENTITY;
    }
  }
}
