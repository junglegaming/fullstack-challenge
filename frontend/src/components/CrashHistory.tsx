import { clsx } from 'clsx'
import type { CrashHistoryEntry } from '@/types'

interface Props {
  history: CrashHistoryEntry[]
}

function crashColor(crashPoint: number): string {
  return crashPoint >= 2
    ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
    : 'text-red-400 bg-red-950/60 border-red-800/40'
}

export function CrashHistory({ history }: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-zinc-800 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Histórico</h2>

      {history.length === 0 ? (
        <p className="py-2 text-center text-sm text-zinc-600">Sem histórico</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {history.map(entry => (
            <div key={entry.roundId} className="flex flex-col items-center gap-0.5">
              <span
                className={clsx(
                  'rounded-full border px-3 py-1 text-xs font-bold tabular-nums',
                  crashColor(entry.crashPoint),
                )}
              >
                {entry.crashPoint.toFixed(2)}x
              </span>

              {entry.playerResult && (
                <span className={clsx('text-[10px] font-semibold leading-none',
                  entry.playerResult.cashedOut ? 'text-emerald-400' : 'text-red-400',
                )}>
                  {entry.playerResult.cashedOut
                    ? `✓ ${entry.playerResult.multiplier.toFixed(2)}x`
                    : '✗ perdeu'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
