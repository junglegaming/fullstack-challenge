import { BetNotAllowedError } from "../errors/bet-not-allowed.error";
import { BetNotFoundError } from "../errors/bet-not-found.error";
import { CashOutNotAllowedError } from "../errors/cash-out-not-allowed.error";
import { DuplicateBetError } from "../errors/duplicate-bet.error";
import { RoundNotFinishedError } from "../errors/round-not-finished.error";
import { InvalidRoundTransitionError } from "../errors/invalid-round-transition.error";
import { InvalidServerSeedError } from "../errors/invalid-server-seed.error";
import {
  calculateGainedBasisPoints,
  type MultiplierGrowthConfig,
} from "../services/multiplier-growth";
import { ProvablyFairService, RoundVerificationData } from "../services/provably-fair.service";
import { Bet } from "./bet";
import { BetId } from "../value-objects/bet-id";
import { BetStatus, RoundStatus } from "../value-objects/round-status";
import { Money } from "../value-objects/money";
import { Multiplier } from "../value-objects/multiplier";
import { PlayerId } from "../value-objects/player-id";
import { RoundId } from "../value-objects/round-id";

type RoundProps = {
  id: RoundId;
  status: RoundStatus;
  serverSeedHash: string;
  serverSeed: string | null;
  hiddenServerSeed: string | null;
  clientSeed: string;
  nonce: number;
  crashPoint: Multiplier;
  bettingStartedAt: Date;
  bettingEndsAt: Date;
  startedAt: Date | null;
  crashedAt: Date | null;
  settledAt: Date | null;
  bets: Bet[];
};

const ROUND_TRANSITIONS: Record<RoundStatus, RoundStatus[]> = {
  [RoundStatus.BETTING]: [RoundStatus.RUNNING],
  [RoundStatus.RUNNING]: [RoundStatus.CRASHED],
  [RoundStatus.CRASHED]: [RoundStatus.SETTLED],
  [RoundStatus.SETTLED]: [],
};

const DEFAULT_MULTIPLIER_GROWTH_BPS_PER_SECOND = 100;

export class Round {
  private constructor(private props: RoundProps) {}

  static create(input: {
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
    crashPoint: Multiplier;
    bettingStartedAt: Date;
    bettingEndsAt: Date;
  }): Round {
    return new Round({
      id: RoundId.generate(),
      status: RoundStatus.BETTING,
      serverSeedHash: input.serverSeedHash,
      serverSeed: null,
      hiddenServerSeed: null,
      clientSeed: input.clientSeed,
      nonce: input.nonce,
      crashPoint: input.crashPoint,
      bettingStartedAt: input.bettingStartedAt,
      bettingEndsAt: input.bettingEndsAt,
      startedAt: null,
      crashedAt: null,
      settledAt: null,
      bets: [],
    });
  }

  static createProvablyFair(input: {
    provablyFairService: ProvablyFairService;
    clientSeed: string;
    nonce: number;
    bettingStartedAt: Date;
    bettingEndsAt: Date;
    serverSeed?: string;
  }): Round {
    const serverSeed =
      input.serverSeed ?? input.provablyFairService.generateServerSeed();
    const serverSeedHash = input.provablyFairService.hashServerSeed(serverSeed);
    const crashPoint = input.provablyFairService.calculateCrashPoint({
      serverSeed,
      clientSeed: input.clientSeed,
      nonce: input.nonce,
    });

    return new Round({
      id: RoundId.generate(),
      status: RoundStatus.BETTING,
      serverSeedHash,
      serverSeed: null,
      hiddenServerSeed: serverSeed,
      clientSeed: input.clientSeed,
      nonce: input.nonce,
      crashPoint,
      bettingStartedAt: input.bettingStartedAt,
      bettingEndsAt: input.bettingEndsAt,
      startedAt: null,
      crashedAt: null,
      settledAt: null,
      bets: [],
    });
  }

  static reconstitute(props: RoundProps): Round {
    return new Round(props);
  }

  placeBet(input: {
    playerId: PlayerId;
    amount: Money;
    idempotencyKey: string;
    now: Date;
  }): Bet {
    if (this.props.status !== RoundStatus.BETTING) {
      throw new BetNotAllowedError("Bets are only accepted while round is in BETTING status");
    }

    if (input.now.getTime() >= this.props.bettingEndsAt.getTime()) {
      throw new BetNotAllowedError("Betting window has closed");
    }

    if (this.hasBetForPlayer(input.playerId)) {
      throw new DuplicateBetError(input.playerId.toString());
    }

    const bet = Bet.createPending({
      roundId: this.id,
      playerId: input.playerId,
      amount: input.amount,
      idempotencyKey: input.idempotencyKey,
    });

    this.props.bets.push(bet);

    return bet;
  }

  confirmBetPlaced(betId: BetId): Bet {
    const bet = this.findBetById(betId);
    bet.markPlaced();
    return bet;
  }

  rejectBet(betId: BetId): Bet {
    const bet = this.findBetById(betId);
    bet.markRejected();
    return bet;
  }

  start(now: Date): void {
    this.transitionTo(RoundStatus.RUNNING);
    this.props.startedAt = now;
  }

  cashOut(input: {
    playerId: PlayerId;
    currentMultiplier: Multiplier;
    payoutCreditIdempotencyKey: string;
  }): Bet {
    if (this.props.status !== RoundStatus.RUNNING) {
      throw new CashOutNotAllowedError("Cash out is only allowed while round is RUNNING");
    }

    if (input.currentMultiplier.isGreaterThan(this.props.crashPoint)) {
      throw new CashOutNotAllowedError(
        "Current multiplier exceeds crash point for this round",
      );
    }

    const bet = this.findBetByPlayer(input.playerId);

    if (!bet) {
      throw new BetNotFoundError(input.playerId.toString());
    }

    if (!bet.isPlaced()) {
      throw new CashOutNotAllowedError("Only placed bets can be cashed out");
    }

    bet.cashOut(input.currentMultiplier, input.payoutCreditIdempotencyKey);

    return bet;
  }

