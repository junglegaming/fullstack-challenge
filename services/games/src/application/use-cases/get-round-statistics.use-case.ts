import { Injectable } from "@nestjs/common";
import { IBetRepository } from "@/domain/repositories/IBetRepository";
import { RoundStatistics } from "@/domain/value-objects/RoundStatistics";
import { GetRoundStatisticsUseCaseDTO } from "../dtos/round.dto";

@Injectable()
export class GetRoundStatisticsUseCase {
  constructor(private readonly betRepository: IBetRepository) {}

  async execute(dto: GetRoundStatisticsUseCaseDTO): Promise<RoundStatistics> {
    const valueBetsUser = await this.betRepository.findUserBetsId(dto.userId);


    return RoundStatistics.create(valueBetsUser);
  }
}
