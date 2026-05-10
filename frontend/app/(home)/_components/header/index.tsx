import { HeaderActions } from "./header-actions"
import Image from "next/image"
import AvatarProfile from "./avatar"
import { VerifyRoundDialog } from "./verify-round-dialog"

export function Header({ balance }: { balance: string }) {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center gap-4">
        <Image
          src="/logo.svg"
          alt="Jungle Gaming Logo"
          width={150}
          height={40}
          className="h-8 w-auto"
        />
      </div>

      <div className="flex items-center gap-6">

        <VerifyRoundDialog />

        <HeaderActions balance={balance} />

        <AvatarProfile />
      </div>
    </header>
  )
}
