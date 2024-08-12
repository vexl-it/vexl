export function replaceNonDecimalCharsInInput(input: string): string {
  if (isNaN(Number(input))) {
    return '0'
  }

  return input
}
