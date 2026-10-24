import {useLayoutEffect, useRef, useState} from 'react'

/** How much content laid out `width` px wide must scale to fill the element's width; 0 until measured. */
export function useScaleToWidth<T extends Element>(
  width: number
): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [scale, setScale] = useState(0)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / width)
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [width])
  return [ref, scale]
}
