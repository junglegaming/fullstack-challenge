import { GameContainer } from "./_components/game"
import { Header } from "./_components/header"
import { LeaderboardTable } from "./_components/LeaderboardTable"
import { gameService } from "./_services/game.service"
import { walletService } from "./_services/wallet.service"
import { getServerSession } from "next-auth"
import { authOptions } from "../api/auth/[...nextauth]/options"

export default async function Page() {
  const session = await getServerSession(authOptions)
  const token = session?.user?.accessToken

  const [balance, history, leaderboard] = await Promise.all([
    token ? walletService.getBalance(token).catch(() => "0") : Promise.resolve("0"),

    gameService.getRoundHistory().catch(() => []),

    gameService.getLeaderboard().catch(() => []),
  ])

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header balance={balance} />
      <main className="w-full flex-1">
        <div className="container mx-auto w-full p-4 lg:h-[calc(100vh-300px)]">
          <GameContainer history={history} />
        </div>

        <div className="container mx-auto w-full p-4">
          <div className="relative flex items-center justify-center mt-25 py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <h3 className="relative z-10 bg-background px-4 text-xl font-bold tracking-widest text-muted-foreground uppercase">
              Top jogadores
            </h3>
          </div>
          <LeaderboardTable leaderboard={leaderboard} />
        </div>
      </main>
    </div>
  )
}
