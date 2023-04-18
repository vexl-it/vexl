export default function deduplicate<T>(a1: T[]): T[] {
  return Array.from(new Set(a1))
}

export function deduplicateBy<T, K>(array: T[], getProperty: (v: T) => K): T[] {
  return array.filter(
    (v, i, a) => a.findIndex((o) => getProperty(o) === getProperty(v)) === i
  )
}
