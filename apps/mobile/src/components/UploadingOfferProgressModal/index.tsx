import {Dialog, Typography} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {uploadingProgressDataForRootElement} from './atoms'
import ProgressIndicator from './components/ProgressIndicator'

function UploadingOfferProgressModal(): React.JSX.Element {
  const data = useAtomValue(uploadingProgressDataForRootElement)

  return (
    <Dialog visible={data.isVisible}>
      <Typography
        variant="heading2"
        fontWeight="700"
        color="$foregroundPrimary"
      >
        {data.title}
      </Typography>
      <ProgressIndicator />
      {!!data.bottomText && (
        <Typography variant="paragraphSmall" color="$foregroundSecondary">
          {data.bottomText}
        </Typography>
      )}
    </Dialog>
  )
}

export default UploadingOfferProgressModal
