import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import type { WalletEventPublisher } from "../../application/ports/wallet-event.publisher";
import {
  WALLET_DEBIT_FAILED,
  WALLET_DEBIT_SUCCEEDED,
  type WalletDebitFailedEnvelope,
  type WalletDebitSucceededEnvelope,
} from "../../application/messaging/wallet-events";
import { GAMES_RMQ_CLIENT } from "./rabbitmq.constants";

@Injectable()
export class RabbitMqWalletEventPublisher implements WalletEventPublisher {
  constructor(
    @Inject(GAMES_RMQ_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  async publishDebitSucceeded(envelope: WalletDebitSucceededEnvelope): Promise<void> {
    await firstValueFrom(this.client.emit(WALLET_DEBIT_SUCCEEDED, envelope));
  }

  async publishDebitFailed(envelope: WalletDebitFailedEnvelope): Promise<void> {
    await firstValueFrom(this.client.emit(WALLET_DEBIT_FAILED, envelope));
  }
}