  confirmPayoutSettled(betId: BetId): Bet {
    const bet = this.findBetById(betId);
    bet.markPayoutSettled();
    return bet;
  }

  markPayoutSettlementFailed(betId: BetId, reason: string): Bet {
    const bet = this.findBetById(betId);
    bet.markPayoutSettlementFailed(reason);
    return bet;
  }

  crash(now: Date): void {
    this.transitionTo(RoundStatus.CRASHED);
    this.props.crashedAt = now;
    this.revealHiddenServerSeed();

    for (const bet of this.props.bets) {
      if (bet.isPlaced()) {
        bet.markLost();
      }
    }
  }

  settle(now: Date): void {
    this.transitionTo(RoundStatus.SETTLED);
    this.props.settledAt = now;
  }

  getCurrentMultiplier(
    now: Date,
    input?: { growthConfig?: MultiplierGrowthConfig },
  ): Multiplier {
    if (
      this.props.status === RoundStatus.CRASHED ||
      this.props.status === RoundStatus.SETTLED
    ) {
      return this.props.crashPoint;
    }

    if (!this.props.startedAt || this.props.status === RoundStatus.BETTING) {
      return Multiplier.one();
    }

    const growthConfig = input?.growthConfig ?? {
      growthBasisPointsPerSecond: DEFAULT_MULTIPLIER_GROWTH_BPS_PER_SECOND,
    };
    const elapsedMs = Math.max(
      0,
      now.getTime() - this.props.startedAt.getTime(),
    );
    const gainedBasisPoints = calculateGainedBasisPoints(elapsedMs, growthConfig);
    const currentBasisPoints = 100 + gainedBasisPoints;

    if (currentBasisPoints > this.props.crashPoint.valueInBasisPoints) {
      return this.props.crashPoint;
    }

    return Multiplier.fromBasisPoints(currentBasisPoints);
  }

  revealServerSeed(serverSeed: string, provablyFairService: ProvablyFairService): void {
    if (provablyFairService.hashServerSeed(serverSeed) !== this.props.serverSeedHash) {
      throw new InvalidServerSeedError();
    }

    this.props.serverSeed = serverSeed;
  }

  toVerificationData(
    provablyFairService: ProvablyFairService,
  ): Omit<RoundVerificationData, "isValid"> {
    if (
      this.props.status !== RoundStatus.CRASHED &&
      this.props.status !== RoundStatus.SETTLED
    ) {
      throw new RoundNotFinishedError();
    }

    const serverSeed = this.requireRevealedServerSeed();
    const crashPoint = provablyFairService.calculateCrashPoint({
      serverSeed,
      clientSeed: this.props.clientSeed,
      nonce: this.props.nonce,
    });

    return {
      serverSeed,
      serverSeedHash: this.props.serverSeedHash,
      clientSeed: this.props.clientSeed,
      nonce: this.props.nonce,
      algorithm: provablyFairService.algorithm,
      crashPoint,
    };
  }

  isServerSeedRevealed(): boolean {
    return this.props.serverSeed !== null;
  }

  get id(): RoundId {
    return this.props.id;
  }

  get status(): RoundStatus {
    return this.props.status;
  }

  get serverSeedHash(): string {
    return this.props.serverSeedHash;
  }

  get serverSeed(): string | null {
    return this.props.serverSeed;
  }

  get clientSeed(): string {
    return this.props.clientSeed;
  }

  get nonce(): number {
    return this.props.nonce;
  }

  get crashPoint(): Multiplier {
    return this.props.crashPoint;
  }

  get bettingStartedAt(): Date {
    return this.props.bettingStartedAt;
  }

  get bettingEndsAt(): Date {
    return this.props.bettingEndsAt;
  }

  get startedAt(): Date | null {
    return this.props.startedAt;
  }

  get crashedAt(): Date | null {
    return this.props.crashedAt;
  }

  get settledAt(): Date | null {
    return this.props.settledAt;
  }

  get bets(): readonly Bet[] {
    return this.props.bets;
  }

  getStoredServerSeed(): string | null {
    return this.props.serverSeed ?? this.props.hiddenServerSeed;
  }

  getBetById(betId: BetId): Bet | null {
    return this.props.bets.find((item) => item.id.equals(betId)) ?? null;
  }

  private revealHiddenServerSeed(): void {
    if (this.props.hiddenServerSeed) {
      this.props.serverSeed = this.props.hiddenServerSeed;
    }
  }

  private requireRevealedServerSeed(): string {
    if (!this.props.serverSeed) {
      throw new Error("Server seed is not revealed yet");
    }

    return this.props.serverSeed;
  }

  private transitionTo(target: RoundStatus): void {
    const allowedTargets = ROUND_TRANSITIONS[this.props.status];

    if (!allowedTargets.includes(target)) {
      throw new InvalidRoundTransitionError(this.props.status, target);
    }

    this.props.status = target;
  }

  private hasBetForPlayer(playerId: PlayerId): boolean {
    return this.props.bets.some((bet) => bet.playerId.equals(playerId));
  }

  private findBetByPlayer(playerId: PlayerId): Bet | null {
    return this.props.bets.find((bet) => bet.playerId.equals(playerId)) ?? null;
  }

  private findBetById(betId: BetId): Bet {
    const bet = this.props.bets.find((item) => item.id.equals(betId));

    if (!bet) {
      throw new Error(`Bet ${betId.toString()} not found in round`);
    }

    return bet;
  }
}
