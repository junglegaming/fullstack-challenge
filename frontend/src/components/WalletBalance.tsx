interface Props {
  availableBalance: number | null
}

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function WalletBalance({ availableBalance }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2">
      <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">Saldo</span>
      <span className="text-lg font-bold text-emerald-400">
        {formatBRL(availableBalance ?? 0)}
      </span>
    </div>
  )
}
