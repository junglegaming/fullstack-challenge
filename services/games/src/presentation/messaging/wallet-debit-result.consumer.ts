import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { HandleWalletDebitFailedUseCase } from "../../application/use-cases/handle-wallet-debit-failed.use-case";
import { HandleWalletDebitSucceededUseCase } from "../../application/use-cases/handle-wallet-debit-succeeded.use-case";
import {
  WALLET_DEBIT_FAILED,
  WALLET_DEBIT_SUCCEEDED,
  type WalletDebitFailedEnvelope,
  type WalletDebitSucceededEnvelope,
} from "../../application/messaging/wallet-events";

@Controller()
export class WalletDebitResultConsumer {
  constructor(
    private readonly handleWalletDebitSucceededUseCase: HandleWalletDebitSucceededUseCase,
    private readonly handleWalletDebitFailedUseCase: HandleWalletDebitFailedUseCase,
  ) {}

  @EventPattern(WALLET_DEBIT_SUCCEEDED)
  async handleDebitSucceeded(
    @Payload() envelope: WalletDebitSucceededEnvelope,
  ): Promise<void> {
    await this.handleWalletDebitSucceededUseCase.execute(envelope);
  }

  @EventPattern(WALLET_DEBIT_FAILED)
  async handleDebitFailed(
    @Payload() envelope: WalletDebitFailedEnvelope,
  ): Promise<void> {
    await this.handleWalletDebitFailedUseCase.execute(envelope);
  }
}
