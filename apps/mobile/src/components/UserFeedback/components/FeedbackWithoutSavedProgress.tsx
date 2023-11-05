import {atom, useAtomValue, type PrimitiveAtom} from 'jotai'
import {ScopeProvider} from 'jotai-molecules'
import {FeedbackScope, generateInitialFeedback} from '../atoms'
import FeedbackBanner from './FeedbackBanner'
import {type FeedbackType} from '@vexl-next/domain/dist/general/feedback'

interface Props {
  autoCloseWhenFinished?: boolean
  feedbackDoneAtom: PrimitiveAtom<boolean>
  hideCloseButton?: boolean
  type: FeedbackType
}

function FeedbackWithoutSavedProgress({
  autoCloseWhenFinished,
  feedbackDoneAtom,
  hideCloseButton,
  type,
}: Props): JSX.Element | null {
  const feedbackDone = useAtomValue(feedbackDoneAtom)

  if (feedbackDone) return null

  return (
    <ScopeProvider
      scope={FeedbackScope}
      value={atom(generateInitialFeedback(type))}
    >
      <FeedbackBanner
        autoCloseWhenFinished={autoCloseWhenFinished}
        feedbackDoneAtom={feedbackDoneAtom}
        hideCloseButton={hideCloseButton}
      />
    </ScopeProvider>
  )
}

export default FeedbackWithoutSavedProgress
