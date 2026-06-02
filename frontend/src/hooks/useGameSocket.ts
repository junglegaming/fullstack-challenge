import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { getSocket } from '@/socket/socket'
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
  connected: false,
}

/**
 * @param onPlayerSettled - called when the current player's wallet is settled via WS.
 *   Balance is provided directly from the event so the caller can update display immediately.
 */
export function useGameSocket(
  token: string,
  playerId: string,
  initialRound: CurrentRound | null,
  onPlayerSettled: (balanceCents: number) => void,
) {
  const [state, setState] = useState<GameState>(() => {
    if (!initialRound) return INITIAL_STATE
    return {
      ...INITIAL_STATE,
      phase: initialRound.state,
      roundId: initialRound.roundId,
      hash: initialRound.hash,
      bettingEndsAt: initialRound.bettingEndsAt ? new Date(initialRound.bettingEndsAt) : null,
      startedAt: initialRound.startedAt ? new Date(initialRound.startedAt) : null,
      multiplier: initialRound.multiplier ?? 1.0,
      bets: initialRound.bets,
    }
  })

  // Keep ref always up-to-date so the socket listener always calls the latest callback
  const onPlayerSettledRef = useRef(onPlayerSettled)
  useEffect(() => { onPlayerSettledRef.current = onPlayerSettled })

  const historyRef = useRef<CrashHistoryEntry[]>([])
  // Captures the player's cashout multiplier — BetSummary in round.crashed doesn't carry it
  const myMultiplierRef = useRef<number | null>(null)

  useEffect(() => {
    const socket = getSocket(token)

    function onConnect() {
      setState(s => ({ ...s, connected: true }))
    }
    function onDisconnect() {
      setState(s => ({ ...s, connected: false }))
    }
    function onRoundBetting(payload: RoundBettingPayload) {
      myMultiplierRef.current = null
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
    }
    function onRoundStarted(payload: RoundStartedPayload) {
      setState(s => ({ ...s, phase: 'RUNNING', startedAt: new Date(payload.startedAt) }))
    }
    function onMultiplierTick(payload: MultiplierTickPayload) {
      setState(s => ({ ...s, multiplier: payload.multiplier }))
    }
    function onRoundCrashed(payload: RoundCrashedPayload) {
      const myBet = payload.bets.find(b => b.playerId === playerId)
      let playerResult: CrashHistoryEntry['playerResult']
      if (myBet) {
        if (myBet.status === 'CASHED_OUT' && myMultiplierRef.current !== null) {
          playerResult = { cashedOut: true, multiplier: myMultiplierRef.current }
        } else if (myBet.status === 'LOST') {
          playerResult = { cashedOut: false }
        }
      }
      myMultiplierRef.current = null

      const entry: CrashHistoryEntry = {
        roundId: payload.roundId,
        crashPoint: payload.crashPoint,
        playerResult,
      }
      historyRef.current = [entry, ...historyRef.current].slice(0, 20)

      setState(s => ({
        ...s,
        phase: 'CRASHED',
        crashPoint: payload.crashPoint,
        multiplier: payload.crashPoint,
        bets: payload.bets,
        history: historyRef.current,
      }))
    }
    function onBetPlaced(payload: BetPlacedPayload) {
      setState(s => ({
        ...s,
        bets: [
          ...s.bets.filter(b => b.playerId !== payload.playerId),
          {
            playerId: payload.playerId,
            amountCents: payload.amountCents,
            status: 'PENDING' as const,
            payoutCents: null,
          },
        ],
      }))
    }
    function onBetCashedOut(payload: BetCashedOutPayload) {
      if (payload.playerId === playerId) {
        myMultiplierRef.current = payload.multiplier
      }
      setState(s => ({
        ...s,
        bets: s.bets.map(b =>
          b.playerId === payload.playerId
            ? { ...b, status: 'CASHED_OUT' as const, multiplier: payload.multiplier, payoutCents: payload.payoutCents }
            : b,
        ),
      }))
    }
    function onSettled(payload: WalletSettledPayload) {
      // Only propagate for the current player — event is broadcast to all clients
      if (payload.playerId === playerId) {
        onPlayerSettledRef.current(Number(payload.availableBalanceCents))
      }
    }
    function onConnectError(err: Error) {
      toast.error(`Connection error: ${err.message}`)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('round.betting', onRoundBetting)
    socket.on('round.started', onRoundStarted)
    socket.on('multiplier.tick', onMultiplierTick)
    socket.on('round.crashed', onRoundCrashed)
    socket.on('bet.placed', onBetPlaced)
    socket.on('bet.cashed_out', onBetCashedOut)
    socket.on('settled', onSettled)
    socket.on('connect_error', onConnectError)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('round.betting', onRoundBetting)
      socket.off('round.started', onRoundStarted)
      socket.off('multiplier.tick', onMultiplierTick)
      socket.off('round.crashed', onRoundCrashed)
      socket.off('bet.placed', onBetPlaced)
      socket.off('bet.cashed_out', onBetCashedOut)
      socket.off('settled', onSettled)
      socket.off('connect_error', onConnectError)
    }
  }, [token, playerId])

  return state
}
