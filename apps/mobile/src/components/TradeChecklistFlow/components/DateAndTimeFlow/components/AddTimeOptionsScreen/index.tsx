import {Stack, Typography} from '@vexl-next/ui'
import {Array as ArrayE, Effect, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useState} from 'react'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {globalDialogAtom} from '../../../../../GlobalDialog'
import {addDateAndTimeSuggestionsActionAtom} from '../../../../atoms/updatesToBeSentAtom'
import {useTradeChecklistExitNavigation} from '../../../../useTradeChecklistExitNavigation'
import {MINIMUM_AVAILABLE_DAYS_THRESHOLD} from '../../../../utils'
import {TradeChecklistItemPageLayout} from '../../../TradeChecklistItemPageLayout'
import {
  areAllAvailableDatesTimeSlotsSelectedAtom,
  isThereAnyOutdatedDateTimeAtom,
  noDateTimeSelectedActionAtom,
  uniqueAvailableDatesAtom,
} from '../../atoms'
import TimeOptionsPerDate from './components/TimeOptionsPerDate'

function AddTimeOptionsScreen(): React.ReactElement {
  const {t} = useTranslation()
  const isThereAnyOutdatedDateTime = useAtomValue(
    isThereAnyOutdatedDateTimeAtom
  )
  const setInfoModal = useSetAtom(globalDialogAtom)
  const setNoDateTimeSelected = useSetAtom(noDateTimeSelectedActionAtom)

  const uniqueAvailableDates = useAtomValue(uniqueAvailableDatesAtom)
  const areAllAvailableDatesTimeSlotsSelected = useAtomValue(
    areAllAvailableDatesTimeSlotsSelectedAtom
  )

  const addDateAndTimeSuggestions = useSetAtom(
    addDateAndTimeSuggestionsActionAtom
  )
  const tradeChecklistExitNavigation = useTradeChecklistExitNavigation()
  const [expandedDate, setExpandedDate] = useState<
    (typeof uniqueAvailableDates)[number] | null
  >(null)

  useEffect(() => {
    if (uniqueAvailableDates.length === 0) {
      setExpandedDate(null)
      return
    }

    if (expandedDate && !uniqueAvailableDates.includes(expandedDate)) {
      setExpandedDate(null)
    }
  }, [expandedDate, uniqueAvailableDates])

  const onSavePress = useCallback(() => {
    if (!areAllAvailableDatesTimeSlotsSelected) {
      Effect.runFork(setNoDateTimeSelected())
      return
    }

    if (isThereAnyOutdatedDateTime) {
      void Effect.runFork(
        setInfoModal({
          title: t('tradeChecklist.dateAndTime.pastDatesAndTimesFound'),
          subtitle: t(
            'tradeChecklist.dateAndTime.pleaseRemovePastDatesAndTimes'
          ),
          positiveButtonText: t('common.ok'),
        })
      )
    } else {
      addDateAndTimeSuggestions()
      tradeChecklistExitNavigation()
    }
  }, [
    addDateAndTimeSuggestions,
    areAllAvailableDatesTimeSlotsSelected,
    isThereAnyOutdatedDateTime,
    setInfoModal,
    setNoDateTimeSelected,
    t,
    tradeChecklistExitNavigation,
  ])

  return (
    <TradeChecklistItemPageLayout
      header={{
        title: t('tradeChecklist.dateAndTime.screenTitle'),
      }}
      bottomButton={{
        disabled:
          uniqueAvailableDates.length < MINIMUM_AVAILABLE_DAYS_THRESHOLD ||
          !areAllAvailableDatesTimeSlotsSelected,
        text: t('common.continue'),
        onPress: onSavePress,
      }}
    >
      <Stack pt="$4" pb="$13" gap="$5">
        <Stack gap="$3">
          <Typography variant="description" color="$foregroundSecondary">
            {t('tradeChecklist.time.description')}
          </Typography>
        </Stack>
        <Stack gap="$3">
          {pipe(
            uniqueAvailableDates,
            ArrayE.map((date) => (
              <TimeOptionsPerDate
                key={date}
                date={date}
                expanded={expandedDate === date}
                onExpand={() => {
                  setExpandedDate((currentExpandedDate) =>
                    currentExpandedDate === date ? null : date
                  )
                }}
                onCollapse={() => {
                  setExpandedDate(null)
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
