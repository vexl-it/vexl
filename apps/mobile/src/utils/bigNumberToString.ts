export function bigNumberToString(number: number | null): string {
  if (!number) {
    return 'error'
  }

  if (number > 1_000_000) {
    return `${Math.round(number / 1_000_000)}M`
  }

  if (number > 1_000) {
    return `${Math.round(number / 1_000)}K`
  }

  return String(number)
}
