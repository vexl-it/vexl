export const MINIMUM_AVAILABLE_DAYS_THRESHOLD = 1

export function replaceNonDecimalCharsInInput(input: string): string {
  if (isNaN(Number(input))) {
    return '0'
  }

  return input
}
