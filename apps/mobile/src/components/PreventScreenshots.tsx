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
import {setBaselineCaptureProtection} from '../utils/captureProtectionLease'

function PreventScreenshots(): null {
  const screenshotsDisabled = useAtomValue(screenshotsDisabledAtom)
  const showYouDidNotAllowTakingScreenshots = useSetAtom(
    showYouDidNotAllowTakingScreenshotsActionAtom
  )

  useEffect(() => {
    // Never calls CaptureProtection.prevent()/allow() directly — all writers
    // go through utils/captureProtectionLease so device-migration leases can
    // force protection on regardless of this preference (conflicts always
    // resolve in favor of protection).
    setBaselineCaptureProtection(screenshotsDisabled)
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
