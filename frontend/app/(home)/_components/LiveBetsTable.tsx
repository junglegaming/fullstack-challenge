"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

type BetStatus = "betting" | "cashed_out" | "lost"

type Bet = {
  name: string
  avatar: string
  amount: number
  status: BetStatus
  cashoutMultiplier?: number
}

type Props = {
  bets: Bet[]
}

export function LiveBetsTable({ bets }: Props) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-xs tracking-widest text-muted-foreground uppercase">
          Apostas em tempo real
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1  p-0">
        <div className="custom-scrollbar h-full overflow-y-auto">
          <Table className="w-full table-fixed">
            <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm">
              <TableRow className="text-[10px] text-muted-foreground uppercase">
                <TableHead className="px-4 py-2">Jogador</TableHead>
                <TableHead className="px-4 py-2 text-right">Aposta</TableHead>
                <TableHead className="px-4 py-2 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {bets.map((bet, i) => (
                <TableRow key={i}>
                  {/* Jogador */}
                  <TableCell className="flex items-center gap-2 px-4 py-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={bet.avatar} />
                      <AvatarFallback>
                        {bet.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <span className="text-sm font-medium">{bet.name}</span>
                  </TableCell>

                  {/* Valor */}
                  <TableCell className="px-4 py-2 text-left text-sm">
                    R$ {bet.amount.toFixed(2)}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="px-4 py-2 text-right">
                    {bet.status === "betting" && (
                      ""
                    )}

                    {bet.status === "cashed_out" && (
                      <Badge className="border-text-primary/20 bg-primary/60 text-white">
                        {bet.cashoutMultiplier?.toFixed(2)}x
                      </Badge>
                    )}

                    {bet.status === "lost" && (
                      <Badge className="border-destructive/90 bg-destructive/80 text-white">
                        {bet.cashoutMultiplier?.toFixed(2)}x
                      </Badge>
                    )}
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
