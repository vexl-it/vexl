import {Stack, StarFilled, StarOutline, useTheme} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {feedbackMolecule} from '../atoms'

interface Props {
  starOrderNumber: number
}

function TouchableStar({starOrderNumber}: Props): React.ReactElement {
  const theme = useTheme()
  const {
    createIsStarSelectedAtom,
    currentFeedbackPageAtom,
    submitChatFeedbackAndHandleUIActionAtom,
    submitOfferCreationFeedbackHandleUIActionAtom,
  } = useMolecule(feedbackMolecule)
  const currentPage = useAtomValue(currentFeedbackPageAtom)
  const submitChatFeedbackAndHandleUI = useSetAtom(
    submitChatFeedbackAndHandleUIActionAtom
  )
  const submitOfferCreationFeedbackHandleUI = useSetAtom(
    submitOfferCreationFeedbackHandleUIActionAtom
  )
  const [isSelected, select] = useAtom(
    useMemo(
      () => createIsStarSelectedAtom(starOrderNumber),
      [createIsStarSelectedAtom, starOrderNumber]
    )
  )

  return (
    <Stack
      ai="center"
      jc="center"
      width="$8"
      height="$8"
      borderRadius="$4"
      onPress={() => {
        select(!isSelected)
        if (currentPage === 'OFFER_RATING') {
          Effect.runFork(submitOfferCreationFeedbackHandleUI())
        } else {
          Effect.runFork(submitChatFeedbackAndHandleUI())
        }
      }}
    >
      {isSelected ? (
        <StarFilled size={32} color={theme.accentYellowPrimary.get()} />
      ) : (
        <StarOutline size={32} color={theme.foregroundSecondary.get()} />
      )}
    </Stack>
  )
}

export default TouchableStar
