export function bigNumberToString(number: number): string {
  if (number > 1_000) {
    return `${Math.round(number / 1_000)}K`
  }

  if (number > 1_000_000) {
    return `${Math.round(number / 1_000)}M`
  }

  return String(number)
}
