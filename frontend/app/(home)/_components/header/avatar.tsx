"use client"

import { CheckIcon, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const AvatarProfile = () => {
  const { data: session } = useSession()

  const avatarContent = (
    <Avatar
      className={cn(
        "transition-transform group-hover:scale-105",
        session &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background dark:ring-primary/80"
      )}
    >
      <AvatarImage
        src={
          session?.user?.image ||
          "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png"
        }
        alt={session?.user?.name || "User"}
      />
      <AvatarFallback className="text-xs">
        {session?.user?.name?.charAt(0).toUpperCase() || "U"}
      </AvatarFallback>
    </Avatar>
  )

  if (!session) {
    return (
      <Link href="/auth" className="group relative w-fit">
        {avatarContent}
      </Link>
    )
  }

  return (
    <div className="group relative w-fit">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer outline-none">
            {avatarContent}
            <span className="absolute -right-1.5 -bottom-1.5 inline-flex size-4 items-center justify-center rounded-full border-2 border-background bg-primary dark:bg-primary/80">
              <CheckIcon className="size-3 text-white" />
            </span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{session.user?.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {session.user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            onClick={() => signOut({ callbackUrl: "/auth" })}
          >
            <LogOut className="mr-2 size-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default AvatarProfile
