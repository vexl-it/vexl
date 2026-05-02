import {Stack, useTheme, XmarkCancelClose} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
import {feedbackMolecule} from '../atoms'

interface Props {
  hideCloseButton?: boolean
}

function BannerCloseButton({
  hideCloseButton,
}: Props): React.ReactElement | null {
  const theme = useTheme()
  const {currentFeedbackPageAtom} = useMolecule(feedbackMolecule)
  const currentPage = useAtomValue(currentFeedbackPageAtom)

  return currentPage !== 'OFFER_RATING' && !hideCloseButton ? (
    <Stack
      ai="center"
      jc="center"
      width="$7"
      height="$7"
      borderRadius="$4"
      onPress={() => {}}
    >
      <XmarkCancelClose size={24} color={theme.foregroundSecondary.val} />
    </Stack>
  ) : (
    <Stack width={24} />
  )
}

export default BannerCloseButton
