import { Injectable } from "@nestjs/common";
import { LedgerTransactionType } from "@prisma/client";
import {
  ApplyWalletMutationInput,
  ApplyWalletMutationResult,
  WalletRepository,
} from "../../../../application/ports/wallet.repository";
import { ProcessedMessage } from "../../../../domain/entities/processed-message";
import { Wallet } from "../../../../domain/entities/wallet";
import { WalletNotFoundError } from "../../../../domain/errors/wallet-not-found.error";
import { PlayerId } from "../../../../domain/value-objects/player-id";
import { WalletTransactionType } from "../../../../domain/value-objects/wallet-transaction-type";
import { ProcessedMessageMapper } from "../mappers/processed-message.mapper";
import { WalletMapper } from "../mappers/wallet.mapper";
import { WalletTransactionMapper } from "../mappers/wallet-transaction.mapper";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaWalletRepository implements WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPlayerId(playerId: PlayerId): Promise<Wallet | null> {
    const record = await this.prisma.wallet.findUnique({
      where: { playerId: playerId.toString() },
    });

    if (!record) {
      return null;
    }

    return WalletMapper.toDomain(record);
  }

  async save(wallet: Wallet): Promise<void> {
    const data = WalletMapper.toPersistence(wallet);

    await this.prisma.$transaction(async (tx) => {
      await tx.wallet.create({
        data: {
          id: data.id,
          playerId: data.playerId,
          balanceCents: data.balanceCents,
        },
      });

      if (wallet.balance.amountInCents > 0n) {
        await tx.ledgerTransaction.create({
          data: {
            walletId: data.id,
            idempotencyKey: `wallet-init-${data.id}`,
            type: LedgerTransactionType.CREDIT,
            amountCents: wallet.balance.amountInCents,
            balanceAfterCents: wallet.balance.amountInCents,
          },
        });
      }
    });
  }

  async applyMutation(input: ApplyWalletMutationInput): Promise<ApplyWalletMutationResult> {
    const replay = await this.findReplayResult(input.idempotencyKey);

    if (replay) {
      return replay;
    }

    const walletRecord = await this.prisma.wallet.findUnique({
      where: { playerId: input.playerId.toString() },
    });

    if (!walletRecord) {
      throw new WalletNotFoundError(input.playerId.toString());
    }

    const wallet = WalletMapper.toDomain(walletRecord);
    const mutation = this.mutateWallet(wallet, input);

    const transactionData = WalletTransactionMapper.toPersistence(mutation.transaction);
    const processedMessage = ProcessedMessage.create({
      idempotencyKey: input.idempotencyKey,
      messageType: input.messageType,
      walletTransactionId: mutation.transaction.id,
    });
    const processedData = ProcessedMessageMapper.toPersistence(processedMessage);

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: wallet.id.toString() },
          data: { balanceCents: mutation.wallet.balance.amountInCents },
        });

        await tx.ledgerTransaction.create({ data: transactionData });
        await tx.processedMessage.create({ data: processedData });
      });
    } catch {
      const concurrentReplay = await this.findReplayResult(input.idempotencyKey);

      if (concurrentReplay) {
        return concurrentReplay;
      }

      throw new Error("Failed to apply wallet mutation");
    }

    return {
      wallet: mutation.wallet,
      transaction: mutation.transaction,
      isReplay: false,
    };
  }

  private mutateWallet(
    wallet: Wallet,
    input: ApplyWalletMutationInput,
  ): { wallet: Wallet; transaction: ReturnType<Wallet["credit"]>["transaction"] } {
    if (input.type === WalletTransactionType.CREDIT) {
      return wallet.credit(input.amount, input.idempotencyKey);
    }

    return wallet.debit(input.amount, input.idempotencyKey);
  }

  private async findReplayResult(
    idempotencyKey: string,
  ): Promise<ApplyWalletMutationResult | null> {
    const processedMessage = await this.prisma.processedMessage.findUnique({
      where: { idempotencyKey },
      include: {
        ledgerTransaction: {
          include: { wallet: true },
        },
      },
    });

    if (!processedMessage) {
      return null;
    }

    return {
      wallet: WalletMapper.toDomain(processedMessage.ledgerTransaction.wallet),
      transaction: WalletTransactionMapper.toDomain(processedMessage.ledgerTransaction),
      isReplay: true,
    };
  }
}
