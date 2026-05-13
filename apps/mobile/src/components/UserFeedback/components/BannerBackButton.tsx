import {ChevronLeft, Stack, useTheme} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useAtomValue} from 'jotai'
import React from 'react'
import {feedbackMolecule} from '../atoms'

function BannerBackButton(): React.ReactElement {
  const theme = useTheme()
  const {currentFeedbackPageAtom, feedbackFlowFinishedAtom} =
    useMolecule(feedbackMolecule)
  const feedbackFlowFinished = useAtomValue(feedbackFlowFinishedAtom)
  const [currentPage, setCurrentPage] = useAtom(currentFeedbackPageAtom)

  return currentPage !== 'CHAT_RATING' &&
    currentPage !== 'OFFER_RATING' &&
    !feedbackFlowFinished ? (
    <Stack
      ai="center"
      jc="center"
      width="$7"
      height="$7"
      borderRadius="$4"
      onPress={() => {
        setCurrentPage(
          currentPage === 'OBJECTIONS' ? 'CHAT_RATING' : 'OBJECTIONS'
        )
      }}
    >
      <ChevronLeft size={24} color={theme.foregroundSecondary.get()} />
    </Stack>
  ) : (
    <Stack width={24} />
  )
}

export default BannerBackButton
