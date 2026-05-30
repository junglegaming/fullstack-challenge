import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { toast } from 'sonner'
import { setAuthToken, api, ApiError } from '@/api/http'
import { useGameSocket } from '@/hooks/useGameSocket'
import { WalletBalance } from '@/components/WalletBalance'
import { MultiplierDisplay } from '@/components/MultiplierDisplay'
import { BetPanel } from '@/components/BetPanel'
import { BetList } from '@/components/BetList'
import { CrashHistory } from '@/components/CrashHistory'
import type { CurrentRound, WalletInfo } from '@/types'

export function GamePage() {
  const auth = useAuth()
  const token = auth.user?.access_token ?? ''
  const playerId = auth.user?.profile.sub ?? ''

  const [initialRound, setInitialRound] = useState<CurrentRound | null>(null)
  const [initialBalance, setInitialBalance] = useState<number | null>(null)
  const [bootstrapped, setBootstrapped] = useState(false)

  // Set the auth token for all API calls
  useEffect(() => {
    setAuthToken(token)
  }, [token])

  // Bootstrap: fetch current round + wallet
  useEffect(() => {
    if (!token) return

    async function bootstrap() {
      try {
        const [round, wallet] = await Promise.all([
          api.get<CurrentRound>('/games/rounds/current'),
          api.get<WalletInfo>('/wallets/me').catch(async (err: unknown) => {
            // Auto-create wallet if it doesn't exist yet
            if (err instanceof ApiError && err.status === 404) {
              return api.post<WalletInfo>('/wallets')
            }
            throw err
          }),
        ])
        setInitialRound(round)
        setInitialBalance(wallet.availableBalance)
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Falha ao carregar dados'
        toast.error(msg)
      } finally {
        setBootstrapped(true)
      }
    }

    bootstrap()
  }, [token])

  const gameState = useGameSocket(token, initialRound, initialBalance)

  // Track local bet state per round (optimistic, reconciled by WS events)
  const [hasBetThisRound, setHasBetThisRound] = useState(false)
  const [hasCashedOut, setHasCashedOut] = useState(false)

  // Reset bet state when a new round starts
  useEffect(() => {
    setHasBetThisRound(false)
    setHasCashedOut(false)
  }, [gameState.roundId])

  // Sync: if WS says we placed a bet this round, keep state in sync
  useEffect(() => {
    if (!playerId) return
    const myBet = gameState.bets.find(b => b.playerId === playerId)
    if (myBet) {
      setHasBetThisRound(true)
      if (myBet.cashedOut) setHasCashedOut(true)
    }
  }, [gameState.bets, playerId])

  const displayBalance = gameState.walletBalance ?? initialBalance

  if (!bootstrapped) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="text-center">
          <div className="mb-3 text-4xl">🎰</div>
          <p className="text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight text-white">JUNGLE CRASH</span>
          <span
            className={
              gameState.connected
                ? 'h-2 w-2 rounded-full bg-emerald-500'
                : 'h-2 w-2 rounded-full bg-red-500'
            }
            title={gameState.connected ? 'Conectado' : 'Desconectado'}
          />
        </div>
        <div className="flex items-center gap-4">
          <WalletBalance availableBalance={displayBalance} />
          <button
            onClick={() => auth.signoutRedirect()}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-white"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main layout */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left column: multiplier + bet panel */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <MultiplierDisplay
              phase={gameState.phase}
              multiplier={gameState.multiplier}
              crashPoint={gameState.crashPoint}
              bettingEndsAt={gameState.bettingEndsAt}
            />

            <BetPanel
              phase={gameState.phase}
              roundId={gameState.roundId}
              playerId={playerId}
              hasBetThisRound={hasBetThisRound}
              hasCashedOut={hasCashedOut}
              onBetPlaced={() => setHasBetThisRound(true)}
              onCashedOut={() => setHasCashedOut(true)}
            />

            <CrashHistory history={gameState.history} />
          </div>

          {/* Right column: bet list */}
          <div className="flex flex-col gap-4">
            <BetList bets={gameState.bets} />

            {/* Provably fair info */}
            {gameState.hash && (
              <div className="rounded-xl bg-zinc-800/50 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Provably Fair
                </h3>
                <p className="break-all font-mono text-xs text-zinc-400">{gameState.hash}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
