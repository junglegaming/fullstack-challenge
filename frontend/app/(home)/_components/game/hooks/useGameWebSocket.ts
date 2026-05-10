"use client"

import { useEffect, useRef, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { GameEvents } from "../interfaces/gameEvents"
import { useGameStore } from "../store/game.store"
import { Bet } from "@/app/(home)/_types/Game"

export const useGameWebSocket = () => {
  const socketRef = useRef<Socket | null>(null)

  const {
    isConnected,
    multiplier,
    bettingTimer,
    gameCrashed,
    setConnected,
    setMultiplier,
    setBettingTimer,
    setGameCrashed,
    setBets,
    setStatus,
    setRoundId,
    setTotalBets,
  } = useGameStore()

  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_API_KONG_URL}`, {
      path: "/games/socket.io",
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ["websocket"],
      upgrade: false,
    })

    socketRef.current = socket

    socket.on("connect", () => {
      console.log("Conectado ao Game WebSocket")

      setConnected(true)
    })

    socket.on("disconnect", () => {
      console.log("Desconectado do Game WebSocket")
      setConnected(false)
    })

    socket.on("betting_timer", (data: GameEvents["betting_timer"]) => {
      setBettingTimer(data.secondsLeft)
    })

    socket.on("user_stats_update", (data: GameEvents["user_stats_update"]) => {
      setTotalBets(data.totalBets)
    })

    socket.on("multiplier_update", (data: GameEvents["multiplier_update"]) => {
      setMultiplier(Number(data.multiplier))
    })

    socket.on("game_crash", (data: GameEvents["game_crash"]) => {
      setGameCrashed(Number(data.crashPoint))
      setStatus("CRASHED")
      setMultiplier(Number(data.crashPoint))
    })

    socket.on("bets_update", (data: Bet[]) => {
      setBets(data)
    })

    socket.on("round_started", (data) => {
      setMultiplier(1.0)
      setRoundId(data.roundId)
      setGameCrashed(null)
      setStatus("RUNNING")
    })

    socket.on("error", (error) => {
      console.error("Erro no WebSocket:", error)
    })

    return () => {
      socket.disconnect()
    }
  }, [
    setConnected,
    setMultiplier,
    setBettingTimer,
    setGameCrashed,
    setBets,
    setStatus,
    setRoundId,
    setTotalBets,
  ])

  const emit = useCallback(
    <K extends keyof GameEvents>(event: K, data: GameEvents[K]) => {
      socketRef.current?.emit(event, data)
    },
    []
  )

  return {
    socketRef,
    isConnected,
    multiplier,
    bettingTimer,
    gameCrashed,
    emit,
  }
}
