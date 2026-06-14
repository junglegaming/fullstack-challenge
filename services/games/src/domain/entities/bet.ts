import { MAX_BET_CENTS, MIN_BET_CENTS } from "../constants/bet-limits";
import { InvalidBetAmountError } from "../errors/invalid-bet-amount.error";
import { InvalidBetTransitionError } from "../errors/invalid-bet-transition.error";
import { BetId } from "../value-objects/bet-id";
import { BetStatus } from "../value-objects/round-status";
import { Money } from "../value-objects/money";
import { Multiplier } from "../value-objects/multiplier";
import { PlayerId } from "../value-objects/player-id";
import { RoundId } from "../value-objects/round-id";

type BetProps = {
  id: BetId;
  roundId: RoundId;
  playerId: PlayerId;
  amount: Money;
  status: BetStatus;
  idempotencyKey: string;
  cashOutMultiplier: Multiplier | null;
  payout: Money | null;
};

export class Bet {
  private constructor(private props: BetProps) {}

  static createPending(input: {
    roundId: RoundId;
    playerId: PlayerId;
    amount: Money;
    idempotencyKey: string;
  }): Bet {
    Bet.validateAmount(input.amount);

    const idempotencyKey = input.idempotencyKey.trim();

    if (!idempotencyKey) {
      throw new Error("Bet idempotency key cannot be empty");
    }

    return new Bet({
      id: BetId.generate(),
      roundId: input.roundId,
      playerId: input.playerId,
      amount: input.amount,
      status: BetStatus.PENDING_DEBIT,
      idempotencyKey,
      cashOutMultiplier: null,
      payout: null,
    });
  }

  static reconstitute(props: BetProps): Bet {
    return new Bet(props);
  }

  static validateAmount(amount: Money): void {
    if (
      amount.amountInCents < MIN_BET_CENTS ||
      amount.amountInCents > MAX_BET_CENTS
    ) {
      throw new InvalidBetAmountError();
    }
  }

  markPlaced(): void {
    this.transitionTo(BetStatus.PLACED, [BetStatus.PENDING_DEBIT]);
  }

  markRejected(): void {
    this.transitionTo(BetStatus.REJECTED, [BetStatus.PENDING_DEBIT]);
  }

  cashOut(multiplier: Multiplier): void {
    this.transitionTo(BetStatus.CASHED_OUT, [BetStatus.PLACED]);

    this.props.cashOutMultiplier = multiplier;
    this.props.payout = multiplier.calculatePayout(this.props.amount);
  }

  markLost(): void {
    this.transitionTo(BetStatus.LOST, [BetStatus.PLACED]);
    this.props.cashOutMultiplier = null;
    this.props.payout = null;
  }

  isPlaced(): boolean {
    return this.props.status === BetStatus.PLACED;
  }

  isCashedOut(): boolean {
    return this.props.status === BetStatus.CASHED_OUT;
  }

  isLost(): boolean {
    return this.props.status === BetStatus.LOST;
  }

  get id(): BetId {
    return this.props.id;
  }

  get roundId(): RoundId {
    return this.props.roundId;
  }

  get playerId(): PlayerId {
    return this.props.playerId;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get status(): BetStatus {
    return this.props.status;
  }

  get idempotencyKey(): string {
    return this.props.idempotencyKey;
  }

  get cashOutMultiplier(): Multiplier | null {
    return this.props.cashOutMultiplier;
  }

  get payout(): Money | null {
    return this.props.payout;
  }

  private transitionTo(target: BetStatus, allowedSources: BetStatus[]): void {
    if (!allowedSources.includes(this.props.status)) {
      throw new InvalidBetTransitionError(this.props.status, target);
    }

    this.props.status = target;
  }
}
