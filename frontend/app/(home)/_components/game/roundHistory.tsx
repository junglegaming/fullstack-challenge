import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RoundHistoryItem } from "../../_types/Game"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Copy } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function RoundHistory({ history }: { history?: RoundHistoryItem[] }) {
  const handleCopyId = async (id: string) => {
    await navigator.clipboard.writeText(id)
    toast.success("ID da rodada copiado!")
  }
  
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-xs tracking-widest text-muted-foreground uppercase">
          Histórico de Rodadas
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="custom-scrollbar h-full overflow-y-auto">
          <ScrollArea>
            <Table>
              <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm">
                <TableRow className="text-[10px] text-muted-foreground uppercase">
                  <TableHead className="px-4 py-2">ID</TableHead>
                  <TableHead className="px-4 py-2 text-right">
                    Multiplicador
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {Array.isArray(history) && history.slice(-12).map((round, i) => {
                  return (
                    <TableRow key={i}>
                      <TableCell className="px-4 py-2 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            {" "}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-4 w-4 p-0"
                                  onClick={() => handleCopyId(round.id)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copiar ID da rodada</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-2 text-right">
                        <span
                          className={`text-xs font-bold ${
                            round.crashPoint >= 2.0
                              ? "text-primary"
                              : "text-destructive"
                          }`}
                        >
                          {round.crashPoint.toFixed(2)}x
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
