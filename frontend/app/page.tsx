"use client";

import { redirect } from "next/navigation";
import KeycloakService from "@/services/keycloak";

export default function HomePage() {
  const isAuth = KeycloakService.isAuthenticated();

  if (isAuth) {
    redirect("/game");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-400">Crash Game</h1>
        <p className="mt-4 text-muted-foreground">Jungle Gaming Platform</p>
        <button
          onClick={() => KeycloakService.login()}
          className="mt-8 rounded-lg bg-green-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-green-700"
        >
          Entrar
        </button>
      </div>
    </main>
  );
}
