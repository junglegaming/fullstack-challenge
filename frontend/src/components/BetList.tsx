import { clsx } from 'clsx'
import type { RoundBet } from '@/types'

interface Props {
  bets: RoundBet[]
}

function formatBRL(cents: number | string | null | undefined): string {
  return ((Number(cents) || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function shortId(id: string): string {
  return id.slice(0, 8) + '…'
}

export function BetList({ bets }: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-zinc-800 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
        Apostas ({bets.length})
      </h2>

      {bets.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-600">Nenhuma aposta ainda</p>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500">
                <th className="pb-2 font-medium">Jogador</th>
                <th className="pb-2 font-medium">Aposta</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/50">
              {bets.map(bet => (
                <tr key={bet.playerId}>
                  <td className="py-1.5 font-mono text-zinc-300">{shortId(bet.playerId)}</td>
                  <td className="py-1.5 text-zinc-200">{formatBRL(bet.amountCents)}</td>
                  <td className="py-1.5">
                    {bet.status === 'CASHED_OUT' ? (
                      <span className={clsx('font-semibold text-emerald-400')}>
                        {bet.multiplier?.toFixed(2)}x — {bet.payoutCents ? formatBRL(bet.payoutCents) : ''}
                      </span>
                    ) : bet.status === 'LOST' ? (
                      <span className="text-red-400">Perdeu</span>
                    ) : (
                      <span className="text-zinc-500">Em jogo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
