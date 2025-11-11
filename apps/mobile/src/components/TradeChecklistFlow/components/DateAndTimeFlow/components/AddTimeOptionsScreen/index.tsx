import {
  effectToTask,
  effectToTaskEither,
} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect, pipe} from 'effect'
import * as T from 'fp-ts/Task'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useCallback} from 'react'
import {Stack} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import {chatWithMessagesKeys} from '../../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../../../../../AreYouSureDialog'
import {loadingOverlayDisplayedAtom} from '../../../../../LoadingOverlayProvider'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../../../PageWithNavigationHeader'
import {
  addDateAndTimeSuggestionsActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../../../atoms/updatesToBeSentAtom'
import {
  MINIMUM_AVAILABLE_DAYS_THRESHOLD,
  useWasOpenFromAgreeOnTradeDetailsScreen,
} from '../../../../utils'
import Content from '../../../Content'
import Header from '../../../Header'
import {
  isThereAnyAvailableDateTimeSelectedAtom,
  isThereAnyOutdatedDateTimeAtom,
  noDateTimeSelectedActionAtom,
  uniqueAvailableDatesAtom,
} from '../../atoms'
import TimeOptionsPerDate from './components/TimeOptionsPerDate'

type Props = TradeChecklistStackScreenProps<'AddTimeOptions'>

function AddTimeOptionsScreen({navigation}: Props): React.ReactElement {
  const {t} = useTranslation()
  const isThereAnyOutdatedDateTime = useAtomValue(
    isThereAnyOutdatedDateTimeAtom
  )
  const setInfoModal = useSetAtom(askAreYouSureActionAtom)
  const setNoDateTimeSelected = useSetAtom(noDateTimeSelectedActionAtom)

  const uniqueAvailableDates = useAtomValue(uniqueAvailableDatesAtom)
  const isThereAnyAvailableDateTimeSelected = useAtomValue(
    isThereAnyAvailableDateTimeSelectedAtom
  )

  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const addDateAndTimeSuggestions = useSetAtom(
    addDateAndTimeSuggestionsActionAtom
  )
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )

  const store = useStore()

  const shouldSendOnSubmit = !useWasOpenFromAgreeOnTradeDetailsScreen()

  const onSavePress = useCallback(() => {
    if (!isThereAnyAvailableDateTimeSelected) {
      Effect.runFork(setNoDateTimeSelected())
      return
    }

    if (isThereAnyOutdatedDateTime) {
      void pipe(
        setInfoModal({
          variant: 'info',
          steps: [
            {
              type: 'StepWithText',
              title: t('tradeChecklist.dateAndTime.pastDatesAndTimesFound'),
              description: t(
                'tradeChecklist.dateAndTime.pleaseRemovePastDatesAndTimes'
              ),
              positiveButtonText: t('common.ok'),
            },
          ],
        }).pipe(effectToTaskEither)
      )()
    } else {
      addDateAndTimeSuggestions()

      void pipe(
        shouldSendOnSubmit
          ? pipe(
              T.Do,
              T.map(() => {
                showLoadingOverlay(true)
              }),
              T.chain(() => effectToTask(submitTradeChecklistUpdates())),
              T.map((val) => {
                showLoadingOverlay(false)
                return val
              })
            )
          : T.of(true),
        T.map((success) => {
          if (!success) return
          if (shouldSendOnSubmit) {
            navigation.navigate('ChatDetail', store.get(chatWithMessagesKeys))
          } else {
            navigation.navigate('AgreeOnTradeDetails')
          }
        })
      )()
    }
  }, [
    addDateAndTimeSuggestions,
    isThereAnyAvailableDateTimeSelected,
    isThereAnyOutdatedDateTime,
    navigation,
    setInfoModal,
    setNoDateTimeSelected,
    shouldSendOnSubmit,
    showLoadingOverlay,
    store,
    submitTradeChecklistUpdates,
    t,
  ])

  return (
    <>
      <HeaderProxy
        title={t('tradeChecklist.dateAndTime.screenTitle')}
        onClose={() => {
          if (shouldSendOnSubmit) {
            navigation.navigate('ChatDetail', store.get(chatWithMessagesKeys))
          } else {
            navigation.navigate('AgreeOnTradeDetails')
          }
        }}
      />
      <Content scrollable>
        <Header title={t('tradeChecklist.dateAndTime.addYourTimeOptions')} />
        <Stack f={1} mt="$4">
          {uniqueAvailableDates.map((date) => (
            <TimeOptionsPerDate key={date} date={date} />
          ))}
        </Stack>
      </Content>
      <PrimaryFooterButtonProxy
        text={t('tradeChecklist.addMoreDates')}
        onPress={() => {
          navigation.goBack()
        }}
      />
      <SecondaryFooterButtonProxy
        text={t('common.save')}
        disabled={
          uniqueAvailableDates.length < MINIMUM_AVAILABLE_DAYS_THRESHOLD
        }
        onPress={onSavePress}
      />
    </>
  )
}

export default AddTimeOptionsScreen
