import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import type { WalletCommandPublisher } from "../../application/ports/wallet-command.publisher";
import {
  WALLET_DEBIT_REQUESTED,
  type WalletDebitRequestedEnvelope,
} from "../../application/messaging/wallet-events";
import { WALLET_RMQ_CLIENT } from "./rabbitmq.constants";

@Injectable()
export class RabbitMqWalletCommandPublisher implements WalletCommandPublisher {
  constructor(
    @Inject(WALLET_RMQ_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  async publishDebitRequested(envelope: WalletDebitRequestedEnvelope): Promise<void> {
    await firstValueFrom(this.client.emit(WALLET_DEBIT_REQUESTED, envelope));
  }
}
