export function normalizeDecimalInput(input: string): string {
  return input.replace(/ /g, '').replace(/,/g, '.')
}

export function parseDecimalInput(input: string): number | undefined {
  const parsed = Number(normalizeDecimalInput(input))
  return Number.isNaN(parsed) ? undefined : parsed
}
