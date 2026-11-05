import {type AvailableDateTimeOption} from '@vexl-next/domain/src/general/tradeChecklist'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  RadioGroup,
  RowRadiobutton,
  Typography,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {Array, Option, pipe, Schema} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo, useState} from 'react'
import type {TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
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
import {generateTimeOptions} from './timeOptions'

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

function PickTimeFromSuggestions({
  navigation,
  route: {
    params: {chosenDateTimes, pickedOption},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)

  const tradeChecklistExitNavigation = useTradeChecklistExitNavigation()
  const options = useMemo(
    () => generateTimeOptions(chosenDateTimes, pickedOption, locale),
    [chosenDateTimes, pickedOption, locale]
  )
  const optionKeys = useMemo(
    () =>
      pipe(
        options,
        Array.map((option) => option.key)
      ),
    [options]
  )
  const [selectedKey, setSelectedKey] = useState<string>()
  const selectedOption = pipe(
    options,
    Array.findFirst((option) => option.key === selectedKey),
    Option.getOrUndefined
  )
  const saveDateTimePick = useSetAtom(saveDateTimePickActionAtom)

  const onFooterButtonPress = useCallback(() => {
    if (!selectedOption) return

    saveDateTimePick({
      dateTime: Schema.decodeSync(UnixMilliseconds)(
        selectedOption.data.toMillis()
      ),
    })

    tradeChecklistExitNavigation()
  }, [saveDateTimePick, selectedOption, tradeChecklistExitNavigation])

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
        disabled: !selectedOption,
        onPress: onFooterButtonPress,
        variant: 'secondary',
      }}
    >
      <YStack flex={1} gap="$7">
        <Typography
          variant="titlesSmall"
          color="$foregroundPrimary"
          textAlign="center"
          marginTop="$4"
        >
          {getPickedDateLabel(pickedOption.date, locale)}
        </Typography>
        <RadioGroup
          allowedValues={optionKeys}
          value={selectedKey}
          onValueChange={setSelectedKey}
          gap="$4"
        >
          {pipe(
            options,
            Array.map((option) => (
              <RowRadiobutton
                key={option.key}
                value={option.key}
                label={option.title}
                disabled={option.outdated}
              />
            ))
          )}
        </RadioGroup>
      </YStack>
    </TradeChecklistItemPageLayout>
  )
}

export default PickTimeFromSuggestions
