export default function calculatePercentageDifference(
  percentageOf: number,
  total: number
): number {
  if (total !== 0) {
    const percentage = Math.round((percentageOf / total) * 100)
    return percentage - 100
  }

  return 0
}
