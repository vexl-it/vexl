import {POSITIVE_STAR_RATING_THRESHOLD} from '@vexl-next/domain/src/general/feedback'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {useEffect, useMemo} from 'react'
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

function FeedbackBannerContent({autoCloseWhenFinished}: Props): JSX.Element {
  const {t} = useTranslation()
  const {
    formIdAtom,
    chatFeedbackFinishedAtom,
    starRatingAtom,
    currentFeedbackPageAtom,
    submitChatFeedbackAndHandleUIAtom,
    submitTextCommentButtonDisabledAtom,
    feedbackFlowFinishedAtom,
  } = useMolecule(feedbackMolecule)
  const feedbackFlowFinished = useAtomValue(feedbackFlowFinishedAtom)
  const currentPage = useAtomValue(currentFeedbackPageAtom)
  const starRating = useAtomValue(starRatingAtom)
  const setChatFeedbackFinished = useSetAtom(chatFeedbackFinishedAtom)
  const submitChatFeedback = useSetAtom(submitChatFeedbackAndHandleUIAtom)
  const submitTextCommentButtonDisabled = useAtomValue(
    submitTextCommentButtonDisabledAtom
  )
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
    <Stack space="$4">
      <Stack ai="center" space="$4">
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
            disabled={submitTextCommentButtonDisabled}
            onPress={() => {
              void submitChatFeedback()
            }}
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
