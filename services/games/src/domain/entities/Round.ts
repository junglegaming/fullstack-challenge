import type { RoundProps } from "../repositories/IRoundRepository";
import { CrashSeed } from "../value-objects/CrashSeed";
import { Multiplier } from "../value-objects/Multiplier";
import { Bet } from "./Bet";
import { ProvablyFair } from "./ProvablyFair";

export class Round {
  private props: RoundProps;
  private seed: CrashSeed;

  constructor(props: RoundProps, seed: CrashSeed) {
    this.props = props;
    this.seed = seed;
  }

  static create(clientSeed: string, nonce: number): Round {
    const seed = ProvablyFair.createSeed(clientSeed, nonce);
    const crashPoint = ProvablyFair.calculateCrashPoint(seed);

    const props: RoundProps = {
      id: crypto.randomUUID(),
      status: "BETTING",
      crashPoint,
      startTime: new Date(),
      endTime: null,
      serverSeed: seed.serverSeed,
      serverSeedHash: seed.serverSeedHash,
      clientSeed: seed.clientSeed,
      nonce: seed.nonce,
    };

    return new Round(props, seed);
  }

  static reconstitute(props: RoundProps): Round {
    const seed = CrashSeed.create({
      serverSeed: props.serverSeed,
      serverSeedHash: props.serverSeedHash,
      clientSeed: props.clientSeed,
      nonce: props.nonce,
    });
    return new Round(props, seed);
  }

  canAcceptBets(): boolean {
    return this.props.status === "BETTING";
  }

  startRound() {
    if (!this.canAcceptBets()) {
      throw new Error(
        "A rodada só pode começar se estiver na fase de apostas (BETTING)",
      );
    }
    this.props.startTime = new Date();
    this.props.status = "RUNNING";
  }

  crash() {
    if (this.props.status !== "RUNNING") {
      throw new Error("A rodada não está ativa para sofrer crash");
    }
    this.props.status = "CRASHED";
    this.props.endTime = new Date();
  }

  settle(bets: Bet[]) {
    if (this.props.status !== "CRASHED") {
      throw new Error(
        "A rodada deve estar em estado CRASHED para ser liquidada",
      );
    }
    bets.forEach((bet) => bet.markAsLost());
  }

  get crashPoint(): number {
    return this.props.crashPoint!;
  }
  get status(): string {
    return this.props.status;
  }
  get id(): string {
    return this.props.id;
  }

  getTotalUserBetsAmount(): bigint {
    return 0n;
  }

  getPublicSeedInfo() {
    return this.seed.toPublicJSON();
  }

  revealSeed() {
    if (this.props.status !== "CRASHED") {
      throw new Error("O serverSeed só pode ser revelado após o crash");
    }
    return this.seed.reveal();
  }

  getCurrentMultiplier(): Multiplier {
    if (this.props.status !== "RUNNING") {
      throw new Error("A rodada não está em andamento");
    }

    const now = new Date();
    const elapsedMs = now.getTime() - this.props.startTime.getTime();

    const value = Math.pow(Math.E, 0.00006 * elapsedMs);

    const finalValue = Math.min(value, this.props.crashPoint);

    return Multiplier.fromValue(finalValue);
  }

  toPersistence() {
    return {
      ...this.props,
    };
  }

  toPublicJSON() {
    return {
      ...this.props,
      serverSeed: undefined,
    };
  }
}