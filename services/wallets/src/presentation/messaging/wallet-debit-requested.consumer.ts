import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import {
  WALLET_DEBIT_REQUESTED,
  type WalletDebitRequestedEnvelope,
} from "../../application/messaging/wallet-events";
import { HandleWalletDebitRequestedUseCase } from "../../application/use-cases/handle-wallet-debit-requested.use-case";

@Controller()
export class WalletDebitRequestedConsumer {
  constructor(
    private readonly handleWalletDebitRequestedUseCase: HandleWalletDebitRequestedUseCase,
  ) {}

  @EventPattern(WALLET_DEBIT_REQUESTED)
  async handleDebitRequested(
    @Payload() envelope: WalletDebitRequestedEnvelope,
  ): Promise<void> {
    await this.handleWalletDebitRequestedUseCase.execute(envelope);
  }
}
