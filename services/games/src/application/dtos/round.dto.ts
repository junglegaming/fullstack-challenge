export interface StartRoundUseCaseDTO {
  userId: string;
  clientSeed: string;
}

export interface RoundResponseDTO {
  id: string;
  userId: string;
  status: "BETTING" | "RUNNING" | "CRASHED";
  crashPoint: number;
  startTime: Date;
}

export interface GetRoundStatisticsUseCaseDTO {
  userId: string;
}