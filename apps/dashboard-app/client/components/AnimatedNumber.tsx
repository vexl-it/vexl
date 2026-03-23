import {formatNumber} from '../utils/formatNumber'
import useAnimatedValue from '../utils/useAnimatedValue'

export default function AnimatedNumber({
  n,
  className,
}: {
  n: number
  className?: string
}): React.ReactElement {
  const animatedNumber = useAnimatedValue(n)

  return (
    <span className={className}>
      {formatNumber(Math.floor(animatedNumber))}
    </span>
  )
}
