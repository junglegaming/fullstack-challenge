import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { HandleWalletCreditFailedUseCase } from "../../application/use-cases/handle-wallet-credit-failed.use-case";
import { HandleWalletCreditSucceededUseCase } from "../../application/use-cases/handle-wallet-credit-succeeded.use-case";
import {
  WALLET_CREDIT_FAILED,
  WALLET_CREDIT_SUCCEEDED,
  type WalletCreditFailedEnvelope,
  type WalletCreditSucceededEnvelope,
} from "../../application/messaging/wallet-events";

@Controller()
export class WalletCreditResultConsumer {
  constructor(
    private readonly handleWalletCreditSucceededUseCase: HandleWalletCreditSucceededUseCase,
    private readonly handleWalletCreditFailedUseCase: HandleWalletCreditFailedUseCase,
  ) {}

  @EventPattern(WALLET_CREDIT_SUCCEEDED)
  async handleCreditSucceeded(
    @Payload() envelope: WalletCreditSucceededEnvelope,
  ): Promise<void> {
    try {
      await this.handleWalletCreditSucceededUseCase.execute(envelope);
    } catch (error) {
      console.error("Failed to handle wallet.credit.succeeded", error);
      throw error;
    }
  }

  @EventPattern(WALLET_CREDIT_FAILED)
  async handleCreditFailed(
    @Payload() envelope: WalletCreditFailedEnvelope,
  ): Promise<void> {
    try {
      await this.handleWalletCreditFailedUseCase.execute(envelope);
    } catch (error) {
      console.error("Failed to handle wallet.credit.failed", error);
      throw error;
    }
  }
}
