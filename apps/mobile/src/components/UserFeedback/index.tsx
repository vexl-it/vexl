import {type Feedback} from '@vexl-next/domain/src/general/feedback'
import {ScopeProvider} from 'bunshi/dist/react'
import {type SetStateAction, type WritableAtom} from 'jotai'
import React from 'react'
import {FeedbackScope} from './atoms'
import FeedbackBanner from './components/FeedbackBanner'

interface Props {
  autoCloseWhenFinished?: boolean
  feedbackAtom: WritableAtom<
    Feedback | undefined,
    [SetStateAction<Feedback>],
    void
  >
  hideCloseButton?: boolean
}

function UserFeedback({
  autoCloseWhenFinished,
  feedbackAtom,
  hideCloseButton,
}: Props): React.ReactElement | null {
  return (
    <ScopeProvider scope={FeedbackScope} value={feedbackAtom}>
      <FeedbackBanner
        autoCloseWhenFinished={autoCloseWhenFinished}
        hideCloseButton={hideCloseButton}
      />
    </ScopeProvider>
  )
}

export default UserFeedback
