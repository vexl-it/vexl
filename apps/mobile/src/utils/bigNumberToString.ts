export function bigNumberToString(number: number): string {
  if (number > 1_000) {
    return `${Math.round(number / 1_000)}K`
  }

  return String(number)
}
