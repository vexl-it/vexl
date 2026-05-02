import {POSITIVE_STAR_RATING_THRESHOLD} from '@vexl-next/domain/src/general/feedback'
import {
  Button,
  EyeShut,
  Stack,
  Typography,
  useTheme,
  XStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {feedbackMolecule} from '../atoms'
import Objections from './Objections'
import StarRating from './StarRating'
import TextComment from './TextComment'

function FeedbackBannerContent({onFinishClose}: {onFinishClose: () => void}): React.ReactElement {
  const {t} = useTranslation()
  const {
    starRatingAtom,
    currentFeedbackPageAtom,
    submitChatFeedbackAndHandleUIActionAtom,
    feedbackFlowFinishedAtom,
  } = useMolecule(feedbackMolecule)
  const feedbackFlowFinished = useAtomValue(feedbackFlowFinishedAtom)
  const [currentPage, setCurrentPage] = useAtom(currentFeedbackPageAtom)
  const starRating = useAtomValue(starRatingAtom)
  const submitChatFeedback = useSetAtom(submitChatFeedbackAndHandleUIActionAtom)
  const theme = useTheme()

  const title = useMemo(() => {
    return !feedbackFlowFinished
      ? currentPage === 'CHAT_RATING'
        ? t('messages.howWasTheTrade')
        : currentPage === 'OFFER_RATING'
          ? t('messages.howWasCreatingNewOffer')
          : currentPage === 'OBJECTIONS'
            ? starRating >= POSITIVE_STAR_RATING_THRESHOLD
              ? t('messages.whatWasGreatAboutIt')
              : t('messages.anyProblems')
            : starRating >= POSITIVE_STAR_RATING_THRESHOLD
              ? t('messages.whatWorkedWellExactly')
              : t('messages.whatWasWrongExactly')
      : t('feedback.thanks')
  }, [feedbackFlowFinished, currentPage, starRating, t])

  const showBackButton = currentPage !== 'CHAT_RATING' && !feedbackFlowFinished
  const showNextButton =
    !feedbackFlowFinished &&
    currentPage !== 'CHAT_RATING' &&
    currentPage !== 'OFFER_RATING'
  const showCloseButton = feedbackFlowFinished

  return (
    <Stack gap="$5">
      <Stack ai="center" gap="$4">
        <Typography
          variant="paragraphDemibold"
          color="$foregroundPrimary"
          textAlign="center"
        >
          {title}
        </Typography>
        {!feedbackFlowFinished ? (
          currentPage === 'CHAT_RATING' || currentPage === 'OFFER_RATING' ? (
            <StarRating />
          ) : currentPage === 'OBJECTIONS' ? (
            <Objections />
          ) : (
            <TextComment />
          )
        ) : (
          <></>
        )}
      </Stack>
      {!feedbackFlowFinished && (
        <XStack ai="center" jc="center" gap="$1">
          <EyeShut size={24} color={theme.foregroundSecondary.val} />
          <Typography variant="description" color="$foregroundSecondary">
            {t('messages.yourAnswerIsAnonymous')}
          </Typography>
        </XStack>
      )}
      {!!(showBackButton || showNextButton || feedbackFlowFinished) && (
        <XStack f={1} gap="$3">
          {!!showBackButton && (
            <Button
              f={1}
              size="medium"
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
              f={1}
              size="medium"
              onPress={() => Effect.runFork(submitChatFeedback())}
              variant="primary"
            >
              {currentPage === 'TEXT_COMMENT'
                ? t('common.send')
                : t('common.next')}
            </Button>
          )}

          {!!showCloseButton && (
            <Button
              f={1}
              size="medium"
              onPress={() => onFinishClose()}
              variant="primary"
            >
              {t('common.close')}
            </Button>
          )}
        </XStack>
      )}
    </Stack>
  )
}

export default FeedbackBannerContent
