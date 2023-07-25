export default function getImageDimensionsWithinLimits(
  original: {
    width: number
    height: number
  },
  limits: {width: number; height: number}
): {width: number; height: number} {
  const ratio = Math.min(
    Math.min(limits.width / original.width, limits.height / original.height),
    1
  )
  return {width: original.width * ratio, height: original.height * ratio}
}
