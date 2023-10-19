import {atom, type PrimitiveAtom, useAtomValue} from 'jotai'
import {ScopeProvider} from 'jotai-molecules'
import {dummyChatFeedback, FeedbackScope} from '../atoms'
import {focusFeedbackForChatAtom} from '../../../state/feedback/atoms'
import {type Chat} from '@vexl-next/domain/dist/general/messaging'
import FeedbackBanner from './FeedbackBanner'
import {useMemo} from 'react'
import hasNonNullableValueAtom from '../../../utils/atomUtils/hasNonNullableValueAtom'
import {type Feedback} from '@vexl-next/domain/dist/general/feedback'

interface Props {
  chatAtom: PrimitiveAtom<Chat>
  feedbackDoneAtom: PrimitiveAtom<boolean>
}

function ChatFeedbackBanner({
  chatAtom,
  feedbackDoneAtom,
}: Props): JSX.Element | null {
  const feedbackDone = useAtomValue(feedbackDoneAtom)
  const chat = useAtomValue(chatAtom)
  const nonNullFeedbackAtomExistsAtom = useMemo(
    () => hasNonNullableValueAtom(focusFeedbackForChatAtom(chat.id)),
    [chat.id]
  )

  const nonNullFeedbackAtom = useAtomValue(nonNullFeedbackAtomExistsAtom)
    ? focusFeedbackForChatAtom(chat.id)
    : atom<Feedback>(dummyChatFeedback)

  if (feedbackDone) return null

  return (
    <ScopeProvider scope={FeedbackScope} value={nonNullFeedbackAtom}>
      <FeedbackBanner feedbackDoneAtom={feedbackDoneAtom} />
    </ScopeProvider>
  )
}

export default ChatFeedbackBanner
