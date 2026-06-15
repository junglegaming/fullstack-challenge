import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRoundVerification } from "../services/api";

type RoundVerificationPanelProps = {
  roundId: string;
};

export function RoundVerificationPanel({ roundId }: RoundVerificationPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const verificationQuery = useQuery({
    queryKey: ["round-verification", roundId],
    queryFn: () => getRoundVerification(roundId),
    enabled: expanded,
  });

  return (
    <div className="round-verification" data-testid="round-verification">
      <button
        aria-expanded={expanded}
        className="ghost-button round-verification-toggle"
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        {expanded ? "Hide verification" : "Verify round"}
      </button>

      {expanded ? (
        <div className="round-verification-details">
          {verificationQuery.isPending ? (
            <p className="hint">Loading verification...</p>
          ) : null}

          {verificationQuery.isError ? (
            <p className="verification-status invalid" role="status">
              Verification unavailable
            </p>
          ) : null}

          {verificationQuery.data ? (
            <>
              <p className="verification-status valid" role="status">
                Verified
              </p>
              <dl className="verification-grid">
                <div>
                  <dt>Server seed</dt>
                  <dd data-testid="verification-server-seed">
                    {verificationQuery.data.serverSeed}
                  </dd>
                </div>
                <div>
                  <dt>Server seed hash</dt>
                  <dd data-testid="verification-server-seed-hash">
                    {verificationQuery.data.serverSeedHash}
                  </dd>
                </div>
                <div>
                  <dt>Crash point</dt>
                  <dd data-testid="verification-crash-point">
                    {verificationQuery.data.crashPoint}x
                  </dd>
                </div>
              </dl>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
