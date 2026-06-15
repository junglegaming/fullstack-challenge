export function formatRoundStatus(status: string | undefined): string {
  switch (status) {
    case "BETTING":
      return "Open";
    case "RUNNING":
      return "Flying";
    case "CRASHED":
      return "Crashed";
    case "SETTLED":
      return "Settled";
    default:
      return "Syncing";
  }
}

export function formatBetStatus(status: string): string {
  switch (status) {
    case "PENDING_DEBIT":
      return "Pending";
    case "PLACED":
      return "In play";
    case "CASHED_OUT":
      return "Cashed out";
    case "LOST":
      return "Lost";
    case "REJECTED":
      return "Rejected";
    default:
      return status;
  }
}
