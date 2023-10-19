import {atom, type PrimitiveAtom} from 'jotai'
import {ScopeProvider} from 'jotai-molecules'
import {dummyOfferFeedback, FeedbackScope} from '../atoms'
import FeedbackBanner from './FeedbackBanner'

interface Props {
  feedbackDoneAtom: PrimitiveAtom<boolean>
}

function OfferCreationFeedbackBanner({feedbackDoneAtom}: Props): JSX.Element {
  return (
    <ScopeProvider scope={FeedbackScope} value={atom(dummyOfferFeedback)}>
      <FeedbackBanner feedbackDoneAtom={feedbackDoneAtom} />
    </ScopeProvider>
  )
}

export default OfferCreationFeedbackBanner
