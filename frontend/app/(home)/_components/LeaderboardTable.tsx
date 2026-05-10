import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Card, CardContent } from "@/components/ui/card"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LeaderboardItem } from "../_types/Game"

export function LeaderboardTable({
  leaderboard = [],
}: {
  leaderboard?: LeaderboardItem[]
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm">
              <TableRow className="text-[10px] text-muted-foreground uppercase">
                <TableHead className="px-4 py-2">Jogador</TableHead>
                <TableHead className="px-4 py-2 text-right">Bet</TableHead>
                <TableHead className="px-4 py-2 text-right">Payout</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {leaderboard.map((player, i) => (
                <TableRow key={i}>
                  <TableCell className="flex items-center gap-2 px-4 py-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={player.avatar} />
                      <AvatarFallback>
                        {player.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <span className="text-sm font-medium">{player.name}</span>
                  </TableCell>

                  <TableCell className="px-4 py-2 text-sm text-muted-foreground">
                    {player.amount}
                  </TableCell>

                  <TableCell className="px-4 py-2 text-right text-sm">
                    ${player.payout.toFixed(2)}
                  </TableCell>

                  <TableCell className="px-4 py-2 text-right">
                    <span
                      className={`text-sm font-bold ${
                        player.payout >= 0 ? "text-primary" : "text-destructive"
                      }`}
                    >
                      ${player.payout.toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
