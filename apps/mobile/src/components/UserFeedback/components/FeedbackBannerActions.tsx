import {Button, XStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtom, useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useEffect} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {feedbackMolecule} from '../atoms'
import {
  resultFromFeedback,
  type UserFeedbackResult,
} from '../UserFeedbackDialog'

interface Props {
  buttonSize?: 'large' | 'medium' | 'small'
  hideCloseButton?: boolean
  onFinishClose: (feedbackFlowFinished: UserFeedbackResult) => void
}

function FeedbackBannerActions({
  buttonSize = 'medium',
  hideCloseButton,
  onFinishClose,
}: Props): React.ReactElement | null {
  const store = useStore()
  const {t} = useTranslation()
  const {
    currentFeedbackPageAtom,
    submitChatFeedbackAndHandleUIActionAtom,
    feedbackFlowFinishedAtom,
    feedbackAtom,
  } = useMolecule(feedbackMolecule)
  const feedbackFlowFinished = useAtomValue(feedbackFlowFinishedAtom)
  const [currentPage, setCurrentPage] = useAtom(currentFeedbackPageAtom)
  const submitChatFeedback = useSetAtom(submitChatFeedbackAndHandleUIActionAtom)

  const showBackButton =
    currentPage !== 'CHAT_RATING' &&
    currentPage !== 'OFFER_RATING' &&
    !feedbackFlowFinished
  const showCancelButton =
    !feedbackFlowFinished &&
    !hideCloseButton &&
    (currentPage === 'CHAT_RATING' || currentPage === 'OFFER_RATING')
  const showNextButton =
    !feedbackFlowFinished &&
    currentPage !== 'CHAT_RATING' &&
    currentPage !== 'OFFER_RATING'
  const showCloseButton = feedbackFlowFinished && !hideCloseButton

  useEffect(() => {
    if (feedbackFlowFinished && !showCancelButton) {
      onFinishClose(resultFromFeedback(store.get(feedbackAtom)))
    }
  }, [
    feedbackFlowFinished,
    feedbackAtom,
    showCancelButton,
    onFinishClose,
    store,
  ])

  if (
    !showBackButton &&
    !showCancelButton &&
    !showNextButton &&
    !showCloseButton
  )
    return null

  return (
    <XStack flex={1} gap="$3">
      {!!showCancelButton && (
        <Button
          flex={1}
          size={buttonSize}
          variant="secondary"
          onPress={() => {
            onFinishClose(resultFromFeedback(store.get(feedbackAtom)))
          }}
        >
          {t('common.cancel')}
        </Button>
      )}

      {!!showBackButton && (
        <Button
          flex={1}
          size={buttonSize}
          variant="secondary"
          onPress={() => {
            setCurrentPage(
              currentPage === 'OBJECTIONS' ? 'CHAT_RATING' : 'OBJECTIONS'
            )
          }}
        >
          {t('common.back')}
        </Button>
      )}

      {!!showNextButton && (
        <Button
          flex={1}
          size={buttonSize}
          onPress={() => Effect.runFork(submitChatFeedback())}
          variant="primary"
        >
          {currentPage === 'TEXT_COMMENT' ? t('common.send') : t('common.next')}
        </Button>
      )}

      {!!showCloseButton && (
        <Button
          flex={1}
          size={buttonSize}
          onPress={() => {
            onFinishClose(resultFromFeedback(store.get(feedbackAtom)))
          }}
          variant="primary"
        >
          {t('common.close')}
        </Button>
      )}
    </XStack>
  )
}

export default FeedbackBannerActions
