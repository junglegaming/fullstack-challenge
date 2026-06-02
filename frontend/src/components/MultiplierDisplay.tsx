import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import type { RoundPhase } from '@/types'

interface Props {
  phase: RoundPhase | null
  multiplier: number
  crashPoint: number | null
  bettingEndsAt: Date | null
}

export function MultiplierDisplay({ phase, multiplier, crashPoint, bettingEndsAt }: Props) {
  const isBetting = phase === 'BETTING'
  const isCrashed = phase === 'CRASHED'
  const isRunning = phase === 'RUNNING'

  const displayValue = isCrashed && crashPoint !== null ? crashPoint : multiplier

  return (
    <div
      className={clsx(
        'relative flex h-64 flex-col items-center justify-center rounded-2xl border-2 transition-colors duration-300',
        isCrashed && 'border-red-600 bg-red-950/40',
        isRunning && 'border-emerald-500 bg-emerald-950/20',
        isBetting && 'border-zinc-700 bg-zinc-900',
        !phase && 'border-zinc-700 bg-zinc-900',
      )}
    >
      {isBetting && <BettingTimer bettingEndsAt={bettingEndsAt} />}

      <div
        className={clsx(
          'text-8xl font-extrabold tabular-nums tracking-tight transition-colors duration-200',
          isCrashed && 'text-red-400',
          isRunning && 'text-emerald-300',
          isBetting && 'text-zinc-500',
          !phase && 'text-zinc-600',
        )}
      >
        {displayValue.toFixed(2)}x
      </div>

      {isCrashed && (
        <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-red-400">
          Crashed!
        </p>
      )}
      {isBetting && (
        <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
          Fase de apostas
        </p>
      )}
      {isRunning && (
        <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-emerald-400">
          Em andamento
        </p>
      )}
    </div>
  )
}

function BettingTimer({ bettingEndsAt }: { bettingEndsAt: Date | null }) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!bettingEndsAt) return
    const update = () => {
      const diff = Math.max(0, bettingEndsAt.getTime() - Date.now())
      setRemaining(Math.ceil(diff / 1000))
    }
    update()
    const id = setInterval(update, 250)
    return () => clearInterval(id)
  }, [bettingEndsAt])

  if (!bettingEndsAt || remaining === 0) return null

  return (
    <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-zinc-700 px-3 py-1 text-sm font-bold text-zinc-200">
      <span>{remaining}s</span>
    </div>
  )
}
