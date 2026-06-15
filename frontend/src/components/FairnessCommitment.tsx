import { useState } from "react";
import { truncateHash } from "../utils/hash-display";

type FairnessCommitmentProps = {
  serverSeedHash: string;
};

export function FairnessCommitment({ serverSeedHash }: FairnessCommitmentProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(serverSeedHash);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fairness-commitment" data-testid="fairness-commitment">
      <span className="fairness-commitment-label">Fairness commitment</span>
      <div className="fairness-commitment-row">
        <code className="fairness-commitment-hash" title={serverSeedHash}>
          {truncateHash(serverSeedHash)}
        </code>
        <button
          aria-label="Copy fairness commitment hash"
          className="ghost-button fairness-copy-button"
          onClick={() => void handleCopy()}
          type="button"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
