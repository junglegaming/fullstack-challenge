import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { randomBytes } from "node:crypto";
import { DataSource } from "typeorm";
import { GameConfig } from "../../application/game-config";
import type {
  SeedChainProvider,
  SeedForNonce,
} from "../../application/ports/seed-chain.provider";
import { sha256Hex } from "../../domain/services/provably-fair";
import { SeedChainEntryOrmEntity } from "./seed-chain-entry.orm-entity";

@Injectable()
export class SeedChainTypeOrmProvider implements SeedChainProvider {
  private readonly logger = new Logger(SeedChainTypeOrmProvider.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: GameConfig,
  ) {}

  async ensureInitialized(): Promise<void> {
    await this.ensureSegmentForNonce(0);
  }

  async getSeedForNonce(nonce: number): Promise<SeedForNonce> {
    const repo = this.dataSource.getRepository(SeedChainEntryOrmEntity);
    let entry = await repo.findOne({ where: { nonce } });
    if (!entry) {
      await this.ensureSegmentForNonce(nonce);
      entry = await repo.findOneByOrFail({ nonce });
    }
    return {
      serverSeed: entry.serverSeed,
      serverSeedHash: entry.serverSeedHash,
    };
  }

  private async ensureSegmentForNonce(nonce: number): Promise<void> {
    const length = this.config.seedChainLength;

    const blockStart = Math.floor(nonce / length) * length;

    const repo = this.dataSource.getRepository(SeedChainEntryOrmEntity);

    const existing = await repo.findOne({ where: { nonce: blockStart } });
    if (existing) {
      return;
    }

    const rows = this.generateSegment(blockStart, length);

    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(SeedChainEntryOrmEntity)
      .values(rows)
      .orIgnore()
      .execute();
    this.logger.log(
      `Generated provably-fair seed segment [${blockStart}, ${blockStart + length})`,
    );
  }

  private generateSegment(
    blockStart: number,
    length: number,
  ): SeedChainEntryOrmEntity[] {
    const chain = new Array<string>(length);

    chain[length - 1] = randomBytes(32).toString("hex");

    for (let i = length - 2; i >= 0; i--) {
      chain[i] = sha256Hex(chain[i + 1]);
    }
    return chain.map((serverSeed, i) => {
      const row = new SeedChainEntryOrmEntity();
      row.nonce = blockStart + i;
      row.serverSeed = serverSeed;
      row.serverSeedHash = sha256Hex(serverSeed);
      return row;
    });
  }
}
