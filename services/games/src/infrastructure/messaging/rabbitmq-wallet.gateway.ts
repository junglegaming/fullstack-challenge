import { Injectable } from "@nestjs/common";
import type {
  CreditRequest,
  DebitRequest,
  WalletGateway,
} from "../../application/ports/wallet.gateway";
import { AmqpService } from "./amqp.service";
import { RoutingKeys } from "./contracts";
import type {
  CreditRequestedEvent,
  DebitRequestedEvent,
} from "./contracts";

@Injectable()
export class RabbitMqWalletGateway implements WalletGateway {
  constructor(private readonly amqp: AmqpService) {}

  requestDebit(request: DebitRequest): void {
    const event: DebitRequestedEvent = { ...request };
    this.amqp.publish(RoutingKeys.DebitRequested, event);
  }

  requestCredit(request: CreditRequest): void {
    const event: CreditRequestedEvent = { ...request };
    this.amqp.publish(RoutingKeys.CreditRequested, event);
  }
}
