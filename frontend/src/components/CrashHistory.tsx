import { clsx } from 'clsx'
import type { CrashHistoryEntry } from '@/types'

interface Props {
  history: CrashHistoryEntry[]
}

function crashColor(crashPoint: number): string {
  return crashPoint >= 2
    ? 'text-emerald-400 bg-emerald-950/40'
    : 'text-red-400 bg-red-950/60'
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
            <span
              key={entry.roundId}
              className={clsx(
                'rounded-full px-3 py-1 text-xs font-bold tabular-nums',
                crashColor(entry.crashPoint),
              )}
            >
              {entry.crashPoint.toFixed(2)}x
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
