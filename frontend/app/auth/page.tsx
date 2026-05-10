"use client"

import Shuffle from "@/components/ui/shuffle"
import { AuthForm } from "./_components/auth-form"
import Image from "next/image"

export default function AuthPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Shuffle
            text="Jungle Gaming"
            shuffleDirection="right"
            tag="h2"
            duration={1}
            animationMode="evenodd"
            shuffleTimes={1}
            ease="power3.out"
            stagger={0.03}
            threshold={0.1}
            triggerOnce={true}
            triggerOnHover
            respectReducedMotion={true}
            loop={true}
            loopDelay={0}
            colorFrom="green"
            colorTo="white"
          />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <AuthForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          width={1080}
          height={720}
          src="/whitelabel.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.4]"
        />
      </div>
    </div>
  )
}
