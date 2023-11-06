import {type SetStateAction, type WritableAtom} from 'jotai'
import {ScopeProvider} from 'jotai-molecules'
import {FeedbackScope} from './atoms'
import {type Feedback} from '@vexl-next/domain/dist/general/feedback'
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
}: Props): JSX.Element | null {
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
