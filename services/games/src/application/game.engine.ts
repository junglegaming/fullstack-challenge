import { Round } from "../domain/entities/round.entity"

export class GameEngine {
  private currentRound: Round | null = null
  private currentMultiplier = 1

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

    setTimeout(() => {
      this.startBettingPhase()
    }, 5000)
  }

  private generateCrashPoint(): number {
    return Number((Math.random() * 10 + 1).toFixed(2))
  }
}