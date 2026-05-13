import {POSITIVE_STAR_RATING_THRESHOLD} from '@vexl-next/domain/src/general/feedback'
import {EyeShut, Stack, Typography, useTheme, XStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React, {useMemo} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {feedbackMolecule} from '../atoms'
import Objections from './Objections'
import StarRating from './StarRating'
import TextComment from './TextComment'

function FeedbackBannerContent(): React.ReactElement {
  const {t} = useTranslation()
  const {starRatingAtom, currentFeedbackPageAtom, feedbackFlowFinishedAtom} =
    useMolecule(feedbackMolecule)
  const feedbackFlowFinished = useAtomValue(feedbackFlowFinishedAtom)
  const currentPage = useAtomValue(currentFeedbackPageAtom)
  const starRating = useAtomValue(starRatingAtom)
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
          <EyeShut size={24} color={theme.foregroundSecondary.get()} />
          <Typography variant="description" color="$foregroundSecondary">
            {t('messages.yourAnswerIsAnonymous')}
          </Typography>
        </XStack>
      )}
    </Stack>
  )
}

export default FeedbackBannerContent
