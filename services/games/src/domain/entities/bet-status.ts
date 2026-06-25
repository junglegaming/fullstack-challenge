export const BetStatus = {

  PENDING: "PENDING",

  ACTIVE: "ACTIVE",

  REJECTED: "REJECTED",

  CASHED_OUT: "CASHED_OUT",

  LOST: "LOST",
} as const;

export type BetStatus = (typeof BetStatus)[keyof typeof BetStatus];
