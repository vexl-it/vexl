import {atom} from 'jotai'
import React from 'react'
import UserFeedback from '../../UserFeedback'
import {generateInitialFeedback} from '../../UserFeedback/atoms'

function ChatFeedbackDialogContent(): React.ReactElement {
  return (
    <UserFeedback
      feedbackAtom={atom(generateInitialFeedback('CHAT_RATING'))}
      hideCloseButton
    />
  )
}

export default ChatFeedbackDialogContent
