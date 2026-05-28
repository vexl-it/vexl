export function normalizeDecimalInput(input: string): string {
  return input.replace(/ /g, '').replace(/,/g, '.')
}

export function parseDecimalInput(input: string): number | undefined {
  const normalizedInput = normalizeDecimalInput(input)
  if (normalizedInput === '') return undefined

  const parsed = Number(normalizedInput)
  return Number.isNaN(parsed) ? undefined : parsed
}
