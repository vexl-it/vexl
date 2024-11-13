import {flow} from 'effect'
import {useEffect} from 'react'
import {animated, useSpring} from 'react-spring'
import {formatNumber} from '../utils/formatNumber'

export default function AnimatedNumber({
  n,
  className,
}: {
  n: number
  className?: string
}): JSX.Element {
  const [springProps, setSpringProps] = useSpring(() => ({
    from: {number: 0},
    number: n,
    delay: 200,
    config: {mass: 1, tension: 20, friction: 10},
  }))

  useEffect(() => {
    void setSpringProps.start({number: n, delay: 200})
  }, [n, setSpringProps])

  return (
    <animated.span className={className}>
      {springProps.number.to(flow(Math.floor, formatNumber))}
    </animated.span>
  )
}
