export const RoundStatus = {

  BETTING: "BETTING",

  RUNNING: "RUNNING",

  CRASHED: "CRASHED",
} as const;

export type RoundStatus = (typeof RoundStatus)[keyof typeof RoundStatus];
