"use client";

import { useEffect } from "react";
import { useGameStore } from "@/stores/game-store";
import { getUsernameFromToken } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchWallet } from "@/services/wallet";

export function PlayerHeader() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("kc_token") : null;
  const username = getUsernameFromToken(token);
  const balance = useGameStore((s) => s.balance);
  const setBalance = useGameStore((s) => s.setBalance);

  const { data: wallet, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: fetchWallet,
    enabled: !!token,
  });

  useEffect(() => {
    if (wallet) {
      setBalance(wallet.balanceCents);
    }
  }, [wallet, setBalance]);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold text-green-400">Crash Game</h1>
        <p className="text-sm text-gray-400">Jungle Gaming</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Jogador</p>
          <p className="text-lg font-semibold text-white">{username}</p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Saldo</p>
          {isLoading ? (
            <div className="h-9 w-32 bg-gray-800 rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-green-400 tabular-nums">
              {formatCurrency(balance)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
