import {ProgressDialog} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect} from 'react'
import {
  progressModalNativeModalUpAtom,
  uploadingProgressModalDataAtom,
} from './atoms'

function UploadingOfferProgressModal(): React.JSX.Element {
  const data = useAtomValue(uploadingProgressModalDataAtom)
  const setNativeModalUp = useSetAtom(progressModalNativeModalUpAtom)
  const shown = data.mode === 'shown'

  useEffect(() => {
    if (shown) setNativeModalUp(true)
  }, [shown, setNativeModalUp])

  const handleHidden = useCallback(() => {
    setNativeModalUp(false)
  }, [setNativeModalUp])

  if (data.mode === 'hidden') {
    return (
      <ProgressDialog
        visible={false}
        title=""
        indicateProgress={{type: 'done'}}
        onHidden={handleHidden}
      />
    )
  }

  return (
    <ProgressDialog
      visible
      title={data.title}
      bottomText={data.bottomText}
      belowProgressLeft={data.belowProgressLeft}
      belowProgressRight={data.belowProgressRight}
      indicateProgress={data.indicateProgress}
      onHidden={handleHidden}
    />
  )
}

export default UploadingOfferProgressModal
