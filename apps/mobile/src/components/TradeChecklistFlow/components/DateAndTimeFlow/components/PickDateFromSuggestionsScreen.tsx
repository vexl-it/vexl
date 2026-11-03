import {type AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'
import {
  Button,
  DateSlotsSummaryRow,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {useAtomValue} from 'jotai'
import {DateTime} from 'luxon'
import React, {useCallback} from 'react'
import type {TradeChecklistStackScreenProps} from '../../../../../navigationTypes'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {
  formatDate,
  formatTime,
  type FormattingLocale,
} from '../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../utils/localization/formattingLocaleAtom'
import unixMillisecondsToLocaleDateTime from '../../../../../utils/unixMillisecondsToLocaleDateTime'
import useFocusMemo from '../../../../../utils/useFocusMemo'
import {TradeChecklistItemPageLayout} from '../../TradeChecklistItemPageLayout'
import {checkIsOldDateTimeMessage, convertDateTimesToNewFormat} from '../utils'

interface DateOption {
  readonly data: AvailableDateTimeOption
  readonly outdated: boolean
  readonly weekday: string
  readonly label: string
  readonly slots: string
}

function createOptionsFromChosenDays(
  days: AvailableDateTimeOption[],
  locale: FormattingLocale
): readonly DateOption[] {
  // TODO: remove this logic once all devices update to new checklist DateTime format
  const daysOptions = checkIsOldDateTimeMessage(days)
    ? convertDateTimesToNewFormat(days)
    : days

  return pipe(
    days,
    Array.dedupeWith((first, second) => first.date === second.date),
    Array.map((day) => {
      const date = unixMillisecondsToLocaleDateTime(day.date).toMillis()
      return {
        data: day,
        outdated: day.date < DateTime.now().startOf('day').toMillis(),
        weekday: formatDate(date, locale, {weekday: 'long'}),
        label: formatDate(date, locale, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        slots: pipe(
          daysOptions,
          Array.filter((d) => d.date === day.date),
          Array.map((d) =>
            formatTime(
              unixMillisecondsToLocaleDateTime(d.to).toMillis(),
              locale
            )
          ),
          Array.join(', ')
        ),
      }
    })
  )
}

type Props = TradeChecklistStackScreenProps<'PickDateFromSuggestions'>

export default function PickDateFromSuggestionsScreen({
  navigation,
  route: {
    params: {chosenDateTimes},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)

  const options = useFocusMemo(
    useCallback(
      () => createOptionsFromChosenDays(chosenDateTimes, locale),
      [chosenDateTimes, locale]
    )
  )

  function onItemPress(pickedOption: AvailableDateTimeOption): void {
    navigation.navigate('PickTimeFromSuggestions', {
      pickedOption,
      chosenDateTimes,
    })
  }

  return (
    <TradeChecklistItemPageLayout
      hideLeftChevron
      header={{
        title: t('tradeChecklist.dateAndTime.chooseTheDay'),
        rightActions: [
          {
            icon: XmarkCancelClose,
            onPress: () => {
              navigation.goBack()
            },
          },
        ],
      }}
      scrollable={true}
    >
      <YStack gap="$7">
        <YStack flex={1} gap="$3">
          {pipe(
            options,
            Array.map((option) => (
              <DateSlotsSummaryRow
                key={option.data.date}
                weekday={option.weekday}
                label={option.label}
                caption={option.outdated ? t('common.outdated') : 'time slots'}
                value={option.slots || undefined}
                outdated={option.outdated}
                onPress={() => {
                  onItemPress(option.data)
                }}
              />
            ))
          )}
        </YStack>
        <Button
          size="medium"
          onPress={() => {
            navigation.navigate('ChooseAvailableDays', {
              chosenDateTimes,
            })
          }}
          variant="secondary"
        >
          {t('tradeChecklist.dateAndTime.addDifferentTime')}
        </Button>
      </YStack>
    </TradeChecklistItemPageLayout>
  )
}
