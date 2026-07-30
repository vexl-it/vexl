import {useFocusEffect} from '@react-navigation/native'
import {useCallback, useRef} from 'react'
import {runAfterAnimationFrame} from './runAfterAnimationFrames'

type ScrollRequestId = string | number

// Runs after focus and layout, once for each request id observed by the screen.
export default function useScrollToTopOnFocus({
  requestId,
  scrollToTop,
}: {
  readonly requestId: ScrollRequestId | undefined
  readonly scrollToTop: () => void
}): void {
  const handledRequestIdRef = useRef<ScrollRequestId | undefined>(undefined)

  useFocusEffect(
    useCallback(() => {
      if (
        requestId === undefined ||
        requestId === handledRequestIdRef.current
      ) {
        return
      }

      return runAfterAnimationFrame(() => {
        scrollToTop()
        handledRequestIdRef.current = requestId
      })
    }, [requestId, scrollToTop])
  )
}
