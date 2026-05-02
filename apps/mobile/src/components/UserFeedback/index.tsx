import {
  type Feedback,
  type FeedbackType,
} from '@vexl-next/domain/src/general/feedback'
import {ScopeProvider} from 'bunshi/dist/react'
import {atom} from 'jotai'
import React, {useMemo} from 'react'
import {FeedbackScope, generateInitialFeedback} from './atoms'
import FeedbackBannerActions from './components/FeedbackBannerActions'
import FeedbackBannerContent from './components/FeedbackBannerContent'
import {
  showUserFeedbackDialogAtom,
  UserFeedbackDialog,
  type UserFeedbackResult,
} from './UserFeedbackDialog'

const empty = (userFeedbackResult: UserFeedbackResult): void => {}

interface Props {
  feedbackType: FeedbackType
  onFinishClose?: (userFeedbackResult: UserFeedbackResult) => void
}

function UserFeedback({
  feedbackType,
  onFinishClose,
}: Props): React.ReactElement | null {
  const feedbackAtom = useMemo(() => {
    return atom<Feedback>(generateInitialFeedback(feedbackType))
  }, [feedbackType])

  return (
    <>
      <ScopeProvider scope={FeedbackScope} value={feedbackAtom}>
        <FeedbackBannerContent />
        <FeedbackBannerActions
          hideCloseButton
          onFinishClose={onFinishClose ?? empty}
        />
      </ScopeProvider>
    </>
  )
}

export default UserFeedback
export {showUserFeedbackDialogAtom, UserFeedbackDialog, type UserFeedbackResult}
