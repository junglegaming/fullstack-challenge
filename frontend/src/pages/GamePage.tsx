import { useCallback, useEffect, useRef, useState } from 'react'
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
  // Single source of truth for balance — updated by both WS "settled" event and REST fallback
  const [balance, setBalance] = useState<number | null>(null)
  const [bootstrapped, setBootstrapped] = useState(false)

  useEffect(() => {
    setAuthToken(token)
  }, [token])

  useEffect(() => {
    if (!token) return

    async function bootstrap() {
      try {
        const [round, wallet] = await Promise.all([
          api.get<CurrentRound>('/games/rounds/current'),
          api.get<WalletInfo>('/wallets/me').catch(async (err: unknown) => {
            if (err instanceof ApiError && err.status === 404) {
              return api.post<WalletInfo>('/wallets')
            }
            throw err
          }),
        ])
        setInitialRound(round)
        setBalance(wallet.availableBalance)
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Falha ao carregar dados'
        toast.error(msg)
      } finally {
        setBootstrapped(true)
      }
    }

    bootstrap()
  }, [token])

  // REST refresh — called as fallback after RabbitMQ settlement delay (~2s)
  const refreshBalance = useCallback(async () => {
    try {
      const wallet = await api.get<WalletInfo>('/wallets/me')
      setBalance(wallet.availableBalance)
    } catch {
      // silent
    }
  }, [])

  const gameState = useGameSocket(
    token,
    playerId,
    initialRound,
    // WS "settled" event fires with the exact new balance — use it directly
    (balanceCents) => setBalance(balanceCents),
  )

  // REST fallback: after RUNNING→CRASHED, wait 2s for RabbitMQ to settle then refresh
  const prevPhase = useRef<string | null>(null)
  useEffect(() => {
    if (prevPhase.current === 'RUNNING' && gameState.phase === 'CRASHED') {
      const t = setTimeout(() => void refreshBalance(), 2000)
      prevPhase.current = gameState.phase
      return () => clearTimeout(t)
    }
    prevPhase.current = gameState.phase
    return undefined
  }, [gameState.phase, refreshBalance])

  const [hasBetThisRound, setHasBetThisRound] = useState(false)
  const [hasCashedOut, setHasCashedOut] = useState(false)

  // Reset per-round bet state on new round
  useEffect(() => {
    setHasBetThisRound(false)
    setHasCashedOut(false)
  }, [gameState.roundId])

  // Reconcile bet state from WS — catches reconnection/page-reload cases
  useEffect(() => {
    if (!playerId) return
    const myBet = gameState.bets.find(b => b.playerId === playerId)
    if (myBet) {
      setHasBetThisRound(true)
      if (myBet.status === 'CASHED_OUT') setHasCashedOut(true)
    }
  }, [gameState.bets, playerId])

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
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight text-white">JUNGLE CRASH</span>
          <span
            className={gameState.connected
              ? 'h-2 w-2 rounded-full bg-emerald-500'
              : 'h-2 w-2 rounded-full bg-red-500'}
            title={gameState.connected ? 'Conectado' : 'Desconectado'}
          />
        </div>
        <div className="flex items-center gap-4">
          <WalletBalance availableBalance={balance} />
          <button
            onClick={() => auth.signoutRedirect()}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-white"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <MultiplierDisplay
              phase={gameState.phase}
              multiplier={gameState.multiplier}
              crashPoint={gameState.crashPoint}
              bettingEndsAt={gameState.bettingEndsAt}
            />

            <BetPanel
              phase={gameState.phase}
              hasBetThisRound={hasBetThisRound}
              hasCashedOut={hasCashedOut}
              onBetPlaced={() => {
                setHasBetThisRound(true)
                // Refresh balance after reservation — wallet moves available→reserved asynchronously
                setTimeout(() => void refreshBalance(), 600)
              }}
              onCashedOut={() => {
                setHasCashedOut(true)
                // REST fallback with 2s delay (WS "settled" is the faster primary path)
                setTimeout(() => void refreshBalance(), 2000)
              }}
              onBetReset={() => setHasBetThisRound(false)}
            />

            <CrashHistory history={gameState.history} />
          </div>

          <div className="flex flex-col gap-4">
            <BetList bets={gameState.bets} />

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
