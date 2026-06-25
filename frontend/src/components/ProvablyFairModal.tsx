import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { RoundVerification } from "../api/types";
import { formatMultiplier, shortHash } from "../utils/format";

interface Props {
  roundId: string;
  onClose: () => void;
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function ProvablyFairModal({ roundId, onClose }: Props) {
  const [data, setData] = useState<RoundVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientHash, setClientHash] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .verifyRound(roundId)
      .then(async (res) => {
        if (cancelled) {
          return;
        }
        setData(res);
        if (res.serverSeed) {
          setClientHash(await sha256Hex(res.serverSeed));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Falha ao verificar.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [roundId]);

  const clientMatches =
    data?.serverSeedHash != null &&
    clientHash != null &&
    clientHash === data.serverSeedHash;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card card-pad modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="card-title">
          Provably fair
          <button className="btn-ghost" onClick={onClose}>
            Fechar
          </button>
        </h3>

        {error && <p className="banner">{error}</p>}
        {!data && !error && <div className="spinner" />}

        {data && (
          <>
            <div className="kv">
              <span className="k">Rodada</span>
              <span className="v">#{data.nonce}</span>
            </div>
            <div className="kv">
              <span className="k">Crash point</span>
              <span className="v">{formatMultiplier(data.crashPoint)}</span>
            </div>
            <div className="kv">
              <span className="k">Hash da seed (commit)</span>
              <span className="v">{shortHash(data.serverSeedHash, 12)}</span>
            </div>
            <div className="kv">
              <span className="k">Server seed (revelada)</span>
              <span className="v">
                {data.serverSeed ? shortHash(data.serverSeed, 12) : "ainda não revelada"}
              </span>
            </div>

            {data.serverSeed && (
              <>
                <div className="kv">
                  <span className="k">sha256(seed) no navegador</span>
                  <span
                    className={`v ${clientMatches ? "match" : clientHash ? "nomatch" : ""}`}
                  >
                    {clientHash
                      ? clientMatches
                        ? "confere ✓"
                        : "não confere ✗"
                      : "calculando…"}
                  </span>
                </div>
                <div className="kv">
                  <span className="k">Verificação do servidor</span>
                  <span
                    className={`v ${data.verification?.valid ? "match" : "nomatch"}`}
                  >
                    {data.verification?.valid ? "válida ✓" : "inválida ✗"}
                  </span>
                </div>
              </>
            )}

            <p className="bet-hint" style={{ marginTop: 12, textAlign: "left" }}>
              {data.formula}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
