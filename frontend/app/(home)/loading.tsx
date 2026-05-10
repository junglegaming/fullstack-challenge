
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col p-4 space-y-6">
      <Skeleton className="h-16 w-full" />

      <Skeleton className="mx-auto w-full p-4 lg:h-[calc(100vh-370px)]" />

      <div className="space-y-2">
        <Skeleton className="h-6 w-40 mx-auto" />
        <Skeleton className="flex h-full flex-col" />
      </div>
    </div>
  )
}