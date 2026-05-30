import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { getSocket, disconnectSocket } from '@/socket/socket'
import type {
  CurrentRound,
  CrashHistoryEntry,
  RoundPhase,
  RoundBettingPayload,
  RoundStartedPayload,
  MultiplierTickPayload,
  RoundCrashedPayload,
  BetPlacedPayload,
  BetCashedOutPayload,
  WalletSettledPayload,
} from '@/types'

export interface GameState {
  phase: RoundPhase | null
  roundId: string | null
  hash: string | null
  bettingEndsAt: Date | null
  startedAt: Date | null
  multiplier: number
  crashPoint: number | null
  bets: CurrentRound['bets']
  history: CrashHistoryEntry[]
  walletBalance: number | null
  connected: boolean
}

const INITIAL_STATE: GameState = {
  phase: null,
  roundId: null,
  hash: null,
  bettingEndsAt: null,
  startedAt: null,
  multiplier: 1.0,
  crashPoint: null,
  bets: [],
  history: [],
  walletBalance: null,
  connected: false,
}

export function useGameSocket(token: string, initialRound: CurrentRound | null, initialBalance: number | null) {
  const [state, setState] = useState<GameState>(() => {
    if (!initialRound) return INITIAL_STATE
    return {
      ...INITIAL_STATE,
      phase: initialRound.phase,
      roundId: initialRound.roundId,
      hash: initialRound.hash,
      bettingEndsAt: initialRound.bettingEndsAt ? new Date(initialRound.bettingEndsAt) : null,
      startedAt: initialRound.startedAt ? new Date(initialRound.startedAt) : null,
      multiplier: initialRound.multiplier ?? 1.0,
      bets: initialRound.bets,
      walletBalance: initialBalance,
    }
  })

  const historyRef = useRef<CrashHistoryEntry[]>([])

  useEffect(() => {
    const socket = getSocket(token)

    socket.on('connect', () => {
      setState(s => ({ ...s, connected: true }))
    })

    socket.on('disconnect', () => {
      setState(s => ({ ...s, connected: false }))
    })

    socket.on('round.betting', (payload: RoundBettingPayload) => {
      setState(s => ({
        ...s,
        phase: 'BETTING',
        roundId: payload.roundId,
        hash: payload.hash,
        bettingEndsAt: new Date(payload.bettingEndsAt),
        startedAt: null,
        multiplier: 1.0,
        crashPoint: null,
        bets: [],
      }))
    })

    socket.on('round.started', (payload: RoundStartedPayload) => {
      setState(s => ({
        ...s,
        phase: 'RUNNING',
        startedAt: new Date(payload.startedAt),
      }))
    })

    socket.on('multiplier.tick', (payload: MultiplierTickPayload) => {
      setState(s => ({ ...s, multiplier: payload.multiplier }))
    })

    socket.on('round.crashed', (payload: RoundCrashedPayload) => {
      const entry: CrashHistoryEntry = { roundId: payload.roundId, crashPoint: payload.crashPoint }
      historyRef.current = [entry, ...historyRef.current].slice(0, 20)
      setState(s => ({
        ...s,
        phase: 'CRASHED',
        crashPoint: payload.crashPoint,
        multiplier: payload.crashPoint,
        bets: payload.bets,
        history: historyRef.current,
      }))
    })

    socket.on('bet.placed', (payload: BetPlacedPayload) => {
      setState(s => ({
        ...s,
        bets: [
          ...s.bets.filter(b => b.playerId !== payload.playerId),
          { playerId: payload.playerId, amount: payload.amount, cashedOut: false },
        ],
      }))
    })

    socket.on('bet.cashed_out', (payload: BetCashedOutPayload) => {
      setState(s => ({
        ...s,
        bets: s.bets.map(b =>
          b.playerId === payload.playerId
            ? { ...b, cashedOut: true, multiplier: payload.multiplier, payout: payload.payout }
            : b,
        ),
      }))
    })

    socket.on('wallet.settled', (payload: WalletSettledPayload) => {
      setState(s => ({ ...s, walletBalance: payload.availableBalance }))
    })

    socket.on('connect_error', (err: Error) => {
      toast.error(`Connection error: ${err.message}`)
    })

    return () => {
      disconnectSocket()
    }
  }, [token])

  return state
}
