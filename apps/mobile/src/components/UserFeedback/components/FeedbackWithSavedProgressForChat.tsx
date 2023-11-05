import {type PrimitiveAtom, useAtomValue, useSetAtom} from 'jotai'
import {ScopeProvider} from 'jotai-molecules'
import {FeedbackScope, generateInitialFeedback} from '../atoms'
import {
  chatsToFeedbacksStorageAtom,
  focusFeedbackForChatAtom,
} from '../../../state/feedback/atoms'
import {type Chat} from '@vexl-next/domain/dist/general/messaging'
import FeedbackBanner from './FeedbackBanner'
import {useMemo} from 'react'
import hasNonNullableValueAtom from '../../../utils/atomUtils/hasNonNullableValueAtom'
import {type FeedbackType} from '@vexl-next/domain/dist/general/feedback'

interface Props {
  autoCloseWhenFinished?: boolean
  chatAtom: PrimitiveAtom<Chat>
  feedbackDoneAtom: PrimitiveAtom<boolean>
  type: FeedbackType
}

function FeedbackWithSavedProgressForChat({
  autoCloseWhenFinished,
  chatAtom,
  feedbackDoneAtom,
  type,
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
            feedback: generateInitialFeedback(type),
          },
        ],
      }))
    }

    return focusFeedbackForChatAtom(chat.id)
  }, [chat.id, feedbackForChatExists, setChatsToFeedbacks, type])

  if (feedbackDone || !chat.id) return null

  return (
    <ScopeProvider scope={FeedbackScope} value={focusedFeedbackAtom}>
      <FeedbackBanner
        autoCloseWhenFinished={autoCloseWhenFinished}
        feedbackDoneAtom={feedbackDoneAtom}
      />
    </ScopeProvider>
  )
}

export default FeedbackWithSavedProgressForChat
