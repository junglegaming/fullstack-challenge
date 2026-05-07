import { GameGateway } from "../presentation/getways/game.gateway"
import { Round } from "../domain/entities/round.entity"

export class GameEngine {
  private currentRound: Round | null = null
  private currentMultiplier = 1

  constructor(
    
    private gateway: GameGateway
  ) {}
  start() {
    this.startBettingPhase()
  }

  private startBettingPhase() {
    console.log('🟡 Betting phase started')

    const crashPoint = this.generateCrashPoint()

    this.currentRound = new Round(
      crypto.randomUUID(),
      crashPoint,
    )

    this.gateway?.emitRoundStarted(this.currentRound.id)

    setTimeout(() => {
      this.startRound()
    }, 10000)
  }

  private startRound() {
    if (!this.currentRound) return

    console.log('🚀 Round started')

    this.currentRound.start()

    this.currentMultiplier = 1

    const interval = setInterval(() => {
      this.currentMultiplier += 0.05

      console.log(
        `Multiplier: ${this.currentMultiplier.toFixed(2)}x`,
      )

      this.gateway?.emitMultiplier(this.currentMultiplier)

      if (
        this.currentMultiplier >=
        this.currentRound!.crashPoint
      ) {
        clearInterval(interval)

        this.crashRound()
      }
    }, 100)
  }

  private crashRound() {
    if (!this.currentRound) return

    this.currentRound.crash()

    console.log(
      `💥 Crashed at ${this.currentMultiplier.toFixed(2)}x`,
    )

    this.gateway?.emitCrash(this.currentMultiplier)
    
    setTimeout(() => {
      this.startBettingPhase()
    }, 5000)
  }

  private generateCrashPoint(): number {
    return Number((Math.random() * 10 + 1).toFixed(2))
  }
}