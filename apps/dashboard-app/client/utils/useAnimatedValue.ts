import {useEffect, useRef, useState} from 'react'

const ANIMATION_DELAY_MS = 200
const ANIMATION_DURATION_MS = 1000

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3
}

export default function useAnimatedValue(targetValue: number): number {
  const [animatedValue, setAnimatedValue] = useState(0)
  const currentValueRef = useRef(0)

  useEffect(() => {
    const startValue = currentValueRef.current
    const valueDelta = targetValue - startValue

    if (valueDelta === 0) return

    let timeoutId = 0
    let frameId = 0

    timeoutId = window.setTimeout(() => {
      let animationStartTime = 0

      const tick = (now: number): void => {
        if (animationStartTime === 0) {
          animationStartTime = now
        }

        const progress = Math.min(
          (now - animationStartTime) / ANIMATION_DURATION_MS,
          1
        )
        const nextValue = startValue + valueDelta * easeOutCubic(progress)

        currentValueRef.current = nextValue
        setAnimatedValue(nextValue)

        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick)
          return
        }

        currentValueRef.current = targetValue
        setAnimatedValue(targetValue)
      }

      frameId = window.requestAnimationFrame(tick)
    }, ANIMATION_DELAY_MS)

    return () => {
      window.clearTimeout(timeoutId)
      window.cancelAnimationFrame(frameId)
    }
  }, [targetValue])

  return animatedValue
}
