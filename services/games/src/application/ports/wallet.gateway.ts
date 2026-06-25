export const WALLET_GATEWAY = Symbol("WALLET_GATEWAY");

export interface DebitRequest {
  betId: string;
  roundId: string;
  playerId: string;
  amountCents: string;
}

export interface CreditRequest {
  betId: string;
  roundId: string;
  playerId: string;
  amountCents: string;
}

export interface WalletGateway {
  requestDebit(request: DebitRequest): void;
  requestCredit(request: CreditRequest): void;
}
