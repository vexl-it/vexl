export default function calculatePercentageDifference(
  percentageOf: number,
  total: number | undefined
): number {
  if (total) {
    const percentage = Math.round((percentageOf / total) * 100)
    return percentage - 100
  }

  return 0
}
