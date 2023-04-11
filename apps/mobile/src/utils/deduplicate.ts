export default function deduplicate<T>(a1: T[]): T[] {
  return Array.from(new Set(a1))
}
