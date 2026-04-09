import {
  effectToTask,
  effectToTaskEither,
} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Typography, lightTheme} from '@vexl-next/ui'
import {Array as ArrayE, Effect, pipe} from 'effect'
import * as T from 'fp-ts/Task'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useCallback, useEffect} from 'react'
import {LayoutAnimation, Platform, UIManager} from 'react-native'
import {Stack} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import {chatWithMessagesKeys} from '../../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../../../../../AreYouSureDialog'
import {loadingOverlayDisplayedAtom} from '../../../../../LoadingOverlayProvider'
import {
  addDateAndTimeSuggestionsActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../../../atoms/updatesToBeSentAtom'
import {
  MINIMUM_AVAILABLE_DAYS_THRESHOLD,
  useWasOpenFromAgreeOnTradeDetailsScreen,
} from '../../../../utils'
import {TradeChecklistItemPageLayout} from '../../../TradeChecklistItemPageLayout'
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
  const [expandedDate, setExpandedDate] = React.useState<
    (typeof uniqueAvailableDates)[number] | null
  >(null)

  useEffect(() => {
    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true)
    }
  }, [])

  useEffect(() => {
    if (uniqueAvailableDates.length === 0) {
      setExpandedDate(null)
      return
    }

    if (expandedDate && !uniqueAvailableDates.includes(expandedDate)) {
      setExpandedDate(null)
    }
  }, [expandedDate, uniqueAvailableDates])

  const animateExpandedDateChange = useCallback(
    (
      nextExpandedDate:
        | ((currentExpandedDate: typeof expandedDate) => typeof expandedDate)
        | typeof expandedDate
    ) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setExpandedDate(nextExpandedDate)
    },
    []
  )

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
            navigation.popTo('ChatDetail', store.get(chatWithMessagesKeys))
          } else {
            navigation.popTo('AgreeOnTradeDetails')
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
    <TradeChecklistItemPageLayout
      header={{
        title: t('tradeChecklist.dateAndTime.screenTitle'),
      }}
      bottomButton={{
        disabled:
          uniqueAvailableDates.length < MINIMUM_AVAILABLE_DAYS_THRESHOLD ||
          !isThereAnyAvailableDateTimeSelected,
        text: t('common.continue'),
        onPress: onSavePress,
      }}
    >
      <Stack pt="$4" pb="$13" gap="$5">
        <Stack gap="$3">
          <Typography variant="description" color="$foregroundSecondary">
            {isThereAnyAvailableDateTimeSelected ? 'true' : 'false'}
            Pick when you&apos;re free. Use the toggle below to apply times to
            all days.
          </Typography>
        </Stack>
        <Stack gap="$3" backgroundColor={lightTheme.backgroundPrimary}>
          {pipe(
            uniqueAvailableDates,
            ArrayE.map((date) => (
              <TimeOptionsPerDate
                key={date}
                date={date}
                expanded={expandedDate === date}
                onExpand={() => {
                  animateExpandedDateChange((currentExpandedDate) =>
                    currentExpandedDate === date ? null : date
                  )
                }}
                onCollapse={() => {
                  animateExpandedDateChange(null)
                }}
              />
            ))
          )}
        </Stack>
      </Stack>
    </TradeChecklistItemPageLayout>
  )
}

export default AddTimeOptionsScreen
