import {Effect} from 'effect/index'
import {useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {
  CaptureEventType,
  CaptureProtection,
} from 'react-native-capture-protection'
import {
  screenshotsDisabledAtom,
  showYouDidNotAllowTakingScreenshotsActionAtom,
} from '../state/showYouDidNotAllowScreenshotsActionAtom'

function PreventScreenshots(): null {
  const screenshotsDisabled = useAtomValue(screenshotsDisabledAtom)
  const showYouDidNotAllowTakingScreenshots = useSetAtom(
    showYouDidNotAllowTakingScreenshotsActionAtom
  )

  useEffect(() => {
    if (screenshotsDisabled) void CaptureProtection.prevent()
    if (!screenshotsDisabled) void CaptureProtection.allow()
  }, [screenshotsDisabled])

  useEffect(() => {
    const listener = CaptureProtection.addListener((event) => {
      if (
        event === CaptureEventType.CAPTURED ||
        event === CaptureEventType.RECORDING
      )
        Effect.runFork(showYouDidNotAllowTakingScreenshots())
    })

    return () => {
      if (listener) CaptureProtection.removeListener(listener)
    }
  }, [showYouDidNotAllowTakingScreenshots])

  return null
}

export default PreventScreenshots
