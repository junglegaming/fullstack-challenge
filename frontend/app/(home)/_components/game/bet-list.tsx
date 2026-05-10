import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Eye } from "lucide-react"
import { useGameStore } from "./store/game.store"
import { numberToCurrency } from "@/lib/utils"

export function BetList() {
  const { totalBets } = useGameStore()

  const mockBets = [
    { user: "Carlos", value: 120 },
    { user: "Ana", value: 85 },
    { user: "João", value: 200 },
    { user: "Marina", value: 45 },
    { user: "Lucas", value: 300 },
  ]

  return (
    <Card className="rounded-4xl border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="size-5 fill-primary text-accent" />
            Jogadores
          </CardTitle>
          <div className="flex items-center -space-x-2 hover:space-x-1">
            <span className="mr-1">{mockBets.length}</span>
            {mockBets.slice(0, 3).map((bet, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <Avatar size="sm" className="transition-all duration-300">
                    <AvatarImage src={`${bet.user}`} />
                    <AvatarFallback className="text-xs">
                      {bet.user.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>{bet.user}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
        <Separator className="mt-2" />
      </CardHeader>

      <CardContent className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xs tracking-wider text-muted-foreground uppercase">
            Total Bet
          </span>
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5">
            <span className="text-lg font-medium tracking-wider text-muted-foreground uppercase">
              R$
            </span>
            <Separator orientation="vertical" />
            <span className="text-sm font-bold text-primary">
              {Number(totalBets) || 0 < 0 ? numberToCurrency(totalBets) : "-"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
