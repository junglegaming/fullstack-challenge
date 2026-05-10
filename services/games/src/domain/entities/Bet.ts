import { BetProps } from "../repositories/IBetRepository";
import { Multiplier } from "../value-objects/Multiplier";

export class Bet {
  private props: BetProps;

  constructor(props: BetProps) {
    this.props = props;
  }

  cashout(multiplier: Multiplier) {
    if (this.props.status !== "PENDING") {
      throw new Error("Aposta já foi finalizada ou não está pendente");
    }

    this.props.status = "WON";
    this.props.multiplierAtCashout = multiplier.toDecimal();
  }

  markAsLost() {
    if (this.props.status !== "PENDING") {
      return;
    }
    this.props.status = "LOST";
  }

  toJSON() {
    return {
      ...this.props,
    };
  }
}
