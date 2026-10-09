import {type AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  TimeSuggestionCard as TimeSuggestionCardView,
  Typography,
  XmarkCancelClose,
  YStack,
  tokens,
  useTheme,
} from '@vexl-next/ui'
import {Schema} from 'effect/index'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import {type DateTime} from 'luxon'
import React, {useCallback} from 'react'
import {FlatList} from 'react-native'
import type {TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import atomKeyExtractor from '../../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {
  formatDate,
  type FormattingLocale,
} from '../../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../../utils/localization/formattingLocaleAtom'
import unixMillisecondsToLocaleDateTime from '../../../../../../utils/unixMillisecondsToLocaleDateTime'
import {saveDateTimePickActionAtom} from '../../../../atoms/updatesToBeSentAtom'
import {useTradeChecklistExitNavigation} from '../../../../useTradeChecklistExitNavigation'
import {TradeChecklistItemPageLayout} from '../../../TradeChecklistItemPageLayout'
import {type Item as TimeOptionItem} from '../OptionsList'
import {useState} from './state'

type Props = TradeChecklistStackScreenProps<'PickTimeFromSuggestions'>

function getPickedDateLabel(
  date: AvailableDateTimeOption['date'],
  locale: FormattingLocale
): string {
  return formatDate(unixMillisecondsToLocaleDateTime(date).toMillis(), locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function TimeSuggestionCard({
  itemAtom,
  onPress,
}: {
  itemAtom: Atom<TimeOptionItem<DateTime>>
  onPress: (item: DateTime) => void
}): React.ReactElement {
  const item = useAtomValue(itemAtom)

  return (
    <TimeSuggestionCardView
      label={item.title}
      selected={item.selected}
      outdated={item.outdated}
      onPress={() => {
        onPress(item.data)
      }}
    />
  )
}

function PickTimeFromSuggestions({
  navigation,
  route: {
    params: {chosenDateTimes, pickedOption},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const locale = useAtomValue(formattingLocaleAtom)

  const tradeChecklistExitNavigation = useTradeChecklistExitNavigation()
  const {selectItem, selectedItem, itemsAtoms} = useState(
    chosenDateTimes,
    pickedOption
  )
  const saveDateTimePick = useSetAtom(saveDateTimePickActionAtom)

  const onItemPress = useCallback(
    (item: DateTime) => {
      selectItem(item)
    },
    [selectItem]
  )

  const onFooterButtonPress = useCallback(() => {
    if (!selectedItem) return

    saveDateTimePick({
      dateTime: Schema.decodeSync(UnixMilliseconds)(
        selectedItem.data.toMillis()
      ),
    })

    tradeChecklistExitNavigation()
  }, [saveDateTimePick, selectedItem, tradeChecklistExitNavigation])

  return (
    <TradeChecklistItemPageLayout
      header={{
        title: t('tradeChecklist.dateAndTime.selectTime'),
        rightActions: [
          {
            icon: XmarkCancelClose,
            onPress: () => {
              navigation.navigate('AgreeOnTradeDetails')
            },
          },
        ],
      }}
      bottomButton={{
        text: t('common.accept'),
        disabled: !selectedItem,
        onPress: onFooterButtonPress,
        variant: 'secondary',
      }}
      scrollable={false}
    >
      <YStack flex={1} gap="$7">
        <Typography
          variant="titlesSmall"
          color={theme.foregroundPrimary.get()}
          textAlign="center"
          marginTop="$4"
        >
          {getPickedDateLabel(pickedOption.date, locale)}
        </Typography>
        <FlatList
          data={itemsAtoms}
          keyExtractor={atomKeyExtractor}
          renderItem={({item}) => (
            <TimeSuggestionCard itemAtom={item} onPress={onItemPress} />
          )}
          ItemSeparatorComponent={() => <YStack h="$4" />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: tokens.space[4].val,
          }}
        />
      </YStack>
    </TradeChecklistItemPageLayout>
  )
}

export default PickTimeFromSuggestions
