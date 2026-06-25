import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GameConfig {
  constructor(private readonly config: ConfigService) {}

  private num(key: string, fallback: number): number {
    const raw = this.config.get<string>(key);
    if (raw === undefined || raw === "") {
      return fallback;
    }
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  }

  get bettingDurationMs(): number {
    return this.num("BETTING_DURATION_MS", 8000);
  }

  get cooldownMs(): number {
    return this.num("COOLDOWN_MS", 4000);
  }

  get tickIntervalMs(): number {
    return this.num("TICK_INTERVAL_MS", 100);
  }

  get growthRatePerMs(): number {
    return this.num("GROWTH_RATE_PER_MS", 0.00007);
  }

  get houseEdge(): number {
    return this.num("HOUSE_EDGE", 0.01);
  }

  get maxMultiplierHundredths(): number {
    return this.num("MAX_MULTIPLIER_HUNDREDTHS", 100_000_000);
  }

  get minBetCents(): bigint {
    return BigInt(this.num("MIN_BET_CENTS", 100));
  }

  get maxBetCents(): bigint {
    return BigInt(this.num("MAX_BET_CENTS", 100_000));
  }

  get seedChainLength(): number {
    return this.num("SEED_CHAIN_LENGTH", 10_000);
  }
}
