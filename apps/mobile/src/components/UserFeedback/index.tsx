import {
  type Feedback,
  type FeedbackType,
} from '@vexl-next/domain/src/general/feedback'
import {ScopeProvider} from 'bunshi/dist/react'
import {atom} from 'jotai'
import React, {useMemo} from 'react'
import {FeedbackScope, generateInitialFeedback} from './atoms'
import FeedbackBannerContent from './components/FeedbackBannerContent'

interface Props {
  feedbackType: FeedbackType
  onFinishClose: () => void
}

function UserFeedback({feedbackType, onFinishClose}: Props): React.ReactElement | null {
  const feedbackAtom = useMemo(() => {
    return atom<Feedback>(generateInitialFeedback(feedbackType))
  }, [feedbackType])

  return (
    <ScopeProvider scope={FeedbackScope} value={feedbackAtom}>
      <FeedbackBannerContent onFinishClose={onFinishClose} />
    </ScopeProvider>
  )
}

export default UserFeedback
