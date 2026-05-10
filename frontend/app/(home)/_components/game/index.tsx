"use client"

import { CrashGraph } from "./crash-graph"
import { BetPanel } from "./bet-panel"
import { BetList } from "./bet-list"
import { RoundHistory } from "./roundHistory"
import { RoundHistoryItem } from "../../_types/Game"
import { useGameWebSocket } from "./hooks/useGameWebSocket"

export function GameContainer({ history }: { history: RoundHistoryItem[] }) {
  useGameWebSocket()

  return (
    <div className="grid h-full w-full gap-4 grid-cols-1 lg:grid-cols-[2fr_4fr_1.2fr]">
      <div className="h-150 w-full lg:hidden order-first">
        <div className="relative h-full w-full overflow-hidden rounded-3xl border border-border bg-muted/30">
          <CrashGraph history={history} />
        </div>
      </div>

      <div className="flex h-full flex-col gap-4 order-last lg:order-0">
        <BetPanel />
        <div className="min-h-0 flex-1">
          <BetList />
        </div>
      </div>

      <div className="h-full hidden lg:block">
        <div className="relative h-full w-full overflow-hidden rounded-3xl border border-border bg-muted/30">
          <CrashGraph history={history} />
        </div>
      </div>

      <div className="h-full min-h-0 hidden lg:block">
        <RoundHistory history={history} />
      </div>
    </div>
  )
}