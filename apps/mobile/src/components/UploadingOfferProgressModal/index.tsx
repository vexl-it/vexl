import {ProgressDialog} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {uploadingProgressModalDataAtom} from './atoms'

function UploadingOfferProgressModal(): React.JSX.Element {
  const data = useAtomValue(uploadingProgressModalDataAtom)

  if (data.mode === 'hidden') {
    return (
      <ProgressDialog
        visible={false}
        title=""
        indicateProgress={{type: 'done'}}
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
    />
  )
}

export default UploadingOfferProgressModal
