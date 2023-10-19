import {Stack, Text} from 'tamagui'
import StarRating from './StarRating'
import Objections from './Objections'
import TextComment from './TextComment'
import Button from '../../Button'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {type PrimitiveAtom, useAtomValue, useSetAtom} from 'jotai'
import {useEffect, useMemo} from 'react'
import {useMolecule} from 'jotai-molecules'
import {feedbackMolecule} from '../atoms'
import {deleteChatFeedbackEntryFromStorageByFormIdAtom} from '../../../state/feedback/atoms'
import {POSITIVE_STAR_RATING_THRESHOLD} from '@vexl-next/domain/dist/general/feedback'

interface Props {
  feedbackDoneAtom: PrimitiveAtom<boolean>
}

function FeedbackBannerContent({feedbackDoneAtom}: Props): JSX.Element {
  const {t} = useTranslation()
  const {
    formIdAtom,
    starRatingAtom,
    currentFeedbackPageAtom,
    feedbackFlowFinishedAtom,
    submitChatFeedbackAndHandleUIAtom,
    submitOfferCreationFeedbackHandleUIAtom,
    submitTextCommentButtonDisabledAtom,
  } = useMolecule(feedbackMolecule)
  const currentPage = useAtomValue(currentFeedbackPageAtom)
  const starRating = useAtomValue(starRatingAtom)
  const feedbackFlowFinished = useAtomValue(feedbackFlowFinishedAtom)
  const setFeedbackDone = useSetAtom(feedbackDoneAtom)
  const submitChatFeedback = useSetAtom(submitChatFeedbackAndHandleUIAtom)
  const submitOfferCreationFeedback = useSetAtom(
    submitOfferCreationFeedbackHandleUIAtom
  )
  const submitTextCommentButtonDisabled = useAtomValue(
    submitTextCommentButtonDisabledAtom
  )
  const deleteChatFeedbackEntryFromStorage = useSetAtom(
    deleteChatFeedbackEntryFromStorageByFormIdAtom
  )

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
  }, [currentPage, feedbackFlowFinished, starRating, t])

  useEffect(() => {
    if (feedbackFlowFinished) {
      const timeout = setTimeout(() => {
        setFeedbackDone(true)
        if (currentPage !== 'OFFER_RATING') {
          deleteChatFeedbackEntryFromStorage(formIdAtom)
        }
      }, 2000)

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [
    currentPage,
    deleteChatFeedbackEntryFromStorage,
    feedbackFlowFinished,
    formIdAtom,
    setFeedbackDone,
  ])

  return (
    <Stack space={'$4'}>
      <Stack ai={'center'} space={'$4'}>
        <Text fos={18} ff={'$body700'} col={'$white'}>
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
      {!feedbackFlowFinished && (
        <Button
          disabled={submitTextCommentButtonDisabled}
          onPress={() => {
            if (currentPage === 'OFFER_RATING')
              void submitOfferCreationFeedback()
            else void submitChatFeedback()
          }}
          variant={'secondary'}
          text={
            currentPage === 'TEXT_COMMENT' || currentPage === 'OFFER_RATING'
              ? t('common.send')
              : t('common.next')
          }
        />
      )}
    </Stack>
  )
}

export default FeedbackBannerContent
