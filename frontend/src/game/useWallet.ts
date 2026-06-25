import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { WalletDto } from "../api/types";

interface UseWallet {
  wallet: WalletDto | null;
  loading: boolean;
  refresh: () => void;
}

export function useWallet(enabled: boolean): UseWallet {
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!enabled) {
      return;
    }
    setLoading(true);
    api
      .getWallet()
      .then(setWallet)
      .catch((err) => console.error("Falha ao buscar a carteira", err))
      .finally(() => setLoading(false));
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { wallet, loading, refresh };
}
