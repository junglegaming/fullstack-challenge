export function truncateHash(value: string, head = 8, tail = 8): string {
  if (value.length <= head + tail + 1) {
    return value;
  }

  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}
