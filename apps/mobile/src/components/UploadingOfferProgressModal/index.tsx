import {ProgressDialog} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useState} from 'react'
import {Theme, useThemeName} from 'tamagui'
import {
  progressModalNativeModalUpAtom,
  uploadingProgressModalDataAtom,
} from './atoms'

function UploadingOfferProgressModal(): React.JSX.Element {
  const data = useAtomValue(uploadingProgressModalDataAtom)
  const setNativeModalUp = useSetAtom(progressModalNativeModalUpAtom)
  const shown = data.mode === 'shown'
  const themeName = useThemeName()
  const [appearance, setAppearance] = useState({shown, themeName})

  // Clearing account preferences must not change a dialog already on screen.
  if (appearance.shown !== shown) {
    setAppearance({
      shown,
      themeName: shown ? themeName : appearance.themeName,
    })
  }

  useEffect(() => {
    if (shown) setNativeModalUp(true)
  }, [shown, setNativeModalUp])

  const handleHidden = useCallback(() => {
    setNativeModalUp(false)
  }, [setNativeModalUp])
  const dialogData = data.mode === 'shown' ? data : undefined

  return (
    <Theme name={appearance.themeName}>
      <ProgressDialog
        title={dialogData?.title ?? ''}
        bottomText={dialogData?.bottomText}
        belowProgressLeft={dialogData?.belowProgressLeft}
        belowProgressRight={dialogData?.belowProgressRight}
        indicateProgress={dialogData?.indicateProgress ?? {type: 'done'}}
        visible={shown}
        onHidden={handleHidden}
      />
    </Theme>
  )
}

export default UploadingOfferProgressModal
