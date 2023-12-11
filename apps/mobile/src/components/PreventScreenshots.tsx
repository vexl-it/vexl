import RNScreenshotPrevent, {addListener} from 'react-native-screenshot-prevent'
import {useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {
  screenshotsDisabledAtom,
  showYouDidNotAllowTakingScreenshotsActionAtom,
} from '../state/showYouDidNotAllowScreenshotsActionAtom'
import {Platform} from 'react-native'

function PreventScreenshots(): null {
  const screenshotsDisabled = useAtomValue(screenshotsDisabledAtom)
  const showYouDidNotAllowTakingScreenshots = useSetAtom(
    showYouDidNotAllowTakingScreenshotsActionAtom
  )

  useEffect(() => {
    if (
      Platform.OS === 'android' ||
      (Platform.OS === 'ios' && Number(Platform.Version) < 17)
    ) {
      addListener(() => {
        void showYouDidNotAllowTakingScreenshots()
      })
    }
  }, [showYouDidNotAllowTakingScreenshots])

  useEffect(() => {
    // not working correctly for iOS 17 and above
    if (Platform.OS === 'ios' && Number(Platform.Version) < 17) {
      if (screenshotsDisabled) RNScreenshotPrevent.enableSecureView()
    } else if (Platform.OS === 'android') {
      RNScreenshotPrevent.enabled(screenshotsDisabled)
    }

    return () => {
      RNScreenshotPrevent.enabled(false)
      RNScreenshotPrevent.disableSecureView()
    }
  }, [screenshotsDisabled])

  return null
}

export default PreventScreenshots
