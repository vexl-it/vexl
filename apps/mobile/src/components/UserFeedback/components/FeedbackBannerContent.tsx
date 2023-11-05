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
import {POSITIVE_STAR_RATING_THRESHOLD} from '@vexl-next/domain/dist/general/feedback'

interface Props {
  autoCloseWhenFinished?: boolean
  feedbackDoneAtom: PrimitiveAtom<boolean>
}

function FeedbackBannerContent({
  autoCloseWhenFinished,
  feedbackDoneAtom,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const {
    formIdAtom,
    starRatingAtom,
    currentFeedbackPageAtom,
    feedbackFlowFinishedAtom,
    submitChatFeedbackAndHandleUIAtom,
    submitTextCommentButtonDisabledAtom,
  } = useMolecule(feedbackMolecule)
  const currentPage = useAtomValue(currentFeedbackPageAtom)
  const starRating = useAtomValue(starRatingAtom)
  const feedbackFlowFinished = useAtomValue(feedbackFlowFinishedAtom)
  const setFeedbackDone = useSetAtom(feedbackDoneAtom)
  const submitChatFeedback = useSetAtom(submitChatFeedbackAndHandleUIAtom)
  const submitTextCommentButtonDisabled = useAtomValue(
    submitTextCommentButtonDisabledAtom
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
    if (feedbackFlowFinished && autoCloseWhenFinished) {
      const timeout = setTimeout(() => {
        setFeedbackDone(true)
      }, 2000)

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [
    autoCloseWhenFinished,
    currentPage,
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
      {!feedbackFlowFinished &&
        currentPage !== 'CHAT_RATING' &&
        currentPage !== 'OFFER_RATING' && (
          <Button
            disabled={submitTextCommentButtonDisabled}
            onPress={() => {
              void submitChatFeedback()
            }}
            variant={'primary'}
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
