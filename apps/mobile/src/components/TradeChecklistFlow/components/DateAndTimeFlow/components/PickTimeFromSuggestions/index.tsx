import {type AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  RadiobuttonCircleEmpty,
  RadiobuttonCircleFilled,
  Typography,
  XStack,
  XmarkCancelClose,
  YStack,
  lightTheme,
  tokens,
} from '@vexl-next/ui'
import {Effect, Schema} from 'effect/index'
import {useAtomValue, useSetAtom, useStore, type Atom} from 'jotai'
import {type DateTime} from 'luxon'
import React, {useCallback} from 'react'
import {FlatList, TouchableOpacity} from 'react-native'
import type {TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import {chatWithMessagesKeys} from '../../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import atomKeyExtractor from '../../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import unixMillisecondsToLocaleDateTime from '../../../../../../utils/unixMillisecondsToLocaleDateTime'
import {loadingOverlayDisplayedAtom} from '../../../../../LoadingOverlayProvider'
import {
  saveDateTimePickActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../../../atoms/updatesToBeSentAtom'
import {useWasOpenFromAgreeOnTradeDetailsScreen} from '../../../../utils'
import {TradeChecklistItemPageLayout} from '../../../TradeChecklistItemPageLayout'
import {type Item as TimeOptionItem} from '../OptionsList'
import {useState} from './state'

type Props = TradeChecklistStackScreenProps<'PickTimeFromSuggestions'>

function getPickedDateLabel(date: AvailableDateTimeOption['date']): string {
  return unixMillisecondsToLocaleDateTime(date).toLocaleString({
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
  const itemColor = item.outdated
    ? lightTheme.foregroundTertiary
    : item.selected
      ? lightTheme.accentHighlightPrimary
      : lightTheme.foregroundPrimary

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
        gap="$4"
        backgroundColor={
          item.selected
            ? lightTheme.accentYellowSecondary
            : lightTheme.backgroundSecondary
        }
        borderRadius="$5"
        paddingHorizontal="$5"
        paddingVertical="$5"
        opacity={item.outdated ? 0.5 : 1}
      >
        {item.selected ? (
          <RadiobuttonCircleFilled
            color={itemColor}
            size={tokens.size[7].val}
          />
        ) : (
          <RadiobuttonCircleEmpty color={itemColor} size={tokens.size[7].val} />
        )}
        <Typography variant="paragraph" color={itemColor}>
          {item.title}
        </Typography>
      </XStack>
    </TouchableOpacity>
  )
}

function PickTimeFromSuggestions({
  navigation,
  route: {
    params: {chosenDateTimes, pickedOption},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const store = useStore()

  const shouldSendOnSubmit = !useWasOpenFromAgreeOnTradeDetailsScreen()
  const {selectItem, selectedItem, itemsAtoms} = useState(
    chosenDateTimes,
    pickedOption
  )
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const saveDateTimePick = useSetAtom(saveDateTimePickActionAtom)
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )

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

    if (!shouldSendOnSubmit) {
      navigation.popTo('AgreeOnTradeDetails')
      return
    }

    showLoadingOverlay(true)
    void Effect.runPromise(submitTradeChecklistUpdates())
      .then((success) => {
        if (!success) return
        navigation.popTo('ChatDetail', store.get(chatWithMessagesKeys))
      })
      .finally(() => {
        showLoadingOverlay(false)
      })
  }, [
    navigation,
    saveDateTimePick,
    selectedItem,
    showLoadingOverlay,
    shouldSendOnSubmit,
    store,
    submitTradeChecklistUpdates,
  ])

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
          color={lightTheme.foregroundPrimary}
          textAlign="center"
          marginTop="$4"
        >
          {getPickedDateLabel(pickedOption.date)}
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
