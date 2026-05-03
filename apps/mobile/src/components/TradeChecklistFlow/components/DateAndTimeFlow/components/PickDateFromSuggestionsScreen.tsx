import {type AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'
import {Button, Typography, XmarkCancelClose} from '@vexl-next/ui'
import {atom, useAtomValue, type Atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {DateTime} from 'luxon'
import React, {useCallback} from 'react'
import {TouchableOpacity} from 'react-native'
import {XStack, YStack, useTheme} from 'tamagui'
import type {TradeChecklistStackScreenProps} from '../../../../../navigationTypes'
import atomKeyExtractor from '../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import unixMillisecondsToLocaleDateTime from '../../../../../utils/unixMillisecondsToLocaleDateTime'
import {useAtomValueRefreshOnFocus} from '../../../../../utils/useFocusMemo'
import {TradeChecklistItemPageLayout} from '../../TradeChecklistItemPageLayout'
import {checkIsOldDateTimeMessage, convertDateTimesToNewFormat} from '../utils'
import {type Item as OptionItem} from './OptionsList'

function createOptionsFromChosenDays(
  days: AvailableDateTimeOption[]
): Array<OptionItem<AvailableDateTimeOption>> {
  const uniqueDates: AvailableDateTimeOption[] = []
  // TODO: remove this logic once all devices update to new checklist DateTime format
  const isOldChecklistDateTimeMessage = checkIsOldDateTimeMessage(days)

  days.forEach((day) => {
    if (uniqueDates.some((uniqueDay) => uniqueDay.date === day.date)) return

    uniqueDates.push(day)
  })

  const daysOptions = isOldChecklistDateTimeMessage
    ? convertDateTimesToNewFormat(days)
    : days

  return uniqueDates.map((day) => ({
    data: day,
    key: day.date.toString(),
    outdated: day.date < DateTime.now().startOf('day').toMillis(),
    title: unixMillisecondsToLocaleDateTime(day.date).toLocaleString({
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    rightText: daysOptions
      .filter((d) => d.date === day.date)
      .map((d) =>
        unixMillisecondsToLocaleDateTime(d.to).toLocaleString(
          DateTime.TIME_SIMPLE
        )
      )
      .join(', '),
  }))
}

type Props = TradeChecklistStackScreenProps<'PickDateFromSuggestions'>

function getDateLabels(date: AvailableDateTimeOption['date']): Readonly<{
  weekday: string
  label: string
}> {
  const localizedDate = unixMillisecondsToLocaleDateTime(date)

  return {
    weekday: localizedDate.toLocaleString({
      weekday: 'long',
    }),
    label: localizedDate.toLocaleString({
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  }
}

function DateSuggestionCard({
  itemAtom,
  onPress,
}: {
  itemAtom: Atom<OptionItem<AvailableDateTimeOption>>
  onPress: (item: AvailableDateTimeOption) => void
}): React.ReactElement {
  const {t} = useTranslation()
  const item = useAtomValue(itemAtom)
  const theme = useTheme()
  const {label, weekday} = getDateLabels(item.data.date)
  const primaryTextColor = item.outdated
    ? theme.foregroundTertiary.val
    : theme.foregroundPrimary.val
  const secondaryTextColor = item.outdated
    ? theme.foregroundTertiary.val
    : theme.foregroundSecondary.val

  return (
    <TouchableOpacity
      disabled={item.outdated}
      activeOpacity={0.85}
      onPress={() => {
        onPress(item.data)
      }}
    >
      <XStack
        alignItems="center"
        justifyContent="space-between"
        backgroundColor={theme.backgroundSecondary.val}
        borderRadius="$5"
        paddingHorizontal="$5"
        paddingVertical="$5"
        opacity={item.outdated ? 0.6 : 1}
      >
        <YStack flex={1} gap="$2">
          <Typography variant="micro" color={secondaryTextColor}>
            {weekday}
          </Typography>
          <Typography variant="paragraphSmall" color={primaryTextColor}>
            {label}
          </Typography>
        </YStack>
        <YStack alignItems="flex-end" gap="$2" maxWidth="45%" flexShrink={1}>
          <Typography
            variant="micro"
            color={secondaryTextColor}
            textAlign="right"
          >
            {item.outdated ? t('common.outdated') : 'time slots'}
          </Typography>
          {!!item.rightText && (
            <Typography
              variant="description"
              color={
                item.outdated
                  ? theme.foregroundTertiary.val
                  : theme.accentHighlightSecondary.val
              }
              textAlign="right"
              numberOfLines={2}
            >
              {item.rightText}
            </Typography>
          )}
        </YStack>
      </XStack>
    </TouchableOpacity>
  )
}

export default function PickDateFromSuggestionsScreen({
  navigation,
  route: {
    params: {chosenDateTimes},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()

  const itemsToShowAtoms = useAtomValueRefreshOnFocus(
    useCallback(
      () => splitAtom(atom(createOptionsFromChosenDays(chosenDateTimes))),
      [chosenDateTimes]
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
          {itemsToShowAtoms.map((itemAtom) => (
            <DateSuggestionCard
              key={atomKeyExtractor(itemAtom)}
              itemAtom={itemAtom}
              onPress={onItemPress}
            />
          ))}
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
