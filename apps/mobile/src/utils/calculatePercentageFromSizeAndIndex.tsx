export default function calculatePercentageFromSizeAndIndex({
  size,
  index,
}: {
  size: number
  index: number
}): number {
  return Math.round(((index + 1) / size) * 100)
}
