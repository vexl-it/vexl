import {useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {Platform} from 'react-native'
import RNScreenshotPrevent, {addListener} from 'react-native-screenshot-prevent'
import {
  screenshotsDisabledAtom,
  showYouDidNotAllowTakingScreenshotsActionAtom,
} from '../state/showYouDidNotAllowScreenshotsActionAtom'
import {isUsingIos17AndAbove} from '../utils/isUsingIos17AndAbove'

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
    if (Platform.OS !== 'android' && !isUsingIos17AndAbove()) {
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
