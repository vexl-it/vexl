export function removeTrailingZerosFromNumberString(input: string): string {
  return input.replace(/\.?0+$/, '')
}
