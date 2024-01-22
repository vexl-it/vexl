import {atom} from 'jotai'
import UserFeedback from '../../UserFeedback'
import {generateInitialFeedback} from '../../UserFeedback/atoms'

function ChatFeedbackDialogContent(): JSX.Element {
  return (
    <UserFeedback
      feedbackAtom={atom(generateInitialFeedback('CHAT_RATING'))}
      hideCloseButton
    />
  )
}

export default ChatFeedbackDialogContent
