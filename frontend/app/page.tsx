"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/game");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-400">Crash Game</h1>
        <p className="mt-4 text-muted-foreground">Jungle Gaming Platform</p>
        <Button
          onClick={login}
          className="mt-8 bg-green-600 hover:bg-green-700"
        >
          Entrar
        </Button>
      </div>
    </main>
  );
}
