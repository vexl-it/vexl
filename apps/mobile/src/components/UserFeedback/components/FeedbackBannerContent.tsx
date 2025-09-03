import {POSITIVE_STAR_RATING_THRESHOLD} from '@vexl-next/domain/src/general/feedback'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect, useMemo} from 'react'
import {Stack, Text} from 'tamagui'
import {newOfferFeedbackDoneAtom} from '../../../state/feedback/atoms'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Button from '../../Button'
import {feedbackMolecule} from '../atoms'
import Objections from './Objections'
import StarRating from './StarRating'
import TextComment from './TextComment'

interface Props {
  autoCloseWhenFinished?: boolean
}

function FeedbackBannerContent({
  autoCloseWhenFinished,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const {
    formIdAtom,
    chatFeedbackFinishedAtom,
    starRatingAtom,
    currentFeedbackPageAtom,
    submitChatFeedbackAndHandleUIActionAtom,
    feedbackFlowFinishedAtom,
  } = useMolecule(feedbackMolecule)
  const feedbackFlowFinished = useAtomValue(feedbackFlowFinishedAtom)
  const currentPage = useAtomValue(currentFeedbackPageAtom)
  const starRating = useAtomValue(starRatingAtom)
  const setChatFeedbackFinished = useSetAtom(chatFeedbackFinishedAtom)
  const submitChatFeedback = useSetAtom(submitChatFeedbackAndHandleUIActionAtom)
  const setNewOfferFeedbackDone = useSetAtom(newOfferFeedbackDoneAtom)

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
      : t('common.thanks')
  }, [feedbackFlowFinished, currentPage, starRating, t])

  useEffect(() => {
    if (feedbackFlowFinished && autoCloseWhenFinished) {
      const timeout = setTimeout(() => {
        setChatFeedbackFinished(true)

        if (currentPage === 'OFFER_RATING') {
          setNewOfferFeedbackDone(true)
        }
      }, 2000)

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [
    autoCloseWhenFinished,
    currentPage,
    formIdAtom,
    feedbackFlowFinished,
    setChatFeedbackFinished,
    setNewOfferFeedbackDone,
  ])

  return (
    <Stack gap="$4">
      <Stack ai="center" gap="$4">
        <Text fos={18} ff="$body700" col="$white">
          {title}
        </Text>
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
      {!feedbackFlowFinished &&
        currentPage !== 'CHAT_RATING' &&
        currentPage !== 'OFFER_RATING' && (
          <Button
            onPress={() => Effect.runFork(submitChatFeedback())}
            variant="primary"
            text={
              currentPage === 'TEXT_COMMENT'
                ? t('common.send')
                : t('common.next')
            }
          />
        )}
    </Stack>
  )
}

export default FeedbackBannerContent
