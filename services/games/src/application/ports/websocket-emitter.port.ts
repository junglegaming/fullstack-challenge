import { BetPlacedDto } from '../../presentation/dtos/bet-placed.dto';
import { BetCashedOutDto } from '../../presentation/dtos/bet-cashed-out.dto';
import { RoundStartedDto } from '../../presentation/dtos/round-started.dto';
import { MultiplierUpdateDto } from '../../presentation/dtos/multiplier-update.dto';
import { RoundCrashedDto } from '../../presentation/dtos/round-crashed.dto';

export interface IWebSocketEmitter {
  broadcastRoundStarted(dto: RoundStartedDto): void;
  broadcastMultiplierUpdate(dto: MultiplierUpdateDto): void;
  broadcastRoundCrashed(dto: RoundCrashedDto): void;
  broadcastBetPlaced(dto: BetPlacedDto): void;
  broadcastBetCashedOut(dto: BetCashedOutDto): void;
}
