import {
  type Feedback,
  type FeedbackType,
} from '@vexl-next/domain/src/general/feedback'
import {Dialog} from '@vexl-next/ui'
import {ScopeProvider} from 'bunshi/dist/react'
import {Array, Effect} from 'effect'
import {atom, useAtomValue, type SetStateAction, type WritableAtom} from 'jotai'
import React, {useCallback, useRef} from 'react'
import {FeedbackScope, generateInitialFeedback} from './atoms'
import FeedbackBannerActions from './components/FeedbackBannerActions'
import FeedbackBannerContent from './components/FeedbackBannerContent'

type FeedbackAtom = WritableAtom<Feedback, [SetStateAction<Feedback>], void>

export interface UserFeedbackResult {
  completed: 'full' | 'partial' | 'dismissed'
}

interface UserFeedbackDialogConfig {
  feedbackType: FeedbackType
}

interface UserFeedbackDialogState {
  feedbackAtom: FeedbackAtom
  onResult: (result: UserFeedbackResult) => void
}

const hiddenFeedbackAtom = atom<Feedback>(
  generateInitialFeedback('CHAT_RATING')
)
const userFeedbackDialogAtom = atom<UserFeedbackDialogState | null>(null)

export function resultFromFeedback(feedback: Feedback): UserFeedbackResult {
  if (feedback.finished) return {completed: 'full'}

  if (
    feedback.stars !== 0 ||
    Array.isNonEmptyReadonlyArray(feedback.objections) ||
    feedback.textComment.trim() !== ''
  ) {
    return {completed: 'partial'}
  }

  return {completed: 'dismissed'}
}

export const showUserFeedbackDialogAtom: WritableAtom<
  null,
  [config: UserFeedbackDialogConfig],
  Effect.Effect<UserFeedbackResult>
> = atom(null, (get, set, config) => {
  const existing = get(userFeedbackDialogAtom)
  if (existing) {
    existing.onResult(resultFromFeedback(get(existing.feedbackAtom)))
  }

  return Effect.async<UserFeedbackResult>((resolve) => {
    const feedbackAtom = atom<Feedback>(
      generateInitialFeedback(config.feedbackType)
    )

    set(userFeedbackDialogAtom, {
      feedbackAtom,
      onResult: (result) => {
        set(userFeedbackDialogAtom, null)
        resolve(Effect.succeed(result))
      },
    })
  })
})

export function UserFeedbackDialog(): React.ReactElement {
  const state = useAtomValue(userFeedbackDialogAtom)
  const lastStateRef = useRef<UserFeedbackDialogState | null>(null)

  if (state) {
    lastStateRef.current = state
  }

  const displayState = state ?? lastStateRef.current
  const feedback = useAtomValue(
    displayState?.feedbackAtom ?? hiddenFeedbackAtom
  )

  const resolveWithCurrentFeedback = useCallback(() => {
    state?.onResult(resultFromFeedback(feedback))
  }, [feedback, state])

  return (
    <ScopeProvider
      scope={FeedbackScope}
      value={displayState?.feedbackAtom ?? hiddenFeedbackAtom}
    >
      <Dialog
        visible={state != null}
        onClose={resolveWithCurrentFeedback}
        footer={
          <FeedbackBannerActions
            buttonSize="large"
            onFinishClose={resolveWithCurrentFeedback}
          />
        }
      >
        <FeedbackBannerContent />
      </Dialog>
    </ScopeProvider>
  )
}
