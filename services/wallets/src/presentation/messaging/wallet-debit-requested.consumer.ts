import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import {
  WALLET_CREDIT_REQUESTED,
  WALLET_DEBIT_REQUESTED,
  type WalletCreditRequestedEnvelope,
  type WalletDebitRequestedEnvelope,
} from "../../application/messaging/wallet-events";
import { HandleWalletCreditRequestedUseCase } from "../../application/use-cases/handle-wallet-credit-requested.use-case";
import { HandleWalletDebitRequestedUseCase } from "../../application/use-cases/handle-wallet-debit-requested.use-case";

@Controller()
export class WalletDebitRequestedConsumer {
  constructor(
    private readonly handleWalletDebitRequestedUseCase: HandleWalletDebitRequestedUseCase,
    private readonly handleWalletCreditRequestedUseCase: HandleWalletCreditRequestedUseCase,
  ) {}

  @EventPattern(WALLET_DEBIT_REQUESTED)
  async handleDebitRequested(
    @Payload() envelope: WalletDebitRequestedEnvelope,
  ): Promise<void> {
    await this.handleWalletDebitRequestedUseCase.execute(envelope);
  }

  @EventPattern(WALLET_CREDIT_REQUESTED)
  async handleCreditRequested(
    @Payload() envelope: WalletCreditRequestedEnvelope,
  ): Promise<void> {
    await this.handleWalletCreditRequestedUseCase.execute(envelope);
  }
}
