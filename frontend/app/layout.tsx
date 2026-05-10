import {
  Geist,
  Geist_Mono,
  Public_Sans,
  Roboto,
  Press_Start_2P,
} from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./providers"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

const robotoHeading = Roboto({ subsets: ["latin"], variable: "--font-heading" })

const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const pressStart2P = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start",
})

export const metadata = {
  title: "Jungle Gaming - Crash Game",
  description: "Experience the thrill of the ultimate crash game",
  icons: {
    icon: "/logo.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        publicSans.variable,
        robotoHeading.variable,
        pressStart2P.variable
      )}
    >
      <body>
        <Providers>
          <ThemeProvider>
            <Toaster richColors={true}/>
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
