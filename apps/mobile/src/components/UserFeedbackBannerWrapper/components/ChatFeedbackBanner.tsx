import {type PrimitiveAtom, useAtomValue, useSetAtom} from 'jotai'
import {ScopeProvider} from 'jotai-molecules'
import {generateInitialChatFeedback, FeedbackScope} from '../atoms'
import {
  chatsToFeedbacksStorageAtom,
  focusFeedbackForChatAtom,
} from '../../../state/feedback/atoms'
import {type Chat} from '@vexl-next/domain/dist/general/messaging'
import FeedbackBanner from './FeedbackBanner'
import {useMemo} from 'react'
import hasNonNullableValueAtom from '../../../utils/atomUtils/hasNonNullableValueAtom'

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
  const setChatsToFeedbacks = useSetAtom(chatsToFeedbacksStorageAtom)

  const feedbackForChatExists = useAtomValue(
    useMemo(
      () => hasNonNullableValueAtom(focusFeedbackForChatAtom(chat.id)),
      [chat.id]
    )
  )

  const focusedFeedbackAtom = useMemo(() => {
    if (!feedbackForChatExists) {
      setChatsToFeedbacks((prev) => ({
        chatsToFeedbacks: [
          ...prev.chatsToFeedbacks,
          {
            chatId: chat.id,
            feedback: generateInitialChatFeedback(),
          },
        ],
      }))
    }

    return focusFeedbackForChatAtom(chat.id)
  }, [chat.id, feedbackForChatExists, setChatsToFeedbacks])

  if (feedbackDone) return null

  return (
    <ScopeProvider scope={FeedbackScope} value={focusedFeedbackAtom}>
      <FeedbackBanner feedbackDoneAtom={feedbackDoneAtom} />
    </ScopeProvider>
  )
}

export default ChatFeedbackBanner
