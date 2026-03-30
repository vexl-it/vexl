import {
  effectToTask,
  effectToTaskEither,
} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Typography, lightTheme, tokens} from '@vexl-next/ui'
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
        <Stack
          pt={tokens.space[4].val}
          pb={tokens.space[13].val}
          gap={tokens.space[5].val}
        >
          <Stack gap={tokens.space[3].val}>
            <Typography variant="description" color="$foregroundSecondary">
              Pick when you&apos;re free. Use the toggle below to apply times to
              all days.
            </Typography>
          </Stack>
          <Stack
            gap={tokens.space[3].val}
            backgroundColor={lightTheme.backgroundPrimary}
          >
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
      </Content>
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy
        text={t('common.continue')}
        disabled={
          uniqueAvailableDates.length < MINIMUM_AVAILABLE_DAYS_THRESHOLD ||
          !isThereAnyAvailableDateTimeSelected
        }
        onPress={onSavePress}
      />
    </>
  )
}

export default AddTimeOptionsScreen
