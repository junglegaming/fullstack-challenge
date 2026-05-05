import { BetPlacedDto } from '../../presentation/dtos/bet-placed.dto';
import { BetCashedOutDto } from '../../presentation/dtos/bet-cashed-out.dto';

export interface IWebSocketEmitter {
  broadcastBetPlaced(dto: BetPlacedDto): void;
  broadcastBetCashedOut(dto: BetCashedOutDto): void;
}
